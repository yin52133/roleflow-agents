const i18n = {
  zh: {
    subtitle: '本地只读状态查看器 · 默认中文 · 像素点缀 + 现代主体',
    summary: '总览',
    roles: '角色',
    workflows: '工作流',
    detail: '详情',
    detailHint: '点击左侧工作流查看定义层与运行态',
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
    generated: '生成时间',
    counts: '数量',
    raw: '原始数据'
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
    generated: 'Generated',
    counts: 'Counts',
    raw: 'Raw'
  }
};

let lang = 'zh';
let workflows = [];
let roles = [];
let summary = null;
let selectedWorkflowId = null;

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

function badgeClass(value = '') {
  return String(value).replace(/\s+/g, '_');
}

function renderSummary() {
  $('#subtitle').textContent = t('subtitle');
  $('#sidebar-title').textContent = t('summary');
  $('#roles-title').textContent = t('roles');
  $('#workflow-title').textContent = t('workflows');
  $('#detail-title').textContent = t('detail');
  $('#detail-hint').textContent = t('detailHint');
  $('#workflow-count').textContent = t('workflowCount', workflows.length);

  const summaryCards = $('#summary-cards');
  summaryCards.innerHTML = '';
  const counts = summary?.counts || {};
  [
    ['workflows', counts.workflows || 0],
    ['roles', counts.roles || 0],
    ['operational', counts.workflowKinds?.operational || 0],
    ['task', counts.workflowKinds?.task || 0]
  ].forEach(([label, value]) => {
    const card = el('div', 'metric');
    card.innerHTML = `<div class="muted">${label}</div><strong>${value}</strong>`;
    summaryCards.appendChild(card);
  });

  const roleList = $('#role-list');
  roleList.innerHTML = '';
  roles.forEach((role) => {
    const card = el('div', 'role-pill');
    card.innerHTML = `<strong>${role.id}</strong><div class="muted">${role.soul.split('\n')[2] || ''}</div>`;
    roleList.appendChild(card);
  });
}

function renderWorkflows() {
  const list = $('#workflow-list');
  list.innerHTML = '';
  workflows.forEach((wf) => {
    const card = el('div', `workflow-card ${wf.workflow_id === selectedWorkflowId ? 'active' : ''}`);
    const latest = wf.latestRun;
    card.innerHTML = `
      <h3>${wf.name}</h3>
      <div class="muted">${wf.workflow_id}</div>
      <div class="badges">
        <span class="badge ${badgeClass(wf.workflow_kind)}">${wf.workflow_kind}</span>
        <span class="badge ${badgeClass(wf.workflow_state)}">${wf.workflow_state}</span>
        <span class="badge ${badgeClass(wf.current_mode)}">${wf.current_mode}</span>
      </div>
      <div class="muted">${t('purpose')}: ${wf.purpose}</div>
      <div class="muted">${t('latestStatus')}: ${latest?.status || t('none')}</div>
    `;
    card.onclick = () => {
      selectedWorkflowId = wf.workflow_id;
      renderWorkflows();
      renderDetail();
    };
    list.appendChild(card);
  });
}

function renderDetail() {
  const panel = $('#detail-panel');
  panel.innerHTML = '';
  const wf = workflows.find((x) => x.workflow_id === selectedWorkflowId);
  if (!wf) {
    panel.innerHTML = `<div class="muted">${t('noSelection')}</div>`;
    return;
  }

  const def = el('div', 'detail-block');
  def.innerHTML = `<h4>${t('definition')}</h4>`;
  const kv = el('div', 'kv');
  const entries = {
    workflow_id: wf.workflow_id,
    workflow_kind: wf.workflow_kind,
    workflow_state: wf.workflow_state,
    current_mode: wf.current_mode,
    lifecycle_intent: wf.lifecycle_intent,
    purpose: wf.purpose,
    approved_runbook: wf.approved_runbook || 'null',
    approved_analysis_template: wf.approved_analysis_template || wf.approved_artifacts?.approved_analysis_template || wf.approved_artifacts?.analysis_template || 'n/a'
  };
  for (const [k, v] of Object.entries(entries)) {
    kv.append(el('div', 'k', k), el('div', 'v', String(v)));
  }
  def.appendChild(kv);

  const rolesBlock = el('div', 'detail-block');
  rolesBlock.innerHTML = `<h4>${t('roleSequence')}</h4><ul class="list">${(wf.role_sequence || []).map((r) => `<li>${r}</li>`).join('')}</ul>`;

  const latest = el('div', 'detail-block');
  latest.innerHTML = `<h4>${t('latestRun')}</h4><pre>${JSON.stringify(wf.latestRun || null, null, 2)}</pre>`;

  const history = el('div', 'detail-block');
  history.innerHTML = `<h4>${t('history')}</h4>`;
  const historyList = el('div', 'stack');
  const items = (wf.history || []).slice(0, 5);
  if (!items.length) {
    historyList.innerHTML = `<div class="muted">${t('none')}</div>`;
  } else {
    items.forEach((run) => {
      const row = el('div', 'workflow-card');
      row.innerHTML = `
        <strong>${run.file}</strong>
        <div class="badges"><span class="badge ${badgeClass(run.status)}">${run.status}</span><span class="badge ${badgeClass(run.current_stage)}">${run.current_stage}</span></div>
        <div class="muted">retry_count: ${run.retry_count ?? 0}</div>
      `;
      row.onclick = () => {
        latest.querySelector('pre').textContent = JSON.stringify(run, null, 2);
      };
      historyList.appendChild(row);
    });
  }
  history.appendChild(historyList);

  panel.append(def, rolesBlock, latest, history);
}

async function loadAll() {
  const [summaryData, workflowsData, rolesData] = await Promise.all([
    fetchJson('/api/summary'),
    fetchJson('/api/workflows'),
    fetchJson('/api/roles')
  ]);
  const histories = await Promise.all(workflowsData.map(async (wf) => {
    const detail = await fetchJson(`/api/workflows/${encodeURIComponent(wf.workflow_id)}`);
    return { ...wf, latestRun: detail.latestRun, history: detail.history };
  }));
  summary = summaryData;
  workflows = histories;
  roles = rolesData;
  if (!selectedWorkflowId && workflows.length) selectedWorkflowId = workflows[0].workflow_id;
  renderSummary();
  renderWorkflows();
  renderDetail();
}

document.querySelectorAll('.lang-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    lang = btn.dataset.lang;
    document.querySelectorAll('.lang-btn').forEach((b) => b.classList.toggle('active', b === btn));
    renderSummary();
    renderWorkflows();
    renderDetail();
  });
});

loadAll().catch((err) => {
  $('#detail-panel').innerHTML = `<pre>${err.stack || err.message}</pre>`;
});
