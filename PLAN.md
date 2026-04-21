# Biomarker Forge — Phased Implementation Plan

**Platform:** Domino Data Lab
**Goal:** End-to-end biomarker discovery, validation, and deployment pipeline
**Principle:** Working code at every phase beats bulk features. Each phase ships independently and is fully testable before the next begins.

---

## Architecture Overview

```
Raw Clinical/Omics Data
        │
        ▼
[Phase 1] Data Pipeline + EDA
        │  synthetic data → preprocessing → statistical summaries → plots
        ▼
[Phase 2] Biomarker Candidate Selection
        │  univariate stats → multiple testing correction → ranked candidates
        ▼
[Phase 3] ML Model Training + MLflow Tracking
        │  feature selection → cross-validated model → experiment registry
        ▼
[Phase 4] Model API Deployment
        │  FastAPI endpoint → Domino Model API → scored predictions
        ▼
[Phase 5] Interactive Dashboard
           Plotly Dash app → live exploration + report export
```

---

## Phase 1 — Data Foundation + EDA  *(CURRENT)*

**Goal:** Prove the data pipeline works end-to-end before any analysis.

### What it delivers
- Synthetic clinical biomarker dataset (reproducible, mimics real shape)
- Preprocessing pipeline: missing values, normalization, cohort splits
- EDA notebook: distributions, correlation heatmap, cohort comparisons
- All outputs written to `/mnt/data/biomarker_forge/` or `reports/`

### Acceptance Criteria
- [ ] `python src/pipeline/generate_data.py` produces `data/synthetic/cohort.csv`
- [ ] `python src/pipeline/preprocess.py` produces `data/synthetic/cohort_clean.csv`
- [ ] `pytest tests/test_phase1.py` passes (data shape, no nulls, expected columns)
- [ ] Notebook `notebooks/01_eda.ipynb` runs top-to-bottom without error
- [ ] At least 3 plots saved to `reports/`

### Files
```
src/pipeline/generate_data.py   ← synthetic dataset generator
src/pipeline/preprocess.py      ← cleaning + normalization pipeline
notebooks/01_eda.ipynb          ← exploratory analysis
tests/test_phase1.py            ← acceptance tests
reports/                        ← output plots (png)
```

---

## Phase 2 — Biomarker Candidate Selection

**Goal:** Identify statistically significant biomarker candidates with rigorous multiple-testing correction.

### What it delivers
- Univariate analysis: t-test + Mann-Whitney U for continuous, chi-square for categorical
- Log-rank test for time-to-event endpoints (if survival data present)
- Benjamini-Hochberg FDR correction
- Volcano plot, ranked candidate table
- Output: `reports/biomarker_candidates.csv`

### Acceptance Criteria
- [ ] `python src/pipeline/biomarker_selection.py` runs and writes candidate CSV
- [ ] FDR-corrected p-values present; no unadjusted values surfaced as findings
- [ ] `pytest tests/test_phase2.py` validates: correct columns, p-values in [0,1], top-N candidates deterministic with fixed seed
- [ ] Volcano plot saved to `reports/volcano.png`
- [ ] At least 1 positive control biomarker (synthetically injected signal) is recovered in top 10

### Files
```
src/pipeline/biomarker_selection.py
tests/test_phase2.py
reports/biomarker_candidates.csv
reports/volcano.png
```

---

## Phase 3 — ML Model Training + MLflow Tracking

**Goal:** Train a validated model on selected biomarkers; every run is tracked in MLflow.

### What it delivers
- Feature selection: variance threshold + top-N from Phase 2
- Model: Logistic Regression baseline + Random Forest comparison
- Evaluation: stratified k-fold CV, ROC-AUC, precision-recall, calibration
- MLflow: every run logged (params, metrics, artifacts, model artifact)
- Best model registered in MLflow Model Registry

### Acceptance Criteria
- [ ] `python src/models/train.py` runs and logs to MLflow (local or Domino-managed)
- [ ] MLflow UI shows ≥2 runs with AUC metric logged
- [ ] Best model promoted to `staging` in registry
- [ ] `pytest tests/test_phase3.py` validates: model loads from registry, predicts on held-out set, AUC > 0.6 (synthetic floor)
- [ ] ROC curve saved to `reports/roc_curve.png`

### Files
```
src/models/train.py
src/models/evaluate.py
tests/test_phase3.py
reports/roc_curve.png
mlruns/                    ← MLflow tracking (gitignored)
```

---

## Phase 4 — Model Serving API

**Goal:** Expose the registered model as a REST endpoint suitable for Domino Model API.

### What it delivers
- FastAPI app wrapping the MLflow-registered model
- `/predict` endpoint: accepts patient feature JSON, returns score + confidence
- `/health` endpoint: liveness check
- Input validation with Pydantic schemas
- Domino `model.py` entrypoint for native Domino Model deployment

### Acceptance Criteria
- [ ] `uvicorn src/api/app:app` starts without error
- [ ] `curl` to `/health` returns `{"status": "ok"}`
- [ ] `curl` to `/predict` with valid payload returns `{"score": float, "label": int}`
- [ ] `curl` with malformed payload returns HTTP 422 (not 500)
- [ ] `pytest tests/test_phase4.py` covers happy path + 3 error cases
- [ ] `src/api/model.py` conforms to Domino Model API entrypoint contract

### Files
```
src/api/app.py
src/api/model.py           ← Domino Model API entrypoint
src/api/schemas.py
tests/test_phase4.py
```

---

## Phase 5 — Interactive Dashboard + Reporting

**Goal:** Give stakeholders a self-serve tool to explore biomarker findings and export reports.

### What it delivers
- Plotly Dash app with: volcano explorer, model performance panel, cohort comparisons
- PDF/HTML report export (static snapshot)
- Domino App deployment entrypoint

### Acceptance Criteria
- [ ] `python src/dashboard/app.py` starts on port 8050 without error
- [ ] Volcano plot is interactive (hover, filter by FDR threshold)
- [ ] Cohort comparison updates on dropdown selection
- [ ] Report export produces `reports/summary_report.html`
- [ ] `pytest tests/test_phase5.py` validates layout renders (Dash testing)

### Files
```
src/dashboard/app.py
src/dashboard/components/
tests/test_phase5.py
reports/summary_report.html
```

---

## Cross-Cutting Concerns (all phases)

| Concern | Approach |
|---|---|
| Reproducibility | Fixed random seeds, versioned data in `/mnt/data/biomarker_forge/` |
| Config | `config.yaml` — no magic numbers in code |
| Logging | Python `logging` module, structured output |
| Secrets | Environment variables only, never committed |
| MLflow | Tracks all experiments; use Domino-managed MLflow if available |
| Data | Synthetic data until real data is available; same schema contract |

---

## Current Status

| Phase | Status |
|---|---|
| Phase 1 | **COMPLETE** ✓ — 18/18 tests passing |
| Phase 2 | Ready to start |
| Phase 3 | Planned |
| Phase 4 | Planned |
| Phase 5 | Planned |
