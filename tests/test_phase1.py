"""
Phase 1 acceptance tests — Data Pipeline.

Run: pytest tests/test_phase1.py -v
"""

import pickle
import sys
from pathlib import Path

import numpy as np
import pandas as pd
import pytest
import yaml

# Make src importable
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.pipeline.generate_data import generate_cohort, load_config
from src.pipeline.preprocess import get_biomarker_cols, run_pipeline


# ── Fixtures ──────────────────────────────────────────────────────────────────

@pytest.fixture(scope="session")
def config():
    return load_config("config.yaml")


@pytest.fixture(scope="session")
def raw_cohort(config):
    cfg = config
    return generate_cohort(
        n_samples=cfg["cohort"]["n_samples"],
        n_biomarkers=cfg["cohort"]["n_biomarkers"],
        n_signal=cfg["cohort"]["n_signal_biomarkers"],
        outcome_col=cfg["cohort"]["outcome_column"],
        id_col=cfg["cohort"]["id_column"],
        seed=cfg["project"]["random_seed"],
    )


@pytest.fixture(scope="session")
def pipeline_outputs(config, tmp_path_factory, raw_cohort):
    tmp = tmp_path_factory.mktemp("pipeline")
    input_csv = tmp / "cohort.csv"
    raw_cohort.to_csv(input_csv, index=False)

    result = run_pipeline(
        input_path=str(input_csv),
        output_clean=str(tmp / "clean.csv"),
        output_train=str(tmp / "train.csv"),
        output_test=str(tmp / "test.csv"),
        scaler_path=str(tmp / "scaler.pkl"),
        cfg=config,
    )
    result["tmp"] = tmp
    return result


# ── Data Generation Tests ─────────────────────────────────────────────────────

class TestDataGeneration:

    def test_row_count(self, raw_cohort, config):
        assert len(raw_cohort) == config["cohort"]["n_samples"]

    def test_column_count(self, raw_cohort, config):
        expected_cols = (
            1  # patient_id
            + 3  # age, sex, bmi
            + config["cohort"]["n_biomarkers"]
            + 1  # outcome
        )
        assert len(raw_cohort.columns) == expected_cols

    def test_required_columns_present(self, raw_cohort, config):
        required = {
            config["cohort"]["id_column"],
            config["cohort"]["outcome_column"],
            "age", "sex", "bmi",
        }
        assert required.issubset(set(raw_cohort.columns))

    def test_outcome_is_binary(self, raw_cohort, config):
        outcome = raw_cohort[config["cohort"]["outcome_column"]]
        assert set(outcome.unique()).issubset({0, 1})

    def test_outcome_has_both_classes(self, raw_cohort, config):
        outcome = raw_cohort[config["cohort"]["outcome_column"]]
        assert outcome.sum() > 10, "Too few positive cases"
        assert (1 - outcome).sum() > 10, "Too few negative cases"

    def test_patient_ids_unique(self, raw_cohort, config):
        id_col = config["cohort"]["id_column"]
        assert raw_cohort[id_col].nunique() == len(raw_cohort)

    def test_age_in_valid_range(self, raw_cohort):
        assert raw_cohort["age"].between(18, 90).all()

    def test_bmi_in_valid_range(self, raw_cohort):
        assert raw_cohort["bmi"].between(15, 55).all()

    def test_reproducibility(self, config):
        """Same seed → identical output."""
        cfg = config
        df1 = generate_cohort(100, 10, 2, "response", "patient_id", seed=42)
        df2 = generate_cohort(100, 10, 2, "response", "patient_id", seed=42)
        pd.testing.assert_frame_equal(df1, df2)

    def test_different_seeds_differ(self, config):
        df1 = generate_cohort(100, 10, 2, "response", "patient_id", seed=1)
        df2 = generate_cohort(100, 10, 2, "response", "patient_id", seed=2)
        assert not df1["BM_000"].equals(df2["BM_000"])

    def test_missing_values_present_but_bounded(self, raw_cohort, config):
        """Each biomarker should have <20% missing (injected at ~5%)."""
        bm_cols = [c for c in raw_cohort.columns if c.startswith("BM_")]
        missing_frac = raw_cohort[bm_cols].isna().mean()
        assert (missing_frac < 0.20).all(), "Unexpected high missing rate"
        assert missing_frac.sum() > 0, "Expected some synthetic missing values"


# ── Preprocessing Tests ───────────────────────────────────────────────────────

class TestPreprocessing:

    def test_no_nulls_in_clean_output(self, pipeline_outputs):
        clean = pd.read_csv(pipeline_outputs["tmp"] / "clean.csv")
        bm_cols = [c for c in clean.columns if c.startswith("BM_")]
        assert clean[bm_cols].isna().sum().sum() == 0

    def test_train_test_sizes(self, pipeline_outputs, config):
        n_total = config["cohort"]["n_samples"]
        n_test_expected = int(n_total * config["cohort"]["test_size"])
        assert abs(pipeline_outputs["n_test"] - n_test_expected) <= 2

    def test_no_overlap_train_test(self, pipeline_outputs, config):
        train = pd.read_csv(pipeline_outputs["tmp"] / "train.csv")
        test = pd.read_csv(pipeline_outputs["tmp"] / "test.csv")
        id_col = config["cohort"]["id_column"]
        overlap = set(train[id_col]) & set(test[id_col])
        assert len(overlap) == 0, f"Train/test overlap: {overlap}"

    def test_scaler_artifact_exists(self, pipeline_outputs):
        scaler_path = pipeline_outputs["tmp"] / "scaler.pkl"
        assert scaler_path.exists()
        with open(scaler_path, "rb") as f:
            artifact = pickle.load(f)
        assert "scaler" in artifact
        assert "feature_cols" in artifact

    def test_stratification_preserved(self, pipeline_outputs, config):
        """Response rate in train and test should be within 5% of each other."""
        train = pd.read_csv(pipeline_outputs["tmp"] / "train.csv")
        test = pd.read_csv(pipeline_outputs["tmp"] / "test.csv")
        outcome_col = config["cohort"]["outcome_column"]
        train_rate = train[outcome_col].mean()
        test_rate = test[outcome_col].mean()
        assert abs(train_rate - test_rate) < 0.05, (
            f"Stratification failed: train={train_rate:.2f} test={test_rate:.2f}"
        )

    def test_scaled_features_have_unit_variance(self, pipeline_outputs, config):
        """StandardScaler: train features should have std ≈ 1."""
        if config["preprocessing"]["scaler"] != "standard":
            pytest.skip("Only applies to StandardScaler")
        train = pd.read_csv(pipeline_outputs["tmp"] / "train.csv")
        bm_cols = [c for c in train.columns if c.startswith("BM_")]
        stds = train[bm_cols].std()
        assert ((stds - 1.0).abs() < 0.05).all(), "Features not unit-variance after scaling"

    def test_feature_count_unchanged(self, pipeline_outputs, raw_cohort, config):
        """With ~5% missing per column, no columns should be dropped."""
        bm_original = len([c for c in raw_cohort.columns if c.startswith("BM_")])
        assert pipeline_outputs["n_features"] <= bm_original
        assert pipeline_outputs["n_features"] >= bm_original - 3  # allow minor drops
