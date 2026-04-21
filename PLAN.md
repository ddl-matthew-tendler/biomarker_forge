# BiomarkerForge — Implementation Plan

*Aligned to FDE Spec: `FDE_BiomarkerForge_NonGxP copy.md`*
*Classification: Non-GxP, pre-IND / translational research*
*Target persona: Translational Scientist*

---

## Product Vision (from spec)

BiomarkerForge compresses biomarker nomination from multi-omics data to a **defensible, translationally-scored shortlist + first-draft clinical validation plan** — from months to days — with every decision reproducible and auditable at a pre-IND meeting.

### Three wedge commitments (must be visible from the first demo)

1. **"Biomarker-to-protocol" in a single click** — auto-generate a first-draft clinical validation plan (assay format, patient population, power calc, specimen SOP, timeline, cost envelope) from the discovery results. No competitor does this.
2. **Translatability scoring baked into every candidate** — species-bridging, assay-feasibility, and tissue-availability scores with evidence surfaced alongside the statistics.
3. **Defensibility as a first-class feature** — one-click audit package per candidate that holds up at a pre-IND meeting six months later.

### What to explicitly NOT build in v1

- Full EDC / clinical-trial-data integration
- A replacement for QIAGEN IPA's curated pathway content (import IPA exports; don't rebuild)
- A fully-autonomous biomarker nomination agent (every human checkpoint earns trust)

---

## Architecture

```
 ┌─────────────────────────────────────────────────────────────────┐
 │  Data Layer (NetApp Volumes)                                     │
 │  rwe-omop-raw (read-only)   biomarker-forge-outputs (read-write) │
 └────────────────────────────┬────────────────────────────────────┘
                              │
 ┌────────────────────────────▼────────────────────────────────────┐
 │  Phase 2 — Multi-Omics Ingest + Cohort Assembly                  │
 │  OMOP → internal schema, sample ID reconciliation, QC flags      │
 └────────────────────────────┬────────────────────────────────────┘
                              │
 ┌────────────────────────────▼────────────────────────────────────┐
 │  Phase 3 — Biomarker Candidate Selection                         │
 │  Univariate stats, FDR correction, volcano plot                  │
 │  → MLflow Experiment Manager (every run tracked)                 │
 └────────────────────────────┬────────────────────────────────────┘
                              │
 ┌────────────────────────────▼────────────────────────────────────┐
 │  Phase 4 — Translatability Scoring                               │
 │  Species bridging, assay feasibility, tissue availability        │
 │  → scored shortlist CSV                                          │
 └────────────────────────────┬────────────────────────────────────┘
                              │
 ┌────────────────────────────▼────────────────────────────────────┐
 │  Phase 5 — ML Ranking + SHAP Explainability                      │
 │  Elastic net / random forest, SHAP feature attribution           │
 │  → Domino Model Registry (versioned, promoted by stage)          │
 └────────────────────────────┬────────────────────────────────────┘
                              │
 ┌────────────────────────────▼────────────────────────────────────┐
 │  Phase 6 — LLM Mechanistic Narrative (RAG)                       │
 │  Claude via Bedrock/Azure, PubMed/OpenAlex retrieval             │
 │  → grounded narrative with inline citations                      │
 └────────────────────────────┬────────────────────────────────────┘
                              │
 ┌────────────────────────────▼────────────────────────────────────┐
 │  Phase 7 — Biomarker-to-Protocol Generator                       │
 │  Structured validation plan: assay, population, power calc       │
 │  specimen SOP, timeline, cost envelope → DOCX/PDF export         │
 └────────────────────────────┬────────────────────────────────────┘
                              │
 ┌────────────────────────────▼────────────────────────────────────┐
 │  Phase 8 — Defensibility Audit Trail + Domino App                │
 │  Per-candidate audit package, interactive explorer               │
 │  Domino App deployment (translational scientist UI)              │
 └─────────────────────────────────────────────────────────────────┘
```

---

## Phase 1 — Data Foundation ✅ COMPLETE

**18/18 tests passing.**

Delivered: synthetic cohort generator, preprocessing pipeline (imputation, outlier clipping,
StandardScaler, stratified split), EDA notebook, 4 report plots, NetApp write volume
(`biomarker-forge-outputs`) created and attached at `/mnt/netapp-volumes/biomarker-forge-outputs`.

Pending: `rwe-omop-raw` volume share from Nick (monitoring every 5 min).

---

## Phase 2 — Multi-Omics Ingest + Cohort Assembly

**Goal:** Replace synthetic data with the real OMOP dataset. Produce a clean, reconciled
cohort file that the rest of the pipeline consumes unchanged.

### Context

The `rwe-omop-raw` volume holds OMOP CDM data. Key tables for biomarker work:
- `measurement` — lab values, assay results, biomarker panel readings
- `observation` — clinical observations, PD readouts
- `person` — demographics (age, sex, race)
- `condition_occurrence` — diagnosis / outcome definition
- `drug_exposure` — treatment arm, dose

v1 target modalities per spec: **clinical measurements (proxy for proteomics panel) + condition/treatment metadata**.

### What it delivers

- `src/pipeline/ingest.py` — reads OMOP tables from the NetApp volume, maps to
  BiomarkerForge internal schema (`patient_id`, biomarker columns, outcome column,
  demographics, treatment arm)
- Sample ID reconciliation with a QC report (any patient in measurements but missing from
  person table flagged; any QC-fail rows surfaced, not silently dropped)
- Modality manifest written to `biomarker-forge-outputs/cohort_manifest.json`
  (which tables, row counts, date range, QC flag rates)
- Existing `preprocess.py` and tests run unchanged against the real cohort

### Acceptance Criteria

- [ ] `python src/pipeline/ingest.py` reads from `/mnt/netapp-volumes/rwe-omop-raw/` and
      writes `cohort_raw.csv` to `biomarker-forge-outputs/`
- [ ] `cohort_manifest.json` present with table provenance, row counts, QC flag summary
- [ ] Zero silently-dropped rows — every exclusion logged with reason
- [ ] `pytest tests/test_phase2_ingest.py` passes: schema contract, no silent nulls in
      outcome column, patient IDs unique, QC flags propagated
- [ ] `python src/pipeline/preprocess.py` runs on real cohort without code changes
- [ ] Phase 1 preprocessing tests still pass against real data (regression gate)

### Files

```
src/pipeline/ingest.py
src/pipeline/omop_mappings.py      ← OMOP concept IDs → biomarker column names
tests/test_phase2_ingest.py
biomarker-forge-outputs/
  cohort_raw.csv
  cohort_manifest.json
```

---

## Phase 3 — Biomarker Candidate Selection + Experiment Tracking

**Goal:** Rank all biomarker candidates by statistical evidence; log every run to
Domino Experiment Manager so parameter choices are never lost.

### What it delivers

- `src/pipeline/biomarker_selection.py`
  - Mann-Whitney U (non-parametric; appropriate for skewed assay distributions)
  - Effect size: rank-biserial correlation
  - Benjamini-Hochberg FDR correction (q < 0.05 threshold configurable)
  - Ranked output: `biomarker_candidates.csv` (biomarker, p-value, q-value, effect size,
    direction, n_responders, n_nonresponders)
- Volcano plot (effect size vs −log₁₀ p, FDR threshold line) → `reports/volcano.png`
- Every run logged to MLflow with: FDR threshold, test type, n_features_tested,
  n_significant, top-10 candidates, volcano artifact
- Experiment name: `biomarker_forge_selection`

### Acceptance Criteria

- [ ] `python src/pipeline/biomarker_selection.py` writes `biomarker_candidates.csv`
- [ ] All p-values FDR-corrected; raw p-values stored but never surfaced as findings
- [ ] Volcano plot saved to `reports/volcano.png`
- [ ] MLflow run visible in Domino Experiment Manager with params + metrics + artifacts
- [ ] `pytest tests/test_phase3_selection.py` passes:
      - q-values in [0, 1]
      - `biomarker_candidates.csv` has required columns
      - Re-running with same seed produces identical results (reproducibility gate)
      - On synthetic data: all 8 injected signal biomarkers in top 20 (ground truth gate)

### Files

```
src/pipeline/biomarker_selection.py
tests/test_phase3_selection.py
reports/volcano.png
biomarker-forge-outputs/biomarker_candidates.csv
```

---

## Phase 4 — Translatability Scoring Engine

**Goal:** Every candidate on the shortlist carries a structured translatability score before
entering the nomination board. This is the #1 differentiator from QIAGEN IPA, SomaScan,
and DNAnexus — none of them do this.

### Scoring dimensions (per spec)

| Dimension | Source | v1 approach |
|---|---|---|
| **Species conservation** | Human Protein Atlas, UniProt, Ensembl ortholog table | Ortholog existence + percent identity |
| **Assay feasibility** | Internal rule set + HPA antibody data | Validated clinical assay exists? Format (ELISA, MSD, IHC)? Specimen type? |
| **Tissue availability** | HPA tissue expression + indication-specific priors | Is the required specimen routinely collected in this indication? |
| **Regulatory precedent** | OpenTargets, curated rule set | Prior use as PD biomarker in IND/NDA? |

Each dimension scores 0–3; composite score 0–12. All scores include the evidence snippet
that justifies them (not just a number).

### What it delivers

- `src/scoring/translatability.py`
  - Pulls HPA / UniProt / Ensembl data via public API (cached locally in
    `biomarker-forge-outputs/reference_cache/` — versioned, never re-fetched mid-analysis)
  - Scores each candidate on all four dimensions
  - Returns `shortlist_scored.csv` — candidate table + scores + evidence snippets
- Reference data cache with version manifest (so re-running in 6 months uses the same
  reference snapshot)

### Acceptance Criteria

- [ ] `python src/scoring/translatability.py` reads `biomarker_candidates.csv` and writes
      `shortlist_scored.csv` to `biomarker-forge-outputs/`
- [ ] Every candidate has a score for all four dimensions (no silently-missing scores)
- [ ] Every score has a non-empty `evidence` field (not just a number)
- [ ] Reference cache written to `biomarker-forge-outputs/reference_cache/` with
      `cache_manifest.json` (source, version/date, record count)
- [ ] `pytest tests/test_phase4_scoring.py` passes:
      - Scores in [0, 3] per dimension, [0, 12] composite
      - Deterministic with fixed cache (no live API calls in test mode)
      - At least one candidate scores > 0 on assay feasibility (smoke test)
- [ ] Re-running against a frozen cache produces byte-identical output (reproducibility gate)

### Files

```
src/scoring/__init__.py
src/scoring/translatability.py
src/scoring/reference_cache.py     ← cache management + version manifest
tests/test_phase4_scoring.py
biomarker-forge-outputs/
  shortlist_scored.csv
  reference_cache/
    cache_manifest.json
```

---

## Phase 5 — ML Ranking + SHAP Explainability + Model Registry

**Goal:** Train a model that integrates multi-omics signal into a single ranked score per
candidate. SHAP explanations are non-negotiable — "black box with a confidence score
is a non-starter" (spec, Section 6).

### What it delivers

- `src/models/train.py`
  - Feature set: top candidates from Phase 3 + translatability scores from Phase 4
  - Models: Elastic Net (interpretable baseline) + Random Forest (performance ceiling)
  - Stratified k-fold CV, ROC-AUC primary metric, calibration curves
  - SHAP values for every prediction (TreeExplainer for RF, LinearExplainer for EN)
  - Every run logged to MLflow (`biomarker_forge_models` experiment):
    params, CV metrics, SHAP summary plot, ROC curve, feature importance
- `src/models/evaluate.py` — held-out test set evaluation
- Best model registered in Domino Model Registry as `BiomarkerForge_Ranker`
  - Staging → after CV gate (AUC > 0.65 on real data)
  - Production → after manual scientist review checkpoint

### Acceptance Criteria

- [ ] `python src/models/train.py` runs and logs ≥ 2 runs to Domino Experiment Manager
- [ ] SHAP summary plot saved as MLflow artifact for every run
- [ ] Best model registered as `BiomarkerForge_Ranker` in Domino Model Registry
- [ ] `pytest tests/test_phase5_model.py` passes:
      - Model loads from registry by name + stage
      - Predicts on held-out set without error
      - SHAP values sum approximately to prediction (additivity check)
      - AUC > 0.55 on synthetic data (floor gate; real data target > 0.65)
- [ ] No feature in the SHAP output is unexplained (every input column has a SHAP value)

### Files

```
src/models/__init__.py
src/models/train.py
src/models/evaluate.py
tests/test_phase5_model.py
reports/shap_summary.png
reports/roc_curve.png
```

---

## Phase 6 — LLM Mechanistic Narrative (RAG)

**Goal:** For each shortlisted candidate, generate a grounded mechanistic narrative —
"why did this biomarker make the shortlist?" — with inline citations traceable to
retrieved publications. Claude is the preferred model per spec.

### Design constraints (from spec)

- **No fabricated citations** — every claim traces to a retrieved document
- **No free-form hallucination** — structured prompt templates with strict grounding
- **Prompt, retrieved context chunks, and generated output all logged** (audit requirement)
- **Model version pinned per analysis run** — included in audit trail
- **Content safety**: output framed as scientific hypothesis, not clinical-use guidance

### What it delivers

- `src/narrative/retriever.py`
  - PubMed / OpenAlex search for each candidate gene/protein
  - Returns top-N abstracts with PMID/DOI, ranked by relevance
  - Results cached in `biomarker-forge-outputs/literature_cache/`
- `src/narrative/narrator.py`
  - Claude API call (via Bedrock or Azure OpenAI endpoint configured in environment)
  - Structured prompt: candidate stats + SHAP explanation + translatability scores +
    retrieved abstracts → 2-paragraph mechanistic narrative with inline citations
  - Outputs `narrative_package.json` per candidate:
    `{candidate, narrative, citations: [{pmid, title, snippet}], model_version, prompt_hash}`
- Audit log: every LLM call appended to `biomarker-forge-outputs/llm_audit_log.jsonl`

### Acceptance Criteria

- [ ] `python src/narrative/narrator.py` generates narratives for top-10 candidates
- [ ] Every narrative contains ≥ 1 inline citation `[PMID:XXXXXXX]`
- [ ] `narrative_package.json` present for each candidate with all required fields
- [ ] `llm_audit_log.jsonl` captures prompt, retrieved chunks, model version, timestamp
- [ ] `pytest tests/test_phase6_narrative.py` passes:
      - Citation format valid (PMID resolvable)
      - No narrative exceeds 500 words (length gate)
      - `model_version` field present and non-empty
      - Prompt hash reproducible for same inputs (determinism check)
- [ ] Re-running with cached literature produces identical citation set

### Files

```
src/narrative/__init__.py
src/narrative/retriever.py
src/narrative/narrator.py
tests/test_phase6_narrative.py
biomarker-forge-outputs/
  literature_cache/
  llm_audit_log.jsonl
  candidates/
    <biomarker_id>/
      narrative_package.json
```

---

## Phase 7 — Biomarker-to-Protocol Generator

**Goal:** The wedge feature. For each top-ranked candidate, auto-generate a first-draft
clinical validation plan. This is what no competitor produces, and it is the output a
Head of Translational Medicine will pay for.

### Validation plan components (per spec)

| Component | Approach |
|---|---|
| **Assay format recommendation** | Rules from translatability scorecard (Phase 4) + LLM |
| **Patient population** | Indication-specific priors + inclusion/exclusion template |
| **Sample size + power calc** | Statistical power calculation (observed effect size + α = 0.05, β = 0.8) |
| **Specimen SOP** | Template library keyed on assay format + tissue type |
| **12-month timeline** | Phase-gated timeline template populated from assay complexity |
| **Cost envelope** | Rule-based estimate from assay format + sample size |

### What it delivers

- `src/protocol/generator.py`
  - Accepts: candidate ID, translatability scorecard, effect size, assay format
  - Outputs structured `validation_plan.json` per candidate
  - LLM fills narrative sections; rule engine fills numbers (power calc, cost, timeline)
  - Scientist review checkpoint: plan marked `status: draft` until scientist approves
- `src/protocol/exporter.py`
  - Renders validation plan to DOCX and PDF
  - Each export stamped with: analysis run ID, model version, candidate stats,
    git commit, timestamp

### Acceptance Criteria

- [ ] `python src/protocol/generator.py` produces `validation_plan.json` for top-3 candidates
- [ ] All 6 plan components present and non-empty in output JSON
- [ ] Power calculation uses observed effect size from Phase 3 (not a hardcoded number)
- [ ] DOCX export renders without error and contains all 6 sections
- [ ] `validation_plan.json` carries `status: draft` and `scientist_approved: false` by default
- [ ] `pytest tests/test_phase7_protocol.py` passes:
      - JSON schema validates against required fields
      - Power calc output is mathematically consistent with inputs
      - DOCX byte count > 0 (smoke test)
- [ ] Plan references the candidate's SHAP top-3 features as mechanistic rationale

### Files

```
src/protocol/__init__.py
src/protocol/generator.py
src/protocol/exporter.py
src/protocol/templates/           ← specimen SOP and timeline templates
tests/test_phase7_protocol.py
biomarker-forge-outputs/
  candidates/
    <biomarker_id>/
      validation_plan.json
      validation_plan.docx
```

---

## Phase 8 — Defensibility Audit Trail + Domino App

**Goal:** Wrap everything in a Domino App the translational scientist can use without
touching code. Every candidate has a one-click audit package that holds up at a
pre-IND meeting.

### Audit package per candidate (per spec)

1. Which samples contributed (cohort manifest + exclusion log)
2. Statistical parameters (Phase 3 run ID, thresholds, FDR)
3. Cross-modality support
4. Translatability scores + evidence (Phase 4)
5. ML ranking + SHAP feature attribution (Phase 5)
6. Mechanistic narrative + full citation chain (Phase 6)
7. First-draft validation plan (Phase 7)
8. All human overrides / re-rankings with rationale and timestamp

### What it delivers

- `src/audit/package.py` — assembles the above into `audit_package.json` per candidate
- `src/dashboard/app.py` — Plotly Dash app:
  - **Shortlist view**: ranked table with composite score, translatability badge, FDR
  - **Candidate deep-dive**: SHAP waterfall, volcano position, narrative, scorecard
  - **Comparison view**: side-by-side candidates or this-run vs previous-run
  - **Protocol panel**: validation plan draft with scientist approve/reject controls
  - **Audit panel**: full audit package, one-click PDF export
- Registered as a Domino App

### Acceptance Criteria

- [ ] `python src/dashboard/app.py` starts on port 8050 without error
- [ ] Shortlist table loads and is sortable by any column
- [ ] Clicking a candidate opens the deep-dive panel with all 8 audit components
- [ ] "Export audit package" button produces a PDF
- [ ] Scientist approve/reject updates `scientist_approved` in `validation_plan.json`
      and logs the action with user + timestamp
- [ ] `pytest tests/test_phase8_app.py` validates layout and key component rendering
- [ ] App deployable as a Domino App (entrypoint documented)

### Files

```
src/audit/__init__.py
src/audit/package.py
src/dashboard/__init__.py
src/dashboard/app.py
src/dashboard/components/
tests/test_phase8_app.py
```

---

## Cross-Cutting Concerns (all phases)

| Concern | Approach |
|---|---|
| **Reproducibility** | Every run pins: dataset snapshot IDs, container image, parameter set, model version, git commit |
| **Provenance** | Domino MLflow tags auto-attach: run ID, project, environment, hardware tier, user, git commit |
| **LLM audit** | Prompt + retrieved context + output + model version logged to `llm_audit_log.jsonl` for every call. Model version pinned per run. |
| **Reference data** | Public APIs (HPA, UniProt, PubMed) cached in `reference_cache/` with version manifest. No live API calls during analysis. |
| **Config** | All parameters in `config.yaml`. No magic numbers in code. |
| **Testing** | Each phase has its own `tests/test_phaseN_*.py`. Synthetic data always available as CI fallback. |
| **Data writes** | All outputs to NetApp volume at `/mnt/netapp-volumes/biomarker-forge-outputs/` |
| **Secrets** | LLM API keys via Domino user secrets / environment variables. Never committed. |
| **R parity** | v1 is Python. R wrappers planned for v2 — spec requires parity. |

---

## Status

| Phase | Status | Tests |
|---|---|---|
| 1 — Data Foundation | **COMPLETE** | 18/18 ✅ |
| 2 — Multi-Omics Ingest | Blocked — awaiting `rwe-omop-raw` volume share from Nick | — |
| 3 — Biomarker Candidate Selection | **Ready to build** (unblocked, synthetic data available) | — |
| 4 — Translatability Scoring | Planned | — |
| 5 — ML Ranking + SHAP | Planned | — |
| 6 — LLM Narrative (RAG) | Planned | — |
| 7 — Biomarker-to-Protocol | Planned | — |
| 8 — Audit Trail + Domino App | Planned | — |
