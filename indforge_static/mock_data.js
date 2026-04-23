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

// Tox studies summary
var MOCK_TOX_STUDIES = [
  { id: 'GLP-001', species: 'Rat',   study_type: '28-day GLP',  noael_mg_kg: 12,  findings: ['Mild ALT elevation @ 30 mg/kg'], glp: true,  status: 'Complete' },
  { id: 'GLP-002', species: 'NHP',   study_type: '28-day GLP',  noael_mg_kg: 6,   findings: ['Transient IL-6 spike @ 20 mg/kg'], glp: true, status: 'Complete' },
  { id: 'GLP-003', species: 'Mouse', study_type: 'Efficacy',    noael_mg_kg: null, findings: [], glp: false, status: 'Complete' },
  { id: 'GLP-004', species: 'Rat',   study_type: 'Cardiovascular safety', noael_mg_kg: 15, findings: ['No cTnI change'], glp: true, status: 'Complete' },
];

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

// PK/PD exposure–response (animal, CXCL9 as the lead PD biomarker)
var MOCK_PKPD = {
  compound: 'INDF-127',
  lead_pd_biomarker: 'CXCL9',
  species: 'NHP',
  // exposure (AUC, ng*h/mL) vs CXCL9 fold-change from baseline
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
  projected_fih_starting_dose_mg: 0.8,
  projected_fih_starting_dose_rationale: '1/10th of NHP NOAEL (allometric, HED) + MABEL cross-check',
  exposure_margin_vs_noael: 9.0,
};

// IND dossier checklist
var MOCK_IND_PACKAGE = {
  compound: 'INDF-127',
  target_ind_submission: '2026-Q4',
  sections: [
    { key: 'cou',          title: 'Fit-for-purpose Context of Use',            status: 'done',    note: 'PD biomarker (CXCL9) — exposure–response, dose selection' },
    { key: 'analytical',   title: 'Analytical validation plan (ICH M10)',      status: 'done',    note: 'ELISA plasma assay; precision, linearity, stability' },
    { key: 'bridging',     title: 'Animal-to-human bridging data',             status: 'done',    note: 'Rat + NHP concordance, ortholog assay match' },
    { key: 'safety',       title: 'Safety biomarker panel (DILI, cardio, renal, CRS)', status: 'done', note: 'ALT, cTnI, CREA, IL-6' },
    { key: 'pkpd',         title: 'PK/PD model + FIH dose justification',      status: 'done',    note: 'Emax fit, NOAEL/MABEL anchors' },
    { key: 'qualification', title: 'Biomarker qualification dossier (FDA BQP)', status: 'pending', note: 'Draft CoU statement under review' },
    { key: 'pre_ind',      title: 'Pre-IND meeting briefing doc — biomarker section', status: 'pending', note: 'Auto-generated draft available' },
    { key: 'cfr_part11',   title: '21 CFR Part 11 audit trail',                status: 'done',    note: 'Version-locked; GLP study provenance attached' },
    { key: 'tox_integration', title: 'GLP tox study integration',              status: 'warn',    note: 'GLP-002 NHP data reconciliation in progress' },
  ],
};
