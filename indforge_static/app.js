// INDForge — preclinical IND-enabling biomarker app.

var antdLib = window.antd;
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
  return fetch(path).then(function(r) {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    return r.json();
  });
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
    var series = [];
    for (var i = 0; i < overlap.candidates.length; i++) {
      for (var j = 0; j < overlap.organs.length; j++) {
        series.push([j, i, overlap.matrix[i][j]]);
      }
    }
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

  useEffect(function() {
    if (!chartRef.current) return;
    var data = pk.points.map(function(p) { return [p.auc, p.response]; });
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
              h(Button, null, 'Run sensitivity analysis')
            )
          )
        )
      )
    )
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
    apiGet('/api/candidates').then(function(data) {
      setConnected(true);
      setUseDummy(false);
      if (data && data.length) setCandidates(data);
    }).catch(function() {
      setConnected(false);
      setUseDummy(true);
    });
  }, []);

  function onToggleDummy(v) {
    setUseDummy(v);
    if (v) {
      setCandidates(MOCK_CANDIDATES);
    } else {
      apiGet('/api/candidates').then(function(data) {
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
          onChange: setActiveTab,
          items: tabs,
        }),

        body
      )
    )
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(h(App));
