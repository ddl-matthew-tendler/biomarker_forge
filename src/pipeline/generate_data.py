"""
Synthetic biomarker dataset generator.

Produces a realistic clinical cohort with:
  - Patient demographics (age, sex, BMI)
  - Protein biomarker assay values (log-normal distributed)
  - Gene expression features (normal distributed)
  - Binary outcome: response (1) / non-response (0)
  - Signal injected into config.cohort.n_signal_biomarkers features

Usage:
    python src/pipeline/generate_data.py
    python src/pipeline/generate_data.py --output data/synthetic/cohort.csv
"""

import argparse
import logging
import os
from pathlib import Path

import numpy as np
import pandas as pd
import yaml

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def load_config(config_path: str = "config.yaml") -> dict:
    with open(config_path) as f:
        return yaml.safe_load(f)


def generate_cohort(
    n_samples: int,
    n_biomarkers: int,
    n_signal: int,
    outcome_col: str,
    id_col: str,
    seed: int,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)

    # ── Demographics ──────────────────────────────────────────────────────────
    age = rng.normal(loc=58, scale=12, size=n_samples).clip(18, 90)
    sex = rng.choice([0, 1], size=n_samples, p=[0.48, 0.52])  # 0=F, 1=M
    bmi = rng.normal(loc=27, scale=5, size=n_samples).clip(15, 55)

    # ── Binary outcome (latent linear combination) ────────────────────────────
    # True outcome probability driven by age, sex, and signal biomarkers
    latent = -0.5 + 0.01 * (age - 58) - 0.2 * sex
    response_prob = 1 / (1 + np.exp(-latent))
    outcome = rng.binomial(1, response_prob, size=n_samples)

    # ── Biomarker features ────────────────────────────────────────────────────
    feature_names = [f"BM_{i:03d}" for i in range(n_biomarkers)]
    features = {}

    for i, name in enumerate(feature_names):
        if i < n_signal:
            # Signal biomarkers: mean shifts by outcome label
            signal_strength = rng.uniform(0.5, 1.5)
            base = rng.lognormal(mean=2.0, sigma=0.6, size=n_samples)
            shift = signal_strength * outcome * rng.normal(1.0, 0.2, size=n_samples)
            values = base + shift
        else:
            # Noise biomarkers: no relationship to outcome
            values = rng.lognormal(mean=2.0, sigma=0.8, size=n_samples)

        # Inject ~5% missing values
        missing_mask = rng.random(n_samples) < 0.05
        values = values.astype(float)
        values[missing_mask] = np.nan
        features[name] = values

    df = pd.DataFrame(features)
    df.insert(0, id_col, [f"PT_{i:04d}" for i in range(n_samples)])
    df.insert(1, "age", age.round(1))
    df.insert(2, "sex", sex)
    df.insert(3, "bmi", bmi.round(1))
    df[outcome_col] = outcome

    log.info(
        "Generated cohort: %d patients, %d features, %d signal biomarkers, "
        "response rate=%.1f%%",
        n_samples,
        n_biomarkers,
        n_signal,
        outcome.mean() * 100,
    )
    return df


def main(config_path: str = "config.yaml", output: str | None = None):
    cfg = load_config(config_path)

    n_samples = cfg["cohort"]["n_samples"]
    n_biomarkers = cfg["cohort"]["n_biomarkers"]
    n_signal = cfg["cohort"]["n_signal_biomarkers"]
    outcome_col = cfg["cohort"]["outcome_column"]
    id_col = cfg["cohort"]["id_column"]
    seed = cfg["project"]["random_seed"]

    df = generate_cohort(n_samples, n_biomarkers, n_signal, outcome_col, id_col, seed)

    if output is None:
        raw_dir = Path(cfg["data"]["raw_dir"])
        raw_dir.mkdir(parents=True, exist_ok=True)
        output = str(raw_dir / cfg["data"]["synthetic_file"])

    Path(output).parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output, index=False)
    log.info("Saved cohort to %s  shape=%s", output, df.shape)
    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic biomarker cohort")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--output", default=None, help="Override output CSV path")
    args = parser.parse_args()
    main(config_path=args.config, output=args.output)
