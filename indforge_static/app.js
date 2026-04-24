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

function apiGet(path) {
  dlog('INFO', 'GET ' + path);
  return fetch(path).then(function(r) {
    dlog('INFO', 'GET ' + path + ' → ' + r.status);
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
  var chartRef = useRef(null);

  useEffect(function() {
    if (!chartRef.current) return;
    if (!Highcharts.seriesTypes || !Highcharts.seriesTypes.heatmap) {
      dlog('ERROR', 'Highcharts heatmap module not loaded — Safety & Tox chart skipped');
      chartRef.current.innerHTML = '<div style="padding:40px;text-align:center;color:#C20A29">Heatmap module failed to load. Chart unavailable; table below still works.</div>';
      return;
    }
    var series = [];
    for (var i = 0; i < overlap.candidates.length; i++) {
      for (var j = 0; j < overlap.organs.length; j++) {
        series.push([j, i, overlap.matrix[i][j]]);
      }
    }
    try {
    Highcharts.chart(chartRef.current, {
      chart: { type: 'heatmap', height: 340 },
      title: { text: null },
      xAxis: { categories: overlap.organs, title: null },
      yAxis: { categories: overlap.candidates, title: null, reversed: true },
      colorAxis: { min: 0, max: 1, minColor: '#F5F3FF', maxColor: '#C20A29' },
      legend: { align: 'right', layout: 'vertical', verticalAlign: 'middle' },
      tooltip: {
        formatter: function() {
          return '<b>' + this.series.yAxis.categories[this.point.y] + '</b><br/>' +
            this.series.xAxis.categories[this.point.x] + ': ' + (this.point.value * 100).toFixed(0) + '%';
        }
      },
      series: [{
        name: 'Overlap',
        data: series,
        dataLabels: { enabled: true, color: '#3F4547',
          formatter: function() { return (this.point.value * 100).toFixed(0); } },
      }],
      credits: { enabled: false }
    });
    } catch (e) {
      dlog('ERROR', 'Heatmap render failed: ' + (e && e.message));
      chartRef.current.innerHTML = '<div style="padding:40px;text-align:center;color:#C20A29">Chart render failed: ' + (e && e.message) + '</div>';
    }
  }, [overlap]);

  var flaggedCount = 0;
  for (var i = 0; i < overlap.matrix.length; i++) {
    for (var j = 0; j < overlap.matrix[i].length; j++) {
      if (overlap.matrix[i][j] >= 0.8) { flaggedCount++; break; }
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
      h(StatCard, { label: 'High-overlap flags', value: flaggedCount, color: 'danger', sub: 'overlap ≥ 0.8' }),
      h(StatCard, { label: 'GLP studies ingested', value: studies.filter(function(s) { return s.glp; }).length, color: 'success' })
    ),

    h('div', { className: 'panel' },
      h('div', { className: 'panel-header' }, h('span', { className: 'panel-title' }, 'Organ-tox signature overlap (candidate × organ)')),
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

// ---------- Page 3: PK/PD & FIH Dose ----------

function PKPDPage(props) {
  var pk = props.pkpd;
  var chartRef = useRef(null);
  var _cp = useState(false);
  var pickerOpen = _cp[0];
  var setPickerOpen = _cp[1];

  useEffect(function() {
    if (!chartRef.current) return;
    var data = pk.points.map(function(p) { return [p.auc, p.response]; });
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
          { value: pk.noael_auc, color: '#C20A29', dashStyle: 'Dash', width: 1,
            label: { text: 'NOAEL', style: { color: '#C20A29' } } },
        ]
      },
      yAxis: { title: { text: pk.lead_pd_biomarker + ' fold-change' } },
      legend: { enabled: false },
      series: [
        { type: 'spline', name: 'Emax fit', data: data, color: '#543FDE', marker: { radius: 5 } }
      ],
      credits: { enabled: false }
    });
    } catch (e) {
      dlog('ERROR', 'PK/PD render failed: ' + (e && e.message));
      chartRef.current.innerHTML = '<div style="padding:40px;text-align:center;color:#C20A29">Chart render failed: ' + (e && e.message) + '</div>';
    }
  }, [pk]);

  return h('div', null,
    h('div', { className: 'stats-row' },
      h(StatCard, { label: 'Compound', value: pk.compound, color: 'primary' }),
      h(StatCard, { label: 'Lead PD biomarker', value: pk.lead_pd_biomarker, color: 'info' }),
      h(StatCard, { label: 'EC50 (AUC)', value: pk.ec50_auc, sub: 'ng·h/mL' }),
      h(StatCard, { label: 'NOAEL (AUC)', value: pk.noael_auc, sub: pk.species + ' · GLP', color: 'danger' }),
      h(StatCard, { label: 'Exposure margin', value: pk.exposure_margin_vs_noael + '×', sub: 'vs NOAEL', color: 'success' })
    ),

    h('div', { className: 'two-col' },
      h('div', { className: 'panel' },
        h('div', { className: 'panel-header' }, h('span', { className: 'panel-title' }, 'Exposure–response (' + pk.species + ')')),
        h('div', { className: 'panel-body' }, h('div', { ref: chartRef, className: 'chart-box' }))
      ),

      h('div', { className: 'panel' },
        h('div', { className: 'panel-header' }, h('span', { className: 'panel-title' }, 'FIH dose recommendation')),
        h('div', { className: 'panel-body' },
          h('div', { className: 'dose-card' },
            h('div', { className: 'dose-card-label' }, 'Projected starting dose'),
            h('div', { className: 'dose-card-value' }, pk.projected_fih_starting_dose_mg + ' mg'),
            h('div', { className: 'dose-card-sub' }, pk.projected_fih_starting_dose_rationale)
          ),
          h('div', { style: { marginTop: 16 } },
            h(Alert, {
              type: 'info', showIcon: true,
              message: 'Auto-generated from NHP NOAEL with allometric scaling (HED), cross-checked against MABEL (10% receptor occupancy).',
            })
          ),
          h('div', { style: { marginTop: 16 } },
            h(Space, null,
              h(Button, { type: 'primary' }, 'Export dose justification'),
              h(Button, { icon: '⚡', onClick: function() { setPickerOpen(true); } },
                'Run bridging & sensitivity analysis')
            ),
            h('div', { className: 'compute-hint' },
              'Parallel species-bridging + PK/PD bootstrap. Targets on-prem SLURM by default — animal omics stays behind the firewall.')
          )
        )
      )
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
  var doneCount = pkg.sections.filter(function(s) { return s.status === 'done'; }).length;
  var pendingCount = pkg.sections.filter(function(s) { return s.status === 'pending'; }).length;
  var warnCount = pkg.sections.filter(function(s) { return s.status === 'warn'; }).length;
  var pct = Math.round(100 * doneCount / pkg.sections.length);

  return h('div', null,
    h('div', { className: 'stats-row' },
      h(StatCard, { label: 'Compound', value: pkg.compound, color: 'primary' }),
      h(StatCard, { label: 'Target IND submission', value: pkg.target_ind_submission, color: 'info' }),
      h(StatCard, { label: 'Sections complete', value: doneCount + ' / ' + pkg.sections.length, color: 'success', sub: pct + '% ready' }),
      h(StatCard, { label: 'Pending', value: pendingCount, color: 'warning' }),
      h(StatCard, { label: 'Needs attention', value: warnCount, color: 'danger' })
    ),

    h('div', { className: 'panel' },
      h('div', { className: 'panel-header' },
        h('span', { className: 'panel-title' }, 'Dossier checklist'),
        h(Space, null,
          h(Button, null, 'Preview briefing doc'),
          h(Button, { type: 'primary' }, 'Export IND package')
        )
      ),
      h('div', { className: 'panel-body' },
        h('ul', { className: 'checklist' },
          pkg.sections.map(function(s) {
            var icon = s.status === 'done' ? h('span', { className: 'checklist-icon done' }, '✓')
              : s.status === 'warn' ? h('span', { className: 'checklist-icon warn' }, '⚠')
              : h('span', { className: 'checklist-icon pending' }, '○');
            return h('li', { key: s.key },
              icon,
              h('div', null,
                h('div', { className: 'checklist-title' }, s.title),
                h('div', { className: 'checklist-sub' }, s.note)
              )
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

  var _c = useState('slurm-onprem');
  var clusterId = _c[0];
  var setClusterId = _c[1];

  var _n = useState(64);
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
      setJob(queued);
      setSubmitState('submitted');
      dlog('INFO', 'Job ' + id + ' queued on ' + selected.name + ' / ' + partition);
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
        description: 'Your animal-omics and GLP tox data is restricted to on-prem storage. ' +
          'On-prem SLURM is recommended — no egress, no data-transfer review.'
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
        h('div', null,
          h('div', { className: 'cluster-param-label' }, 'Bootstraps (sensitivity runs)'),
          h(InputNumber, { min: 16, max: 1024, step: 16, value: bootstraps, onChange: setBootstraps })
        ),
        h('div', { className: 'cluster-estimate' },
          'Est. wall-clock on ', h('strong', null, selected.name.split(' (')[0]), ': ',
          h('strong', null, Math.max(3, Math.round(bootstraps * (selected.type === 'slurm' ? 0.08 : 0.15))) + ' min'))
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
        'Submit to ' + (selected.type === 'slurm' ? 'SLURM' : selected.type.toUpperCase()))
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

  var _tab = useState('candidates');
  var activeTab = _tab[0];
  var setActiveTab = _tab[1];

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

  // On mount: probe live data; fall back to dummy silently.
  useEffect(function() {
    dlog('INFO', 'App mounted');
    // Collapse the fixed boot-debug overlay since the React accordion now owns it.
    var boot = document.getElementById('boot-debug');
    if (boot) boot.style.display = 'none';

    apiGet('api/context').then(function(ctx) {
      dlog('INFO', 'context: ' + JSON.stringify(ctx));
    }).catch(function() {});

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

  var tabs = [
    { key: 'candidates', label: 'Candidates' },
    { key: 'safety',     label: 'Safety & Tox' },
    { key: 'pkpd',       label: 'PK/PD & FIH Dose' },
    { key: 'ind',        label: 'IND Package' },
  ];

  var body =
    activeTab === 'candidates' ? h(CandidatesPage, { candidates: candidates }) :
    activeTab === 'safety'     ? h(SafetyPage,     { overlap: overlap, studies: studies }) :
    activeTab === 'pkpd'       ? h(PKPDPage,       { pkpd: pkpd }) :
                                  h(IndPackagePage, { pkg: indPkg });

  return h(ConfigProvider, { theme: dominoTheme },
    h('div', { className: 'app-layout-no-topnav' },
      h('div', { className: 'main-content' },
        h('div', { className: 'search-card' },
          h('div', { className: 'search-card-identity' },
            h('span', { className: 'app-title' }, 'INDForge'),
            h('span', { className: 'app-subtitle' }, 'Preclinical → IND-enabling biomarker package')
          ),
          h('div', { className: 'search-card-controls' },
            h('div', { className: 'dummy-data-toggle' },
              h('span', null, 'Dummy data'),
              h(Switch, { checked: useDummy, onChange: onToggleDummy, size: 'small' })
            ),
            h(Button, { type: 'primary' }, 'Generate IND package')
          )
        ),

        h(Tabs, {
          className: 'section-tabs',
          activeKey: activeTab,
          onChange: function(k) { dlog('INFO', 'tab: ' + k); setActiveTab(k); },
          items: tabs,
        }),

        body,

        h(DebugAccordion)
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(h(App));
