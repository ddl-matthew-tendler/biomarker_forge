// INDForge mock data — preclinical biomarker candidates carried from
// BiomarkerForge discovery, re-scored on IND-enabling evidence.

var MOCK_CANDIDATES = [
  { id: 'BMK-001', symbol: 'CXCL9',   target: 'PD-L1 pathway',  assay: 'ELISA (plasma)',  species_concordance: 0.92, assay_feasibility: 0.88, pd_dynamic_range: 0.81, safety_overlap: 'none',   role: 'efficacy_pd', confidence: 'high',   updated: '2026-04-18' },
  { id: 'BMK-002', symbol: 'ALT',     target: 'Hepatic',        assay: 'Clin chem',       species_concordance: 0.99, assay_feasibility: 0.99, pd_dynamic_range: 0.40, safety_overlap: 'dili',   role: 'safety',      confidence: 'high',   updated: '2026-04-20' },
  { id: 'BMK-003', symbol: 'IFNG',    target: 'T-cell activation', assay: 'MSD',          species_concordance: 0.85, assay_feasibility: 0.78, pd_dynamic_range: 0.76, safety_overlap: 'none',   role: 'efficacy_pd', confidence: 'medium', updated: '2026-04-12' },
  { id: 'BMK-004', symbol: 'cTnI',    target: 'Cardiac',        assay: 'High-sensitivity', species_concordance: 0.97, assay_feasibility: 0.95, pd_dynamic_range: 0.30, safety_overlap: 'cardio', role: 'safety',      confidence: 'high',   updated: '2026-04-22' },
  { id: 'BMK-005', symbol: 'GZMB',    target: 'Cytotoxic T',    assay: 'Flow cytometry',  species_concordance: 0.74, assay_feasibility: 0.62, pd_dynamic_range: 0.68, safety_overlap: 'none',   role: 'efficacy_pd', confidence: 'medium', updated: '2026-04-10' },
  { id: 'BMK-006', symbol: 'CREA',    target: 'Renal',          assay: 'Clin chem',       species_concordance: 0.98, assay_feasibility: 0.99, pd_dynamic_range: 0.25, safety_overlap: 'nephro', role: 'safety',      confidence: 'high',   updated: '2026-04-21' },
  { id: 'BMK-007', symbol: 'PDCD1',   target: 'PD-1',           assay: 'IHC (tumor)',     species_concordance: 0.70, assay_feasibility: 0.55, pd_dynamic_range: 0.72, safety_overlap: 'none',   role: 'target_engagement', confidence: 'medium', updated: '2026-04-08' },
  { id: 'BMK-008', symbol: 'TIGIT',   target: 'T-cell exhaustion', assay: 'Flow',         species_concordance: 0.66, assay_feasibility: 0.58, pd_dynamic_range: 0.64, safety_overlap: 'none',   role: 'efficacy_pd', confidence: 'low',    updated: '2026-04-05' },
  { id: 'BMK-009', symbol: 'IL6',     target: 'Inflammatory',   assay: 'MSD',             species_concordance: 0.88, assay_feasibility: 0.82, pd_dynamic_range: 0.55, safety_overlap: 'crs',    role: 'safety',      confidence: 'medium', updated: '2026-04-19' },
  { id: 'BMK-010', symbol: 'CXCL10',  target: 'Th1 chemokine',  assay: 'ELISA',           species_concordance: 0.90, assay_feasibility: 0.85, pd_dynamic_range: 0.78, safety_overlap: 'none',   role: 'efficacy_pd', confidence: 'high',   updated: '2026-04-17' },
];

// Tox studies summary (legacy shape — kept for the existing study table)
var MOCK_TOX_STUDIES = [
  { id: 'GLP-001', species: 'Rat',   study_type: '28-day GLP',  noael_mg_kg: 12,  findings: ['Mild ALT elevation @ 30 mg/kg'], glp: true,  status: 'Complete' },
  { id: 'GLP-002', species: 'NHP',   study_type: '28-day GLP',  noael_mg_kg: 6,   findings: ['Transient IL-6 spike @ 20 mg/kg'], glp: true, status: 'Complete' },
  { id: 'GLP-003', species: 'Mouse', study_type: 'Efficacy',    noael_mg_kg: null, findings: [], glp: false, status: 'Complete' },
  { id: 'GLP-004', species: 'Rat',   study_type: 'Cardiovascular safety', noael_mg_kg: 15, findings: ['No cTnI change'], glp: true, status: 'Complete' },
];

// Full GLP study records — used by the safety heatmap, dose calculator,
// and audit lineage drawer. Mirrors the server-side _GLP_STUDIES in
// indforge_app.py.
var MOCK_GLP_STUDIES = [
  { id: 'GLP-001', species: 'Rat', study_type: '28-day repeat-dose GLP',
    animal_bw_kg: 0.25, n_animals: 80, dose_groups_mg_per_kg: [0, 3, 10, 30],
    noael_mg_kg: 12.0, study_director: 'K. Hartwell, DVM, DABT',
    study_date: '2025-09-12', cro: 'Charles River Mattawan',
    audit_chain_hash: 'sha256:e2c4…a91f',
    findings: [
      { day: 14, severity: 'Mild', organ: 'Liver',
        text: 'Mild ALT elevation at 30 mg/kg (4 of 10 animals); recovered by Day 28; HE histopathology unremarkable.' },
    ] },
  { id: 'GLP-002', species: 'NHP', study_type: '28-day repeat-dose GLP',
    animal_bw_kg: 5.0, n_animals: 40, dose_groups_mg_per_kg: [0, 2, 6, 20],
    noael_mg_kg: 6.0, study_director: 'M. Okafor, PhD, DABT',
    study_date: '2025-11-04', cro: 'Labcorp Madison',
    audit_chain_hash: 'sha256:9bd8…71c2',
    findings: [
      { day: 14, severity: 'Moderate', organ: 'CRS / Immune',
        text: 'Transient IL-6 spike at 20 mg/kg (Cmax 142 pg/mL); resolved by Day 21; no clinical correlate.' },
      { day: 28, severity: 'Minimal', organ: 'Liver',
        text: 'Minimal ALT trend at 20 mg/kg (within reference range); not adverse.' },
    ] },
  { id: 'GLP-003', species: 'Rat', study_type: 'Genotoxicity panel (Ames + in vivo MN)',
    animal_bw_kg: 0.25, n_animals: 30, dose_groups_mg_per_kg: [0, 50, 200, 500],
    noael_mg_kg: null, study_director: 'S. Chen, MS, DABT',
    study_date: '2025-10-20', cro: 'Inotiv',
    audit_chain_hash: 'sha256:4af3…d827',
    findings: [
      { day: 0, severity: 'None', organ: 'Genotox',
        text: 'Negative Ames (5 strains, ±S9). Negative in vivo bone marrow micronucleus.' },
    ] },
  { id: 'GLP-004', species: 'Rat', study_type: 'Cardiovascular safety pharmacology',
    animal_bw_kg: 0.25, n_animals: 16, dose_groups_mg_per_kg: [0, 5, 15],
    noael_mg_kg: 15.0, study_director: 'P. Liang, PhD',
    study_date: '2025-08-30', cro: 'Charles River',
    audit_chain_hash: 'sha256:7c10…b4e9',
    findings: [
      { day: 0, severity: 'None', organ: 'Cardiac',
        text: 'No QTc prolongation, no cTnI elevation across all dose groups.' },
    ] },
];

// Severity ordering helper — used by the heatmap to pick the highest
// severity per (biomarker × organ).
var TOX_SEVERITY_ORDER = ['None', 'Minimal', 'Mild', 'Moderate', 'Severe'];
var TOX_SEVERITY_COLOR = {
  None:     '#F0F0F0',
  Minimal:  '#FEF3C7',
  Mild:     '#FDE68A',
  Moderate: '#FB923C',
  Severe:   '#C20A29',
};

// Biomarker × organ tox-finding lookup — populated from the GLP study
// findings above. The Safety & Tox heatmap reads this; clicking a cell
// opens the underlying finding.
var MOCK_TOX_FINDINGS = {
  // (biomarker symbol) → (organ category) → { severity, study_id, day, text }
  'ALT':    { 'Liver (DILI)': { severity: 'Mild',    study_id: 'GLP-001', day: 14,
                                text: 'Mild ALT elevation at 30 mg/kg (4 of 10 animals); recovered by Day 28; HE histopathology unremarkable.' } },
  'IL6':    { 'CRS / Immune': { severity: 'Moderate', study_id: 'GLP-002', day: 14,
                                text: 'Transient IL-6 spike at 20 mg/kg (Cmax 142 pg/mL); resolved by Day 21; no clinical correlate.' } },
  'cTnI':   { 'Cardiac':      { severity: 'None',    study_id: 'GLP-004', day: 0,
                                text: 'No QTc prolongation, no cTnI elevation across all dose groups.' } },
  'CREA':   { 'Renal':        { severity: 'None',    study_id: 'GLP-002', day: 28,
                                text: 'No change in serum creatinine across dose groups.' } },
  'IFNG':   { 'CRS / Immune': { severity: 'Minimal', study_id: 'GLP-002', day: 14,
                                text: 'Minimal IFN-γ rise at 20 mg/kg, well below adverse threshold.' } },
  'CXCL9':  {},
  'CXCL10': {},
  'GZMB':   { 'CRS / Immune': { severity: 'Minimal', study_id: 'GLP-002', day: 14,
                                text: 'Minimal GZMB elevation co-occurring with IL-6 spike; no clinical correlate.' } },
};

// Pre-authored dose justification document (demo mode).
var MOCK_DOSE_JUSTIFICATION_INDF127 = {
  document_id: 'DOSE-JUST-INDF127-DEMO',
  compound_id: 'INDF-127',
  paragraph_text: 'INDF-127 is a humanized monoclonal antibody targeting PD-1 with a Kd of ' +
    '12 nM. Based on the 28-day GLP repeat-dose study in cynomolgus macaques (GLP-002), the ' +
    'NOAEL of 6 mg/kg supports a HED of 2.6 mg/kg via FDA 2005 surface-area scaling and ' +
    'an MRSD of 0.26 mg/kg (16 mg total for a 60 kg subject) after a 10× safety factor. ' +
    'Per EMA 2017 §4.4, MABEL is the preferred starting-dose method for receptor-binding ' +
    'biologics: anchored at 10% receptor occupancy, MABEL yields 0.8 mg total — the controlling ' +
    'value. The proposed FIH starting dose is 0.8 mg, providing a 9.3× exposure margin vs the ' +
    'NHP NOAEL AUC. The biomarker plan is anchored on CXCL9 with safety monitoring of ALT, ' +
    'cTnI, CREA, and IL-6, all qualified through the GLP-002 panel.',
  prompt_version: 'fih-justification-v1.0',
  model_id: 'demo-static',
  citations: [
    'FDA 2005 — Estimating the Maximum Safe Starting Dose',
    'EMA 2017 — FIH Risk Identification and Mitigation Guideline',
    'ICH M3(R2) — Nonclinical Safety Studies',
  ],
};

// Organ tox overlap heatmap (candidate × organ system)
var MOCK_TOX_OVERLAP = {
  organs: ['Liver (DILI)', 'Cardiac', 'Renal', 'CRS / Immune'],
  candidates: ['CXCL9', 'ALT', 'IFNG', 'cTnI', 'GZMB', 'CREA', 'IL6', 'CXCL10'],
  // values 0..1 — overlap risk score
  matrix: [
    [0.05, 0.02, 0.04, 0.08], // CXCL9
    [0.95, 0.05, 0.10, 0.05], // ALT
    [0.08, 0.10, 0.05, 0.35], // IFNG
    [0.03, 0.98, 0.04, 0.05], // cTnI
    [0.05, 0.06, 0.03, 0.22], // GZMB
    [0.05, 0.04, 0.96, 0.04], // CREA
    [0.10, 0.08, 0.08, 0.85], // IL6
    [0.05, 0.03, 0.04, 0.15], // CXCL10
  ],
};

// PK/PD exposure–response (animal, CXCL9 as the lead PD biomarker).
// All inputs needed by the live FIH dose calculator are seeded here so a
// pharmacometrician can drag any of them and watch the math update.
var MOCK_PKPD = {
  compound: 'INDF-127',
  modality: 'biologic',          // 'small_molecule' | 'biologic'
  indication: 'Solid tumor (PD-1)',
  lead_pd_biomarker: 'CXCL9',

  // Pivotal NOAEL determination
  pivotal_glp_study: 'GLP-002',
  species: 'NHP',
  animal_bw_kg: 5.0,
  human_bw_kg: 60.0,
  noael_mg_kg: 6.0,

  // Allometric scaling (FDA 2005 default 0.67 surface-area)
  exponent: 0.67,
  safety_factor: 10.0,

  // Biologic-only MABEL inputs
  kd_nm: 12.0,
  mw_kda: 150.0,
  vd_l: 4.0,
  ro_threshold: 0.10,

  // Exposure–response
  points: [
    { auc: 120,  response: 1.05 },
    { auc: 340,  response: 1.18 },
    { auc: 680,  response: 1.62 },
    { auc: 1100, response: 2.35 },
    { auc: 1650, response: 3.40 },
    { auc: 2400, response: 4.10 },
    { auc: 3200, response: 4.60 },
    { auc: 4200, response: 4.85 },
  ],
  emax: 5.0,
  ec50_auc: 1050,
  noael_auc: 3800,    // from GLP-002 NHP
  mabel_auc: 420,     // 10% receptor occupancy
  auc_per_mg: 510,    // projected NHP AUC at 1 mg starting dose
};

// Translatability sweep — multi-omics integration mock
var MOCK_SWEEP_COHORTS = [
  { id: 'NHP-2026-A1', label: 'NHP-2026-A1 · 28-day repeat-dose', n_animals: 40, glp_study: 'GLP-002', dose_groups: 4, timepoints: 2, species: 'NHP' },
  { id: 'RAT-2026-B2', label: 'RAT-2026-B2 · 14-day exploratory', n_animals: 24, glp_study: 'GLP-001', dose_groups: 3, timepoints: 2, species: 'Rat' },
];

// Top-30 features for the factor weights heatmap, mixing transcripts, proteins, metabolites.
var MOCK_SWEEP_FEATURES = [
  'CXCL9','IL6','IFNG','TIGIT','PD-L1','GZMB','PDCD1','CXCL10','CD8A','FOXP3',
  'p-STAT1','p-AKT','sIL2R','sCD25','TNF',
  'kynurenine','tryptophan','lactate','creatinine','bilirubin',
  'ALT','AST','cTnI','BUN','CRP',
  'NK_freq','Treg_freq','Mono_freq','Tex_freq','Eos_freq'
];

// Deterministic-looking factor weights (10 factors × 30 features, values in [-1, 1]).
function _buildSweepWeights() {
  var rows = [];
  for (var f = 0; f < 10; f++) {
    var row = [];
    for (var i = 0; i < MOCK_SWEEP_FEATURES.length; i++) {
      // Deterministic pseudo-random from indices
      var s = Math.sin((f + 1) * 12.9898 + (i + 1) * 78.233) * 43758.5453;
      var w = (s - Math.floor(s)) * 2 - 1; // -1..1
      // Make the leading factors load on the leading features more strongly
      if (f === 0 && i < 6)  w = 0.55 + 0.4 * Math.abs(w);
      if (f === 3 && (i === 20 || i === 22 || i === 18 || i === 24)) w = 0.7 + 0.25 * Math.abs(w);
      if (f === 1 && i >= 6 && i <= 11) w = 0.4 + 0.4 * w;
      row.push(parseFloat(w.toFixed(2)));
    }
    rows.push(row);
  }
  return rows;
}

var MOCK_SWEEP_RESULTS = {
  sweep_id: 'SWEEP-2026-05-03-A',
  cohort: { id: 'NHP-2026-A1', n_animals: 40, glp_study: 'GLP-002', dose_groups: 4, timepoints: 2 },
  method: 'MOFA+',
  parameters: { factors: 10, bootstrap: 1000, confidence: 0.95 },
  compute: {
    target: 'cambridge_hpc', target_label: 'Cambridge HPC (On-Prem SLURM)',
    partition: 'cpu-long', cores: 64, wall_time_seconds: 8040,
    on_prem: true, egress: false, cost_usd: 0,
  },
  ortholog: { db: 'Ensembl 110', method: 'one-to-one + 1:N', nhp_human_coverage: 0.942 },
  candidates: [
    { symbol: 'CXCL9', score: 0.87, ci_low: 0.81, ci_high: 0.92, factor: 'F1',     role: 'efficacy_pd', status: 'PD' },
    { symbol: 'IL-6',  score: 0.71, ci_low: 0.62, ci_high: 0.79, factor: 'F1, F3', role: 'efficacy_pd', status: 'PD' },
    { symbol: 'ALT',   score: 0.93, ci_low: 0.89, ci_high: 0.96, factor: 'F4',     role: 'safety',      status: 'Tox' },
    { symbol: 'cTnI',  score: 0.88, ci_low: 0.83, ci_high: 0.92, factor: 'F4',     role: 'safety',      status: 'Tox' },
    { symbol: 'IFNG',  score: 0.66, ci_low: 0.55, ci_high: 0.76, factor: 'F2',     role: 'efficacy_pd', status: 'PD' },
    { symbol: 'CREA',  score: 0.79, ci_low: 0.72, ci_high: 0.85, factor: 'F5',     role: 'safety',      status: 'Tox' },
    { symbol: 'TIGIT', score: 0.42, ci_low: 0.31, ci_high: 0.54, factor: 'F2',     role: 'target_engagement', status: 'PD' },
    { symbol: 'PD-L1', score: 0.58, ci_low: 0.48, ci_high: 0.67, factor: 'F2, F6', role: 'target_engagement', status: 'PD' },
  ],
  factor_features: MOCK_SWEEP_FEATURES,
  factor_weights: _buildSweepWeights(),
  audit: {
    snapshot_id: 'snap_20260503T141127Z_a91f3c',
    parameter_combinations_logged: 1024,
    data_residency: 'on-prem',
    egress: false,
    glp_chain_preserved: true,
    user_id: 'computational.biologist@sponsor.com',
    started_at: '2026-05-03T14:11:27Z',
    completed_at: '2026-05-03T16:25:13Z',
  },
};

// IND dossier checklist — structured to 21 CFR §312.23 section headers.
// `scope` distinguishes IND Forge's contribution from sections owned by
// CMC / Clinical / Regulatory teams (shown as 'external' for context).
// Status is derived from `evidence` — items with no evidence cannot be
// marked complete.
var MOCK_IND_PACKAGE = {
  compound: 'INDF-127',
  target_ind_submission: '2026-Q4',
  cfr_reference: '21 CFR §312.23',
  sections: [
    { key: 'fda_1571', title: 'Form FDA 1571', cfr: '§312.23(a)(1)', scope: 'external',
      note: 'Sponsor signature; owned by Regulatory.' },
    { key: 'toc', title: 'Table of contents', cfr: '§312.23(a)(2)', scope: 'external',
      note: 'Auto-assembled at submission time.' },
    { key: 'gen_plan', title: 'Introductory statement and general investigational plan',
      cfr: '§312.23(a)(3)', scope: 'external',
      note: 'Owned by Clinical Development.' },
    { key: 'ib', title: "Investigator's Brochure (IB)", cfr: '§312.23(a)(5)', scope: 'external',
      note: 'Owned by Clinical Development. IND Forge supplies the Pharmacology/Toxicology section into the IB.' },
    { key: 'protocol', title: 'Clinical protocol(s)', cfr: '§312.23(a)(6)', scope: 'external',
      note: 'Owned by Clinical Development. FIH dose justification is supplied by IND Forge.' },
    { key: 'cmc', title: 'Chemistry, Manufacturing, and Controls (CMC)', cfr: '§312.23(a)(7)',
      scope: 'external', note: 'Owned by CMC team.' },

    // ---- IND Forge in-scope sections ----
    { key: 'pharmtox', title: 'Pharmacology and Toxicology data', cfr: '§312.23(a)(8)', scope: 'in_scope',
      note: 'Pivotal repeat-dose tox + safety pharmacology + genotox panel.',
      sub: [
        { key: 'noael', title: 'NOAEL determination',
          evidence: { type: 'glp_study', id: 'GLP-002',
                      summary: 'NHP 28-day repeat-dose, NOAEL 6 mg/kg' } },
        { key: 'allometric', title: 'Allometric scaling (HED, MRSD)',
          evidence: { type: 'computation', id: 'dose-calc',
                      summary: 'FDA 2005 BW^0.67; live calc on PK/PD tab' } },
        { key: 'safety_pharm', title: 'Safety pharmacology (cardiovascular)',
          evidence: { type: 'glp_study', id: 'GLP-004',
                      summary: 'No QTc prolongation, no cTnI elevation' } },
        { key: 'genotox', title: 'Genotoxicity panel',
          evidence: { type: 'glp_study', id: 'GLP-003',
                      summary: 'Negative Ames + in vivo MN' } },
        { key: 'repeat_dose_rat', title: 'Repeat-dose toxicity (rat)',
          evidence: { type: 'glp_study', id: 'GLP-001',
                      summary: 'Rat 28-day, NOAEL 12 mg/kg' } },
      ] },

    { key: 'fih_dose', title: 'FIH dose justification', cfr: '§312.23(a)(6)(iii)', scope: 'in_scope',
      note: 'Lives within the clinical protocol; IND Forge owns the derivation and document.',
      evidence_required: 'dose_justification_doc' },

    { key: 'translational', title: 'Translational biomarker plan', cfr: '§312.23(a)(8)(iii)',
      scope: 'in_scope',
      note: 'Multi-omics translatability sweep; CXCL9 PD anchor + safety panel.',
      evidence_required: 'sweep_run' },

    { key: 'pre_ind', title: 'Pre-IND briefing-book paragraph (Pharm/Tox)',
      cfr: 'Pre-IND meeting (Type B)', scope: 'in_scope',
      note: 'LLM-drafted with FDA 2005 / EMA 2017 / ICH M3(R2) citations; reviewable arithmetic.',
      evidence_required: 'dose_justification_doc' },

    { key: 'audit', title: '21 CFR Part 11 audit trail',
      cfr: '21 CFR Part 11', scope: 'in_scope',
      note: 'Snapshot ID, math kernel version, user, timestamp; Vault-RIM-liftable.',
      evidence: { type: 'snapshot', id: 'auto',
                  summary: 'Auto-assembled from on-screen state' } },

    { key: 'prior_human', title: 'Previous human experience', cfr: '§312.23(a)(9)', scope: 'external',
      note: 'Owned by Clinical Development.' },
    { key: 'addl', title: 'Additional information', cfr: '§312.23(a)(10)', scope: 'external',
      note: 'Pediatric plan / drug abuse data; owned by Regulatory.' },
  ],
};
