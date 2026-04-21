from pathlib import Path

import dash
import dash_bootstrap_components as dbc
import pandas as pd
import plotly.express as px
import plotly.graph_objects as go
import yaml
from dash import dash_table, dcc, html

# ── Config & data ────────────────────────────────────────────────────────────

_BASE = Path("/mnt/code")
_CFG_PATH = _BASE / "config.yaml"

with open(_CFG_PATH) as f:
    CFG = yaml.safe_load(f)

_RAW_DIR = _BASE / CFG["data"]["raw_dir"]
_COHORT_PATH = _RAW_DIR / CFG["data"]["synthetic_file"]
_CLEAN_PATH = _RAW_DIR / CFG["data"]["clean_file"]
_OUTCOME = CFG["cohort"]["outcome_column"]
_ID_COL = CFG["cohort"]["id_column"]
_BM_PREFIX = "BM_"

df_raw = pd.read_csv(_COHORT_PATH) if _COHORT_PATH.exists() else pd.DataFrame()
df_clean = pd.read_csv(_CLEAN_PATH) if _CLEAN_PATH.exists() else pd.DataFrame()

bm_cols = [c for c in df_raw.columns if c.startswith(_BM_PREFIX)] if not df_raw.empty else []
demo_cols = ["age", "sex", "bmi"]

# ── Helpers ──────────────────────────────────────────────────────────────────

def _stat_card(title, value, subtitle="", color="primary"):
    return dbc.Card(
        dbc.CardBody([
            html.P(title, className="text-muted mb-1", style={"fontSize": "0.8rem", "textTransform": "uppercase", "letterSpacing": "0.05em"}),
            html.H3(value, className=f"text-{color} mb-0 fw-bold"),
            html.Small(subtitle, className="text-muted"),
        ]),
        className="shadow-sm h-100",
    )


def _phase_badge(status):
    color = {"complete": "success", "blocked": "warning", "ready": "info", "planned": "secondary"}
    return dbc.Badge(status.upper(), color=color.get(status, "secondary"), className="ms-2")


# ── Figures ──────────────────────────────────────────────────────────────────

def fig_response_dist():
    if df_raw.empty:
        return go.Figure()
    counts = df_raw[_OUTCOME].value_counts().rename({0: "Non-responder", 1: "Responder"})
    fig = px.bar(
        x=counts.index, y=counts.values,
        color=counts.index,
        color_discrete_map={"Responder": "#198754", "Non-responder": "#dc3545"},
        labels={"x": "", "y": "Patients"},
        text=counts.values,
    )
    fig.update_traces(textposition="outside")
    fig.update_layout(showlegend=False, plot_bgcolor="white", margin=dict(t=20, b=20))
    return fig


def fig_age_dist():
    if df_raw.empty:
        return go.Figure()
    fig = px.histogram(
        df_raw, x="age", color=_OUTCOME,
        color_discrete_map={0: "#dc3545", 1: "#198754"},
        labels={"age": "Age", "count": "Patients", _OUTCOME: "Response"},
        barmode="overlay", opacity=0.7, nbins=20,
    )
    fig.update_layout(plot_bgcolor="white", margin=dict(t=20, b=20))
    return fig


def fig_bmi_dist():
    if df_raw.empty:
        return go.Figure()
    fig = px.violin(
        df_raw, y="bmi", x=df_raw[_OUTCOME].map({0: "Non-resp.", 1: "Responder"}),
        color=df_raw[_OUTCOME].map({0: "Non-resp.", 1: "Responder"}),
        color_discrete_map={"Responder": "#198754", "Non-resp.": "#dc3545"},
        box=True, points="outliers",
        labels={"y": "BMI", "x": ""},
    )
    fig.update_layout(showlegend=False, plot_bgcolor="white", margin=dict(t=20, b=20))
    return fig


def fig_missing_heatmap():
    if df_raw.empty:
        return go.Figure()
    miss = df_raw[bm_cols[:30]].isna().mean().sort_values(ascending=False)
    fig = px.bar(
        x=miss.index, y=miss.values * 100,
        labels={"x": "Biomarker", "y": "Missing (%)"},
        color=miss.values,
        color_continuous_scale="Reds",
    )
    fig.update_layout(plot_bgcolor="white", coloraxis_showscale=False, margin=dict(t=20, b=60))
    return fig


def fig_top_biomarkers():
    if df_raw.empty or not bm_cols:
        return go.Figure()
    resp = df_raw[df_raw[_OUTCOME] == 1][bm_cols[:12]].median()
    nonr = df_raw[df_raw[_OUTCOME] == 0][bm_cols[:12]].median()
    delta = (resp - nonr).abs().sort_values(ascending=False).head(8)
    fig = px.bar(
        x=delta.index, y=delta.values,
        labels={"x": "Biomarker", "y": "Median |Δ| (Responder vs Non-responder)"},
        color=delta.values, color_continuous_scale="Blues",
    )
    fig.update_layout(plot_bgcolor="white", coloraxis_showscale=False, margin=dict(t=20, b=60))
    return fig


# ── Layout ───────────────────────────────────────────────────────────────────

def _cohort_tab():
    if df_raw.empty:
        return dbc.Alert("No cohort data found. Run the data generation pipeline first.", color="warning")

    n = len(df_raw)
    resp_rate = df_raw[_OUTCOME].mean()
    n_bm = len(bm_cols)
    miss_pct = df_raw[bm_cols].isna().mean().mean() * 100 if bm_cols else 0

    return html.Div([
        dbc.Row([
            dbc.Col(_stat_card("Patients", f"{n:,}", "synthetic cohort"), md=3),
            dbc.Col(_stat_card("Responders", f"{resp_rate:.1%}", f"{int(resp_rate*n)} patients", "success"), md=3),
            dbc.Col(_stat_card("Biomarkers", str(n_bm), f"{CFG['cohort']['n_signal_biomarkers']} with signal"), md=3),
            dbc.Col(_stat_card("Missing data", f"{miss_pct:.1f}%", "across biomarker columns", "warning" if miss_pct > 5 else "success"), md=3),
        ], className="g-3 mb-4"),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("Response distribution"),
                    dbc.CardBody(dcc.Graph(figure=fig_response_dist(), config={"displayModeBar": False})),
                ], className="shadow-sm"),
            ], md=4),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("Age distribution by response"),
                    dbc.CardBody(dcc.Graph(figure=fig_age_dist(), config={"displayModeBar": False})),
                ], className="shadow-sm"),
            ], md=4),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("BMI by response"),
                    dbc.CardBody(dcc.Graph(figure=fig_bmi_dist(), config={"displayModeBar": False})),
                ], className="shadow-sm"),
            ], md=4),
        ], className="g-3 mb-4"),

        dbc.Row([
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("Biomarker missing-value rate (first 30)"),
                    dbc.CardBody(dcc.Graph(figure=fig_missing_heatmap(), config={"displayModeBar": False})),
                ], className="shadow-sm"),
            ], md=6),
            dbc.Col([
                dbc.Card([
                    dbc.CardHeader("Top differentially-expressed biomarkers (median Δ, top 8)"),
                    dbc.CardBody(dcc.Graph(figure=fig_top_biomarkers(), config={"displayModeBar": False})),
                ], className="shadow-sm"),
            ], md=6),
        ], className="g-3"),
    ])


def _pipeline_tab():
    phases = [
        ("1", "Data Foundation", "complete", "Synthetic cohort generator + preprocessing. 18/18 tests passing."),
        ("2", "Multi-Omics Ingest", "blocked", "Awaiting rwe-omop-raw volume share from Nick."),
        ("3", "Biomarker Candidate Selection", "ready", "Mann-Whitney U, FDR correction, volcano plot, MLflow tracking."),
        ("4", "Translatability Scoring", "planned", "Species bridging, assay feasibility, tissue availability scores."),
        ("5", "ML Ranking + SHAP", "planned", "Elastic net / random forest with SHAP explanations."),
        ("6", "LLM Mechanistic Narrative", "planned", "RAG over PubMed / OpenAlex with grounded citations."),
        ("7", "Biomarker-to-Protocol", "planned", "Auto-generated clinical validation plan per candidate."),
        ("8", "Audit Trail + App", "planned", "One-click audit package per candidate. Pre-IND defensibility."),
    ]
    rows = []
    for num, name, status, desc in phases:
        badge_color = {"complete": "success", "blocked": "warning", "ready": "info", "planned": "secondary"}[status]
        rows.append(
            html.Tr([
                html.Td(html.Strong(f"Phase {num}"), style={"whiteSpace": "nowrap"}),
                html.Td(name),
                html.Td(dbc.Badge(status.upper(), color=badge_color)),
                html.Td(desc, className="text-muted", style={"fontSize": "0.875rem"}),
            ])
        )

    return dbc.Card([
        dbc.CardHeader(html.Strong("Pipeline phases")),
        dbc.CardBody(
            dbc.Table(
                [html.Thead(html.Tr([html.Th(""), html.Th("Phase"), html.Th("Status"), html.Th("Notes")]))] +
                [html.Tbody(rows)],
                bordered=False, hover=True, responsive=True, size="sm",
            )
        ),
    ], className="shadow-sm")


app = dash.Dash(
    __name__,
    external_stylesheets=[dbc.themes.BOOTSTRAP],
    title="BiomarkerForge",
    suppress_callback_exceptions=True,
)
server = app.server

app.layout = dbc.Container(fluid=True, children=[
    # ── Header ────────────────────────────────────────────────────────────
    dbc.Navbar(
        dbc.Container([
            html.Span([
                html.Strong("BiomarkerForge", style={"fontSize": "1.25rem", "color": "white"}),
                html.Span(" · Translational Biomarker Discovery", style={"color": "rgba(255,255,255,0.65)", "fontSize": "0.9rem", "marginLeft": "0.5rem"}),
            ]),
            dbc.Badge("Phase 1 · Synthetic Data", color="light", text_color="dark"),
        ]),
        color="dark", dark=True, className="mb-4",
    ),

    # ── Tabs ──────────────────────────────────────────────────────────────
    dbc.Tabs([
        dbc.Tab(_cohort_tab(), label="Cohort Overview", tab_id="cohort"),
        dbc.Tab(_pipeline_tab(), label="Pipeline Status", tab_id="pipeline"),
    ], active_tab="cohort"),

    html.Footer(
        html.Small("BiomarkerForge · Non-GxP preclinical discovery · Domino Data Lab", className="text-muted"),
        className="mt-5 mb-3 text-center",
    ),
], style={"backgroundColor": "#f8f9fa", "minHeight": "100vh"})


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8888, debug=False)
