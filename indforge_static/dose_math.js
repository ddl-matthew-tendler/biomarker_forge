// IND Forge — FIH dose math kernel.
//
// Pure functions. No DOM, no fetch. The same formulas exist in
// indforge_app.py:compute_dose — keep the two in sync.
//
// Citations (also surfaced in the per-formula "citation" fields):
//   FDA 2005   "Estimating the Maximum Safe Starting Dose in Initial
//              Clinical Trials for Therapeutics in Adult Healthy Volunteers"
//   EMA 2017   "Guideline on Strategies to Identify and Mitigate Risks
//              for First-in-Human and Early Clinical Trials"
//   ICH M3(R2) "Nonclinical Safety Studies for the Conduct of Human
//              Clinical Trials and Marketing Authorization for Pharmaceuticals"
//   ICH S9     (oncology only) "Nonclinical Evaluation for Anticancer
//              Pharmaceuticals"

var DOSE_MATH_KERNEL_VERSION = 'indforge.dose_math/1.0.0';

function _r(x, n) { var p = Math.pow(10, n == null ? 4 : n); return Math.round(x * p) / p; }

function computeDose(inp) {
  var a = inp.animal_bw_kg;
  var h = inp.human_bw_kg;
  var noael = inp.noael_mg_kg;
  var sf = inp.safety_factor;

  // Allometric scaling factor (FDA 2005 default exponent 0.67).
  var scaling = Math.pow(a / h, 1.0 - inp.exponent);
  var hed_mg_per_kg = noael * scaling;
  var mrsd_mg_per_kg = hed_mg_per_kg / sf;
  var mrsd_mg = mrsd_mg_per_kg * h;

  var formulas = [
    { id: 'scaling', label: 'Allometric scaling factor',
      formula: '(' + a + ' / ' + h + ') ^ (1 − ' + inp.exponent + ')',
      value: _r(scaling), unit: '',
      citation: 'FDA 2005 §3 (BW^0.67 surface-area scaling)' },
    { id: 'hed', label: 'HED (Human Equivalent Dose)',
      formula: noael + ' mg/kg × ' + _r(scaling) + ' = ' + _r(hed_mg_per_kg) + ' mg/kg',
      value: _r(hed_mg_per_kg), unit: 'mg/kg',
      citation: 'FDA 2005 §4' },
    { id: 'mrsd', label: 'MRSD (Maximum Recommended Starting Dose)',
      formula: _r(hed_mg_per_kg) + ' mg/kg / ' + sf + ' = ' + _r(mrsd_mg_per_kg) + ' mg/kg',
      value: _r(mrsd_mg_per_kg), unit: 'mg/kg',
      citation: 'FDA 2005 §5 (default safety factor 10)' },
    { id: 'mrsd_total', label: 'MRSD total dose',
      formula: _r(mrsd_mg_per_kg) + ' mg/kg × ' + h + ' kg = ' + _r(mrsd_mg) + ' mg',
      value: _r(mrsd_mg), unit: 'mg' },
  ];

  var mabel_dose_mg = null;
  if (inp.modality === 'biologic' && inp.kd_nm && inp.mw_kda && inp.vd_l && inp.ro_threshold) {
    // RO = C / (Kd + C)  →  C = Kd × RO / (1 − RO)
    var ro = inp.ro_threshold;
    var c_nm = inp.kd_nm * ro / (1.0 - ro);
    var mw_g_per_mol = inp.mw_kda * 1000.0;
    var c_mg_per_l = c_nm * mw_g_per_mol * 1e-6;
    mabel_dose_mg = c_mg_per_l * inp.vd_l;
    formulas.push({
      id: 'mabel_conc', label: 'Target concentration at 10% RO',
      formula: inp.kd_nm + ' nM × ' + ro + ' / (1 − ' + ro + ') = ' + _r(c_nm) + ' nM',
      value: _r(c_nm), unit: 'nM',
      citation: 'EMA 2017 §4.4 (MABEL anchored at 10% RO)',
    });
    formulas.push({
      id: 'mabel_dose', label: 'MABEL dose',
      formula: _r(c_mg_per_l) + ' mg/L × ' + inp.vd_l + ' L = ' + _r(mabel_dose_mg) + ' mg',
      value: _r(mabel_dose_mg), unit: 'mg',
      citation: 'EMA 2017 §4.4 (MABEL preferred for biologics post-TGN1412)',
    });
  }

  // Controlling method = lower of MRSD-total and MABEL.
  var pairs = [['MRSD', mrsd_mg]];
  if (mabel_dose_mg != null) pairs.push(['MABEL', mabel_dose_mg]);
  pairs.sort(function (x, y) { return x[1] - y[1]; });
  var controlling_method = pairs[0][0];
  var fih_dose_mg = pairs[0][1];

  // Exposure margin vs NOAEL = NOAEL_AUC / projected_AUC_at_starting_dose.
  var exposure_margin = null;
  if (inp.noael_auc && inp.auc_per_mg && fih_dose_mg > 0) {
    var projected_auc = inp.auc_per_mg * fih_dose_mg;
    if (projected_auc > 0) {
      exposure_margin = inp.noael_auc / projected_auc;
      formulas.push({
        id: 'exposure_margin', label: 'Exposure margin vs NOAEL',
        formula: 'NOAEL AUC ' + inp.noael_auc + ' ÷ projected AUC at ' +
          _r(fih_dose_mg, 2) + ' mg (' + _r(projected_auc) + ' ng·h/mL) = ' +
          _r(exposure_margin, 1) + '×',
        value: _r(exposure_margin, 2), unit: '× vs NOAEL',
        citation: 'ICH M3(R2) §3.1',
      });
    }
  }

  var rationale;
  if (controlling_method === 'MABEL') {
    rationale = 'MABEL-controlled: anchored at ' + (inp.ro_threshold * 100) +
      '% receptor occupancy per EMA 2017 §4.4 (MABEL preferred for biologics post-TGN1412).';
  } else {
    rationale = 'MRSD-controlled: derived from animal NOAEL via allometric scaling ' +
      '(FDA 2005) with a ' + sf + '× safety factor.';
  }
  if (mabel_dose_mg != null) {
    rationale += ' Cross-check: MRSD = ' + _r(mrsd_mg, 2) + ' mg, MABEL = ' +
      _r(mabel_dose_mg, 2) + ' mg; lower value selected.';
  }

  return {
    kernel_version: DOSE_MATH_KERNEL_VERSION,
    inputs: inp,
    hed_mg_per_kg: _r(hed_mg_per_kg),
    mrsd_mg_per_kg: _r(mrsd_mg_per_kg),
    mrsd_mg: _r(mrsd_mg),
    mabel_dose_mg: mabel_dose_mg != null ? _r(mabel_dose_mg) : null,
    fih_dose_mg: _r(fih_dose_mg, 2),
    controlling_method: controlling_method,
    exposure_margin: exposure_margin != null ? _r(exposure_margin, 2) : null,
    formulas: formulas,
    rationale: rationale,
    citations: [
      'FDA 2005 — Estimating the Maximum Safe Starting Dose',
      'EMA 2017 — FIH Risk Identification and Mitigation Guideline',
      'ICH M3(R2) — Nonclinical Safety Studies',
    ],
  };
}

// Helper used by the IND Package checklist to derive completion status
// strictly from attached evidence — the user cannot toggle status freely.
function checklistStatus(item, evidenceState) {
  if (item.scope === 'external') return 'external';
  if (item.evidence) return 'done';
  if (item.sub) {
    var done = item.sub.filter(function (s) { return !!s.evidence; }).length;
    if (done === item.sub.length) return 'done';
    if (done > 0) return 'in_progress';
    return 'not_started';
  }
  if (item.evidence_required) {
    var attached = evidenceState && evidenceState[item.key];
    return attached ? 'done' : 'not_started';
  }
  return 'not_started';
}

// Expose to the global scope for app.js (no module system in CDN setup).
window.computeDose = computeDose;
window.DOSE_MATH_KERNEL_VERSION = DOSE_MATH_KERNEL_VERSION;
window.checklistStatus = checklistStatus;
