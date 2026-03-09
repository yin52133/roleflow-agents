import http from 'node:http';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(__dirname, 'public');
const HOST = '127.0.0.1';
const PORT = Number(process.env.PORT || 3210);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png'
};

function sendJson(res, data, status = 200) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data, null, 2));
}

async function loadYaml(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return YAML.parse(raw);
}

async function fileExists(filePath) {
  try { await stat(filePath); return true; } catch { return false; }
}

async function loadWorkflows() {
  const dir = path.join(ROOT, 'workflows');
  const files = (await readdir(dir)).filter((f) => f.endsWith('.yaml')).sort();
  const items = [];
  for (const file of files) {
    const full = path.join(dir, file);
    const data = await loadYaml(full);
    items.push({
      file,
      ...data,
      latestRunPath: data.workflow_id ? `runtime/workflow-runs/${data.workflow_id}/latest.json` : null
    });
  }
  return items;
}

async function loadRuntimeLatest(workflowId) {
  const latestPath = path.join(ROOT, 'runtime', 'workflow-runs', workflowId, 'latest.json');
  if (!(await fileExists(latestPath))) return null;
  return JSON.parse(await readFile(latestPath, 'utf8'));
}

async function loadRuntimeHistory(workflowId) {
  const histDir = path.join(ROOT, 'runtime', 'workflow-runs', workflowId, 'history');
  if (!(await fileExists(histDir))) return [];
  const files = (await readdir(histDir)).filter((f) => f.endsWith('.json')).sort().reverse();
  const runs = [];
  for (const file of files) {
    const full = path.join(histDir, file);
    const parsed = JSON.parse(await readFile(full, 'utf8'));
    runs.push({ file, ...parsed });
  }
  return runs;
}

async function loadRoles() {
  const dir = path.join(ROOT, 'agents');
  const roles = (await readdir(dir)).sort();
  const items = [];
  for (const role of roles) {
    const soulPath = path.join(dir, role, 'SOUL.md');
    const agentsPath = path.join(dir, role, 'AGENTS.md');
    items.push({
      id: role,
      soul: await readFile(soulPath, 'utf8'),
      rules: await readFile(agentsPath, 'utf8')
    });
  }
  return items;
}

async function buildSummary() {
  const workflows = await loadWorkflows();
  const roles = await loadRoles();
  const workflowStates = {};
  const workflowKinds = {};
  for (const wf of workflows) {
    workflowStates[wf.workflow_state] = (workflowStates[wf.workflow_state] || 0) + 1;
    workflowKinds[wf.workflow_kind || 'unknown'] = (workflowKinds[wf.workflow_kind || 'unknown'] || 0) + 1;
  }
  const latestRuns = await Promise.all(workflows.map((wf) => wf.workflow_id ? loadRuntimeLatest(wf.workflow_id) : null));
  const runStatus = {};
  for (const run of latestRuns.filter(Boolean)) {
    runStatus[run.status] = (runStatus[run.status] || 0) + 1;
  }
  return {
    generatedAt: new Date().toISOString(),
    counts: {
      roles: roles.length,
      workflows: workflows.length,
      workflowStates,
      workflowKinds,
      runStatus
    }
  };
}

async function serveStatic(req, res) {
  const requested = req.url === '/' ? '/index.html' : req.url;
  const safePath = path.normalize(requested).replace(/^\/+/, '');
  const filePath = path.join(PUBLIC_DIR, safePath);
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }
  if (!(await fileExists(filePath))) {
    res.writeHead(404); res.end('Not found'); return;
  }
  const ext = path.extname(filePath);
  const content = await readFile(filePath);
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  res.end(content);
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${HOST}:${PORT}`);
    if (url.pathname === '/api/summary') return sendJson(res, await buildSummary());
    if (url.pathname === '/api/workflows') {
      const workflows = await loadWorkflows();
      const withRuntime = await Promise.all(workflows.map(async (wf) => ({ ...wf, latestRun: wf.workflow_id ? await loadRuntimeLatest(wf.workflow_id) : null })));
      return sendJson(res, withRuntime);
    }
    if (url.pathname.startsWith('/api/workflows/')) {
      const workflowId = decodeURIComponent(url.pathname.split('/').pop());
      const workflows = await loadWorkflows();
      const workflow = workflows.find((w) => w.workflow_id === workflowId);
      if (!workflow) return sendJson(res, { error: 'Workflow not found' }, 404);
      return sendJson(res, { workflow, latestRun: await loadRuntimeLatest(workflowId), history: await loadRuntimeHistory(workflowId) });
    }
    if (url.pathname === '/api/roles') return sendJson(res, await loadRoles());
    return serveStatic(req, res);
  } catch (error) {
    return sendJson(res, { error: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined }, 500);
  }
});

server.listen(PORT, HOST, () => {
  console.log(`RoleFlow UI running at http://${HOST}:${PORT}`);
});
