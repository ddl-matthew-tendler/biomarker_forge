// INDForge — preclinical IND-enabling biomarker app.

if (!window.antd) {
  var msg = 'window.antd is undefined — AntD UMD failed to initialize. ' +
    'Check dayjs load order (must load before antd) and network access to unpkg.com.';
  try { window.__indforgePush && window.__indforgePush('ERROR', msg); } catch (e) {}
  var root = document.getElementById('root');
  if (root) {
    root.innerHTML = '<div style="padding:40px;font-family:Inter,Arial,sans-serif;color:#C20A29">' +
      '<h2>INDForge failed to initialize</h2><p>' + msg + '</p>' +
      '<p>Open the debug log at the bottom of the page for details.</p></div>';
  }
  throw new Error(msg);
}
var antdLib = window.antd;
var Modal = antdLib.Modal;
var Radio = antdLib.Radio;
var Form = antdLib.Form;
var InputNumber = antdLib.InputNumber;
var Badge = antdLib.Badge;
var ConfigProvider = antdLib.ConfigProvider;
var Button = antdLib.Button;
var Table = antdLib.Table;
var Tag = antdLib.Tag;
var Switch = antdLib.Switch;
var Tooltip = antdLib.Tooltip;
var Drawer = antdLib.Drawer;
var Tabs = antdLib.Tabs;
var Alert = antdLib.Alert;
var Space = antdLib.Space;
var Collapse = antdLib.Collapse;
var Select = antdLib.Select;
var Progress = antdLib.Progress;

// Unified debug logger — proxies to the boot log so everything lives in one store.
function dlog(level, msg) {
  try {
    if (typeof window.__indforgePush === 'function') { window.__indforgePush(level, msg); return; }
  } catch (e) {}
  console.log('[INDForge]', level, msg);
}
dlog('INFO', 'app.js evaluating');

var h = React.createElement;
var Fragment = React.Fragment;
var useState = React.useState;
var useEffect = React.useEffect;
var useMemo = React.useMemo;
var useRef = React.useRef;

var dominoTheme = {
  token: {
    colorPrimary: '#543FDE',
    colorPrimaryHover: '#3B23D1',
    colorPrimaryActive: '#311EAE',
    colorText: '#2E2E38',
    colorTextSecondary: '#65657B',
    colorTextTertiary: '#8F8FA3',
    colorSuccess: '#28A464',
    colorWarning: '#CCB718',
    colorError: '#C20A29',
    colorInfo: '#0070CC',
    colorBgContainer: '#FFFFFF',
    colorBgLayout: '#FAFAFA',
    colorBorder: '#E0E0E0',
    fontFamily: 'Inter, Lato, Helvetica Neue, Helvetica, Arial, sans-serif',
    fontSize: 14,
    borderRadius: 4,
    borderRadiusLG: 8,
  },
  components: {
    Button: { primaryShadow: 'none', defaultShadow: 'none' },
    Table: { headerBg: '#FAFAFA', rowHoverBg: '#F5F5F5' },
  },
};

Highcharts.setOptions({
  colors: ['#543FDE', '#0070CC', '#28A464', '#CCB718', '#FF6543', '#E835A7', '#2EDCC4', '#A9734C'],
  chart: { style: { fontFamily: 'Inter, Lato, Helvetica Neue, Arial, sans-serif' } },
  credits: { enabled: false },
});

// ---------- Small helpers ----------

function StatCard(props) {
  var cls = 'stat-card' + (props.onClick ? ' stat-card-clickable' : '') + (props.active ? ' stat-card-active' : '');
  return h('div', { className: cls, onClick: props.onClick || null },
    h('div', { className: 'stat-card-label' }, props.label),
    h('div', { className: 'stat-card-value ' + (props.color || '') }, props.value),
    props.sub ? h('div', { className: 'stat-card-sub' }, props.sub) : null
  );
}

function ScoreBar(props) {
  var v = Math.max(0, Math.min(1, props.value || 0));
  var pct = Math.round(v * 100);
  var cls = v >= 0.75 ? '' : (v >= 0.5 ? 'warn' : 'bad');
  return h('div', { className: 'score-bar-wrap' },
    h('div', { className: 'score-bar' }, h('div', { className: 'score-bar-fill ' + cls, style: { width: pct + '%' } })),
    h('span', { className: 'score-bar-num' }, pct)
  );
}

// ---------- Glossary + Term helper ----------
//
// IND Forge is dense with regulatory and pharmacology jargon. For non-expert
// audience members exploring the app (pharma leadership, MSLs, IT leads),
// every domain term should have a one-line plain-language definition behind
// a hover. The Term helper wraps any string in a dotted-underline span with
// an AntD Tooltip; ? affordance optional.

var GLOSSARY = {
  // Compound / program
  compound: {
    title: 'Compound',
    body: 'The drug candidate being developed. Each compound is advanced through one or more indications; each compound × indication files its own IND submission. INDF-127 in this app is a humanized monoclonal antibody targeting PD-1.'
  },
  indication: {
    title: 'Indication',
    body: 'The disease the compound is being developed to treat. A single compound may pursue several indications; each one requires its own IND.'
  },
  fih: {
    title: 'First-in-Human (FIH)',
    body: 'The first time the compound is given to a person. Conducted in Phase 1 under an active IND. The starting dose is the most scrutinized number in the entire IND package — it must be defensibly low.'
  },
  ind: {
    title: 'IND — Investigational New Drug application',
    body: 'The submission to the FDA that authorizes a sponsor to begin human clinical trials of a new drug. Structured per 21 CFR §312.23. IND Forge owns the Pharmacology & Toxicology section and the FIH dose justification.'
  },
  ind_package: {
    title: 'IND package',
    body: 'The full IND submission dossier. Contains 10 sections per 21 CFR §312.23: Form FDA 1571, ToC, intro statement, Investigator\'s Brochure, clinical protocol, CMC, Pharm/Tox, previous human experience, and additional info. IND Forge generates the in-scope pieces; CMC and Clinical own the rest.'
  },

  // Pharmacology / dose math
  pkpd: {
    title: 'PK/PD — Pharmacokinetics & Pharmacodynamics',
    body: 'PK is what the body does to the drug (absorption, distribution, metabolism, excretion). PD is what the drug does to the body (target engagement, biomarker effect). The PK/PD model links exposure (e.g. AUC) to a measurable response — used to anchor the FIH dose.'
  },
  noael: {
    title: 'NOAEL — No-Observed-Adverse-Effect Level',
    body: 'The highest animal dose at which no adverse effects are seen in the GLP repeat-dose tox study. The pivotal anchor for FIH dose calculation. Lower NOAEL → lower starting human dose. Reported in mg/kg.'
  },
  hed: {
    title: 'HED — Human Equivalent Dose',
    body: 'The animal NOAEL scaled to humans using surface-area allometric scaling (BW^0.67 per FDA 2005). Accounts for the fact that smaller animals metabolize drugs faster per kilogram. Reported in mg/kg.'
  },
  mrsd: {
    title: 'MRSD — Maximum Recommended Starting Dose',
    body: 'The HED divided by a safety factor (default 10×). One of two possible controlling values for the FIH starting dose. Per FDA 2005.'
  },
  mabel: {
    title: 'MABEL — Minimum Anticipated Biological Effect Level',
    body: 'For biologics, the dose anchored at a low (typically 10%) receptor occupancy. Mandated by EMA 2017 post-TGN1412. For receptor-binding biologics MABEL is usually the controlling (lower) value vs. MRSD.'
  },
  exposure_margin: {
    title: 'Exposure margin vs NOAEL',
    body: 'Ratio of NOAEL exposure (animal AUC at the no-adverse dose) to projected human exposure at the proposed starting dose. Higher = more conservative. ICH M3(R2) §3.1 expects a multiple of margin before exposing healthy volunteers.'
  },
  allometric: {
    title: 'Allometric scaling',
    body: 'Mathematical translation of a dose between species using a body-weight power law. FDA 2005 default uses the BW^0.67 (surface-area) exponent; some programs use Boxenbaum BW^0.75.'
  },
  kd: {
    title: 'Kd — Dissociation constant',
    body: 'Affinity of the drug for its target receptor (lower Kd = tighter binding). Used in the MABEL calculation to derive the free drug concentration that produces a given receptor occupancy.'
  },
  receptor_occupancy: {
    title: 'Receptor occupancy (RO)',
    body: 'The fraction of target receptors bound by the drug. MABEL is anchored at a conservative threshold — typically 10% — so the FIH dose produces minimal pharmacology in humans.'
  },
  vd: {
    title: 'Vd — Volume of distribution',
    body: 'Apparent volume of body fluid the drug is distributed into. For monoclonal antibodies, typically 4–7 L (close to plasma volume) because they don\'t enter cells.'
  },

  // Safety / Tox
  glp: {
    title: 'GLP — Good Laboratory Practice',
    body: 'A set of regulatory standards (21 CFR Part 58) for non-clinical lab studies that support FDA submissions. GLP-compliant studies have full audit chains, signed protocols, archived raw data, and certified study directors.'
  },
  noael_study: {
    title: 'NOAEL determination study',
    body: 'A pivotal repeat-dose GLP toxicology study (typically 28-day in rat and NHP) designed to identify the highest dose with no adverse effects. The NOAEL is the critical input to the FIH dose calculation.'
  },
  safety_pharm: {
    title: 'Safety pharmacology',
    body: 'A panel of in vivo and in vitro studies evaluating effects on critical organ systems — typically cardiovascular (QT prolongation), CNS, and respiratory. Required for IND under ICH S7A.'
  },
  genotox: {
    title: 'Genotoxicity panel',
    body: 'Battery of tests for DNA damage potential. Standard panel: Ames (bacterial reverse mutation), in vitro chromosome aberration or mouse lymphoma, in vivo bone marrow micronucleus. ICH S2(R1).'
  },
  tox_finding: {
    title: 'Tox finding',
    body: 'An observation in a GLP tox study graded by severity (None / Minimal / Mild / Moderate / Severe). Severity drives whether the dose is considered adverse and whether it factors into the NOAEL.'
  },

  // Translatability sweep
  translatability: {
    title: 'Translatability',
    body: 'How well an animal biomarker signal predicts the same signal in humans. High translatability biomarkers anchor the clinical biomarker plan; low translatability biomarkers are deprioritized.'
  },
  multi_omics: {
    title: 'Multi-omics integration',
    body: 'Combining transcriptomics (RNA-seq), proteomics, and metabolomics into a single factor model (e.g. MOFA+ or DIABLO). Surfaces shared signals across data types and quantifies translatability per candidate.'
  },
  bootstrap: {
    title: 'Bootstrap iterations',
    body: 'Resampling-based uncertainty quantification. Each iteration rebuilds the factor model on a resampled cohort; the spread across iterations gives a 95% confidence interval for each translatability score.'
  },
  ortholog: {
    title: 'Ortholog mapping',
    body: 'Lookup table that links animal genes/proteins (e.g. cynomolgus macaque) to their human counterparts. Required to translate animal signals into human biomarkers. Coverage rarely hits 100% — gaps are flagged.'
  },
  factor_model: {
    title: 'Factor model (MOFA+ / DIABLO)',
    body: 'Unsupervised method that decomposes multi-omics data into latent factors capturing co-variation across data types. Each factor represents a biological program; per-feature weights show which biomarkers load on which programs.'
  },

  // Process / regulatory
  briefing_doc: {
    title: 'Pre-IND briefing doc / book',
    body: 'A document prepared by the sponsor for the Pre-IND meeting (Type B FDA meeting). Summarizes the proposed IND content and asks the FDA specific questions before formal submission. Helps avoid surprises at IND review.'
  },
  audit_chain: {
    title: 'Audit chain (21 CFR Part 11)',
    body: 'The signed, time-stamped, immutable record of who did what, when, and to which version. Required for any electronic record submitted to the FDA. IND Forge assembles this metadata so it can be lifted into a validated RIM/Vault system.'
  },
  cfr_312: {
    title: '21 CFR §312.23 — IND content and format',
    body: 'The federal regulation defining what every IND must contain. Each subsection (a)(1) through (a)(10) is owned by a different team — IND Forge primarily owns (a)(8) Pharm/Tox.'
  },
  fda_2005: {
    title: 'FDA 2005 MRSD guidance',
    body: 'FDA, "Estimating the Maximum Safe Starting Dose in Initial Clinical Trials for Therapeutics in Adult Healthy Volunteers" (2005). The canonical reference for the HED → MRSD → starting-dose pathway.'
  },
  ema_2017: {
    title: 'EMA 2017 FIH guidance',
    body: 'EMA, "Guideline on Strategies to Identify and Mitigate Risks for First-in-Human and Early Clinical Trials" (2017). Issued post-TGN1412; mandates MABEL for receptor-binding biologics.'
  },
  ich_m3: {
    title: 'ICH M3(R2)',
    body: 'International Council for Harmonisation guideline on the nonclinical safety studies needed before each clinical phase. Aligns FDA, EMA, and PMDA expectations.'
  },
  ich_s9: {
    title: 'ICH S9',
    body: 'ICH guideline specific to oncology programs. Allows accelerated nonclinical paths and a smaller safety factor for advanced cancer indications.'
  },
};

function Term(props) {
  // props: term (key into GLOSSARY) | inline body, children = visible text
  var entry = props.term && GLOSSARY[props.term];
  var title = entry ? h('div', { style: { maxWidth: 320 } },
    h('div', { style: { fontWeight: 700, marginBottom: 4 } }, entry.title),
    h('div', { style: { fontSize: 12, lineHeight: 1.45 } }, entry.body)
  ) : (props.body || props.title || '');
  return h(Tooltip, { title: title, color: '#3F4547', placement: props.placement || 'top' },
    h('span', { className: 'glossary-term' + (props.subtle ? ' subtle' : '') },
      props.children, h('span', { className: 'glossary-q' }, '?'))
  );
}

// ---------- IND Package Browser (in-app document viewer) ----------
//
// Replaces the previous "Download .docx and walk away" experience. The user
// stays in-app: package opens in a modal with two tabs — Sections (the
// assembled IND with content per section, scope-coded) and Downstream
// (the real-world flow after Vault RIM lift). They can then download the
// .docx OR simulate the Vault lift, which surfaces the timeline card.
//
// Why this matters: non-experts don't know what "filing-ready" means until
// they see what happens next. The downstream tab is the explainer.

function IndPackageBrowser(props) {
  // props: open, onClose, packageId, manifest, onGenerate (lazy generate)
  var open = props.open;
  var manifest = props.manifest;
  var _tab = useState('sections');
  var tab = _tab[0]; var setTab = _tab[1];
  var _lifted = useState(false);
  var lifted = _lifted[0]; var setLifted = _lifted[1];

  // Reset to "sections" tab and clear lifted state when reopened.
  useEffect(function() {
    if (open) { setTab('sections'); setLifted(false); }
  }, [open]);

  function downloadDocx() {
    if (!manifest) return;
    var url = 'api/ind/package/' + manifest.package_id + '/export.docx';
    var a = document.createElement('a');
    a.href = url; a.download = manifest.package_id + '.docx';
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    if (window.antd && window.antd.message) window.antd.message.success('IND package downloaded · ' + manifest.package_id);
  }

  function liftToVault() {
    setLifted(true);
    setTab('downstream');
    if (window.antd && window.antd.message) window.antd.message.success('Lifted to Veeva Vault RIM · audit chain preserved');
  }

  if (!manifest) {
    return h(Modal, { open: open, onCancel: props.onClose, footer: null, title: 'Generating IND package…', width: 720 },
      h('div', { style: { padding: 40, textAlign: 'center' } }, 'Assembling sections…'));
  }

  var inScope = manifest.sections.filter(function(s) { return s.scope === 'in_scope'; });
  var external = manifest.sections.filter(function(s) { return s.scope === 'external'; });

  function renderSections() {
    return h('div', null,
      h('div', { className: 'pkg-cover' },
        h('div', { className: 'pkg-cover-row' },
          h('span', { className: 'pkg-cover-k' }, 'Compound'),
          h('strong', null, manifest.compound_id),
          h('span', { className: 'pkg-cover-k' }, 'Indication'),
          h('span', null, manifest.indication),
          h('span', { className: 'pkg-cover-k' }, 'IND target'),
          h('span', null, manifest.ind_target)),
        h('div', { className: 'pkg-cover-row' },
          h('span', { className: 'pkg-cover-k' }, 'Package ID'),
          h('code', null, manifest.package_id),
          h('span', { className: 'pkg-cover-k' }, 'Snapshot'),
          h('code', null, manifest.snapshot_id),
          h('span', { className: 'pkg-cover-k' }, 'Sweep'),
          h('code', null, manifest.sweep_id || '—'))
      ),

      h('div', { className: 'pkg-section-group' },
        h('div', { className: 'pkg-section-group-title' },
          h(Term, { term: 'ind_package', subtle: true }, 'In scope · authored by IND Forge'),
          h('span', { className: 'pkg-count' }, inScope.length + ' sections')),
        inScope.map(function(s) {
          return h('details', { key: s.key, className: 'pkg-section in-scope', open: true },
            h('summary', null,
              h('span', { className: 'pkg-section-cfr' }, s.cfr),
              h('span', { className: 'pkg-section-title' }, s.title),
              h(Tag, { color: 'green' }, s.status)),
            h('div', { className: 'pkg-section-body' }, s.body));
        })
      ),

      h('div', { className: 'pkg-section-group' },
        h('div', { className: 'pkg-section-group-title' },
          'External · authored elsewhere',
          h('span', { className: 'pkg-count' }, external.length + ' sections')),
        external.map(function(s) {
          return h('details', { key: s.key, className: 'pkg-section external' },
            h('summary', null,
              h('span', { className: 'pkg-section-cfr' }, s.cfr),
              h('span', { className: 'pkg-section-title' }, s.title),
              h(Tag, null, 'Owner: ' + s.owner)),
            h('div', { className: 'pkg-section-body' }, s.body));
        })
      )
    );
  }

  function renderDownstream() {
    var flow = manifest.downstream_workflow || [];
    return h('div', null,
      h(Alert, {
        type: lifted ? 'success' : 'info', showIcon: true, style: { marginBottom: 14 },
        message: lifted
          ? 'Lifted to Veeva Vault RIM · audit chain preserved'
          : 'After IND Forge: what happens to this package',
        description: lifted
          ? ('Vault assigned a controlled record. The package is now the system of record (GxP). ' +
             'The remaining steps run inside Vault and the FDA submission gateway — IND Forge\'s job is done.')
          : ('IND Forge\'s output is non-GxP. The downstream flow lifts it into a validated GxP system ' +
             '(Vault RIM), assembles the eCTD modules, and submits via FDA ESG. This is what "filing-ready" means.')
      }),
      h('div', { className: 'pkg-flow' },
        flow.map(function(step) {
          return h('div', { key: step.step, className: 'pkg-flow-step' + (lifted && step.step <= 1 ? ' done' : '') },
            h('div', { className: 'pkg-flow-step-num' }, step.step),
            h('div', { className: 'pkg-flow-step-body' },
              h('div', { className: 'pkg-flow-step-label' }, step.label),
              h('div', { className: 'pkg-flow-step-meta' },
                h('span', null, 'Owner: ', h('strong', null, step.owner)),
                h('span', null, ' · '),
                h('span', null, step.duration)),
              h('div', { className: 'pkg-flow-step-detail' }, step.detail)));
        })
      )
    );
  }

  return h(Modal, {
    open: open, onCancel: props.onClose, width: 920,
    title: h('span', null,
      h(Term, { term: 'ind_package', subtle: true }, 'IND Package'),
      ' — ', manifest.compound_id),
    footer: [
      h(Button, { key: 'close', onClick: props.onClose }, 'Close'),
      h(Button, { key: 'docx', onClick: downloadDocx },
        'Download .docx'),
      h(Button, { key: 'vault', type: 'primary', disabled: lifted, onClick: liftToVault },
        lifted ? '✓ Lifted to Vault RIM' : 'Lift to Veeva Vault RIM'),
    ],
  },
    h(Tabs, {
      activeKey: tab, onChange: setTab,
      items: [
        { key: 'sections', label: 'Sections (' + manifest.sections.length + ')', children: renderSections() },
        { key: 'downstream', label: 'Downstream workflow', children: renderDownstream() },
      ]
    })
  );
}

// ---------- Program context strip ----------
//
// One-line "what am I looking at?" header for first-time visitors. Anchors
// the entire app to a single compound × indication × IND submission target.

function ProgramContext(props) {
  var pk = props.pkpd;
  var pkg = props.pkg;
  return h('div', { className: 'program-context' },
    h('div', { className: 'pc-row' },
      h('span', { className: 'pc-label' }, 'Program'),
      h(Term, { term: 'compound' }, h('span', { className: 'pc-strong' }, pk.compound)),
      h('span', { className: 'pc-arrow' }, '→'),
      h(Term, { term: 'indication' }, h('span', null, pk.indication)),
      h('span', { className: 'pc-arrow' }, '→'),
      h(Term, { term: 'ind' }, h('span', null, 'IND target ' + pkg.target_ind_submission)),
      h('span', { className: 'pc-arrow' }, '→'),
      h(Term, { term: 'fih' }, h('span', null, 'First-in-Human Phase 1')),
      h('span', { className: 'pc-spacer' }),
      h('span', { className: 'pc-meta' }, 'Modality: ', pk.modality === 'biologic' ? 'biologic (mAb)' : 'small molecule'),
      h('span', { className: 'pc-meta' }, 'Pivotal NOAEL study: ',
        h(Term, { term: 'noael_study' }, pk.pivotal_glp_study))
    )
  );
}

// ---------- TraceVal — a clickable numeric token tied to its source ----------
//
// Every displayed dose number, margin, or biomarker score should be a
// clickable token. Hover shows the formula or source; click opens the
// Audit Lineage drawer scoped to that value. This is the "every number
// traces" promise the spec makes — wired here so we never hand-craft it.

function TraceVal(props) {
  // props: value (number|string), unit?, formula?, citation?, sources?,
  //        onClick (defaults to opening AuditLineageDrawer via a global event)
  var unit = props.unit ? ' ' + props.unit : '';
  var tip = h('div', { style: { maxWidth: 360 } },
    props.formula ? h('div', { style: { fontFamily: 'SFMono-Regular, Consolas, Menlo, monospace', fontSize: 12 } }, props.formula) : null,
    props.citation ? h('div', { style: { marginTop: 6, fontSize: 11, color: '#C9C5F2' } }, props.citation) : null,
    h('div', { style: { marginTop: 6, fontSize: 11, color: '#C9C5F2' } }, 'Click for full lineage')
  );
  function onClick() {
    if (props.onClick) return props.onClick();
    // Broadcast on a global event so the drawer can listen without prop-drilling.
    var ev = new CustomEvent('indforge:openLineage', {
      detail: {
        value_id: props.id || 'value',
        value: props.value,
        unit: props.unit,
        formula: props.formula,
        citation: props.citation,
        sources: props.sources,
        snapshot_id: props.snapshot_id,
        kernel_version: props.kernel_version,
      }
    });
    window.dispatchEvent(ev);
  }
  return h(Tooltip, { title: tip, color: '#3F4547' },
    h('span', { className: 'trace-val' + (props.size === 'lg' ? ' trace-val-lg' : ''), onClick: onClick },
      props.value, unit, h('span', { className: 'trace-val-icon' }, '↗'))
  );
}

// ---------- Audit Lineage drawer (project-wide) ----------
//
// Listens for indforge:openLineage events anywhere in the app and renders a
// drawer scoped to the value clicked. Surface area: snapshot, sources,
// computation, identity, compute provenance, hand-off button.

function AuditLineageDrawer() {
  var _open = useState(false);
  var open = _open[0]; var setOpen = _open[1];
  var _detail = useState(null);
  var detail = _detail[0]; var setDetail = _detail[1];

  useEffect(function() {
    function handler(ev) {
      setDetail(ev.detail || {});
      setOpen(true);
      dlog('INFO', 'audit lineage opened for ' + (ev.detail && ev.detail.value_id));
    }
    window.addEventListener('indforge:openLineage', handler);
    return function() { window.removeEventListener('indforge:openLineage', handler); };
  }, []);

  var d = detail || {};
  var snapshot = d.snapshot_id || ('snap_' + new Date().toISOString().replace(/[:\-]/g,'').slice(0,15) + 'Z_indforge');
  var kernel = d.kernel_version || (window.DOSE_MATH_KERNEL_VERSION || 'indforge.dose_math/1.0.0');
  var user = (window.__indforgeContext && window.__indforgeContext.user) || 'demo.user@sponsor.com';

  function exportToVault() {
    dlog('INFO', 'Vault RIM lift requested for ' + (d.value_id || 'value'));
    if (window.antd && window.antd.message) window.antd.message.success('Vault RIM lift packaged · snapshot ' + snapshot);
  }

  return h(Drawer, {
    open: open,
    onClose: function() { setOpen(false); },
    width: 540,
    title: 'Audit & lineage' + (d.value_id ? ' — ' + d.value_id : ''),
    styles: { body: { padding: '20px 24px' } }
  },
    !detail ? null : h('div', null,
      h('div', { className: 'drawer-section' },
        h('div', { className: 'drawer-section-title' }, 'Value'),
        h('div', { className: 'audit-grid' },
          h('span', { className: 'k' }, 'ID'),       h('span', { className: 'v' }, d.value_id),
          h('span', { className: 'k' }, 'Value'),    h('span', { className: 'v' }, (d.value != null ? d.value : '—') + (d.unit ? ' ' + d.unit : '')),
          d.formula ? h('span', { className: 'k' }, 'Formula') : null,
          d.formula ? h('span', { className: 'v' }, d.formula) : null,
          d.citation ? h('span', { className: 'k' }, 'Citation') : null,
          d.citation ? h('span', { className: 'v' }, d.citation) : null
        )
      ),
      h('div', { className: 'drawer-section' },
        h('div', { className: 'drawer-section-title' }, 'Sources'),
        h('div', { className: 'audit-grid' },
          (d.sources || []).reduce(function(acc, s, i) {
            acc.push(h('span', { key: 'k'+i, className: 'k' }, s.kind));
            acc.push(h('span', { key: 'v'+i, className: 'v' }, s.id + ' · ' + (s.summary || '')));
            return acc;
          }, []),
          (!d.sources || !d.sources.length) ? [h('span', { key: 'none', className: 'v', style: { gridColumn: '1 / -1', color: '#7F8385' } }, 'No upstream sources recorded for this value.')] : []
        )
      ),
      h('div', { className: 'drawer-section' },
        h('div', { className: 'drawer-section-title' }, 'Computation'),
        h('div', { className: 'audit-grid' },
          h('span', { className: 'k' }, 'Math kernel'),    h('span', { className: 'v' }, kernel),
          h('span', { className: 'k' }, 'Snapshot ID'),    h('span', { className: 'v' }, snapshot)
        )
      ),
      h('div', { className: 'drawer-section' },
        h('div', { className: 'drawer-section-title' }, 'Identity'),
        h('div', { className: 'audit-grid' },
          h('span', { className: 'k' }, 'User'),       h('span', { className: 'v' }, user),
          h('span', { className: 'k' }, 'Role'),       h('span', { className: 'v' }, 'Pharmacometrics Lead'),
          h('span', { className: 'k' }, 'Timestamp'),  h('span', { className: 'v' }, new Date().toISOString()),
          h('span', { className: 'k' }, 'Signature'),  h('span', { className: 'v' }, '— (placeholder; non-GxP at execution)')
        )
      ),
      d.compute ? h('div', { className: 'drawer-section' },
        h('div', { className: 'drawer-section-title' }, 'Compute provenance'),
        h('div', { className: 'audit-grid' },
          h('span', { className: 'k' }, 'Cluster'),   h('span', { className: 'v' }, d.compute.cluster || '—'),
          h('span', { className: 'k' }, 'Partition'), h('span', { className: 'v' }, d.compute.partition || '—'),
          h('span', { className: 'k' }, 'Wall time'), h('span', { className: 'v' }, d.compute.wall_time || '—'),
          h('span', { className: 'k' }, 'On-prem'),   h('span', { className: 'v ok' }, d.compute.on_prem ? '✓ yes (no egress)' : '✗ no')
        )
      ) : null,
      h('div', { className: 'drawer-section' },
        h('div', { className: 'drawer-section-title' }, 'Hand-off'),
        h(Space, null,
          h(Button, { type: 'primary', onClick: exportToVault }, 'Export to Vault RIM'),
          h(Button, null, 'Copy snapshot ID'))
      )
    )
  );
}

function apiGet(path) {
  dlog('INFO', 'GET ' + path);
  return fetch(path).then(function(r) {
    dlog('INFO', 'GET ' + path + ' status=' + r.status);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  }).catch(function(err) {
    dlog('ERROR', 'GET ' + path + ' failed: ' + (err && err.message ? err.message : err));
    throw err;
  });
}

// Debug accordion — reads window.__indforgeLog and re-renders on an interval
// so new events show up without manual refresh. Open by default when there are
// ERRORs, collapsed otherwise.
function DebugAccordion() {
  var _t = useState(0);
  var tick = _t[0];
  var setTick = _t[1];

  useEffect(function() {
    var id = setInterval(function() { setTick(function(n) { return n + 1; }); }, 1000);
    return function() { clearInterval(id); };
  }, []);

  var log = (window.__indforgeLog || []).slice();
  var hasError = log.some(function(e) { return e.level === 'ERROR'; });
  var errCount = log.filter(function(e) { return e.level === 'ERROR'; }).length;

  function copyAll() {
    var text = log.map(function(e) {
      var d = new Date(e.time); return '[' + d.toISOString().split('T')[1].slice(0, 12) + '] ' + e.level + ' ' + e.msg;
    }).join('\n');
    try { navigator.clipboard.writeText(text); } catch (e) {}
  }

  function clearAll() {
    window.__indforgeLog = [];
    setTick(tick + 1);
  }

  var body = h('div', null,
    h(Space, { style: { marginBottom: 8 } },
      h(Button, { size: 'small', onClick: copyAll }, 'Copy log'),
      h(Button, { size: 'small', onClick: clearAll }, 'Clear'),
      h('span', { style: { fontSize: 12, color: '#7F8385' } }, log.length + ' events · ' + errCount + ' errors')
    ),
    h('pre', null,
      log.map(function(e, i) {
        var d = new Date(e.time);
        var cls = 'debug-log-row ' + (e.level === 'ERROR' ? 'err' : e.level === 'WARN' ? 'warn' : 'info');
        return h('div', { key: i, className: cls },
          '[' + d.toISOString().split('T')[1].slice(0, 12) + '] ' + e.level + ' ' + e.msg);
      })
    )
  );

  return h('div', { className: 'debug-accordion' },
    h(Collapse, {
      defaultActiveKey: hasError ? ['debug'] : [],
      items: [
        { key: 'debug',
          label: hasError
            ? ('Debug log · ' + errCount + ' error' + (errCount === 1 ? '' : 's'))
            : ('Debug log · ' + log.length + ' events'),
          children: body }
      ]
    })
  );
}

// ---------- Page 1: Candidates ----------

function CandidatesPage(props) {
  var candidates = props.candidates;

  var _f = useState(null);
  var tableFilter = _f[0];
  var setTableFilter = _f[1];

  var _d = useState(null);
  var selected = _d[0];
  var setSelected = _d[1];

  var stats = useMemo(function() {
    var total = candidates.length;
    var efficacy = candidates.filter(function(c) { return c.role === 'efficacy_pd'; }).length;
    var safety = candidates.filter(function(c) { return c.role === 'safety'; }).length;
    var toxFlagged = candidates.filter(function(c) { return c.safety_overlap && c.safety_overlap !== 'none'; }).length;
    var highConfidence = candidates.filter(function(c) { return c.confidence === 'high'; }).length;
    return { total: total, efficacy: efficacy, safety: safety, toxFlagged: toxFlagged, highConfidence: highConfidence };
  }, [candidates]);

  var filtered = useMemo(function() {
    if (!tableFilter) return candidates;
    if (tableFilter.type === 'role') return candidates.filter(function(c) { return c.role === tableFilter.value; });
    if (tableFilter.type === 'tox') return candidates.filter(function(c) { return c.safety_overlap && c.safety_overlap !== 'none'; });
    if (tableFilter.type === 'confidence') return candidates.filter(function(c) { return c.confidence === tableFilter.value; });
    return candidates;
  }, [candidates, tableFilter]);

  var columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 100,
      sorter: function(a, b) { return a.id.localeCompare(b.id); } },
    { title: 'Symbol', dataIndex: 'symbol', key: 'symbol', width: 110,
      render: function(v) { return h('strong', null, v); },
      sorter: function(a, b) { return a.symbol.localeCompare(b.symbol); } },
    { title: 'Role', dataIndex: 'role', key: 'role', width: 150,
      filters: [
        { text: 'Efficacy / PD', value: 'efficacy_pd' },
        { text: 'Safety', value: 'safety' },
        { text: 'Target engagement', value: 'target_engagement' },
      ],
      onFilter: function(v, r) { return r.role === v; },
      render: function(v) {
        var map = { efficacy_pd: { c: 'purple', t: 'Efficacy / PD' }, safety: { c: 'red', t: 'Safety' }, target_engagement: { c: 'blue', t: 'Target engagement' } };
        var m = map[v] || { c: 'default', t: v };
        return h(Tag, { color: m.c }, m.t);
      }
    },
    { title: 'Assay', dataIndex: 'assay', key: 'assay', width: 150 },
    { title: 'Species concordance', dataIndex: 'species_concordance', key: 'spec', width: 170,
      sorter: function(a, b) { return a.species_concordance - b.species_concordance; },
      render: function(v) { return h(ScoreBar, { value: v }); }
    },
    { title: 'Assay feasibility', dataIndex: 'assay_feasibility', key: 'afeas', width: 160,
      sorter: function(a, b) { return a.assay_feasibility - b.assay_feasibility; },
      render: function(v) { return h(ScoreBar, { value: v }); }
    },
    { title: 'PD dynamic range', dataIndex: 'pd_dynamic_range', key: 'pdr', width: 160,
      sorter: function(a, b) { return a.pd_dynamic_range - b.pd_dynamic_range; },
      render: function(v) { return h(ScoreBar, { value: v }); }
    },
    { title: 'Flags', key: 'flags', width: 160,
      render: function(_, r) {
        var flags = [];
        if (r.safety_overlap && r.safety_overlap !== 'none') {
          flags.push(h('span', { key: 'tox', className: 'status-flag danger' }, 'Tox overlap'));
        }
        if (r.confidence === 'high') flags.push(h('span', { key: 'hc', className: 'status-flag success' }, 'High conf'));
        if (r.confidence === 'low') flags.push(h('span', { key: 'lc', className: 'status-flag warning' }, 'Low conf'));
        return h('span', null, flags);
      }
    },
    { title: '', key: 'open', width: 60,
      render: function(_, r) {
        return h(Button, { size: 'small', type: 'link', onClick: function() { setSelected(r); } }, 'Open');
      }
    },
  ];

  var filterLabel = tableFilter ? (tableFilter.type === 'tox' ? 'Tox overlap' : tableFilter.value) : null;

  return h('div', null,
    h('div', { className: 'stats-row' },
      h(StatCard, { label: 'Candidates', value: stats.total, active: !tableFilter, color: 'primary',
        onClick: function() { setTableFilter(null); } }),
      h(StatCard, { label: 'Efficacy / PD', value: stats.efficacy, active: tableFilter && tableFilter.value === 'efficacy_pd', color: 'info',
        onClick: function() { setTableFilter(tableFilter && tableFilter.value === 'efficacy_pd' ? null : { type: 'role', value: 'efficacy_pd' }); } }),
      h(StatCard, { label: 'Safety biomarkers', value: stats.safety, active: tableFilter && tableFilter.value === 'safety', color: 'danger',
        onClick: function() { setTableFilter(tableFilter && tableFilter.value === 'safety' ? null : { type: 'role', value: 'safety' }); } }),
      h(StatCard, { label: 'Tox overlap flagged', value: stats.toxFlagged, active: tableFilter && tableFilter.type === 'tox', color: 'warning',
        sub: 'Organ-tox signature match',
        onClick: function() { setTableFilter(tableFilter && tableFilter.type === 'tox' ? null : { type: 'tox' }); } }),
      h(StatCard, { label: 'High confidence', value: stats.highConfidence, active: tableFilter && tableFilter.value === 'high', color: 'success',
        onClick: function() { setTableFilter(tableFilter && tableFilter.value === 'high' ? null : { type: 'confidence', value: 'high' }); } })
    ),

    h('div', { className: 'panel' },
      h('div', { className: 'panel-header' },
        h('span', { className: 'panel-title' }, filterLabel ? 'Candidates — ' + filterLabel : 'All candidates'),
        filterLabel ? h(Tag, { closable: true, onClose: function() { setTableFilter(null); }, color: 'purple' }, filterLabel) : null
      ),
      h('div', { className: 'panel-body no-pad' },
        h(Table, { dataSource: filtered, columns: columns, rowKey: 'id', pagination: { pageSize: 10 }, size: 'middle' })
      )
    ),

    h(Drawer, {
      open: !!selected,
      onClose: function() { setSelected(null); },
      width: 520,
      title: selected ? selected.symbol + ' — ' + selected.id : '',
      styles: { body: { padding: '20px 24px' } },
    }, selected ? h('div', null,
      h('div', { className: 'drawer-section' },
        h('div', { className: 'drawer-section-title' }, 'Candidate summary'),
        h('div', { className: 'kv-grid' },
          h('span', { className: 'k' }, 'Target'), h('span', { className: 'v' }, selected.target),
          h('span', { className: 'k' }, 'Role'), h('span', { className: 'v' }, selected.role),
          h('span', { className: 'k' }, 'Assay'), h('span', { className: 'v' }, selected.assay),
          h('span', { className: 'k' }, 'Confidence'), h('span', { className: 'v' }, selected.confidence),
          h('span', { className: 'k' }, 'Tox overlap'), h('span', { className: 'v' }, selected.safety_overlap || 'none'),
          h('span', { className: 'k' }, 'Updated'), h('span', { className: 'v' }, selected.updated)
        )
      ),
      h('div', { className: 'drawer-section' },
        h('div', { className: 'drawer-section-title' }, 'Translational scores'),
        h('div', { className: 'kv-grid' },
          h('span', { className: 'k' }, 'Species concordance'), h('span', { className: 'v' }, h(ScoreBar, { value: selected.species_concordance })),
          h('span', { className: 'k' }, 'Assay feasibility'), h('span', { className: 'v' }, h(ScoreBar, { value: selected.assay_feasibility })),
          h('span', { className: 'k' }, 'PD dynamic range'), h('span', { className: 'v' }, h(ScoreBar, { value: selected.pd_dynamic_range }))
        )
      ),
      h(Space, null,
        h(Button, { type: 'primary' }, 'Add to IND package'),
        h(Button, null, 'View bridging evidence')
      )
    ) : null)
  );
}

// ---------- Page 2: Safety & Tox ----------

function SafetyPage(props) {
  var overlap = props.overlap;
  var studies = props.studies;
  var glpStudies = props.glpStudies || (window.MOCK_GLP_STUDIES || []);
  var chartRef = useRef(null);

  // Replaces the previous decorative 0–1 score with a severity-coded view
  // tied to actual GLP findings. Each non-gray cell links to a real study
  // finding; gray cells (no finding) are not clickable.
  var severityRank = function(s) { return Math.max(0, (window.TOX_SEVERITY_ORDER || ['None','Minimal','Mild','Moderate','Severe']).indexOf(s)); };

  useEffect(function() {
    if (!chartRef.current) return;
    if (!Highcharts.seriesTypes || !Highcharts.seriesTypes.heatmap) {
      chartRef.current.innerHTML = '<div style="padding:40px;text-align:center;color:#C20A29">Heatmap module failed to load.</div>';
      return;
    }

    var findingsLookup = window.MOCK_TOX_FINDINGS || {};
    var data = [];
    for (var i = 0; i < overlap.candidates.length; i++) {
      var sym = overlap.candidates[i];
      for (var j = 0; j < overlap.organs.length; j++) {
        var organ = overlap.organs[j];
        var f = findingsLookup[sym] && findingsLookup[sym][organ];
        var sev = f ? f.severity : 'None';
        var rank = severityRank(sev);
        data.push({
          x: j, y: i, value: rank, severity: sev,
          finding: f || null, biomarker: sym, organ: organ,
          color: (window.TOX_SEVERITY_COLOR || {})[sev] || '#F0F0F0',
        });
      }
    }

    try {
      Highcharts.chart(chartRef.current, {
        chart: { type: 'heatmap', height: 360 },
        title: { text: null },
        xAxis: { categories: overlap.organs, title: null },
        yAxis: { categories: overlap.candidates, title: null, reversed: true },
        colorAxis: { dataClasses: [
          { from: 0, to: 0, color: '#F0F0F0', name: 'No finding' },
          { from: 1, to: 1, color: '#FEF3C7', name: 'Minimal' },
          { from: 2, to: 2, color: '#FDE68A', name: 'Mild' },
          { from: 3, to: 3, color: '#FB923C', name: 'Moderate' },
          { from: 4, to: 4, color: '#C20A29', name: 'Severe' },
        ] },
        legend: { align: 'right', layout: 'vertical', verticalAlign: 'middle', title: { text: 'Severity', style: { fontSize: '11px' } } },
        tooltip: {
          useHTML: true,
          formatter: function() {
            var p = this.point;
            if (!p.finding) return '<b>' + p.biomarker + ' · ' + p.organ + '</b><br/>No GLP finding';
            return '<b>' + p.biomarker + ' · ' + p.organ + '</b><br/>' +
              p.finding.severity + ' · ' + p.finding.study_id + (p.finding.day != null ? ' Day ' + p.finding.day : '') +
              '<br/><span style="font-size:11px;color:#C9C5F2">Click to open finding</span>';
          }
        },
        plotOptions: { heatmap: {
          borderColor: '#FFF', borderWidth: 1,
          dataLabels: { enabled: true, color: '#3F4547',
            formatter: function() { return this.point.severity === 'None' ? '' : this.point.severity; },
            style: { fontSize: '10px', textOutline: 'none' } },
          point: { events: { click: function() {
            if (!this.finding) return;
            var ev = new CustomEvent('indforge:openLineage', { detail: {
              value_id: this.biomarker + ' × ' + this.organ,
              value: this.finding.severity, unit: '',
              formula: this.finding.text,
              citation: this.finding.study_id + (this.finding.day != null ? ' · Day ' + this.finding.day : ''),
              sources: [{ kind: 'GLP study', id: this.finding.study_id, summary: this.finding.text }],
            }});
            window.dispatchEvent(ev);
          }}}
        }},
        series: [{ name: 'Severity', data: data }],
        credits: { enabled: false }
      });
    } catch (e) { dlog('ERROR', 'Tox heatmap failed: ' + (e && e.message)); }
  }, [overlap]);

  // Stat: count of flagged cells (severity ≥ Mild).
  var findingsLookup = window.MOCK_TOX_FINDINGS || {};
  var flaggedCount = 0;
  for (var ci = 0; ci < overlap.candidates.length; ci++) {
    var symbol = overlap.candidates[ci];
    var bm = findingsLookup[symbol];
    if (!bm) continue;
    for (var organ in bm) {
      if (bm[organ].severity && severityRank(bm[organ].severity) >= 2) { flaggedCount++; break; }
    }
  }

  var studyCols = [
    { title: 'Study', dataIndex: 'id', key: 'id', width: 110 },
    { title: 'Species', dataIndex: 'species', key: 'species', width: 100 },
    { title: 'Type', dataIndex: 'study_type', key: 'type', width: 200 },
    { title: 'GLP', dataIndex: 'glp', key: 'glp', width: 70,
      render: function(v) { return v ? h(Tag, { color: 'green' }, 'GLP') : h(Tag, null, 'non-GLP'); }
    },
    { title: 'NOAEL (mg/kg)', dataIndex: 'noael_mg_kg', key: 'noael', width: 140,
      render: function(v) { return v != null ? v : '—'; }
    },
    { title: 'Findings', dataIndex: 'findings', key: 'findings',
      render: function(fs) { return (fs && fs.length) ? fs.join('; ') : h('span', { style: { color: '#8F8FA3' } }, 'None') }
    },
  ];

  return h('div', null,
    h('div', { className: 'stats-row' },
      h(StatCard, { label: 'Candidates in safety panel', value: overlap.candidates.length, color: 'primary' }),
      h(StatCard, { label: 'Organ systems monitored', value: overlap.organs.length, color: 'info' }),
      h(StatCard, { label: h(Term, { term: 'tox_finding', subtle: true }, 'Tox flags (severity ≥ Mild)'),
        value: flaggedCount, color: 'danger', sub: 'GLP-tied' }),
      h(StatCard, { label: h(Term, { term: 'glp', subtle: true }, 'GLP studies ingested'),
        value: studies.filter(function(s) { return s.glp; }).length, color: 'success' })
    ),

    h('div', { className: 'panel' },
      h('div', { className: 'panel-header' },
        h('span', { className: 'panel-title' },
          h(Term, { term: 'tox_finding', subtle: true }, 'Tox findings by biomarker × organ')),
        h('span', { style: { fontSize: 12, color: '#7F8385' } },
          'Severity from GLP studies — click any non-gray cell for the finding')),
      h('div', { className: 'panel-body' },
        h('div', { ref: chartRef, className: 'chart-box' })
      )
    ),

    h('div', { className: 'panel' },
      h('div', { className: 'panel-header' }, h('span', { className: 'panel-title' }, 'Preclinical tox studies')),
      h('div', { className: 'panel-body no-pad' },
        h(Table, { dataSource: studies, columns: studyCols, rowKey: 'id', pagination: false, size: 'middle' })
      )
    )
  );
}

// ---------- Page 3: Translatability Sweep (multi-omics × on-prem SLURM) ----------
//
// Keynote-demo page. The audience is asked to imagine a computational biologist
// integrating RNA-seq, proteomics, and metabolomics across a 40-animal NHP cohort.
// Animal omics is pinned to on-prem storage by IT policy, so the workload routes
// to where the data already lives — no egress, no data-transfer review.

function CIBar(props) {
  // Render a 95% CI segment with a centered point estimate. Domain is 0..1.
  var lo = Math.max(0, Math.min(1, props.low));
  var hi = Math.max(0, Math.min(1, props.high));
  var pt = Math.max(0, Math.min(1, props.point));
  var rangeLeft = (lo * 100).toFixed(1) + '%';
  var rangeWidth = ((hi - lo) * 100).toFixed(1) + '%';
  var ptLeft = (pt * 100).toFixed(1) + '%';
  return h('div', { className: 'ci-bar' },
    h('div', { className: 'ci-bar-track' },
      h('div', { className: 'ci-bar-range', style: { left: rangeLeft, width: rangeWidth } }),
      h('div', { className: 'ci-bar-point', style: { left: ptLeft } })
    ),
    h('span', { className: 'ci-bar-num' },
      pt.toFixed(2) + ' [' + lo.toFixed(2) + ', ' + hi.toFixed(2) + ']')
  );
}

function FactorHeatmap(props) {
  var data = props.data;
  var ref = useRef(null);
  useEffect(function() {
    if (!ref.current) return;
    if (!Highcharts.seriesTypes || !Highcharts.seriesTypes.heatmap) {
      ref.current.innerHTML = '<div style="padding:40px;text-align:center;color:#C20A29">Heatmap module unavailable.</div>';
      return;
    }
    var factors = [];
    for (var f = 0; f < data.factor_weights.length; f++) factors.push('F' + (f + 1));
    var series = [];
    for (var fi = 0; fi < data.factor_weights.length; fi++) {
      for (var ci = 0; ci < data.factor_features.length; ci++) {
        series.push([ci, fi, data.factor_weights[fi][ci]]);
      }
    }
    try {
      Highcharts.chart(ref.current, {
        chart: { type: 'heatmap', height: 360, marginTop: 20, marginBottom: 100 },
        title: { text: null },
        xAxis: { categories: data.factor_features, title: null,
          labels: { rotation: -55, style: { fontSize: '10px' } } },
        yAxis: { categories: factors, title: null, reversed: true },
        colorAxis: { min: -1, max: 1, stops: [[0, '#FF6543'], [0.5, '#FFFFFF'], [1, '#543FDE']],
          title: { text: 'Factor weight', style: { fontSize: '11px', color: '#7F8385' } } },
        legend: { align: 'right', layout: 'vertical', verticalAlign: 'middle' },
        tooltip: {
          formatter: function() {
            return '<b>' + factors[this.point.y] + ' · ' + data.factor_features[this.point.x] + '</b><br/>' +
              'weight: ' + this.point.value.toFixed(2);
          }
        },
        series: [{ name: 'Loading', data: series, borderWidth: 0 }],
        credits: { enabled: false }
      });
    } catch (e) {
      dlog('ERROR', 'Sweep heatmap render failed: ' + (e && e.message));
    }
  }, [data]);
  return h('div', { ref: ref, className: 'chart-box', style: { minHeight: 360 } });
}

function BootstrapHistogram(props) {
  // Plausible-looking bootstrap distribution centered at the point estimate
  // with width matching the CI. Pure mock — for the keynote drill-down only.
  var ref = useRef(null);
  var c = props.candidate;
  useEffect(function() {
    if (!ref.current || !c) return;
    var center = c.score;
    var sd = (c.ci_high - c.ci_low) / 4;
    var bins = 24;
    var lo = Math.max(0, center - 4 * sd);
    var hi = Math.min(1, center + 4 * sd);
    var bw = (hi - lo) / bins;
    var counts = new Array(bins).fill(0);
    for (var k = 0; k < 1000; k++) {
      // Deterministic-ish pseudo-normal via Box-Muller with a seeded LCG
      var s1 = (Math.sin((k + 1) * 23.71 + center * 7) * 43758.5453);
      var s2 = (Math.sin((k + 1) * 17.13 + center * 3) * 43758.5453);
      var u = s1 - Math.floor(s1); if (u < 1e-6) u = 1e-6;
      var v = s2 - Math.floor(s2);
      var z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      var x = center + z * sd;
      if (x >= lo && x < hi) counts[Math.floor((x - lo) / bw)]++;
    }
    var cats = [];
    for (var b = 0; b < bins; b++) cats.push((lo + (b + 0.5) * bw).toFixed(2));
    try {
      Highcharts.chart(ref.current, {
        chart: { type: 'column', height: 240 },
        title: { text: null },
        xAxis: { categories: cats, title: { text: 'Translatability score (bootstrap)' },
          labels: { step: 4 } },
        yAxis: { title: { text: 'Bootstrap count' } },
        plotOptions: { column: { borderWidth: 0, pointPadding: 0, groupPadding: 0.02 } },
        legend: { enabled: false },
        series: [{ name: 'Bootstrap', data: counts, color: '#543FDE' }],
        credits: { enabled: false }
      });
    } catch (e) { dlog('ERROR', 'Histogram failed: ' + (e && e.message)); }
  }, [c]);
  return h('div', { ref: ref, style: { minHeight: 240 } });
}

function SweepPage(props) {
  var cohorts = props.cohorts;

  var _phase = useState('config'); // 'config' | 'running' | 'results'
  var phase = _phase[0]; var setPhase = _phase[1];

  var _cohortId = useState(cohorts[0].id);
  var cohortId = _cohortId[0]; var setCohortId = _cohortId[1];
  var cohort = cohorts.find(function(c) { return c.id === cohortId; }) || cohorts[0];

  var _params = useState({ method: 'MOFA+', factors: 10, bootstrap: 1000, confidence: 95 });
  var params = _params[0]; var setParams = _params[1];
  function setParam(k, v) { setParams(Object.assign({}, params, (function(o){o[k]=v;return o;})({}))); }

  var _clusterId = useState('slurm-onprem');
  var clusterId = _clusterId[0]; var setClusterId = _clusterId[1];
  var selectedCluster = COMPUTE_CLUSTERS.find(function(c) { return c.id === clusterId; }) || COMPUTE_CLUSTERS[0];
  var isOnPrem = selectedCluster.type === 'slurm';

  var _pickerOpen = useState(false);
  var pickerOpen = _pickerOpen[0]; var setPickerOpen = _pickerOpen[1];

  var _progress = useState(0);
  var progress = _progress[0]; var setProgress = _progress[1];
  var _stage = useState(0); // 0 queued · 1 running · 2 succeeded
  var stage = _stage[0]; var setStage = _stage[1];

  var _results = useState(null);
  var results = _results[0]; var setResults = _results[1];

  var _drawer = useState(null);
  var drawerCand = _drawer[0]; var setDrawerCand = _drawer[1];

  function onPickerSubmitted(job) {
    setClusterId(job.cluster.id);
    setPickerOpen(false);
    setPhase('running');
    setProgress(0);
    setStage(0);

    // Try the live submit endpoint; results are taken from the frontend mock
    // (server endpoint returns 503 for results following existing pattern).
    apiPost('api/sweep/submit', {
      cohort_id: cohortId, method: params.method, factors: params.factors,
      bootstrap: params.bootstrap, confidence: params.confidence / 100,
      compute_target: job.cluster.id,
    }).catch(function() { /* non-fatal — demo continues with mock */ });

    var start = Date.now();
    var iv = setInterval(function() {
      var elapsed = (Date.now() - start) / 6000;
      var p = Math.min(1, elapsed);
      setProgress(Math.round(p * 100));
      if (p >= 0.15 && stage < 1) setStage(1);
      if (p >= 1) {
        clearInterval(iv);
        setStage(2);
        // Tailor mock to the cluster the user actually picked.
        var r = JSON.parse(JSON.stringify(MOCK_SWEEP_RESULTS));
        r.compute.target = job.cluster.id;
        r.compute.target_label = job.cluster.name;
        r.compute.partition = job.partition;
        r.compute.on_prem = (job.cluster.type === 'slurm');
        r.compute.egress = (job.cluster.type !== 'slurm');
        r.cohort = { id: cohort.id, n_animals: cohort.n_animals, glp_study: cohort.glp_study,
          dose_groups: cohort.dose_groups, timepoints: cohort.timepoints };
        r.parameters = { factors: params.factors, bootstrap: params.bootstrap, confidence: params.confidence / 100 };
        setResults(r);
        setPhase('results');
        if (props.onCompleted) props.onCompleted(r.sweep_id);
      }
    }, 150);
  }

  function apiPost(path, body) {
    return fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body) }).then(function(r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      });
  }

  // ----- Config view -----
  function renderConfig() {
    return h('div', null,
      h('div', { className: 'sweep-config-grid' },
        h('div', { className: 'sweep-card' },
          h('div', { className: 'sweep-card-title' }, 'Input cohort'),
          h(Select, { value: cohortId, onChange: setCohortId, style: { width: '100%', marginBottom: 10 },
            options: cohorts.map(function(c) { return { value: c.id, label: c.label }; }) }),
          h('div', { className: 'kv-row' }, h('span', { className: 'k' }, 'Animals'),    h('span', { className: 'v' }, cohort.n_animals)),
          h('div', { className: 'kv-row' }, h('span', { className: 'k' }, 'GLP study'),  h('span', { className: 'v' }, cohort.glp_study)),
          h('div', { className: 'kv-row' }, h('span', { className: 'k' }, 'Dose groups'), h('span', { className: 'v' }, cohort.dose_groups)),
          h('div', { className: 'kv-row' }, h('span', { className: 'k' }, 'Timepoints'), h('span', { className: 'v' }, cohort.timepoints)),
          h('div', { className: 'kv-row' }, h('span', { className: 'k' }, 'Species'),    h('span', { className: 'v' }, cohort.species))
        ),

        h('div', { className: 'sweep-card' },
          h('div', { className: 'sweep-card-title' },
            h(Term, { term: 'multi_omics', subtle: true }, 'Data sources')),
          h('div', { className: 'sweep-source-row' }, h('span', { className: 'sweep-source-dot' }), 'RNA-seq · 18,432 transcripts (on-prem)'),
          h('div', { className: 'sweep-source-row' }, h('span', { className: 'sweep-source-dot' }), 'Proteomics · 4,127 proteins (on-prem)'),
          h('div', { className: 'sweep-source-row' }, h('span', { className: 'sweep-source-dot' }), 'Metabolomics · 612 metabolites (on-prem)'),
          h('div', { className: 'sweep-policy-note' },
            'All animal-omics is restricted to on-prem storage by IT policy. Cloud routing triggers a six-week data-transfer review.')
        ),

        h('div', { className: 'sweep-card' },
          h('div', { className: 'sweep-card-title' }, 'Sweep parameters'),
          h(Form, { layout: 'vertical', size: 'small' },
            h(Form.Item, { label: h(Term, { term: 'factor_model', subtle: true }, 'Method'), style: { marginBottom: 10 } },
              h(Select, { value: params.method, onChange: function(v) { setParams(Object.assign({}, params, { method: v })); },
                options: [{ value: 'MOFA+', label: 'MOFA+ (multi-omics factor analysis)' },
                          { value: 'DIABLO', label: 'DIABLO (mixOmics)' }] })),
            h(Form.Item, { label: 'Factors', style: { marginBottom: 10 } },
              h(InputNumber, { min: 3, max: 25, value: params.factors,
                onChange: function(v) { setParams(Object.assign({}, params, { factors: v })); }, style: { width: '100%' } })),
            h(Form.Item, { label: h(Term, { term: 'bootstrap', subtle: true }, 'Bootstrap iterations'), style: { marginBottom: 10 } },
              h(InputNumber, { min: 100, max: 5000, step: 100, value: params.bootstrap,
                onChange: function(v) { setParams(Object.assign({}, params, { bootstrap: v })); }, style: { width: '100%' } })),
            h(Form.Item, { label: 'Confidence (%)', style: { marginBottom: 0 } },
              h(InputNumber, { min: 80, max: 99, value: params.confidence,
                onChange: function(v) { setParams(Object.assign({}, params, { confidence: v })); }, style: { width: '100%' } }))
          )
        ),

        h('div', { className: 'sweep-card' },
          h('div', { className: 'sweep-card-title' },
            h(Term, { term: 'ortholog', subtle: true }, 'Ortholog mapping')),
          h('div', { className: 'kv-row' }, h('span', { className: 'k' }, 'Source DB'),  h('span', { className: 'v' }, 'Ensembl 110')),
          h('div', { className: 'kv-row' }, h('span', { className: 'k' }, 'Method'),     h('span', { className: 'v' }, 'one-to-one + 1:N')),
          h('div', { className: 'kv-row' }, h('span', { className: 'k' }, 'NHP→Human'),  h('span', { className: 'v' }, '94.2% coverage')),
          h('div', { className: 'kv-row' }, h('span', { className: 'k' }, 'Rat→Human'),  h('span', { className: 'v' }, '88.6% coverage')),
          h('div', { className: 'kv-row' }, h('span', { className: 'k' }, 'Last refresh'), h('span', { className: 'v' }, '2026-04-29'))
        )
      ),

      h('div', { className: 'sweep-run-row' },
        h(Button, { type: 'primary', size: 'large', onClick: function() { setPickerOpen(true); } },
          'Run translatability sweep'),
        isOnPrem
          ? h('span', { className: 'residency-pill ok' }, '✓ Animal omics stays on-prem · GLP audit chain preserved')
          : h('span', { className: 'residency-pill warn' }, '⚠ Data-transfer review required for preclinical'),
        h('span', { style: { marginLeft: 'auto', fontSize: 12, color: '#7F8385' } },
          'Compute target: ', h('strong', { style: { color: '#3F4547' } }, selectedCluster.name))
      ),

      h('div', { className: 'sweep-rationale' },
        isOnPrem
          ? 'Multi-omics integration is HPC-shaped. Routing to on-prem SLURM keeps animal omics behind the firewall and preserves the GLP audit chain end-to-end.'
          : 'Cloud target selected. Animal omics will trigger a data-transfer review (~6 weeks). Switch back to on-prem SLURM to skip the review.')
    );
  }

  // ----- Running view -----
  function renderRunning() {
    var stages = ['Queued', 'Running on ' + selectedCluster.name.split(' (')[0], 'Aggregating bootstrap', 'Succeeded'];
    // Threshold each chip to a progress band so exactly one is "active"
    // and earlier ones are "done" — clearer than the previous additive logic.
    var thresholds = [0, 15, 50, 100];
    function chipState(i) {
      if (progress >= 100) return i === 3 ? 'done' : 'done';
      if (i + 1 < thresholds.length && progress >= thresholds[i + 1]) return 'done';
      if (progress >= thresholds[i]) return 'active';
      return '';
    }
    return h('div', null,
      h('div', { className: 'sweep-progress-card' },
        h('div', { className: 'sweep-progress-title' }, 'Translatability sweep in progress'),
        h('div', { className: 'sweep-progress-sub' },
          'Cohort ', h('strong', null, cohort.id), ' · ', params.method, ' with ', params.factors, ' factors · ',
          params.bootstrap.toLocaleString(), ' bootstrap iterations · partition ',
          h('code', null, selectedCluster.partitions[0])),
        h(Progress, { percent: progress, status: 'active', strokeColor: '#543FDE' }),
        h('div', { className: 'sweep-progress-steps' },
          stages.map(function(s, i) {
            var st = chipState(i);
            return h('span', { key: i, className: 'sweep-progress-step' + (st ? ' ' + st : '') }, s);
          })
        ),
        h('div', { style: { marginTop: 16, fontSize: 12, color: '#65657B' } },
          isOnPrem
            ? '✓ Job dispatched on-prem — animal omics never leaves the firewall.'
            : '⚠ Cloud target — data-transfer review approval assumed.')
      )
    );
  }

  // ----- Results view -----
  function renderResults() {
    var r = results;
    var candCols = [
      { title: 'Candidate', dataIndex: 'symbol', key: 'sym', width: 110,
        render: function(v) { return h('strong', null, v); } },
      { title: 'Score', dataIndex: 'score', key: 'sc', width: 90,
        sorter: function(a, b) { return a.score - b.score; },
        defaultSortOrder: 'descend',
        render: function(v) { return v.toFixed(2); } },
      { title: '95% CI', key: 'ci', width: 230,
        sorter: function(a, b) { return (a.ci_high - a.ci_low) - (b.ci_high - b.ci_low); },
        render: function(_, row) { return h(CIBar, { low: row.ci_low, high: row.ci_high, point: row.score }); } },
      { title: 'Factor', dataIndex: 'factor', key: 'f', width: 110,
        render: function(v) { return h('code', { style: { fontSize: 12 } }, v); } },
      { title: 'Role', dataIndex: 'role', key: 'role', width: 160,
        sorter: function(a, b) { return a.role.localeCompare(b.role); },
        render: function(v) {
          var map = { efficacy_pd: { c: 'purple', t: 'Efficacy / PD' }, safety: { c: 'red', t: 'Safety' }, target_engagement: { c: 'blue', t: 'Target engagement' } };
          var m = map[v] || { c: 'default', t: v };
          return h(Tag, { color: m.c }, m.t);
        } },
      { title: 'Status', dataIndex: 'status', key: 'st', width: 150,
        render: function(v) { return v === 'Tox'
          ? h('span', { className: 'status-flag warning' }, '⚠ Safety / Tox')
          : h('span', { className: 'status-flag success' }, '✓ Efficacy / PD'); } },
      { title: '', key: 'open', width: 70,
        render: function(_, row) {
          return h(Button, { size: 'small', type: 'link', onClick: function() { setDrawerCand(row); } }, 'Open');
        } },
    ];

    var residencyOk = r.compute.on_prem && !r.compute.egress;

    return h('div', null,
      h('div', { style: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } },
        h('span', { style: { fontSize: 13, color: '#7F8385' } }, 'Run ID:'),
        h('span', { className: 'sweep-run-id' }, r.sweep_id),
        h(Button, { size: 'small', onClick: function() { setPhase('config'); setResults(null); } }, 'Configure new sweep')
      ),

      h('div', { className: 'stats-row' },
        h(StatCard, { label: 'Candidates ranked', value: r.candidates.length, color: 'primary' }),
        h(StatCard, { label: 'Method', value: r.method, color: 'info', sub: r.parameters.factors + ' factors' }),
        h(StatCard, { label: h(Term, { term: 'bootstrap', subtle: true }, 'Bootstraps'),
          value: r.parameters.bootstrap.toLocaleString(),
          sub: (r.parameters.confidence * 100).toFixed(0) + '% CI' }),
        h(StatCard, { label: 'Compute', value: r.compute.partition, sub: r.compute.target_label, color: 'primary' }),
        h(StatCard, { label: 'Wall time', value: Math.round(r.compute.wall_time_seconds / 60) + ' min',
          sub: r.compute.cores + ' cores', color: 'success' })
      ),

      h('div', { className: 'panel' },
        h('div', { className: 'panel-header' },
          h('span', { className: 'panel-title' },
            h(Term, { term: 'translatability', subtle: true }, 'Translatability envelope')),
          residencyOk
            ? h('span', { className: 'residency-pill ok' }, '✓ On-prem · no egress')
            : h('span', { className: 'residency-pill warn' }, '⚠ Cloud · egress')),
        h('div', { className: 'panel-body no-pad' },
          h(Table, { dataSource: r.candidates, columns: candCols, rowKey: 'symbol',
            pagination: false, size: 'middle' }))),

      h('div', { className: 'panel' },
        h('div', { className: 'panel-header' },
          h('span', { className: 'panel-title' }, 'Factor weights · ' + r.factor_weights.length + ' factors × top ' + r.factor_features.length + ' features')),
        h('div', { className: 'panel-body' }, h(FactorHeatmap, { data: r }))),

      h('div', { className: 'panel' },
        h('div', { className: 'panel-header' }, h('span', { className: 'panel-title' }, 'Audit & lineage')),
        h('div', { className: 'panel-body' },
          h('div', { className: 'audit-grid' },
            h('span', { className: 'k' }, 'Compute'),         h('span', { className: 'v' }, r.compute.target_label + ' · ' + r.compute.partition + ' · ' + r.compute.cores + ' cores'),
            h('span', { className: 'k' }, 'Wall time'),       h('span', { className: 'v' }, Math.floor(r.compute.wall_time_seconds / 3600) + 'h ' + Math.round((r.compute.wall_time_seconds % 3600) / 60) + 'm'),
            h('span', { className: 'k' }, 'Cost'),            h('span', { className: 'v' }, r.compute.cost_usd === 0 ? 'included (on-prem)' : ('$' + r.compute.cost_usd.toFixed(2))),
            h('span', { className: 'k' }, 'Data residency'),  h('span', { className: 'v ' + (residencyOk ? 'ok' : '') }, residencyOk ? '✓ on-prem; no egress' : '⚠ cloud; egress required'),
            h('span', { className: 'k' }, 'GLP study'),       h('span', { className: 'v' }, r.cohort.glp_study + ' (NHP 28-day repeat-dose)'),
            h('span', { className: 'k' }, 'Param combos'),    h('span', { className: 'v' }, r.audit.parameter_combinations_logged.toLocaleString() + ' logged'),
            h('span', { className: 'k' }, 'Snapshot ID'),     h('span', { className: 'v' }, r.audit.snapshot_id),
            h('span', { className: 'k' }, 'GLP audit chain'), h('span', { className: 'v ok' }, r.audit.glp_chain_preserved ? '✓ preserved' : '✗ broken'),
            h('span', { className: 'k' }, 'Started'),         h('span', { className: 'v' }, r.audit.started_at),
            h('span', { className: 'k' }, 'Completed'),       h('span', { className: 'v' }, r.audit.completed_at),
            h('span', { className: 'k' }, 'User'),            h('span', { className: 'v' }, r.audit.user_id)
          ),
          h('div', { style: { marginTop: 14 } },
            h(Space, null,
              h(Tooltip, { title: 'Audit Trail integration ships in v2. Snapshot ID is preserved for manual lookup.' },
                h(Button, { disabled: true }, 'Open audit trail')),
              h(Button, null, 'Attach to IND package')))
        ))
    );
  }

  return h('div', null,
    phase === 'config'  ? renderConfig()  :
    phase === 'running' ? renderRunning() : renderResults(),

    h(ClusterPicker, {
      open: pickerOpen,
      onClose: function() { setPickerOpen(false); },
      workflowLabel: 'Run translatability sweep',
      clusterId: clusterId,
      onClusterChange: setClusterId,
      hideBootstraps: true,
      bootstrapDefault: params.bootstrap,
      description: 'Multi-omics integration is HPC-shaped. Your animal-omics and GLP tox data is restricted ' +
        'to on-prem storage. On-prem SLURM is recommended — no egress, no data-transfer review, GLP audit chain preserved.',
      onSubmitted: onPickerSubmitted,
    }),

    h(Drawer, {
      open: !!drawerCand,
      onClose: function() { setDrawerCand(null); },
      width: 560,
      title: drawerCand ? drawerCand.symbol + ' — translatability detail' : '',
      styles: { body: { padding: '20px 24px' } }
    }, drawerCand ? h('div', null,
      h('div', { className: 'drawer-section' },
        h('div', { className: 'drawer-section-title' }, 'Point estimate + 95% CI'),
        h(CIBar, { low: drawerCand.ci_low, high: drawerCand.ci_high, point: drawerCand.score })),
      h('div', { className: 'drawer-section' },
        h('div', { className: 'drawer-section-title' }, 'Per-factor loading'),
        h('div', { className: 'kv-grid' },
          h('span', { className: 'k' }, 'Loading on'), h('span', { className: 'v' }, drawerCand.factor),
          h('span', { className: 'k' }, 'Role'),       h('span', { className: 'v' }, drawerCand.role),
          h('span', { className: 'k' }, 'Status'),     h('span', { className: 'v' }, drawerCand.status))),
      h('div', { className: 'drawer-section' },
        h('div', { className: 'drawer-section-title' }, 'Bootstrap distribution'),
        h(BootstrapHistogram, { candidate: drawerCand }))
    ) : null)
  );
}

// ---------- Page 4: PK/PD & FIH Dose ----------
//
// The dose math is reviewable arithmetic, not a model. Every input is
// editable, every derived value updates live, and every value clicks
// through to its lineage. The pharmacometrician should be able to drag
// any input on stage and watch the math follow.

function PKPDPage(props) {
  var pk = props.pkpd;
  var sweepRunId = props.sweepRunId; // optional — set when a sweep was completed

  // Live inputs — seeded from MOCK_PKPD, fully editable.
  var _inputs = useState({
    species: pk.species,
    animal_bw_kg: pk.animal_bw_kg,
    human_bw_kg: pk.human_bw_kg,
    noael_mg_kg: pk.noael_mg_kg,
    glp_study_id: pk.pivotal_glp_study,
    exponent: pk.exponent,
    safety_factor: pk.safety_factor,
    modality: pk.modality,
    kd_nm: pk.kd_nm,
    mw_kda: pk.mw_kda,
    vd_l: pk.vd_l,
    ro_threshold: pk.ro_threshold,
    noael_auc: pk.noael_auc,
    auc_per_mg: pk.auc_per_mg,
  });
  var inputs = _inputs[0]; var setInputs = _inputs[1];
  function setInput(k, v) { setInputs(Object.assign({}, inputs, (function(o){ o[k]=v; return o; })({}))); }

  // Derived values — recomputed on every input change via the dose math kernel.
  var result = useMemo(function() { return window.computeDose(inputs); }, [inputs]);

  // Exposure–response chart
  var chartRef = useRef(null);
  useEffect(function() {
    if (!chartRef.current) return;
    var data = pk.points.map(function(p) { return [p.auc, p.response]; });
    var fihAuc = inputs.auc_per_mg * result.fih_dose_mg;
    try {
      Highcharts.chart(chartRef.current, {
        chart: { height: 340 },
        title: { text: null },
        xAxis: { title: { text: 'AUC (ng·h/mL)' }, type: 'logarithmic',
          plotLines: [
            { value: pk.mabel_auc, color: '#0070CC', dashStyle: 'Dash', width: 1,
              label: { text: 'MABEL', style: { color: '#0070CC' } } },
            { value: pk.ec50_auc, color: '#543FDE', dashStyle: 'Dash', width: 1,
              label: { text: 'EC50', style: { color: '#543FDE' } } },
            { value: inputs.noael_auc, color: '#C20A29', dashStyle: 'Dash', width: 1,
              label: { text: 'NOAEL', style: { color: '#C20A29' } } },
            { value: fihAuc, color: '#28A464', dashStyle: 'ShortDash', width: 2,
              label: { text: 'FIH starting dose', style: { color: '#28A464' } } },
          ]
        },
        yAxis: { title: { text: pk.lead_pd_biomarker + ' fold-change' } },
        legend: { enabled: false },
        series: [
          { type: 'spline', name: 'Emax fit', data: data, color: '#543FDE', marker: { radius: 5 } }
        ],
        credits: { enabled: false }
      });
    } catch (e) { dlog('ERROR', 'PK/PD render failed: ' + (e && e.message)); }
  }, [pk, inputs, result]);

  // Compute-cluster picker for the sensitivity sweep
  var _cp = useState(false);
  var pickerOpen = _cp[0]; var setPickerOpen = _cp[1];

  // Export modal state — uses the backend .docx endpoint.
  var _exportOpen = useState(false);
  var exportOpen = _exportOpen[0]; var setExportOpen = _exportOpen[1];
  var _exporting = useState(false);
  var exporting = _exporting[0]; var setExporting = _exporting[1];
  var _draft = useState(null);
  var draft = _draft[0]; var setDraft = _draft[1];

  function draftAndExport() {
    setExporting(true);
    setExportOpen(true);
    // 1) draft → 2) GET .docx
    fetch('api/dose/justification/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        compound_id: pk.compound,
        sweep_id: sweepRunId || null,
        dose_inputs: inputs,
      }),
    }).then(function(r) { return r.ok ? r.json() : Promise.reject(r); })
      .then(function(d) {
        setDraft(d);
        // Trigger the file download via a hidden link.
        var url = 'api/dose/justification/' + d.document_id + '/export.docx';
        var a = document.createElement('a');
        a.href = url; a.download = d.document_id + '.docx';
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        setExporting(false);
        if (window.antd && window.antd.message) {
          window.antd.message.success('Dose justification exported · ' + d.document_id);
        }
        if (props.onExported) props.onExported(d.document_id);
      })
      .catch(function(err) {
        dlog('ERROR', 'Dose justification export failed: ' + (err && err.message));
        setExporting(false);
      });
  }

  // ----- Renderers -----

  function renderInputs() {
    return h('div', { className: 'panel' },
      h('div', { className: 'panel-header' },
        h('span', { className: 'panel-title' }, 'Inputs'),
        h(Tag, { color: 'purple' }, inputs.modality === 'biologic' ? 'Biologic (MABEL applies)' : 'Small molecule')),
      h('div', { className: 'panel-body' },
        h(Form, { layout: 'vertical', size: 'small' },
          h('div', { className: 'dose-input-grid' },
            h(Form.Item, { label: 'Species' },
              h(Select, { value: inputs.species, onChange: function(v) {
                  // Adjust default body weight per species.
                  var bwBy = { Mouse: 0.025, Rat: 0.25, Dog: 10.0, NHP: 5.0 };
                  setInputs(Object.assign({}, inputs, { species: v, animal_bw_kg: bwBy[v] || inputs.animal_bw_kg }));
                },
                options: [{ value: 'Mouse', label: 'Mouse' }, { value: 'Rat', label: 'Rat' },
                          { value: 'Dog', label: 'Dog' }, { value: 'NHP', label: 'NHP (cynomolgus)' }] })),
            h(Form.Item, { label: 'Animal BW (kg)' },
              h(InputNumber, { min: 0.01, max: 50, step: 0.01, value: inputs.animal_bw_kg, style: { width: '100%' },
                onChange: function(v) { setInput('animal_bw_kg', v); } })),
            h(Form.Item, { label: 'Human BW (kg)' },
              h(InputNumber, { min: 30, max: 120, step: 1, value: inputs.human_bw_kg, style: { width: '100%' },
                onChange: function(v) { setInput('human_bw_kg', v); } })),
            h(Form.Item, { label: h(Term, { term: 'noael', subtle: true }, 'NOAEL (mg/kg)') },
              h(InputNumber, { min: 0.01, max: 1000, step: 0.1, value: inputs.noael_mg_kg, style: { width: '100%' },
                onChange: function(v) { setInput('noael_mg_kg', v); } })),
            h(Form.Item, { label: h(Term, { term: 'glp', subtle: true }, 'GLP study') },
              h(Select, { value: inputs.glp_study_id, style: { width: '100%' },
                onChange: function(v) { setInput('glp_study_id', v); },
                options: (window.MOCK_GLP_STUDIES || MOCK_GLP_STUDIES).map(function(s) {
                  return { value: s.id, label: s.id + ' · ' + s.species + ' ' + s.study_type };
                }) })),
            h(Form.Item, { label: h(Term, { term: 'allometric', subtle: true }, 'Allometric exponent') },
              h(Select, { value: inputs.exponent, style: { width: '100%' },
                onChange: function(v) { setInput('exponent', v); },
                options: [{ value: 0.67, label: '0.67 — surface area (FDA 2005)' },
                          { value: 0.75, label: '0.75 — Boxenbaum' }] })),
            h(Form.Item, { label: 'Safety factor' },
              h(InputNumber, { min: 1, max: 100, step: 1, value: inputs.safety_factor, style: { width: '100%' },
                onChange: function(v) { setInput('safety_factor', v); } })),
            h(Form.Item, { label: 'Modality' },
              h(Select, { value: inputs.modality, style: { width: '100%' },
                onChange: function(v) { setInput('modality', v); },
                options: [{ value: 'biologic', label: 'Biologic (MABEL)' },
                          { value: 'small_molecule', label: 'Small molecule' }] }))
          ),
          inputs.modality === 'biologic' ? h('div', { className: 'dose-input-mabel' },
            h('div', { className: 'dose-section-title' }, 'MABEL inputs (EMA 2017 §4.4)'),
            h('div', { className: 'dose-input-grid' },
              h(Form.Item, { label: h(Term, { term: 'kd', subtle: true }, 'Kd (nM)') },
                h(InputNumber, { min: 0.01, max: 10000, step: 0.1, value: inputs.kd_nm, style: { width: '100%' },
                  onChange: function(v) { setInput('kd_nm', v); } })),
              h(Form.Item, { label: 'MW (kDa)' },
                h(InputNumber, { min: 1, max: 1000, step: 1, value: inputs.mw_kda, style: { width: '100%' },
                  onChange: function(v) { setInput('mw_kda', v); } })),
              h(Form.Item, { label: h(Term, { term: 'vd', subtle: true }, 'Vd (L)') },
                h(InputNumber, { min: 0.5, max: 50, step: 0.1, value: inputs.vd_l, style: { width: '100%' },
                  onChange: function(v) { setInput('vd_l', v); } })),
              h(Form.Item, { label: h(Term, { term: 'receptor_occupancy', subtle: true }, 'RO threshold') },
                h(InputNumber, { min: 0.01, max: 0.5, step: 0.01, value: inputs.ro_threshold, style: { width: '100%' },
                  onChange: function(v) { setInput('ro_threshold', v); } }))
            )
          ) : null
        )
      )
    );
  }

  function renderDerived() {
    var fSources = function(formId) {
      return [
        { kind: 'GLP study', id: inputs.glp_study_id || '—',
          summary: inputs.species + ' ' + (inputs.noael_mg_kg) + ' mg/kg' },
        { kind: 'Math kernel', id: window.DOSE_MATH_KERNEL_VERSION,
          summary: 'Allometric scaling (FDA 2005) + MABEL (EMA 2017)' },
      ];
    };
    var formulaById = {};
    result.formulas.forEach(function(f) { formulaById[f.id] = f; });

    return h('div', { className: 'panel' },
      h('div', { className: 'panel-header' },
        h('span', { className: 'panel-title' }, 'Derived FIH dose recommendation'),
        h(Tag, { color: result.controlling_method === 'MABEL' ? 'blue' : 'purple' },
          result.controlling_method + '-controlled')),
      h('div', { className: 'panel-body' },
        h('div', { className: 'dose-card' },
          h('div', { className: 'dose-card-label' }, 'Recommended starting dose'),
          h('div', { className: 'dose-card-value' },
            h(TraceVal, { id: 'fih_dose', value: result.fih_dose_mg, unit: 'mg', size: 'lg',
              formula: result.controlling_method === 'MABEL'
                ? formulaById.mabel_dose && formulaById.mabel_dose.formula
                : formulaById.mrsd_total && formulaById.mrsd_total.formula,
              citation: result.controlling_method === 'MABEL' ? 'EMA 2017 §4.4' : 'FDA 2005',
              sources: fSources('fih_dose'), kernel_version: result.kernel_version })),
          h('div', { className: 'dose-card-sub' }, result.rationale)
        ),

        h('div', { className: 'derived-grid' },
          h('div', { className: 'derived-cell' },
            h('div', { className: 'derived-label' }, h(Term, { term: 'hed', subtle: true }, 'HED')),
            h('div', { className: 'derived-val' },
              h(TraceVal, { id: 'hed', value: result.hed_mg_per_kg, unit: 'mg/kg',
                formula: formulaById.hed && formulaById.hed.formula,
                citation: 'FDA 2005 §4', sources: fSources('hed') })),
            h('div', { className: 'derived-sub' }, formulaById.scaling && ('scaling × ' + formulaById.scaling.value))
          ),
          h('div', { className: 'derived-cell' },
            h('div', { className: 'derived-label' }, h(Term, { term: 'mrsd', subtle: true }, 'MRSD')),
            h('div', { className: 'derived-val' },
              h(TraceVal, { id: 'mrsd', value: result.mrsd_mg, unit: 'mg',
                formula: formulaById.mrsd_total && formulaById.mrsd_total.formula,
                citation: 'FDA 2005 §5', sources: fSources('mrsd') })),
            h('div', { className: 'derived-sub' }, result.mrsd_mg_per_kg + ' mg/kg × ' + inputs.human_bw_kg + ' kg')
          ),
          inputs.modality === 'biologic' ? h('div', { className: 'derived-cell' },
            h('div', { className: 'derived-label' }, h(Term, { term: 'mabel', subtle: true }, 'MABEL')),
            h('div', { className: 'derived-val' },
              h(TraceVal, { id: 'mabel', value: result.mabel_dose_mg, unit: 'mg',
                formula: formulaById.mabel_dose && formulaById.mabel_dose.formula,
                citation: 'EMA 2017 §4.4', sources: fSources('mabel') })),
            h('div', { className: 'derived-sub' }, '@ ' + (inputs.ro_threshold * 100) + '% RO')
          ) : null,
          result.exposure_margin ? h('div', { className: 'derived-cell' },
            h('div', { className: 'derived-label' }, h(Term, { term: 'exposure_margin', subtle: true }, 'Exposure margin')),
            h('div', { className: 'derived-val' },
              h(TraceVal, { id: 'exposure_margin', value: result.exposure_margin, unit: '× vs NOAEL',
                formula: formulaById.exposure_margin && formulaById.exposure_margin.formula,
                citation: 'ICH M3(R2) §3.1', sources: fSources('exposure_margin') })),
            h('div', { className: 'derived-sub' }, 'NOAEL AUC ' + inputs.noael_auc + ' ÷ projected')
          ) : null
        )
      )
    );
  }

  function renderWalkthrough() {
    return h('div', { className: 'panel' },
      h('div', { className: 'panel-header' },
        h('span', { className: 'panel-title' },
          h(Term, { term: 'allometric', subtle: true }, 'Math walkthrough'),
          h('span', { style: { marginLeft: 8, fontSize: 12, color: '#7F8385', fontWeight: 400 } },
            'Reviewable arithmetic — every step shown with formula and citation'))),
      h('div', { className: 'panel-body' },
        h('ol', { className: 'math-walkthrough' },
          result.formulas.map(function(f) {
            return h('li', { key: f.id },
              h('div', { className: 'mw-label' }, f.label,
                f.unit ? h('span', { className: 'mw-unit' }, ' (' + f.unit + ')') : null),
              h('div', { className: 'mw-formula' }, f.formula),
              f.citation ? h('div', { className: 'mw-citation' }, f.citation) : null
            );
          })
        ),
        h('div', { className: 'mw-citations' },
          'Citations: ', result.citations.join(' · '))
      )
    );
  }

  function renderSweepSeam() {
    if (!sweepRunId) {
      return h('div', { className: 'sweep-seam-empty' },
        h('span', null, 'No translatability sweep attached. '),
        h('a', { href: '#', onClick: function(e) { e.preventDefault(); props.onJumpToSweep && props.onJumpToSweep(); } },
          'Run a sweep to populate bridging evidence →'));
    }
    return h('div', { className: 'sweep-seam' },
      h('span', { className: 'sweep-seam-label' }, 'Bridging evidence'),
      h('span', { className: 'sweep-run-id' }, sweepRunId),
      h(Button, { size: 'small', type: 'link',
        onClick: function() { props.onJumpToSweep && props.onJumpToSweep(); } }, 'View sweep'),
      h('span', { style: { marginLeft: 'auto', fontSize: 12, color: '#28A464' } },
        '✓ Sensitivity envelope will populate the dose justification document'));
  }

  return h('div', null,
    h('div', { className: 'stats-row' },
      h(StatCard, { label: h(Term, { term: 'compound', subtle: true }, 'Compound'),
        value: pk.compound, color: 'primary', sub: pk.indication }),
      h(StatCard, { label: h(Term, { term: 'pkpd', subtle: true }, 'Lead PD biomarker'),
        value: pk.lead_pd_biomarker, color: 'info' }),
      h(StatCard, { label: h(Term, { term: 'fih', subtle: true }, 'FIH starting dose'),
        value: h(TraceVal, { id: 'fih_dose_stat', value: result.fih_dose_mg, unit: 'mg',
          formula: 'Lower of MRSD ' + result.mrsd_mg + ' mg and MABEL ' + (result.mabel_dose_mg || '—') + ' mg' }),
        sub: result.controlling_method + '-controlled', color: 'primary' }),
      h(StatCard, { label: h(Term, { term: 'noael', subtle: true }, 'NOAEL'),
        value: inputs.noael_mg_kg + ' mg/kg',
        sub: inputs.species + ' · ' + (inputs.glp_study_id || 'GLP'), color: 'danger' }),
      h(StatCard, { label: h(Term, { term: 'exposure_margin', subtle: true }, 'Exposure margin'),
        value: (result.exposure_margin || '—') + (result.exposure_margin ? '×' : ''),
        sub: 'vs NOAEL AUC', color: 'success' })
    ),

    renderSweepSeam(),

    h('div', { className: 'two-col' },
      renderInputs(),
      renderDerived()
    ),

    renderWalkthrough(),

    h('div', { className: 'panel' },
      h('div', { className: 'panel-header' },
        h('span', { className: 'panel-title' }, 'Exposure–response (' + inputs.species + ')')),
      h('div', { className: 'panel-body' }, h('div', { ref: chartRef, className: 'chart-box' }))
    ),

    h('div', { className: 'export-row' },
      h(Space, null,
        h(Button, { type: 'primary', loading: exporting, onClick: draftAndExport },
          'Export FIH dose justification (.docx)'),
        h(Button, { onClick: function() { setPickerOpen(true); } },
          'Run sensitivity sweep')
      ),
      h('div', { className: 'compute-hint' },
        'Document includes: cover, executive summary, study basis, allometric walkthrough, MABEL cross-check, ' +
        'sensitivity envelope, safety panel, and audit chain. Cites FDA 2005, EMA 2017, ICH M3(R2).')
    ),

    h(ClusterPicker, {
      open: pickerOpen,
      onClose: function() { setPickerOpen(false); },
      workflowLabel: 'Run bridging & sensitivity analysis'
    })
  );
}

// ---------- Page 4: IND Package ----------

function IndPackagePage(props) {
  var pkg = props.pkg;
  var evidenceState = props.evidenceState || {};

  // Status is derived from attached evidence — the user cannot toggle it.
  function statusOf(item) {
    return (window.checklistStatus || function(){ return 'not_started'; })(item, evidenceState);
  }

  // Aggregate counts across in-scope items only.
  var inScope = pkg.sections.filter(function(s) { return s.scope !== 'external'; });
  var doneCount = inScope.filter(function(s) { return statusOf(s) === 'done'; }).length;
  var inProgressCount = inScope.filter(function(s) { return statusOf(s) === 'in_progress'; }).length;
  var notStartedCount = inScope.filter(function(s) { return statusOf(s) === 'not_started'; }).length;
  var pct = Math.round(100 * doneCount / Math.max(1, inScope.length));

  function renderEvidence(s) {
    if (s.evidence) {
      return h('div', { className: 'evidence-row' },
        h(Tag, { color: 'green' }, s.evidence.type),
        h('span', { className: 'evidence-id' }, s.evidence.id),
        h('span', { className: 'evidence-summary' }, s.evidence.summary));
    }
    if (s.evidence_required) {
      var attached = evidenceState[s.key];
      if (attached) {
        return h('div', { className: 'evidence-row' },
          h(Tag, { color: 'green' }, attached.type),
          h('span', { className: 'evidence-id' }, attached.id),
          h('span', { className: 'evidence-summary' }, attached.summary));
      }
      return h('div', { className: 'evidence-empty' },
        'No evidence attached. Required: ', h('code', null, s.evidence_required),
        h(Button, { size: 'small', type: 'link',
          onClick: function() { props.onAttach && props.onAttach(s.key, s.evidence_required); } },
          'Attach evidence'));
    }
    if (s.sub) {
      return h('ul', { className: 'sub-checklist' },
        s.sub.map(function(sub) {
          var done = !!sub.evidence;
          return h('li', { key: sub.key },
            h('span', { className: 'checklist-icon ' + (done ? 'done' : 'pending') }),
            h('span', { className: 'sub-title' }, sub.title),
            sub.evidence ? h('span', { className: 'sub-evidence' },
              h(Tag, { color: 'geekblue' }, sub.evidence.type),
              sub.evidence.id, ' · ', sub.evidence.summary) :
              h('span', { className: 'sub-empty' }, 'No evidence yet')
          );
        }));
    }
    return null;
  }

  function statusBadge(s) {
    var status = statusOf(s);
    if (s.scope === 'external')   return h(Tag, null, 'External');
    if (status === 'done')        return h(Tag, { color: 'green' }, 'Done');
    if (status === 'in_progress') return h(Tag, { color: 'gold' }, 'In progress');
    return h(Tag, null, 'Not started');
  }

  return h('div', null,
    h('div', { className: 'stats-row' },
      h(StatCard, { label: 'Compound', value: pkg.compound, color: 'primary' }),
      h(StatCard, { label: 'Target submission', value: pkg.target_ind_submission, color: 'info',
        sub: pkg.cfr_reference }),
      h(StatCard, { label: 'In-scope sections done', value: doneCount + ' / ' + inScope.length,
        color: 'success', sub: pct + '% ready' }),
      h(StatCard, { label: 'In progress', value: inProgressCount, color: 'warning' }),
      h(StatCard, { label: 'Not started', value: notStartedCount, color: 'danger' })
    ),

    h('div', { className: 'panel' },
      h('div', { className: 'panel-header' },
        h('span', { className: 'panel-title' },
          h(Term, { term: 'ind_package', subtle: true }, 'IND package'),
          ' — ', h(Term, { term: 'cfr_312', subtle: true }, '21 CFR §312.23')),
        h(Space, null,
          h(Tooltip, { title: h(Term, { term: 'briefing_doc' }, 'Pre-IND briefing doc') },
            h(Button, { onClick: function() { props.onJumpToPKPD && props.onJumpToPKPD(); } },
              'Export FIH dose justification')),
          h(Button, { type: 'primary', onClick: function() { props.onGenerate && props.onGenerate(); } },
            'Open IND package'))
      ),
      h('div', { className: 'panel-body' },
        h('div', { className: 'checklist-legend' },
          h('span', null, h(Tag, { color: 'green' }, 'In scope · IND Forge'), ' authored here'),
          h('span', null, h(Tag, null, 'External'), ' authored elsewhere — shown for context')),
        h('ul', { className: 'checklist v2' },
          pkg.sections.map(function(s) {
            var status = statusOf(s);
            var iconCls = status === 'done' ? 'done' : status === 'in_progress' ? 'warn' : 'pending';
            return h('li', { key: s.key, className: 'checklist-item ' + (s.scope === 'external' ? 'is-external' : 'is-in-scope') },
              h('div', { className: 'checklist-row' },
                h('span', { className: 'checklist-icon ' + iconCls }),
                h('div', { style: { flex: 1 } },
                  h('div', { className: 'checklist-title' },
                    s.title,
                    h('span', { className: 'cfr-ref' }, s.cfr)),
                  h('div', { className: 'checklist-sub' }, s.note)),
                statusBadge(s)
              ),
              s.scope === 'external' ? null : h('div', { className: 'checklist-evidence' }, renderEvidence(s))
            );
          })
        )
      )
    )
  );
}

// ---------- Compute Cluster Picker (on-prem SLURM showcase) ----------
//
// This is the workflow that highlights Domino's new on-prem SLURM capability.
// The science: species-bridging + bootstrap PK/PD sensitivity sweep — a genuinely
// parallel HPC workload that benefits from SLURM array jobs. The business case
// for on-prem: animal omics + GLP tox data is often IP/IT-restricted to stay
// behind the firewall, so being able to target an on-prem cluster from inside
// Domino (without punching data out to a cloud cluster) is the differentiator.
//
// Clusters listed reflect a realistic pharma setup: on-prem SLURM as default,
// with cloud EKS/GKE as fallbacks.

var COMPUTE_CLUSTERS = [
  { id: 'slurm-onprem',    name: 'Cambridge HPC (On-Prem SLURM)',  type: 'slurm',   location: 'On-Prem · Cambridge',
    recommended: true,
    badge: 'On-prem · SLURM',
    partitions: ['cpu-long', 'cpu-short', 'gpu-a100'],
    nodes_available: 142, nodes_total: 256,
    cost_note: 'No egress · already paid-for capacity',
    compliance: ['Animal-omics data residency', 'Internal IT approved', 'GLP audit chain preserved'],
    why_this: 'Preclinical omics is restricted to on-prem storage. Run the sweep where the data already lives.',
  },
  { id: 'slurm-nj',    name: 'NJ Research HPC (On-Prem SLURM)', type: 'slurm',   location: 'On-Prem · New Jersey',
    badge: 'On-prem · SLURM',
    partitions: ['cpu-xlarge', 'gpu-h100'],
    nodes_available: 38, nodes_total: 96,
    cost_note: 'No egress',
    compliance: ['Animal-omics data residency', 'Internal IT approved'],
    why_this: 'Secondary on-prem option if Cambridge queue is saturated.',
  },
  { id: 'ray-domino',  name: 'Domino-managed Ray cluster', type: 'ray',     location: 'Cloud · us-east-1',
    partitions: ['default'],
    nodes_available: 16, nodes_total: 32,
    cost_note: '$0.42/node-hr (on-demand)',
    compliance: ['Public omics only — data-transfer review required for preclinical'],
    why_this: 'Use only if on-prem is offline; requires data-transfer approval for animal omics.',
  },
  { id: 'eks-aws',     name: 'AWS EKS (us-east-1)',        type: 'k8s',     location: 'Cloud · AWS',
    partitions: ['spot-m5', 'gpu-g5'],
    nodes_available: null, nodes_total: null,
    cost_note: '$0.38/node-hr + egress',
    compliance: ['Data-transfer review required'],
    why_this: 'Burst capacity; incurs egress.',
  },
];

function ClusterBadge(props) {
  var c = props.cluster;
  var color = c.type === 'slurm' ? '#543FDE' : c.type === 'ray' ? '#0070CC' : '#65657B';
  return h('span', { style: { display: 'inline-block', background: color, color: '#FFF', fontSize: 10, fontWeight: 700,
    padding: '2px 7px', borderRadius: 3, letterSpacing: '0.04em', textTransform: 'uppercase' } }, c.badge || c.type);
}

function ClusterPicker(props) {
  var open = props.open;
  var onClose = props.onClose;
  var workflowLabel = props.workflowLabel || 'Job';
  // Optional: caller takes over post-submit UI (e.g. SweepPage shows progress
  // page instead of the in-modal success state).
  var onSubmitted = props.onSubmitted;
  var customDescription = props.description;
  var bootstrapDefault = props.bootstrapDefault || 64;
  var bootstrapMax = props.bootstrapMax || 1024;
  var hideBootstraps = !!props.hideBootstraps;
  var onClusterChange = props.onClusterChange;

  // Controlled mode: parent owns clusterId. Falls back to internal state otherwise.
  var _c = useState(props.initialClusterId || 'slurm-onprem');
  var internalClusterId = _c[0];
  var setInternalClusterId = _c[1];
  var clusterId = props.clusterId != null ? props.clusterId : internalClusterId;
  function setClusterId(id) {
    if (props.clusterId == null) setInternalClusterId(id);
    if (onClusterChange) onClusterChange(id);
  }

  var _n = useState(bootstrapDefault);
  var bootstraps = _n[0];
  var setBootstraps = _n[1];

  var _s = useState('idle'); // idle | submitting | submitted
  var submitState = _s[0];
  var setSubmitState = _s[1];

  var _j = useState(null);
  var job = _j[0];
  var setJob = _j[1];

  var selected = COMPUTE_CLUSTERS.find(function(c) { return c.id === clusterId; }) || COMPUTE_CLUSTERS[0];

  function submit() {
    dlog('INFO', 'Submitting ' + workflowLabel + ' to ' + selected.name);
    setSubmitState('submitting');
    setTimeout(function() {
      var id = 'JOB-' + Math.floor(100000 + Math.random() * 900000);
      var partition = selected.partitions[0];
      var queued = { id: id, cluster: selected, workflow: workflowLabel, bootstraps: bootstraps,
        partition: partition, submitted_at: new Date().toISOString() };
      dlog('INFO', 'Job ' + id + ' queued on ' + selected.name + ' / ' + partition);
      if (onSubmitted) {
        // Caller drives post-submit UI; reset and close immediately.
        setSubmitState('idle');
        onSubmitted(queued);
        return;
      }
      setJob(queued);
      setSubmitState('submitted');
    }, 600);
  }

  function close() {
    setSubmitState('idle');
    setJob(null);
    onClose();
  }

  var body;
  if (submitState === 'submitted' && job) {
    body = h('div', null,
      h(Alert, { type: 'success', showIcon: true,
        message: 'Job ' + job.id + ' submitted',
        description: h('div', null,
          h('div', null, workflowLabel + ' queued on ', h('strong', null, job.cluster.name)),
          h('div', { style: { marginTop: 4, fontSize: 12, color: '#65657B' } },
            'Partition: ', h('code', null, job.partition), ' · ',
            'Bootstraps: ', job.bootstraps, ' · ',
            'Submitted: ', job.submitted_at.split('T')[1].slice(0,8), ' UTC')
        )
      }),
      h('div', { style: { marginTop: 16, padding: 14, background: '#F8F7FF', borderRadius: 6, border: '1px solid #E4E0FF' } },
        h('div', { style: { fontSize: 12, color: '#1820A0', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' } }, 'Why this matters'),
        h('p', { style: { margin: '6px 0 0', fontSize: 13, color: '#3F4547' } },
          'Preclinical omics + GLP tox data stays on-prem. The sensitivity sweep runs where the data already lives — no egress, no data-transfer review, and the GLP audit chain is preserved end-to-end. ',
          'This is the workflow enabled by Domino\u2019s new on-prem SLURM integration.'))
    );
  } else {
    body = h('div', null,
      h(Alert, { type: 'info', showIcon: true, style: { marginBottom: 16 },
        message: 'Choose where to run this workload',
        description: customDescription || ('Your animal-omics and GLP tox data is restricted to on-prem storage. ' +
          'On-prem SLURM is recommended — no egress, no data-transfer review.')
      }),

      h('div', { className: 'cluster-list' },
        COMPUTE_CLUSTERS.map(function(c) {
          var sel = c.id === clusterId;
          return h('div', {
            key: c.id,
            className: 'cluster-card' + (sel ? ' selected' : ''),
            onClick: function() { setClusterId(c.id); }
          },
            h('div', { className: 'cluster-card-top' },
              h(Radio, { checked: sel, onChange: function() { setClusterId(c.id); } }),
              h('div', { className: 'cluster-card-title' },
                h('span', { className: 'cluster-name' }, c.name),
                h(ClusterBadge, { cluster: c }),
                c.recommended ? h('span', { className: 'cluster-recommended' }, 'Recommended') : null
              )
            ),
            h('div', { className: 'cluster-card-body' },
              h('div', { className: 'cluster-card-row' },
                h('span', { className: 'ccl-k' }, 'Location'),
                h('span', { className: 'ccl-v' }, c.location)),
              h('div', { className: 'cluster-card-row' },
                h('span', { className: 'ccl-k' }, 'Capacity'),
                h('span', { className: 'ccl-v' },
                  c.nodes_available != null
                    ? (c.nodes_available + ' / ' + c.nodes_total + ' nodes free')
                    : 'autoscale')),
              h('div', { className: 'cluster-card-row' },
                h('span', { className: 'ccl-k' }, 'Partitions'),
                h('span', { className: 'ccl-v' },
                  c.partitions.map(function(p, i) {
                    return h(Tag, { key: i, style: { marginRight: 4 } }, p);
                  }))),
              h('div', { className: 'cluster-card-row' },
                h('span', { className: 'ccl-k' }, 'Cost'),
                h('span', { className: 'ccl-v' }, c.cost_note)),
              h('div', { className: 'cluster-card-row' },
                h('span', { className: 'ccl-k' }, 'Compliance'),
                h('span', { className: 'ccl-v' },
                  c.compliance.map(function(x, i) {
                    return h('span', { key: i, className: 'status-flag ' + (c.type === 'slurm' ? 'success' : 'warning'), style: { marginRight: 4 } }, x);
                  }))),
              h('div', { className: 'cluster-why' }, c.why_this)
            )
          );
        })
      ),

      h('div', { style: { marginTop: 18, display: 'flex', gap: 18, alignItems: 'center' } },
        hideBootstraps ? null : h('div', null,
          h('div', { className: 'cluster-param-label' }, 'Bootstraps (sensitivity runs)'),
          h(InputNumber, { min: 16, max: bootstrapMax, step: 16, value: bootstraps, onChange: setBootstraps })
        ),
        h('div', { className: 'cluster-estimate' },
          'Est. wall-clock on ', h('strong', null, selected.name.split(' (')[0]), ': ',
          h('strong', null, Math.max(3, Math.round((hideBootstraps ? bootstrapDefault : bootstraps) * (selected.type === 'slurm' ? 0.08 : 0.15))) + ' min'))
      )
    );
  }

  return h(Modal, {
    title: workflowLabel,
    open: open,
    onCancel: close,
    width: 760,
    footer: submitState === 'submitted' ? [
      h(Button, { key: 'close', type: 'primary', onClick: close }, 'Close')
    ] : [
      h(Button, { key: 'cancel', onClick: close }, 'Cancel'),
      h(Button, { key: 'submit', type: 'primary', loading: submitState === 'submitting', onClick: submit },
        'Submit to ' + ({ slurm: 'SLURM', ray: 'Ray', k8s: 'Kubernetes' }[selected.type] || selected.type))
    ],
  }, body);
}

// ---------- Root App ----------

function App() {
  var _c = useState(false);
  var connected = _c[0];
  var setConnected = _c[1];

  var _u = useState(true);
  var useDummy = _u[0];
  var setUseDummy = _u[1];

  // Route scoping: ?app=ind-forge hides Candidates (Biomarker Forge surface).
  // The keynote opens with ?app=ind-forge so the seam between discovery and
  // IND-enabling work reads cleanly. Default route also scopes to IND Forge
  // since this is the IND Forge app; Biomarker Forge will live separately.
  var _route = useState((function() {
    try { return new URLSearchParams(window.location.search).get('app') || 'ind-forge'; }
    catch (e) { return 'ind-forge'; }
  })());
  var routeApp = _route[0];

  var defaultTab = routeApp === 'biomarker-forge' ? 'candidates' : 'sweep';
  var _tab = useState(defaultTab);
  var activeTab = _tab[0];
  var setActiveTab = _tab[1];

  // Tracks the most recently completed sweep run id — feeds the PK/PD seam.
  var _sweep = useState(null);
  var lastSweepId = _sweep[0];
  var setLastSweepId = _sweep[1];

  // IND Package browser modal state
  var _pkgOpen = useState(false);
  var pkgOpen = _pkgOpen[0]; var setPkgOpen = _pkgOpen[1];
  var _pkgManifest = useState(null);
  var pkgManifest = _pkgManifest[0]; var setPkgManifest = _pkgManifest[1];

  function generateIndPackage() {
    setPkgOpen(true);
    setPkgManifest(null);
    fetch('api/ind/package/generate', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ compound_id: 'INDF-127', sweep_id: lastSweepId, dose_inputs: {} }),
    }).then(function(r) { return r.ok ? r.json() : Promise.reject(r); })
      .then(function(m) {
        setPkgManifest(m);
        setEvidenceState(Object.assign({}, evidenceState, {
          fih_dose: { type: 'package', id: m.package_id,
                      summary: 'IND package · ' + m.sections.filter(function(s){return s.scope==='in_scope';}).length + ' sections in-scope · snapshot ' + m.snapshot_id },
        }));
      })
      .catch(function(err) { dlog('ERROR', 'IND package generate failed: ' + (err && err.message)); });
  }

  // Evidence state for the IND Package checklist. Starts empty for "in
  // progress" items; gets populated as the user completes upstream work.
  var _ev = useState({});
  var evidenceState = _ev[0];
  var setEvidenceState = _ev[1];

  // data state
  var _dc = useState(MOCK_CANDIDATES);
  var candidates = _dc[0];
  var setCandidates = _dc[1];

  var _ds = useState(MOCK_TOX_STUDIES);
  var studies = _ds[0];

  var _do = useState(MOCK_TOX_OVERLAP);
  var overlap = _do[0];

  var _dk = useState(MOCK_PKPD);
  var pkpd = _dk[0];

  var _di = useState(MOCK_IND_PACKAGE);
  var indPkg = _di[0];

  var _sw = useState(MOCK_SWEEP_COHORTS);
  var sweepCohorts = _sw[0];
  var setSweepCohorts = _sw[1];

  // On mount: probe live data; fall back to dummy silently.
  useEffect(function() {
    dlog('INFO', 'App mounted');
    // Collapse the fixed boot-debug overlay since the React accordion now owns it.
    var boot = document.getElementById('boot-debug');
    if (boot) boot.style.display = 'none';

    apiGet('api/context').then(function(ctx) {
      dlog('INFO', 'context: ' + JSON.stringify(ctx));
    }).catch(function() {});

    apiGet('api/sweep/cohorts').then(function(data) {
      if (data && data.cohorts && data.cohorts.length) setSweepCohorts(data.cohorts);
    }).catch(function() { /* keep mock */ });

    // Skip the candidates probe on the IND Forge route — Candidates tab
    // is hidden there, so the 503 is just noise.
    if (routeApp !== 'ind-forge') {
      apiGet('api/candidates').then(function(data) {
        setConnected(true);
        setUseDummy(false);
        if (data && data.length) setCandidates(data);
        dlog('INFO', 'live candidates loaded: ' + (data && data.length ? data.length : 0));
      }).catch(function() {
        setConnected(false);
        setUseDummy(true);
        dlog('WARN', 'live /api/candidates unavailable — showing dummy data');
      });
    }
  }, []);

  function onToggleDummy(v) {
    setUseDummy(v);
    if (v) {
      setCandidates(MOCK_CANDIDATES);
    } else {
      apiGet('api/candidates').then(function(data) {
        if (data && data.length) setCandidates(data);
      }).catch(function() { setUseDummy(true); });
    }
  }

  // Hide Candidates when on the IND Forge route (it's biomarker-discovery
  // work, owned by Biomarker Forge). Keep the code in place so the
  // Biomarker Forge route can still render it.
  // Tab labels carry hover glossary tips for non-experts.
  var tabLabel = function(text, term) {
    return h(Term, { term: term, subtle: true, placement: 'bottom' }, text);
  };
  var allTabs = [
    { key: 'candidates', label: 'Candidates' },
    { key: 'safety',     label: tabLabel('Safety & Tox', 'glp') },
    { key: 'sweep',      label: tabLabel('Translatability Sweep', 'translatability') },
    { key: 'pkpd',       label: tabLabel('PK/PD & FIH Dose', 'pkpd') },
    { key: 'ind',        label: tabLabel('IND Package', 'ind_package') },
  ];
  var tabs = routeApp === 'ind-forge'
    ? allTabs.filter(function(t) { return t.key !== 'candidates'; })
    : allTabs;

  function onSweepCompleted(runId) { setLastSweepId(runId); }
  function onAttachEvidence(itemKey, kind) {
    // Walk-up affordance: jumping to the right tab is the way to attach
    // evidence. The IND Package can't generate it itself.
    if (kind === 'sweep_run') setActiveTab('sweep');
    else if (kind === 'dose_justification_doc') setActiveTab('pkpd');
  }
  // Auto-attach evidence as upstream artifacts come into existence.
  useEffect(function() {
    if (lastSweepId && !evidenceState.translational) {
      setEvidenceState(Object.assign({}, evidenceState, {
        translational: { type: 'sweep_run', id: lastSweepId,
          summary: 'Multi-omics sweep · 8 candidates · 95% bootstrap CI · on-prem SLURM' },
      }));
    }
  }, [lastSweepId]);

  var body =
    activeTab === 'candidates' ? h(CandidatesPage, { candidates: candidates }) :
    activeTab === 'safety'     ? h(SafetyPage,     { overlap: overlap, studies: studies }) :
    activeTab === 'sweep'      ? h(SweepPage,      { cohorts: sweepCohorts, onCompleted: onSweepCompleted }) :
    activeTab === 'pkpd'       ? h(PKPDPage,       { pkpd: pkpd, sweepRunId: lastSweepId,
                                                     onJumpToSweep: function() { setActiveTab('sweep'); },
                                                     onExported: function(docId) {
                                                       setEvidenceState(Object.assign({}, evidenceState, {
                                                         fih_dose: { type: 'document', id: docId, summary: 'FIH dose justification (.docx) · FDA 2005 + EMA 2017 + ICH M3(R2)' },
                                                         pre_ind:  { type: 'document', id: docId, summary: 'Pre-IND briefing-book paragraph (Pharm/Tox)' },
                                                       }));
                                                     } }) :
                                  h(IndPackagePage, { pkg: indPkg, evidenceState: evidenceState,
                                                       onAttach: onAttachEvidence,
                                                       onJumpToPKPD: function() { setActiveTab('pkpd'); },
                                                       onGenerate: generateIndPackage });

  return h(ConfigProvider, { theme: dominoTheme },
    h('div', { className: 'app-layout-no-topnav' },
      h('div', { className: 'main-content' },
        h('div', { className: 'search-card' },
          h('div', { className: 'search-card-identity' },
            h('span', { className: 'app-title' }, 'IND Forge'),
            h('span', { className: 'app-subtitle' },
              'Preclinical → IND-enabling: NOAEL · HED · MABEL · 21 CFR §312.23 (a)(8) Pharm/Tox')
          ),
          h('div', { className: 'search-card-controls' },
            h('div', { className: 'dummy-data-toggle' },
              h('span', null, 'Dummy data'),
              h(Switch, { checked: useDummy, onChange: onToggleDummy, size: 'small' })
            ),
            h(Button, { onClick: generateIndPackage }, 'Generate IND package')
          )
        ),

        routeApp === 'ind-forge' ? h(ProgramContext, { pkpd: pkpd, pkg: indPkg }) : null,

        h(Tabs, {
          className: 'section-tabs',
          activeKey: activeTab,
          onChange: function(k) { dlog('INFO', 'tab: ' + k); setActiveTab(k); },
          items: tabs,
        }),

        body,

        h(IndPackageBrowser, {
          open: pkgOpen,
          onClose: function() { setPkgOpen(false); },
          manifest: pkgManifest,
        }),

        h(AuditLineageDrawer),
        h(DebugAccordion)
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(h(App));
