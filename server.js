const http = require('http');
const fs = require('fs');
const path = require('path');

const CSV_PATH = path.join(__dirname, 'tracker.csv');
const PORT = 3737;

const COLUMNS = [
  'Company','Role','Job URL','Location','Work Mode','Date Applied',
  'Referral Contact','Status','Date Phone Screen',
  'Date Technical Screen','Date Onsite / Final Round','Date Offer',
  'Date Decision','Offer Amount','Decision','Rejection Stage','Notes'
];

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length < 1) return [];
  const headers = parseRow(lines[0]);
  return lines.slice(1).filter(l => l.trim()).map(line => {
    const vals = parseRow(line);
    const obj = {};
    headers.forEach((h, i) => obj[h] = vals[i] || '');
    return obj;
  });
}

function parseRow(line) {
  const result = [];
  let cur = '', inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuote && line[i+1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (c === ',' && !inQuote) {
      result.push(cur); cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

function toCSV(rows) {
  const esc = v => /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
  const header = COLUMNS.join(',');
  const data = rows.map(r => COLUMNS.map(c => esc(r[c] || '')).join(','));
  return [header, ...data].join('\n') + '\n';
}

function readRows() {
  try {
    return parseCSV(fs.readFileSync(CSV_PATH, 'utf8'));
  } catch { return []; }
}

function writeRows(rows) {
  fs.writeFileSync(CSV_PATH, toCSV(rows), 'utf8');
}

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Job Hunt Tracker</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f1117;color:#e1e4e8;min-height:100vh}
  header{background:#161b22;border-bottom:1px solid #30363d;padding:16px 24px;display:flex;align-items:center;gap:16px}
  header h1{font-size:18px;font-weight:600;color:#f0f6fc}
  .pill{background:#21262d;border:1px solid #30363d;border-radius:20px;padding:2px 10px;font-size:12px;color:#8b949e}
  .controls{padding:16px 24px;display:flex;gap:10px;flex-wrap:wrap;background:#0f1117;border-bottom:1px solid #21262d}
  input[type=search],select{background:#21262d;border:1px solid #30363d;color:#e1e4e8;border-radius:6px;padding:6px 10px;font-size:13px;outline:none}
  input[type=search]:focus,select:focus{border-color:#58a6ff}
  input[type=search]{width:220px}
  button{border:none;border-radius:6px;padding:6px 14px;font-size:13px;cursor:pointer;font-weight:500}
  .btn-primary{background:#238636;color:#fff}
  .btn-primary:hover{background:#2ea043}
  .btn-sm{padding:3px 10px;font-size:12px}
  .btn-ghost{background:transparent;color:#8b949e;border:1px solid #30363d}
  .btn-ghost:hover{background:#21262d;color:#e1e4e8}
  .btn-danger{background:#da3633;color:#fff}
  .btn-danger:hover{background:#f85149}
  .table-wrap{overflow-x:auto;padding:0 24px 24px}
  table{width:100%;border-collapse:collapse;font-size:13px;min-width:900px;margin-top:16px}
  th{background:#161b22;color:#8b949e;font-weight:600;text-align:left;padding:8px 12px;border-bottom:2px solid #30363d;white-space:nowrap;user-select:none;cursor:pointer}
  th:hover{color:#e1e4e8}
  th .sort-icon{opacity:.4;margin-left:4px}
  th.sorted .sort-icon{opacity:1;color:#58a6ff}
  td{padding:8px 12px;border-bottom:1px solid #21262d;vertical-align:top;max-width:200px;word-break:break-word}
  tr:hover td{background:#161b22}
  .status-badge{display:inline-block;border-radius:20px;padding:2px 9px;font-size:11px;font-weight:600;white-space:nowrap}
  .s-applied{background:#1f3a5f;color:#79c0ff}
  .s-phone{background:#3b2a6e;color:#c084fc}
  .s-technical{background:#422006;color:#fb923c}
  .s-onsite{background:#422006;color:#fbbf24}
  .s-offer{background:#14532d;color:#4ade80}
  .s-rejected{background:#450a0a;color:#f87171}
  .s-referral{background:#0d3040;color:#38bdf8}
  .s-withdrawn{background:#1c1c1c;color:#6b7280}
  .s-ghosted{background:#1c1c1c;color:#6b7280}
  a.job-link{color:#58a6ff;text-decoration:none}
  a.job-link:hover{text-decoration:underline}
  .empty{text-align:center;padding:60px;color:#8b949e}
  /* Modal */
  .overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);z-index:100;align-items:flex-start;justify-content:center;padding-top:40px;overflow-y:auto}
  .overlay.open{display:flex}
  .modal{background:#161b22;border:1px solid #30363d;border-radius:12px;width:700px;max-width:95vw;padding:24px;position:relative}
  .modal h2{font-size:16px;font-weight:600;color:#f0f6fc;margin-bottom:20px}
  .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .form-grid .full{grid-column:1/-1}
  label{display:block;font-size:12px;color:#8b949e;margin-bottom:4px;font-weight:500}
  .form-grid input,.form-grid select,.form-grid textarea{width:100%;background:#0f1117;border:1px solid #30363d;color:#e1e4e8;border-radius:6px;padding:7px 10px;font-size:13px;outline:none;font-family:inherit}
  .form-grid input:focus,.form-grid select:focus,.form-grid textarea:focus{border-color:#58a6ff}
  .form-grid textarea{resize:vertical;min-height:60px}
  .modal-actions{display:flex;justify-content:flex-end;gap:8px;margin-top:20px}
  .close-btn{position:absolute;top:14px;right:14px;background:none;border:none;color:#8b949e;font-size:18px;cursor:pointer;line-height:1}
  .close-btn:hover{color:#e1e4e8}
  .stats{display:flex;gap:12px;padding:12px 24px;flex-wrap:wrap}
  .stat{background:#161b22;border:1px solid #30363d;border-radius:8px;padding:10px 16px;text-align:center;min-width:80px}
  .stat-num{font-size:22px;font-weight:700;color:#f0f6fc}
  .stat-label{font-size:11px;color:#8b949e;margin-top:2px}
</style>
</head>
<body>
<header>
  <h1>Job Hunt Tracker</h1>
  <span class="pill" id="total-pill">0 applications</span>
  <button class="btn-ghost" style="margin-left:auto" onclick="openBulk()">+ Bulk Add</button>
  <button class="btn-primary" onclick="openAdd()">+ Add Application</button>
</header>

<div class="stats" id="stats-row"></div>

<div class="controls">
  <input type="search" id="search" placeholder="Search company or role…" oninput="render()">
  <select id="filter-status" onchange="render()">
    <option value="">All statuses</option>
    <option>Referral Requested</option><option>Applied</option><option>Phone Screen</option>
    <option>Technical</option><option>Onsite</option><option>Offer</option>
    <option>Rejected</option><option>Withdrawn</option><option>Ghosted</option>
  </select>
  <select id="filter-mode" onchange="render()">
    <option value="">All work modes</option>
    <option>Remote</option><option>Hybrid</option><option>Onsite</option>
  </select>
</div>

<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th onclick="sortBy('Company')">Company <span class="sort-icon">↕</span></th>
        <th onclick="sortBy('Role')">Role <span class="sort-icon">↕</span></th>
        <th onclick="sortBy('Date Applied')">Applied <span class="sort-icon">↕</span></th>
        <th onclick="sortBy('Status')">Status <span class="sort-icon">↕</span></th>
        <th>Work Mode</th>
        <th>Referral</th>
        <th onclick="sortBy('Date Decision')">Decide By <span class="sort-icon">↕</span></th>
        <th>Offer</th>
        <th style="width:80px"></th>
      </tr>
    </thead>
    <tbody id="tbody"></tbody>
  </table>
  <div class="empty" id="empty" style="display:none">No applications yet. Click <b>+ Add Application</b> to get started.</div>
</div>

<!-- Modal -->
<div class="overlay" id="overlay" onclick="maybeClose(event)">
  <div class="modal" id="modal">
    <button class="close-btn" onclick="closeModal()">✕</button>
    <h2 id="modal-title">Add Application</h2>
    <div class="form-grid">
      <div><label>Company *</label><input id="f-Company" placeholder="Acme Corp"></div>
      <div><label>Role *</label><input id="f-Role" placeholder="Software Engineer"></div>
      <div><label>Job URL</label><input id="f-Job URL" placeholder="https://…"></div>
      <div><label>Location</label><input id="f-Location" placeholder="San Francisco, CA"></div>
      <div><label>Work Mode</label>
        <select id="f-Work Mode"><option></option><option>Remote</option><option>Hybrid</option><option>Onsite</option></select>
      </div>
      <div><label>Date Applied</label><input type="date" id="f-Date Applied"></div>
      <div><label>Status</label>
        <select id="f-Status">
          <option>Referral Requested</option><option>Applied</option><option>Phone Screen</option>
          <option>Technical</option><option>Onsite</option><option>Offer</option>
          <option>Rejected</option><option>Withdrawn</option><option>Ghosted</option>
        </select>
      </div>
      <div><label>Referral Contact</label><input id="f-Referral Contact" placeholder="Jane Smith"></div>
      <div><label>Date Phone Screen</label><input type="date" id="f-Date Phone Screen"></div>
      <div><label>Date Technical Screen</label><input type="date" id="f-Date Technical Screen"></div>
      <div><label>Date Onsite / Final Round</label><input type="date" id="f-Date Onsite / Final Round"></div>
      <div><label>Date Offer</label><input type="date" id="f-Date Offer"></div>
      <div><label>Date Decision</label><input type="date" id="f-Date Decision"></div>
      <div><label>Offer Amount</label><input id="f-Offer Amount" placeholder="$150,000 base / $200k TC"></div>
      <div><label>Decision</label>
        <select id="f-Decision"><option></option><option>Accepted</option><option>Declined</option><option>Pending</option></select>
      </div>
      <div><label>Rejection Stage</label><input id="f-Rejection Stage" placeholder="Resume Screen, Phone Screen…"></div>
      <div class="full"><label>Notes</label><textarea id="f-Notes" placeholder="Recruiter name, interview notes, follow-up needed…"></textarea></div>
    </div>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" onclick="save()">Save</button>
    </div>
  </div>
</div>

<!-- Bulk Add Modal -->
<div class="overlay" id="bulk-overlay" onclick="maybeBulkClose(event)">
  <div class="modal" id="bulk-modal" style="width:800px">
    <button class="close-btn" onclick="closeBulk()">✕</button>
    <h2>Bulk Add Applications</h2>
    <div style="margin-bottom:14px">
      <label style="display:block;font-size:12px;color:#8b949e;margin-bottom:4px;font-weight:500">Company *</label>
      <input id="bulk-company" placeholder="Acme Corp" style="width:100%;background:#0f1117;border:1px solid #30363d;color:#e1e4e8;border-radius:6px;padding:7px 10px;font-size:13px;outline:none">
    </div>
    <div style="overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:600px">
        <thead>
          <tr>
            <th style="background:#0f1117;color:#8b949e;padding:6px 8px;text-align:left;border-bottom:1px solid #30363d;white-space:nowrap">Role *</th>
            <th style="background:#0f1117;color:#8b949e;padding:6px 8px;text-align:left;border-bottom:1px solid #30363d">Location</th>
            <th style="background:#0f1117;color:#8b949e;padding:6px 8px;text-align:left;border-bottom:1px solid #30363d">Work Mode</th>
            <th style="background:#0f1117;color:#8b949e;padding:6px 8px;text-align:left;border-bottom:1px solid #30363d">Status</th>
            <th style="background:#0f1117;color:#8b949e;padding:6px 8px;text-align:left;border-bottom:1px solid #30363d;white-space:nowrap">Date Applied</th>
            <th style="background:#0f1117;color:#8b949e;padding:6px 8px;text-align:left;border-bottom:1px solid #30363d;white-space:nowrap">Job URL</th>
            <th style="background:#0f1117;color:#8b949e;padding:6px 8px;text-align:left;border-bottom:1px solid #30363d">Notes</th>
            <th style="background:#0f1117;padding:6px 4px;border-bottom:1px solid #30363d"></th>
          </tr>
        </thead>
        <tbody id="bulk-tbody"></tbody>
      </table>
    </div>
    <button class="btn-ghost btn-sm" style="margin-top:10px" onclick="addBulkRow()">+ Add Row</button>
    <div class="modal-actions">
      <button class="btn-ghost" onclick="closeBulk()">Cancel</button>
      <button class="btn-primary" onclick="saveBulk()">Save All</button>
    </div>
  </div>
</div>

<script>
let rows = [];
let editIdx = null;
let sortCol = 'Date Applied';
let sortDir = -1;

const STATUS_CLASS = {
  'Referral Requested':'s-referral','Applied':'s-applied','Phone Screen':'s-phone',
  'Technical':'s-technical','Onsite':'s-onsite','Offer':'s-offer',
  'Rejected':'s-rejected','Withdrawn':'s-withdrawn','Ghosted':'s-ghosted'
};

async function load() {
  const r = await fetch('/api/rows');
  rows = await r.json();
  render();
}

function render() {
  const q = document.getElementById('search').value.toLowerCase();
  const fStatus = document.getElementById('filter-status').value;
  const fMode = document.getElementById('filter-mode').value;

  let filtered = rows.filter(r => {
    if (q && !r.Company.toLowerCase().includes(q) && !r.Role.toLowerCase().includes(q)) return false;
    if (fStatus && r.Status !== fStatus) return false;
    if (fMode && r['Work Mode'] !== fMode) return false;
    return true;
  });

  filtered.sort((a, b) => {
    const av = a[sortCol] || '', bv = b[sortCol] || '';
    return av < bv ? sortDir : av > bv ? -sortDir : 0;
  });

  document.getElementById('total-pill').textContent = rows.length + ' application' + (rows.length !== 1 ? 's' : '');

  // Stats
  const counts = {};
  rows.forEach(r => counts[r.Status] = (counts[r.Status] || 0) + 1);
  const statOrder = ['Referral Requested','Applied','Phone Screen','Technical','Onsite','Offer','Rejected'];
  document.getElementById('stats-row').innerHTML = statOrder.map(s =>
    \`<div class="stat"><div class="stat-num">\${counts[s]||0}</div><div class="stat-label">\${s}</div></div>\`
  ).join('');

  // Update sort headers
  document.querySelectorAll('th').forEach(th => th.classList.remove('sorted'));

  const tbody = document.getElementById('tbody');
  if (filtered.length === 0) {
    tbody.innerHTML = '';
    document.getElementById('empty').style.display = '';
    return;
  }
  document.getElementById('empty').style.display = 'none';

  tbody.innerHTML = filtered.map((r, i) => {
    const realIdx = rows.indexOf(r);
    const badge = r.Status ? \`<span class="status-badge \${STATUS_CLASS[r.Status]||''}">\${r.Status}</span>\` : '';
    const link = r['Job URL'] ? \`<a class="job-link" href="\${r['Job URL']}" target="_blank">\${esc(r.Role)}</a>\` : esc(r.Role);
    const referral = r['Referral Contact'] ? esc(r['Referral Contact']) : '';
    return \`<tr>
      <td><b>\${esc(r.Company)}</b></td>
      <td>\${link}</td>
      <td>\${r['Date Applied']||''}</td>
      <td>\${badge}</td>
      <td>\${esc(r['Work Mode'])}</td>
      <td>\${referral}</td>
      <td style="\${isUrgent(r['Date Decision'])?'color:#fbbf24;font-weight:600':''}">\${r['Date Decision']||''}</td>
      <td>\${esc(r['Offer Amount'])}</td>
      <td>
        <button class="btn-ghost btn-sm" onclick="openEdit(\${realIdx})">Edit</button>
        <button class="btn-danger btn-sm" style="margin-left:4px" onclick="del(\${realIdx})">✕</button>
      </td>
    </tr>\`;
  }).join('');
}

function esc(s) {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function isUrgent(d) {
  if (!d) return false;
  const diff = (new Date(d) - new Date()) / 86400000;
  return diff >= 0 && diff <= 3;
}

function sortBy(col) {
  if (sortCol === col) sortDir *= -1; else { sortCol = col; sortDir = -1; }
  render();
}

function openAdd() {
  editIdx = null;
  document.getElementById('modal-title').textContent = 'Add Application';
  const fields = ['Company','Role','Job URL','Location','Work Mode','Date Applied',
    'Referral Contact','Status','Date Phone Screen','Date Technical Screen',
    'Date Onsite / Final Round','Date Offer','Date Decision','Offer Amount','Decision',
    'Rejection Stage','Notes'];
  fields.forEach(f => { const el = document.getElementById('f-'+f); if(el) el.value = f==='Status'?'Applied':''; });
  // Default date applied to today
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('f-Date Applied').value = today;
  document.getElementById('overlay').classList.add('open');
}

function openEdit(idx) {
  editIdx = idx;
  document.getElementById('modal-title').textContent = 'Edit Application';
  const r = rows[idx];
  Object.keys(r).forEach(f => { const el = document.getElementById('f-'+f); if(el) el.value = r[f]||''; });
  document.getElementById('overlay').classList.add('open');
}

function closeModal() { document.getElementById('overlay').classList.remove('open'); }
function maybeClose(e) { if (e.target === document.getElementById('overlay')) closeModal(); }

async function save() {
  const company = document.getElementById('f-Company').value.trim();
  const role = document.getElementById('f-Role').value.trim();
  if (!company || !role) { alert('Company and Role are required.'); return; }

  const fields = ['Company','Role','Job URL','Location','Work Mode','Date Applied',
    'Referral Contact','Status','Date Phone Screen','Date Technical Screen',
    'Date Onsite / Final Round','Date Offer','Date Decision','Offer Amount','Decision',
    'Rejection Stage','Notes'];
  const obj = {};
  fields.forEach(f => { const el = document.getElementById('f-'+f); obj[f] = el ? el.value : ''; });

  if (editIdx !== null) rows[editIdx] = obj; else rows.push(obj);

  await fetch('/api/rows', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(rows) });
  closeModal();
  await load();
}

async function del(idx) {
  if (!confirm(\`Delete \${rows[idx].Company} – \${rows[idx].Role}?\`)) return;
  rows.splice(idx, 1);
  await fetch('/api/rows', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(rows) });
  await load();
}

const BULK_STATUS_OPTS = ['Referral Requested','Applied','Phone Screen','Technical','Onsite','Offer','Rejected','Withdrawn','Ghosted'];
const BULK_MODE_OPTS = ['','Remote','Hybrid','Onsite'];
let bulkRowCount = 0;

function bulkCellInput(name, rowId, placeholder='') {
  return \`<input data-row="\${rowId}" data-field="\${name}" placeholder="\${placeholder}" style="width:100%;background:#161b22;border:1px solid #30363d;color:#e1e4e8;border-radius:4px;padding:5px 7px;font-size:12px;outline:none;font-family:inherit">\`;
}
function bulkCellSelect(name, rowId, opts, defaultVal='') {
  const options = opts.map(o => \`<option\${o===defaultVal?' selected':''}>\${o}</option>\`).join('');
  return \`<select data-row="\${rowId}" data-field="\${name}" style="width:100%;background:#161b22;border:1px solid #30363d;color:#e1e4e8;border-radius:4px;padding:5px 6px;font-size:12px;outline:none">\${options}</select>\`;
}

function addBulkRow() {
  const id = ++bulkRowCount;
  const today = new Date().toISOString().split('T')[0];
  const tr = document.createElement('tr');
  tr.id = 'bulk-row-' + id;
  tr.innerHTML = \`
    <td style="padding:4px 6px">\${bulkCellInput('Role', id, 'Software Engineer')}</td>
    <td style="padding:4px 6px">\${bulkCellInput('Location', id, 'Remote / City')}</td>
    <td style="padding:4px 6px">\${bulkCellSelect('Work Mode', id, BULK_MODE_OPTS)}</td>
    <td style="padding:4px 6px">\${bulkCellSelect('Status', id, BULK_STATUS_OPTS, 'Applied')}</td>
    <td style="padding:4px 6px"><input type="date" data-row="\${id}" data-field="Date Applied" value="\${today}" style="background:#161b22;border:1px solid #30363d;color:#e1e4e8;border-radius:4px;padding:5px 6px;font-size:12px;outline:none"></td>
    <td style="padding:4px 6px">\${bulkCellInput('Job URL', id, 'https://…')}</td>
    <td style="padding:4px 6px">\${bulkCellInput('Notes', id, '')}</td>
    <td style="padding:4px 4px"><button class="btn-danger btn-sm" onclick="removeBulkRow(\${id})">✕</button></td>
  \`;
  document.getElementById('bulk-tbody').appendChild(tr);
}

function removeBulkRow(id) {
  const el = document.getElementById('bulk-row-' + id);
  if (el) el.remove();
}

function openBulk() {
  bulkRowCount = 0;
  document.getElementById('bulk-tbody').innerHTML = '';
  document.getElementById('bulk-company').value = '';
  addBulkRow();
  document.getElementById('bulk-overlay').classList.add('open');
}

function closeBulk() { document.getElementById('bulk-overlay').classList.remove('open'); }
function maybeBulkClose(e) { if (e.target === document.getElementById('bulk-overlay')) closeBulk(); }

async function saveBulk() {
  const company = document.getElementById('bulk-company').value.trim();
  if (!company) { alert('Company is required.'); return; }

  const newRows = [];
  const trs = document.querySelectorAll('#bulk-tbody tr');
  for (const tr of trs) {
    const get = field => {
      const el = tr.querySelector(\`[data-field="\${field}"]\`);
      return el ? el.value.trim() : '';
    };
    const role = get('Role');
    if (!role) continue;
    newRows.push({
      Company: company, Role: role,
      'Job URL': get('Job URL'), Location: get('Location'),
      'Work Mode': get('Work Mode'), 'Date Applied': get('Date Applied'),
      'Referral Contact': '', Status: get('Status'),
      'Date Phone Screen': '', 'Date Technical Screen': '',
      'Date Onsite / Final Round': '', 'Date Offer': '',
      'Date Decision': '', 'Offer Amount': '', Decision: '',
      'Rejection Stage': '', Notes: get('Notes')
    });
  }

  if (newRows.length === 0) { alert('Add at least one role.'); return; }
  rows.push(...newRows);
  await fetch('/api/rows', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(rows) });
  closeBulk();
  await load();
}

load();
</script>
</body>
</html>`;

const server = http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');

  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(HTML);
    return;
  }

  if (pathname === '/api/rows') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(readRows()));
      return;
    }
    if (req.method === 'POST') {
      let body = '';
      req.on('data', d => body += d);
      req.on('end', () => {
        try {
          const rows = JSON.parse(body);
          writeRows(rows);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch {
          res.writeHead(400);
          res.end('Bad request');
        }
      });
      return;
    }
  }

  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Job Hunt Tracker running at http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop.');
});
