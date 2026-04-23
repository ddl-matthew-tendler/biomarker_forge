"""INDForge — preclinical → IND-enabling biomarker package app.

Serves static assets from indforge_static/ and a small set of mock JSON
endpoints. Live endpoints are stubs — when wired to Domino, they'd read
from the biomarker-forge-outputs NetApp volume plus tox/PK stores.
"""

from __future__ import annotations

import os
from pathlib import Path

from fastapi import FastAPI
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

BASE_DIR = Path(__file__).resolve().parent
STATIC_DIR = BASE_DIR / "indforge_static"

app = FastAPI(title="INDForge")
app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
def root():
    return FileResponse(str(STATIC_DIR / "index.html"))


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "INDForge"}


@app.get("/api/context")
def context():
    return {
        "app": "INDForge",
        "project_id": os.environ.get("DOMINO_PROJECT_ID"),
        "project_name": os.environ.get("DOMINO_PROJECT_NAME"),
        "project_owner": os.environ.get("DOMINO_PROJECT_OWNER"),
    }


@app.get("/api/candidates")
def candidates():
    # Live endpoint stub. In production this reads the scored shortlist
    # produced by BiomarkerForge and re-ranks on preclinical evidence.
    return JSONResponse(
        {"error": "live_data_unavailable",
         "detail": "Connect to biomarker-forge-outputs volume and GLP tox store."},
        status_code=503,
    )


@app.get("/api/safety")
def safety():
    return JSONResponse({"error": "live_data_unavailable"}, status_code=503)


@app.get("/api/pkpd")
def pkpd():
    return JSONResponse({"error": "live_data_unavailable"}, status_code=503)


@app.get("/api/ind-package")
def ind_package():
    return JSONResponse({"error": "live_data_unavailable"}, status_code=503)
