"""
Preprocessing pipeline for the biomarker cohort.

Steps:
  1. Drop features exceeding missing-value threshold
  2. Impute remaining missing values (median per feature)
  3. Clip extreme outliers at ±N standard deviations
  4. Scale numeric biomarker columns
  5. Encode categorical demographics
  6. Split into train/test and save both

Usage:
    python src/pipeline/preprocess.py
    python src/pipeline/preprocess.py --input data/synthetic/cohort.csv
"""

import argparse
import logging
import pickle
from pathlib import Path

import numpy as np
import pandas as pd
import yaml
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import MinMaxScaler, RobustScaler, StandardScaler

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
log = logging.getLogger(__name__)


def load_config(config_path: str = "config.yaml") -> dict:
    with open(config_path) as f:
        return yaml.safe_load(f)


SCALER_MAP = {
    "standard": StandardScaler,
    "minmax": MinMaxScaler,
    "robust": RobustScaler,
}


def get_biomarker_cols(df: pd.DataFrame, id_col: str, outcome_col: str) -> list[str]:
    """Return all numeric columns that are not ID, outcome, or demographics."""
    demo_cols = {"age", "sex", "bmi"}
    exclude = {id_col, outcome_col} | demo_cols
    return [c for c in df.columns if c not in exclude and df[c].dtype != object]


def drop_high_missing(df: pd.DataFrame, cols: list[str], threshold: float) -> list[str]:
    missing_frac = df[cols].isna().mean()
    keep = missing_frac[missing_frac <= threshold].index.tolist()
    dropped = set(cols) - set(keep)
    if dropped:
        log.info("Dropped %d features with >%.0f%% missing: %s", len(dropped), threshold * 100, dropped)
    return keep


def impute_median(df: pd.DataFrame, cols: list[str]) -> pd.DataFrame:
    medians = df[cols].median()
    df[cols] = df[cols].fillna(medians)
    log.info("Imputed missing values with column medians")
    return df


def clip_outliers(df: pd.DataFrame, cols: list[str], n_std: float) -> pd.DataFrame:
    for col in cols:
        mean, std = df[col].mean(), df[col].std()
        lower, upper = mean - n_std * std, mean + n_std * std
        clipped = ((df[col] < lower) | (df[col] > upper)).sum()
        if clipped:
            df[col] = df[col].clip(lower, upper)
    log.info("Clipped outliers at ±%.1f SD", n_std)
    return df


def fit_scaler(df: pd.DataFrame, cols: list[str], scaler_name: str):
    ScalerClass = SCALER_MAP[scaler_name]
    scaler = ScalerClass()
    scaler.fit(df[cols])
    return scaler


def apply_scaler(df: pd.DataFrame, cols: list[str], scaler) -> pd.DataFrame:
    df = df.copy()
    df[cols] = scaler.transform(df[cols])
    return df


def run_pipeline(
    input_path: str,
    output_clean: str,
    output_train: str,
    output_test: str,
    scaler_path: str,
    cfg: dict,
) -> dict:
    df = pd.read_csv(input_path)
    log.info("Loaded %s  shape=%s", input_path, df.shape)

    id_col = cfg["cohort"]["id_column"]
    outcome_col = cfg["cohort"]["outcome_column"]
    missing_thresh = cfg["preprocessing"]["missing_threshold"]
    outlier_std = cfg["preprocessing"]["outlier_std"]
    scaler_name = cfg["preprocessing"]["scaler"]
    test_size = cfg["cohort"]["test_size"]
    seed = cfg["project"]["random_seed"]

    bm_cols = get_biomarker_cols(df, id_col, outcome_col)
    log.info("Identified %d biomarker columns", len(bm_cols))

    # 1. Drop high-missing features
    bm_cols = drop_high_missing(df, bm_cols, missing_thresh)

    # 2. Impute remaining missing
    df = impute_median(df, bm_cols)

    # 3. Clip outliers
    df = clip_outliers(df, bm_cols, outlier_std)

    # 4. Train/test split BEFORE fitting scaler (prevent leakage)
    train_df, test_df = train_test_split(
        df, test_size=test_size, random_state=seed, stratify=df[outcome_col]
    )
    log.info("Split: train=%d  test=%d", len(train_df), len(test_df))

    # 5. Fit scaler on train only, apply to both
    scaler = fit_scaler(train_df, bm_cols, scaler_name)
    train_df = apply_scaler(train_df, bm_cols, scaler)
    test_df = apply_scaler(test_df, bm_cols, scaler)

    # Save outputs
    for path in [output_clean, output_train, output_test, scaler_path]:
        Path(path).parent.mkdir(parents=True, exist_ok=True)

    full_clean = apply_scaler(df, bm_cols, scaler)
    full_clean.to_csv(output_clean, index=False)
    train_df.to_csv(output_train, index=False)
    test_df.to_csv(output_test, index=False)

    with open(scaler_path, "wb") as f:
        pickle.dump({"scaler": scaler, "feature_cols": bm_cols}, f)

    log.info("Saved clean=%s  train=%s  test=%s  scaler=%s",
             output_clean, output_train, output_test, scaler_path)

    return {
        "n_features": len(bm_cols),
        "n_train": len(train_df),
        "n_test": len(test_df),
        "feature_cols": bm_cols,
        "scaler": scaler,
    }


def resolve_output_dir(cfg: dict) -> Path:
    """Return the NetApp volume mount path if available, else the legacy Domino dataset path."""
    netapp_path = Path(cfg["volumes"]["outputs"]["mount_path"])
    if netapp_path.exists():
        log.info("Writing outputs to NetApp volume: %s", netapp_path)
        return netapp_path
    fallback = Path(cfg["data"]["output_dir"])
    log.warning(
        "NetApp volume not mounted at %s — falling back to %s. "
        "Restart the workspace after attaching the volume.",
        netapp_path, fallback,
    )
    return fallback


def main(config_path: str = "config.yaml", input_path: str | None = None):
    cfg = load_config(config_path)
    raw_dir = Path(cfg["data"]["raw_dir"])
    data_dir = resolve_output_dir(cfg)
    data_dir.mkdir(parents=True, exist_ok=True)

    if input_path is None:
        input_path = str(raw_dir / cfg["data"]["synthetic_file"])

    return run_pipeline(
        input_path=input_path,
        output_clean=str(raw_dir / cfg["data"]["clean_file"]),
        output_train=str(data_dir / "train.csv"),
        output_test=str(data_dir / "test.csv"),
        scaler_path=str(data_dir / "scaler.pkl"),
        cfg=cfg,
    )


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Preprocess biomarker cohort")
    parser.add_argument("--config", default="config.yaml")
    parser.add_argument("--input", default=None)
    args = parser.parse_args()
    main(config_path=args.config, input_path=args.input)
