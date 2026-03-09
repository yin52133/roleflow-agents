const i18n = {
  zh: {
    subtitle: '本地只读状态查看器 · 默认中文 · 像素点缀 + 现代主体',
    summary: '总览',
    roles: '角色',
    workflows: '工作流',
    detail: '详情',
    detailHint: '点击工作流查看定义层与运行态',
    workflowCount: (n) => `共 ${n} 条`,
    noSelection: '请选择一个 workflow 查看详情',
    definition: '定义层',
    latestRun: '最新运行态',
    history: '历史运行',
    purpose: '目标',
    roleSequence: '角色顺序',
    latestStatus: '最近状态',
    none: '暂无',
    runtime: '运行态',
    raw: '查看原始 JSON',
    hideRaw: '收起原始 JSON',
    roleDesc: {
      orchestrator: '拆分、验收、收口',
      analyst: '解释、比较、给出判断材料',
      builder: '实现、验证、交付 artifact',
      operator: '按批准版本稳定执行'
    },
    guards: 'Guard 状态',
    outputs: '输出',
    anomalies: '异常',
    fallback: 'Fallback / 决策',
    kind: '类型',
    state: '状态',
    mode: '模式',
    cards: '卡片',
    compact: '紧凑',
    all: '全部',
    allStates: '全部状态'
  },
  en: {
    subtitle: 'Local read-only viewer · Chinese by default · pixel accents + modern shell',
    summary: 'Summary',
    roles: 'Roles',
    workflows: 'Workflows',
    detail: 'Details',
    detailHint: 'Select a workflow to inspect control-plane and runtime state',
    workflowCount: (n) => `${n} workflows`,
    noSelection: 'Select a workflow to inspect details',
    definition: 'Definition',
    latestRun: 'Latest Run',
    history: 'History',
    purpose: 'Purpose',
    roleSequence: 'Role Sequence',
    latestStatus: 'Latest Status',
    none: 'None',
    runtime: 'Runtime',
    raw: 'Show raw JSON',
    hideRaw: 'Hide raw JSON',
    roleDesc: {
      orchestrator: 'decompose, review, re-center',
      analyst: 'interpret, compare, provide judgment material',
      builder: 'implement, validate, deliver artifacts',
      operator: 'execute approved paths steadily'
    },
    guards: 'Guard Status',
    outputs: 'Outputs',
    anomalies: 'Anomalies',
    fallback: 'Fallback / Decision',
    kind: 'Kind',
    state: 'State',
    mode: 'Mode',
    cards: 'Cards',
    compact: 'Compact',
    all: 'all',
    allStates: 'all states'
  }
};

const roleAvatars = {
  orchestrator: '/avatars/orchestrator.svg',
  analyst: '/avatars/analyst.svg',
  builder: '/avatars/builder.svg',
  operator: '/avatars/operator.svg'
};

let lang = 'zh';
let workflows = [];
let roles = [];
let summary = null;
let selectedWorkflowId = null;
let rawOpen = false;
let workflowView = 'cards';
let kindFilter = 'all';
let stateFilter = 'all';

const $ = (s) => document.querySelector(s);
const el = (tag, cls, html) => {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (html !== undefined) node.innerHTML = html;
  return node;
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}`);
  return res.json();
}

function t(key, ...args) {
  const v = i18n[lang][key];
  return typeof v === 'function' ? v(...args) : v;
}

function badgeClass(value = '') { return String(value).replace(/\s+/g, '_'); }
function truncate(text = '', n = 76) { return text.length > n ? text.slice(0, n - 1) + '…' : text; }
function filteredWorkflows() {
  return workflows.filter((wf) => (kindFilter === 'all' || wf.workflow_kind === kindFilter) && (stateFilter === 'all' || wf.workflow_state === stateFilter));
}

function renderSummary() {
  $('#subtitle').textContent = t('subtitle');
  $('#sidebar-title').textContent = t('summary');
  $('#roles-title').textContent = t('roles');
  $('#workflow-title').textContent = t('workflows');
  $('#detail-title').textContent = t('detail');
  $('#detail-hint').textContent = t('detailHint');
  $('#workflow-count').textContent = t('workflowCount', filteredWorkflows().length);
  $('#view-card').textContent = t('cards');
  $('#view-compact').textContent = t('compact');

  const kindSel = $('#kind-filter');
  const stateSel = $('#state-filter');
  kindSel.options[0].text = t('all');
  stateSel.options[0].text = t('allStates');
  kindSel.value = kindFilter;
  stateSel.value = stateFilter;

  const summaryCards = $('#summary-cards');
  summaryCards.innerHTML = '';
  const counts = summary?.counts || {};
  [['workflows', counts.workflows || 0], ['roles', counts.roles || 0], ['operational', counts.workflowKinds?.operational || 0], ['task', counts.workflowKinds?.task || 0]].forEach(([label, value]) => {
    const card = el('div', 'metric');
    card.innerHTML = `<div class="muted">${label}</div><strong>${value}</strong>`;
    summaryCards.appendChild(card);
  });

  const roleList = $('#role-list');
  roleList.innerHTML = '';
  roles.forEach((role) => {
    const card = el('div', 'role-card');
    card.innerHTML = `<div class="pixel-avatar ${role.id}"><img src="${roleAvatars[role.id]}" alt="${role.id}" /></div><div><strong>${role.id}</strong><div class="muted">${t('roleDesc')[role.id] || ''}</div></div>`;
    roleList.appendChild(card);
  });
}

function renderWorkflows() {
  const list = $('#workflow-list');
  const viewData = filteredWorkflows();
  list.className = workflowView === 'cards' ? 'workflow-grid' : 'workflow-list compact';
  list.innerHTML = '';

  viewData.forEach((wf) => {
    const latest = wf.latestRun;
    const seq = (wf.role_sequence || []).map((r) => `<span class="node">${r}</span>`).join('<span class="arrow">→</span>');
    const cls = workflowView === 'cards' ? 'workflow-card' : 'workflow-row';
    const card = el('div', `${cls} ${wf.workflow_id === selectedWorkflowId ? 'active' : ''}`);
    if (workflowView === 'cards') {
      card.innerHTML = `
        <h3>${wf.name}</h3>
        <div class="muted">${wf.workflow_id}</div>
        <div class="badges">
          <span class="badge ${badgeClass(wf.workflow_kind)}">${wf.workflow_kind}</span>
          <span class="badge ${badgeClass(wf.workflow_state)}">${wf.workflow_state}</span>
          <span class="badge ${badgeClass(wf.current_mode)}">${wf.current_mode}</span>
        </div>
        <div class="muted">${truncate(wf.purpose, 82)}</div>
        <div class="arrow-line compact-line">${seq}</div>
        <div class="muted">${t('latestStatus')}: ${latest?.status || t('none')}</div>`;
    } else {
      card.innerHTML = `
        <div><strong>${wf.name}</strong><div class="muted">${wf.workflow_id}</div></div>
        <div><span class="badge ${badgeClass(wf.workflow_kind)}">${wf.workflow_kind}</span></div>
        <div><span class="badge ${badgeClass(wf.workflow_state)}">${wf.workflow_state}</span></div>
        <div><span class="badge ${badgeClass(wf.current_mode)}">${wf.current_mode}</span></div>
        <div class="muted">${latest?.status || t('none')}</div>`;
    }
    card.onclick = () => { selectedWorkflowId = wf.workflow_id; rawOpen = false; renderWorkflows(); renderDetail(); };
    list.appendChild(card);
  });
  if (!viewData.length) list.innerHTML = `<div class="muted">${t('none')}</div>`;
}

function toList(items = []) { return items?.length ? `<ul class="list">${items.map((i) => `<li>${i}</li>`).join('')}</ul>` : `<div class="muted">${t('none')}</div>`; }
function buildRuntimeOverview(run) {
  if (!run) return `<div class="muted">${t('none')}</div>`;
  const tone = badgeClass(run.status);
  return `<div class="runtime-summary ${tone}">
    <div class="runtime-chip"><div class="label">status</div><div class="value"><span class="badge ${tone}">${run.status}</span></div></div>
    <div class="runtime-chip"><div class="label">current_stage</div><div class="value"><span class="badge ${badgeClass(run.current_stage)}">${run.current_stage}</span></div></div>
    <div class="runtime-chip"><div class="label">retry_count</div><div class="value">${run.retry_count ?? 0}</div></div>
    <div class="runtime-chip"><div class="label">deadline</div><div class="value">${run.deadline || t('none')}</div></div>
  </div>`;
}

function renderDetail() {
  const panel = $('#detail-panel');
  panel.innerHTML = '';
  const wf = workflows.find((x) => x.workflow_id === selectedWorkflowId);
  if (!wf) return panel.innerHTML = `<div class="muted">${t('noSelection')}</div>`;
  const approvedAnalysis = wf.approved_analysis_template || wf.approved_artifacts?.approved_analysis_template || wf.approved_artifacts?.analysis_template || 'n/a';
  const seq = (wf.role_sequence || []).map((r) => `<span class="node">${r}</span>`).join('<span class="arrow">→</span>');

  const def = el('div', 'detail-block');
  def.innerHTML = `<h4>${t('definition')}</h4><div class="kv"><div class="k">workflow_id</div><div>${wf.workflow_id}</div><div class="k">${t('kind')}</div><div><span class="badge ${badgeClass(wf.workflow_kind)}">${wf.workflow_kind}</span></div><div class="k">${t('state')}</div><div><span class="badge ${badgeClass(wf.workflow_state)}">${wf.workflow_state}</span></div><div class="k">${t('mode')}</div><div><span class="badge ${badgeClass(wf.current_mode)}">${wf.current_mode}</span></div><div class="k">lifecycle_intent</div><div>${wf.lifecycle_intent}</div><div class="k">${t('purpose')}</div><div>${wf.purpose}</div><div class="k">approved_runbook</div><div>${wf.approved_runbook || 'null'}</div><div class="k">approved_analysis_template</div><div>${approvedAnalysis}</div></div>`;
  const rolesBlock = el('div', 'detail-block');
  rolesBlock.innerHTML = `<h4>${t('roleSequence')}</h4><div class="arrow-line">${seq}</div>`;

  const latest = wf.latestRun;
  const runtime = el('div', `detail-block state-${badgeClass(latest?.status || 'none')}`);
  runtime.innerHTML = `<h4>${t('latestRun')}</h4>${buildRuntimeOverview(latest)}<div class="section-title">${t('guards')}</div>${latest?.guard_status ? `<div class="badges">${Object.entries(latest.guard_status).map(([k,v]) => `<span class="badge ${badgeClass(v)}">${k}: ${v}</span>`).join('')}</div>` : `<div class="muted">${t('none')}</div>`}<div class="section-title">${t('outputs')}</div>${toList(latest?.outputs)}<div class="section-title">${t('anomalies')}</div>${toList(latest?.anomalies)}<div class="section-title">${t('fallback')}</div><div class="muted">${latest?.fallback_action || latest?.orchestrator_decision || t('none')}</div>`;

  const history = el('div', 'detail-block');
  history.innerHTML = `<h4>${t('history')}</h4>`;
  const historyList = el('div', 'stack');
  const items = (wf.history || []).slice(0, 5);
  if (!items.length) historyList.innerHTML = `<div class="muted">${t('none')}</div>`;
  else items.forEach((run) => {
    const row = el('div', `history-card state-${badgeClass(run.status)}`);
    row.innerHTML = `<strong>${run.file}</strong><div class="badges"><span class="badge ${badgeClass(run.status)}">${run.status}</span><span class="badge ${badgeClass(run.current_stage)}">${run.current_stage}</span></div><div class="muted">retry_count: ${run.retry_count ?? 0}</div>`;
    row.onclick = () => { latestRaw.textContent = JSON.stringify(run, null, 2); };
    historyList.appendChild(row);
  });
  history.appendChild(historyList);

  const raw = el('div', 'detail-block');
  const toggle = el('button', 'raw-toggle', rawOpen ? t('hideRaw') : t('raw'));
  const latestRaw = el('pre', '', JSON.stringify(latest || null, null, 2));
  latestRaw.style.display = rawOpen ? 'block' : 'none';
  toggle.onclick = () => { rawOpen = !rawOpen; toggle.textContent = rawOpen ? t('hideRaw') : t('raw'); latestRaw.style.display = rawOpen ? 'block' : 'none'; };
  raw.innerHTML = `<h4>${t('raw')}</h4>`;
  raw.append(toggle, latestRaw);
  panel.append(def, rolesBlock, runtime, history, raw);
}

async function loadAll() {
  const [summaryData, workflowsData, rolesData] = await Promise.all([fetchJson('/api/summary'), fetchJson('/api/workflows'), fetchJson('/api/roles')]);
  const histories = await Promise.all(workflowsData.map(async (wf) => {
    const detail = await fetchJson(`/api/workflows/${encodeURIComponent(wf.workflow_id)}`);
    return { ...wf, latestRun: detail.latestRun, history: detail.history };
  }));
  summary = summaryData; workflows = histories; roles = rolesData;
  if (!selectedWorkflowId && workflows.length) selectedWorkflowId = workflows[0].workflow_id;
  renderSummary(); renderWorkflows(); renderDetail();
}

document.querySelectorAll('.lang-btn').forEach((btn) => btn.addEventListener('click', () => {
  if (btn.dataset.lang) {
    lang = btn.dataset.lang;
    document.querySelectorAll('.lang-btn[data-lang]').forEach((b) => b.classList.toggle('active', b === btn));
    renderSummary(); renderWorkflows(); renderDetail();
  }
}));
$('#view-card').addEventListener('click', () => { workflowView = 'cards'; $('#view-card').classList.add('active'); $('#view-compact').classList.remove('active'); renderWorkflows(); });
$('#view-compact').addEventListener('click', () => { workflowView = 'compact'; $('#view-compact').classList.add('active'); $('#view-card').classList.remove('active'); renderWorkflows(); });
$('#kind-filter').addEventListener('change', (e) => { kindFilter = e.target.value; renderSummary(); renderWorkflows(); });
$('#state-filter').addEventListener('change', (e) => { stateFilter = e.target.value; renderSummary(); renderWorkflows(); });

loadAll().catch((err) => { $('#detail-panel').innerHTML = `<pre>${err.stack || err.message}</pre>`; });
