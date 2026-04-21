from pathlib import Path

import yaml
from fastapi import FastAPI
from fastapi.responses import JSONResponse

app = FastAPI(title="BiomarkerForge", version="0.1.0")

_CONFIG_PATH = Path("/mnt/code/config.yaml")


def _load_config() -> dict:
    if _CONFIG_PATH.exists():
        with open(_CONFIG_PATH) as f:
            return yaml.safe_load(f)
    return {}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/status")
def status():
    cfg = _load_config()
    return {
        "project": cfg.get("project", {}),
        "phases": {
            "1_data_foundation": "complete",
            "2_multi_omics_ingest": "blocked",
            "3_biomarker_selection": "ready",
            "4_translatability_scoring": "planned",
            "5_ml_ranking": "planned",
            "6_llm_narrative": "planned",
            "7_protocol_generator": "planned",
            "8_audit_app": "planned",
        },
    }


@app.get("/data/summary")
def data_summary():
    try:
        import pandas as pd

        cfg = _load_config()
        raw_dir = Path(cfg.get("data", {}).get("raw_dir", "data/synthetic"))
        cohort_path = Path("/mnt/code") / raw_dir / cfg.get("data", {}).get("synthetic_file", "cohort.csv")

        if not cohort_path.exists():
            return JSONResponse(status_code=404, content={"detail": "Cohort not yet generated"})

        df = pd.read_csv(cohort_path)
        outcome_col = cfg.get("cohort", {}).get("outcome_column", "response")
        id_col = cfg.get("cohort", {}).get("id_column", "patient_id")

        return {
            "n_patients": len(df),
            "n_features": len(df.columns) - 2,
            "response_rate": round(float(df[outcome_col].mean()), 4) if outcome_col in df.columns else None,
            "missing_pct": round(float(df.drop(columns=[id_col, outcome_col], errors="ignore").isna().mean().mean()), 4),
        }
    except Exception as exc:
        return JSONResponse(status_code=500, content={"detail": str(exc)})
