import { useState, useMemo, useRef } from "react";

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const ALL_MONTHS = [
  "Enero","Febrero","Marzo","Abril","Mayo","Junio",
  "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
];

const RESULT_OPTIONS = [
  { label: "V", value: 3 },
  { label: "E", value: 1 },
  { label: "D", value: 0 },
];

const DEFAULT_SPLITS = [
  { id: "sp1", name: "Pretemporada", color: "#f59e0b", months: ["Julio","Agosto"] },
  { id: "sp2", name: "Otoño",        color: "#f97316", months: ["Septiembre","Octubre","Noviembre"] },
  { id: "sp3", name: "Invierno",     color: "#3b82f6", months: ["Diciembre","Enero","Febrero"] },
  { id: "sp4", name: "Primavera",    color: "#22c55e", months: ["Marzo","Abril","Mayo"] },
  { id: "sp5", name: "Verano",       color: "#a855f7", months: ["Junio"] },
];

const SPLIT_COLORS = [
  "#3b82f6","#f59e0b","#22c55e","#ef4444","#a855f7",
  "#f97316","#06b6d4","#ec4899","#84cc16","#6366f1",
];

// ─── SEED PLAYERS ─────────────────────────────────────────────────────────────
const SEED_PLAYERS = [
  { id:"p0",  name:"Álvaro Torre",     photo:null },
  { id:"p1",  name:"Boro Martínez",    photo:null },
  { id:"p2",  name:"Dani Dolz",        photo:null },
  { id:"p3",  name:"Diego Hernández",  photo:null },
  { id:"p4",  name:"Edvin Babayan",    photo:null },
  { id:"p5",  name:"Eric Sanz",        photo:null },
  { id:"p6",  name:"Gerard Fernández", photo:null },
  { id:"p7",  name:"Jaheim Johnny",    photo:null },
  { id:"p8",  name:"Joan Santos",      photo:null },
  { id:"p9",  name:"Marc Huelamo",     photo:null },
  { id:"p10", name:"Marcos Pallás",    photo:null },
  { id:"p11", name:"Mateo Murillo",    photo:null },
  { id:"p12", name:"Oliver Rull",      photo:null },
  { id:"p13", name:"Pepe Moyano",      photo:null },
  { id:"p14", name:"Raúl Fernández",   photo:null },
  { id:"p15", name:"Theo Laroche",     photo:null },
];

// ─── SEED SESSION M26 ─────────────────────────────────────────────────────────
const RAW_M26 = [
  [3,0,null,null,0,0,0,0, 1],  // p0
  [3,0,3,0,3,3,0,0,       -1], // p1
  [0,0,3,0,3,3,0,0,        0], // p2
  [3,0,null,null,0,0,0,0, -1], // p3
  [0,0,null,null,0,0,0,0,  0], // p4
  [3,0,null,null,0,0,0,0,  0], // p5
  [3,0,3,0,3,3,0,0,        0], // p6
  [0,0,null,null,0,0,0,0,  0], // p7
  [0,0,3,0,3,3,0,0,        0], // p8
  [3,0,3,0,3,3,0,0,       -1], // p9
  [3,0,null,null,3,3,0,0,  0], // p10
  [0,0,null,null,0,0,0,0,  0], // p11
  [0,0,3,0,3,3,0,0,       -1], // p12
  [0,0,3,0,null,null,0,0,  0], // p13
  [3,0,null,null,0,0,0,0,  0], // p14
  [0,0,3,0,3,3,0,0,        0], // p15
];

function buildSeedSession() {
  const pids = SEED_PLAYERS.map(p => p.id);
  const buildSerie = (col, id) => {
    const results = {};
    pids.forEach((pid, i) => { if (RAW_M26[i][col] !== null) results[pid] = RAW_M26[i][col]; });
    return { id: `sr_m26_${id}`, results };
  };
  const extras = {};
  pids.forEach((pid, i) => { extras[pid] = RAW_M26[i][8]; });
  return {
    id: "session_m26", split: "sp3", month: "Febrero", microciclo: 26, year: 2026, extras,
    tasks: [
      { id:"t1",name:"Tarea 1",isDouble:false,series:[buildSerie(0,"t1s1"),buildSerie(1,"t1s2")] },
      { id:"t2",name:"Tarea 2",isDouble:false,series:[buildSerie(2,"t2s1"),buildSerie(3,"t2s2")] },
      { id:"t3",name:"Tarea 3",isDouble:false,series:[buildSerie(4,"t3s1"),buildSerie(5,"t3s2")] },
      { id:"t4",name:"Tarea 4",isDouble:false,series:[buildSerie(6,"t4s1"),buildSerie(7,"t4s2")] },
    ],
  };
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function getPlayerStats(pid, sessions) {
  let totalPts=0, totalSeries=0, extraTotal=0;
  sessions.forEach(s => {
    if (s.extras?.[pid] !== undefined) extraTotal += s.extras[pid];
    s.tasks.forEach(t => {
      const m = t.isDouble ? 2 : 1;
      t.series.forEach(sr => {
        const r = sr.results[pid];
        if (r !== undefined) { totalPts += r*m; totalSeries += m; }
      });
    });
  });
  return { totalPts, totalSeries, avg: totalSeries===0 ? 0 : totalPts/totalSeries, extraTotal };
}

function filterSessions(sessions, { microciclo, month, split, year }) {
  return sessions.filter(s => {
    if (year       !== undefined && s.year       !== year)       return false;
    if (split      !== undefined && s.split      !== split)      return false;
    if (month      !== undefined && s.month      !== month)      return false;
    if (microciclo !== undefined && s.microciclo !== microciclo) return false;
    return true;
  });
}

function buildRanking(players, sessions) {
  return players
    .map(p => ({ ...p, ...getPlayerStats(p.id, sessions) }))
    .sort((a,b) => b.avg-a.avg || b.totalPts-a.totalPts);
}

function getMicrciclosForMonth(sessions, month, splitId, year) {
  const ws = new Set();
  sessions.filter(s=>s.month===month&&s.split===splitId&&s.year===year).forEach(s=>ws.add(s.microciclo));
  return [...ws].sort((a,b)=>a-b);
}

function initials(name) {
  return name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
}

function splitColor(splits, splitId) {
  return splits.find(s=>s.id===splitId)?.color ?? "#64748b";
}

// Returns ISO week number (1-53) for a given date
function isoWeek(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// Builds array of {mc, month, dateRange} for all 52/53 weeks of a year
function buildMcOptions(year) {
  const options = [];
  const d = new Date(Date.UTC(year, 0, 4)); // Jan 4 is always in week 1
  d.setUTCDate(d.getUTCDate() - (d.getUTCDay() || 7) + 1); // Monday of week 1
  const seen = new Set();
  for (let w = 1; w <= 53; w++) {
    const monday = new Date(d);
    const sunday = new Date(d); sunday.setUTCDate(sunday.getUTCDate() + 6);
    const wn = isoWeek(monday);
    if (seen.has(wn)) { d.setUTCDate(d.getUTCDate() + 7); continue; }
    seen.add(wn);
    const fmtDate = dt => `${dt.getUTCDate()} ${ALL_MONTHS[dt.getUTCMonth()].slice(0,3)}`;
    const midpoint = new Date(d); midpoint.setUTCDate(midpoint.getUTCDate() + 3);
    options.push({
      mc: wn,
      month: ALL_MONTHS[midpoint.getUTCMonth()],
      dateRange: `${fmtDate(monday)} – ${fmtDate(sunday)}`,
    });
    d.setUTCDate(d.getUTCDate() + 7);
    if (wn < w && w > 52) break;
  }
  return options.sort((a,b) => a.mc - b.mc);
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@300;400;500;600;700&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg:#0a0c10; --surface:#111318; --surface2:#181c24; --border:#232736;
    --accent:#3b82f6; --accent2:#f59e0b;
    --green:#22c55e; --yellow:#eab308; --red:#ef4444;
    --text:#e2e8f0; --muted:#64748b;
    --fd:'Bebas Neue',sans-serif; --fb:'Outfit',sans-serif;
  }
  body { background:var(--bg); color:var(--text); font-family:var(--fb); min-height:100vh; }
  .app { display:flex; flex-direction:column; min-height:100vh; }

  /* HEADER */
  .hdr {
    background:linear-gradient(135deg,#0f1117,#151822);
    border-bottom:1px solid var(--border);
    padding:0 24px; position:sticky; top:0; z-index:100;
    display:flex; align-items:stretch;
  }
  .hbrand {
    display:flex; align-items:center; gap:12px;
    padding:14px 24px 14px 0; border-right:1px solid var(--border); margin-right:24px;
  }
  .hicon {
    width:34px; height:34px;
    background:linear-gradient(135deg,var(--accent),#6366f1);
    border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:17px;
  }
  .htitle { font-family:var(--fd); font-size:20px; letter-spacing:2px; color:white; line-height:1; }
  .hsub   { font-size:10px; color:var(--muted); letter-spacing:3px; text-transform:uppercase; }
  .nav { display:flex; align-items:stretch; gap:2px; flex:1; }
  .nbtn {
    background:none; border:none; cursor:pointer;
    font-family:var(--fb); font-size:13px; font-weight:500;
    color:var(--muted); padding:0 18px;
    border-bottom:3px solid transparent; transition:all .2s;
  }
  .nbtn:hover { color:var(--text); }
  .nbtn.on  { color:var(--accent); border-bottom-color:var(--accent); }

  .content { flex:1; padding:32px 24px; max-width:1200px; margin:0 auto; width:100%; }

  .ph2 { font-family:var(--fd); font-size:34px; letter-spacing:3px; color:white; line-height:1; }
  .psub { color:var(--muted); font-size:13px; margin-top:6px; }

  /* TABS */
  .tabs { display:flex; gap:8px; margin-bottom:24px; flex-wrap:wrap; }
  .tbtn {
    background:var(--surface); border:1px solid var(--border);
    color:var(--muted); font-family:var(--fb);
    font-size:11px; font-weight:600; padding:8px 16px;
    border-radius:6px; cursor:pointer; transition:all .2s;
    letter-spacing:.5px; text-transform:uppercase;
  }
  .tbtn:hover { border-color:var(--accent); color:var(--text); }
  .tbtn.on { background:var(--accent); border-color:var(--accent); color:white; }

  /* SELECTORS */
  .selrow { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; align-items:center; }
  .sellbl { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
  .sel {
    background:var(--surface2); border:1px solid var(--border);
    color:var(--text); font-family:var(--fb); font-size:13px;
    padding:8px 12px; border-radius:6px; cursor:pointer; outline:none; transition:border-color .2s;
  }
  .sel:focus { border-color:var(--accent); }

  /* AVATAR */
  .av {
    border-radius:50%; border:2px solid var(--border); flex-shrink:0;
    background:var(--surface2); overflow:hidden;
    display:flex; align-items:center; justify-content:center;
    font-family:var(--fd); color:var(--muted);
  }
  .av-sm { width:34px; height:34px; font-size:13px; }
  .av-md { width:46px; height:46px; font-size:17px; }
  .av img { width:100%; height:100%; object-fit:cover; }

  /* RANKING */
  .rtbl { width:100%; border-collapse:collapse; }
  .rtbl thead tr { background:var(--surface2); border-bottom:2px solid var(--border); }
  .rtbl thead th {
    padding:12px 14px; text-align:left;
    font-size:10px; font-weight:600; color:var(--muted); letter-spacing:1.5px; text-transform:uppercase;
  }
  .rtbl .r { text-align:right; }
  .rtbl tbody tr { border-bottom:1px solid var(--border); transition:background .15s; }
  .rtbl tbody tr:hover { background:var(--surface2); }
  .rtbl td { padding:11px 14px; font-size:14px; vertical-align:middle; }
  .rpos  { font-family:var(--fd); font-size:19px; color:var(--muted); }
  .ravg  { font-family:var(--fd); font-size:22px; color:var(--accent2); letter-spacing:1px; }
  .rpts  { font-weight:600; }
  .rsrs  { color:var(--muted); font-size:13px; }
  .rxp   { color:var(--green); font-size:12px; font-weight:700; }
  .rxn   { color:var(--red);   font-size:12px; font-weight:700; }
  .rbarw { background:var(--border); border-radius:99px; height:5px; width:90px; }
  .rbar  { height:5px; border-radius:99px; background:linear-gradient(90deg,var(--accent),var(--accent2)); transition:width .5s; }
  .top1 { background:linear-gradient(90deg,rgba(245,158,11,.07),transparent) !important; }
  .top2 { background:linear-gradient(90deg,rgba(148,163,184,.04),transparent) !important; }
  .top3 { background:linear-gradient(90deg,rgba(180,83,9,.05),transparent) !important; }

  /* CARDS */
  .card { background:var(--surface); border:1px solid var(--border); border-radius:12px; padding:24px; }
  .ctitle {
    font-family:var(--fd); font-size:16px; letter-spacing:2px; color:white;
    margin-bottom:16px; display:flex; align-items:center; gap:10px;
  }

  /* STAT PILLS */
  .statrow { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:20px; }
  .statpill {
    background:var(--surface2); border:1px solid var(--border); border-radius:10px;
    padding:13px 18px; display:flex; flex-direction:column; gap:4px; min-width:96px;
  }
  .spv { font-family:var(--fd); font-size:26px; color:white; line-height:1; }
  .spl { font-size:10px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }

  /* BADGES */
  .bdg {
    font-family:var(--fb); font-size:10px; font-weight:700;
    padding:3px 8px; border-radius:4px; letter-spacing:1px; text-transform:uppercase;
  }
  .bb { background:rgba(59,130,246,.2);  color:var(--accent); }
  .ba { background:rgba(245,158,11,.2);  color:var(--accent2); }
  .bd { background:rgba(99,102,241,.2);  color:#818cf8; }

  /* FORM */
  .fgrid { display:grid; grid-template-columns:1fr 1fr; gap:16px; }
  .fg    { display:flex; flex-direction:column; gap:6px; }
  .flbl  { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; }
  .fin {
    background:var(--surface2); border:1px solid var(--border);
    color:var(--text); font-family:var(--fb); font-size:14px;
    padding:10px 12px; border-radius:8px; outline:none; transition:border-color .2s;
  }
  .fin:focus { border-color:var(--accent); }
  .fin::placeholder { color:var(--muted); }

  /* BUTTONS */
  .btn { font-family:var(--fb); font-size:13px; font-weight:600; padding:10px 18px; border-radius:8px; border:none; cursor:pointer; transition:all .2s; }
  .bp  { background:var(--accent); color:white; }
  .bp:hover { background:#2563eb; }
  .bs  { background:var(--surface2); color:var(--text); border:1px solid var(--border); }
  .bs:hover { border-color:var(--accent); }
  .bdd { background:rgba(239,68,68,.12); color:var(--red);   border:1px solid rgba(239,68,68,.25); }
  .bdd:hover { background:rgba(239,68,68,.22); }
  .bok { background:rgba(34,197,94,.12);  color:var(--green); border:1px solid rgba(34,197,94,.25); }
  .bok:hover { background:rgba(34,197,94,.22); }
  .bsm { padding:6px 11px; font-size:12px; }
  .bic { padding:7px 9px;  border-radius:6px; }

  /* RESULT BUTTONS */
  .rbtn { font-family:var(--fd); font-size:13px; letter-spacing:1px; padding:4px 9px; border-radius:5px; border:1px solid var(--border); cursor:pointer; transition:all .12s; background:var(--surface2); color:var(--muted); }
  .rbtn.sV { background:rgba(34,197,94,.18); color:var(--green); border-color:var(--green); }
  .rbtn.sE { background:rgba(234,179,8,.18); color:var(--yellow); border-color:var(--yellow); }
  .rbtn.sD { background:rgba(239,68,68,.18); color:var(--red);   border-color:var(--red); }

  /* TASK BLOCKS */
  .tblk  { border:1px solid var(--border); border-radius:10px; overflow:hidden; margin-bottom:12px; }
  .thead { background:var(--surface2); padding:12px 16px; display:flex; align-items:center; justify-content:space-between; }
  .tbody { padding:16px; }

  /* TOGGLE */
  .togw { display:flex; align-items:center; gap:8px; cursor:pointer; user-select:none; }
  .togi { display:none; }
  .togt { width:38px; height:21px; border-radius:99px; background:var(--border); position:relative; transition:background .2s; flex-shrink:0; }
  .togt.on { background:#6366f1; }
  .togth { position:absolute; top:3px; left:3px; width:15px; height:15px; border-radius:99px; background:white; transition:transform .2s; }

  /* SESSION ITEMS */
  .sitem { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:16px; display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }

  /* SPLIT CHIPS */
  .split-chip {
    display:inline-flex; align-items:center; gap:6px;
    padding:4px 10px; border-radius:99px; font-size:12px; font-weight:600;
    border:1px solid; cursor:pointer; transition:all .15s;
  }
  .split-dot { width:8px; height:8px; border-radius:50%; flex-shrink:0; }

  /* SPLIT MANAGER */
  .sm-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:12px; margin-bottom:20px; }
  .sm-card {
    background:var(--surface2); border-radius:10px; overflow:hidden;
    border:1px solid var(--border);
  }
  .sm-card-head {
    padding:14px 16px; display:flex; align-items:center; gap:10px;
  }
  .sm-card-body { padding:0 16px 14px; }
  .sm-months { display:flex; flex-wrap:wrap; gap:6px; }
  .mchip {
    font-size:11px; font-weight:600; padding:3px 9px; border-radius:99px;
    border:1px solid var(--border); cursor:pointer; transition:all .15s;
    background:var(--surface); color:var(--muted);
  }
  .mchip.on { color:white; }

  /* PLAYER GRID */
  .pgrid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:12px; }
  .pcard { background:var(--surface2); border:1px solid var(--border); border-radius:10px; padding:14px 16px; display:flex; align-items:center; gap:12px; transition:border-color .2s; }
  .pcard:hover { border-color:#2d3448; }
  .pname { font-weight:500; font-size:14px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .pid   { font-size:11px; color:var(--muted); margin-top:2px; }

  /* PHOTO MODAL */
  .pdrop { border:2px dashed var(--border); border-radius:10px; padding:20px; text-align:center; cursor:pointer; transition:border-color .2s; background:var(--surface2); }
  .pdrop:hover { border-color:var(--accent); }
  .overlay { position:fixed; inset:0; background:rgba(0,0,0,.75); display:flex; align-items:center; justify-content:center; z-index:200; padding:20px; }
  .modal { background:var(--surface); border:1px solid var(--border); border-radius:14px; padding:28px; max-width:520px; width:100%; max-height:90vh; overflow-y:auto; }
  .mtitle { font-family:var(--fd); font-size:20px; letter-spacing:2px; color:white; margin-bottom:20px; }

  .empty { text-align:center; padding:50px 20px; color:var(--muted); font-size:14px; }
  .ei    { font-size:36px; margin-bottom:10px; }

  /* REGISTRO RÁPIDO */
  .rr-container { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
  @media(max-width:800px){ .rr-container { grid-template-columns:1fr; } }
  .rr-input-panel { display:flex; flex-direction:column; gap:16px; }
  .rr-textarea {
    width:100%; min-height:180px; resize:vertical;
    background:var(--surface2); border:1px solid var(--border);
    color:var(--text); font-family:var(--fb); font-size:14px; line-height:1.6;
    padding:14px; border-radius:10px; outline:none; transition:border-color .2s;
  }
  .rr-textarea:focus { border-color:var(--accent); }
  .rr-textarea::placeholder { color:var(--muted); }
  .rr-mic-btn {
    width:64px; height:64px; border-radius:50%; border:none; cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:26px;
    transition:all .2s; flex-shrink:0;
    background:linear-gradient(135deg,var(--accent),#6366f1);
    box-shadow:0 4px 20px rgba(99,102,241,.4);
  }
  .rr-mic-btn.recording {
    background:linear-gradient(135deg,var(--red),#dc2626);
    box-shadow:0 4px 20px rgba(239,68,68,.5);
    animation:pulse-rec 1.2s ease-in-out infinite;
  }
  @keyframes pulse-rec {
    0%,100% { transform:scale(1); box-shadow:0 4px 20px rgba(239,68,68,.5); }
    50%      { transform:scale(1.08); box-shadow:0 4px 28px rgba(239,68,68,.8); }
  }
  .rr-audio-row { display:flex; align-items:center; gap:12px; }
  .rr-audio-label { font-size:12px; color:var(--muted); flex:1; }
  .rr-transcript-box {
    background:var(--bg); border:1px solid var(--border); border-radius:8px;
    padding:12px 14px; font-size:13px; color:var(--muted); line-height:1.6;
    min-height:60px; font-style:italic;
  }
  .rr-status {
    display:flex; align-items:center; gap:8px;
    font-size:13px; padding:10px 14px; border-radius:8px;
  }
  .rr-status.loading { background:rgba(59,130,246,.1); color:var(--accent); border:1px solid rgba(59,130,246,.2); }
  .rr-status.error   { background:rgba(239,68,68,.1);  color:var(--red);    border:1px solid rgba(239,68,68,.2); }
  .rr-status.success { background:rgba(34,197,94,.1);  color:var(--green);  border:1px solid rgba(34,197,94,.2); }
  .rr-spin { animation:spin .8s linear infinite; display:inline-block; }
  @keyframes spin { to { transform:rotate(360deg); } }

  /* PREVIEW PANEL */
  .rr-preview { display:flex; flex-direction:column; gap:12px; }
  .rr-preview-empty { display:flex; flex-direction:column; align-items:center; justify-content:center; min-height:300px; color:var(--muted); gap:12px; font-size:14px; }
  .rr-task-preview { background:var(--surface2); border:1px solid var(--border); border-radius:10px; overflow:hidden; }
  .rr-task-head { padding:10px 14px; background:var(--bg); border-bottom:1px solid var(--border); display:flex; align-items:center; gap:8px; }
  .rr-serie { padding:10px 14px; border-bottom:1px solid var(--border); }
  .rr-serie:last-child { border-bottom:none; }
  .rr-serie-title { font-size:11px; color:var(--muted); text-transform:uppercase; letter-spacing:1px; margin-bottom:8px; }
  .rr-player-row { display:flex; align-items:center; gap:8px; margin-bottom:4px; }
  .rr-result-chip { font-family:var(--fd); font-size:12px; letter-spacing:1px; padding:2px 8px; border-radius:4px; }
  .rr-V { background:rgba(34,197,94,.18); color:var(--green); }
  .rr-E { background:rgba(234,179,8,.18);  color:var(--yellow); }
  .rr-D { background:rgba(239,68,68,.18);  color:var(--red); }
  .rr-extra-list { display:flex; flex-wrap:wrap; gap:6px; margin-top:4px; }
  .rr-extra-chip { font-size:11px; padding:3px 8px; border-radius:4px; background:rgba(245,158,11,.15); color:var(--accent2); border:1px solid rgba(245,158,11,.3); }

  /* DRAG & DROP SPLITS */
  .dnd-board { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:16px; margin-bottom:20px; }
  .dnd-split-col {
    background:var(--surface2); border:1px solid var(--border); border-radius:12px;
    overflow:hidden; transition:border-color .2s, box-shadow .2s;
  }
  .dnd-split-col.drag-over {
    border-color:var(--accent) !important;
    box-shadow:0 0 0 2px rgba(59,130,246,.25);
  }
  .dnd-col-head {
    padding:12px 14px; display:flex; align-items:center; gap:10px;
    border-bottom:1px solid var(--border);
  }
  .dnd-col-body { padding:12px; min-height:80px; display:flex; flex-wrap:wrap; gap:6px; align-content:flex-start; }
  .dnd-month {
    display:inline-flex; align-items:center; gap:5px;
    padding:5px 11px; border-radius:99px; font-size:12px; font-weight:600;
    cursor:grab; user-select:none; transition:all .15s;
    border:1px solid;
  }
  .dnd-month:active { cursor:grabbing; }
  .dnd-month.dragging { opacity:.35; transform:scale(.95); }
  .dnd-month-unassigned {
    background:var(--surface); border-color:var(--border); color:var(--muted);
    cursor:grab;
  }
  .dnd-unassigned-col {
    background:var(--bg); border:1px dashed var(--border); border-radius:12px; padding:12px;
    min-height:60px; display:flex; flex-wrap:wrap; gap:6px; align-content:flex-start;
    transition:border-color .2s;
  }
  .dnd-unassigned-col.drag-over { border-color:var(--muted); }
  .dnd-hint { font-size:11px; color:var(--muted); margin-top:6px; display:flex; align-items:center; gap:5px; }

  /* MC SELECTOR */
  .mc-wrap { display:flex; flex-direction:column; gap:6px; }
  .mc-input-row { display:flex; align-items:stretch; gap:0; border:1px solid var(--border); border-radius:8px; overflow:hidden; background:var(--surface2); }
  .mc-arrow { background:var(--surface2); border:none; color:var(--muted); cursor:pointer; padding:0 11px; font-size:16px; transition:all .15s; flex-shrink:0; }
  .mc-arrow:hover { background:var(--border); color:var(--text); }
  .mc-arrow:disabled { opacity:.3; cursor:not-allowed; }
  .mc-num { border:none; background:transparent; color:var(--text); font-family:var(--fd); font-size:20px; letter-spacing:1px; text-align:center; width:56px; outline:none; padding:8px 4px; }
  .mc-num::-webkit-inner-spin-button, .mc-num::-webkit-outer-spin-button { -webkit-appearance:none; }
  .mc-sep { width:1px; background:var(--border); flex-shrink:0; }
  .mc-dropdown { background:var(--surface2); border:none; color:var(--muted); font-family:var(--fb); font-size:12px; padding:0 10px; cursor:pointer; outline:none; border-left:1px solid var(--border); flex-shrink:0; }
  .mc-dropdown:focus { color:var(--text); }
  .mc-week-label { font-size:11px; color:var(--muted); letter-spacing:.5px; }
  .mc-taken { font-size:11px; color:var(--red); margin-top:2px; }
  .mc-ok    { font-size:11px; color:var(--green); margin-top:2px; }

  /* COLOR SWATCHES */
  .swatches { display:flex; gap:8px; flex-wrap:wrap; margin-top:8px; }
  .swatch { width:26px; height:26px; border-radius:6px; cursor:pointer; border:2px solid transparent; transition:all .15s; flex-shrink:0; }
  .swatch.on { border-color:white; transform:scale(1.15); }
`;

// ─── MICROCICLO SELECTOR ─────────────────────────────────────────────────────
// props: value, onChange, year, takenMcs (Set of mc numbers already used), editingMc (current session's mc, exempt from duplicate check)
function MicrocicloSelector({ value, onChange, year=2026, takenMcs=new Set(), editingMc=null }) {
  const options = useMemo(() => buildMcOptions(year), [year]);
  const current = options.find(o => o.mc === value) ?? options[0];
  const isDuplicate = takenMcs.has(value) && value !== editingMc;

  function clamp(v) { return Math.max(1, Math.min(53, v)); }

  function handleManual(e) {
    const raw = e.target.value;
    if (raw === "" || /^\d{1,2}$/.test(raw)) {
      const n = raw === "" ? "" : Number(raw);
      onChange(n === "" ? "" : clamp(n));
    }
  }

  function handleBlur(e) {
    const n = Number(e.target.value);
    if (!n || n < 1) onChange(1);
    else onChange(clamp(n));
  }

  return (
    <div className="mc-wrap">
      <label className="flbl">Nº Semana</label>
      <div className="mc-input-row" style={{ borderColor: isDuplicate ? "var(--red)" : "var(--border)" }}>
        {/* Down arrow */}
        <button className="mc-arrow" onClick={() => onChange(clamp(Number(value||1) - 1))} disabled={value <= 1}>▾</button>
        {/* Manual number input */}
        <input
          className="mc-num"
          type="text"
          inputMode="numeric"
          value={value}
          onChange={handleManual}
          onBlur={handleBlur}
        />
        <div className="mc-sep"/>
        {/* Dropdown */}
        <select
          className="mc-dropdown"
          value={value}
          onChange={e => onChange(Number(e.target.value))}
        >
          {options.map(o => (
            <option key={o.mc} value={o.mc} disabled={takenMcs.has(o.mc) && o.mc !== editingMc}>
              Semana {String(o.mc).padStart(2,"0")} · {o.month} · {o.dateRange}{takenMcs.has(o.mc) && o.mc !== editingMc ? " ✗" : ""}
            </option>
          ))}
        </select>
        {/* Up arrow */}
        <button className="mc-arrow" onClick={() => onChange(clamp(Number(value||1) + 1))} disabled={value >= 53}>▴</button>
      </div>
      {current && (
        <div className="mc-week-label">
          Semana ISO {String(current.mc).padStart(2,"0")} · {current.dateRange}
        </div>
      )}
      {isDuplicate && (
        <div className="mc-taken">⚠ Esta semana ya existe — edítala desde el listado</div>
      )}
      {!isDuplicate && value && (
        <div className="mc-ok">✓ Semana disponible</div>
      )}
    </div>
  );
}

// ─── AVATAR ───────────────────────────────────────────────────────────────────
function Av({ player, size="sm" }) {
  return (
    <div className={`av av-${size}`}>
      {player.photo ? <img src={player.photo} alt={player.name} /> : initials(player.name)}
    </div>
  );
}

// ─── APP ──────────────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage]       = useState("ranking");
  const [players, setPlayers] = useState(SEED_PLAYERS);
  const [sessions, setSessions] = useState([buildSeedSession()]);
  const [splits, setSplits]   = useState(DEFAULT_SPLITS);

  return (
    <>
      <style>{css}</style>
      <div className="app">
        <header className="hdr">
          <div className="hbrand">
            <div className="hicon">⚽</div>
            <div>
              <div className="htitle">COMPETITIVA AB</div>
              <div className="hsub">Temporada 25/26</div>
            </div>
          </div>
          <nav className="nav">
            {[
              ["ranking",   "🏆 Clasificación"],
              ["registro",  "📋 Registro"],
              ["jugadores", "👥 Jugadores"],
              ["splits",    "⚙️ Splits"],
            ].map(([id,lbl]) => (
              <button key={id} className={`nbtn ${page===id?"on":""}`} onClick={()=>setPage(id)}>{lbl}</button>
            ))}
          </nav>
        </header>
        <main className="content">
          {page==="ranking"   && <RankingPage   players={players} sessions={sessions} splits={splits} />}
          {page==="registro"  && <RegistroHub   players={players} sessions={sessions} setSessions={setSessions} splits={splits} />}
          {page==="jugadores" && <JugadoresPage players={players} setPlayers={setPlayers} />}
          {page==="splits"    && <SplitsPage    splits={splits} setSplits={setSplits} sessions={sessions} setSessions={setSessions} />}
        </main>
      </div>
    </>
  );
}

// ─── RANKING ─────────────────────────────────────────────────────────────────
function RankingPage({ players, sessions, splits }) {
  const [view, setView]   = useState("microciclo");
  const [splitId, setSplitId] = useState("sp3");
  const [month, setMonth] = useState("Febrero");
  const [semana, setSemana] = useState(26);

  const currentSplit = splits.find(s=>s.id===splitId) ?? splits[0];
  const monthsForSplit = currentSplit?.months ?? ALL_MONTHS;

  const semanas = useMemo(
    () => getMicrciclosForMonth(sessions, month, splitId, 2026),
    [sessions, month, splitId]
  );

  const filtered = useMemo(() => {
    if (view==="semanal") return filterSessions(sessions, { microciclo: semana ?? semanas[0], month, split:splitId, year:2026 });
    if (view==="mensual")    return filterSessions(sessions, { month, split:splitId, year:2026 });
    if (view==="split")      return filterSessions(sessions, { split:splitId, year:2026 });
    return sessions;
  }, [view, sessions, semana, month, splitId, semanas]);

  const ranking = useMemo(()=>buildRanking(players,filtered),[players,filtered]);
  const maxAvg = ranking[0]?.avg || 1;
  const accentCol = splitColor(splits, splitId);

  return (
    <div>
      <div style={{marginBottom:28}}>
        <div className="ph2">CLASIFICACIÓN</div>
        <div className="psub">Ranking por promedio · puntos totales / series jugadas</div>
      </div>

      <div className="tabs">
        {[["semanal","Semanal"],["mensual","Mensual"],["split","Split"],["general","General"]].map(([id,lbl])=>(
          <button key={id} className={`tbtn ${view===id?"on":""}`} onClick={()=>setView(id)}>{lbl}</button>
        ))}
      </div>

      <div className="selrow">
        {view!=="general" && (
          <>
            <span className="sellbl">Split</span>
            <select className="sel" value={splitId} onChange={e=>{setSplitId(e.target.value); setMonth((splits.find(s=>s.id===e.target.value)?.months??ALL_MONTHS)[0]);}}>
              {splits.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </>
        )}
        {(view==="semanal"||view==="mensual") && (
          <>
            <span className="sellbl">Mes</span>
            <select className="sel" value={month} onChange={e=>setMonth(e.target.value)}>
              {monthsForSplit.map(m=><option key={m}>{m}</option>)}
            </select>
          </>
        )}
        {view==="semanal" && semanas.length>0 && (
          <>
            <span className="sellbl">Semana</span>
            <select className="sel" value={semana??semanas[0]} onChange={e=>setSemana(Number(e.target.value))}>
              {semanas.map(w=><option key={w} value={w}>Semana {w}</option>)}
            </select>
          </>
        )}
      </div>

      <div className="statrow">
        {[
          [ranking.filter(r=>r.totalSeries>0).length,"Activos"],
          [filtered.length,"Sesiones"],
          [filtered.reduce((a,s)=>a+s.tasks.reduce((b,t)=>b+t.series.length,0),0),"Series"],
          [ranking[0]?.avg.toFixed(2)??"—","Mejor avg"],
        ].map(([val,lbl])=>(
          <div key={lbl} className="statpill">
            <span className="spv" style={lbl==="Mejor avg"?{color:"var(--accent2)"}:{}}>{val}</span>
            <span className="spl">{lbl}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{padding:0,overflow:"hidden"}}>
        <table className="rtbl">
          <thead>
            <tr>
              <th style={{width:50}}>#</th>
              <th>Jugador</th>
              <th className="r">Series</th>
              <th className="r">Pts</th>
              <th className="r">Extra</th>
              <th className="r">Avg</th>
              <th style={{width:110}}></th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((p,i)=>{
              const med=["🥇","🥈","🥉"][i]??null;
              const rc=i===0?"top1":i===1?"top2":i===2?"top3":"";
              return (
                <tr key={p.id} className={rc}>
                  <td>{med?<span style={{fontSize:20}}>{med}</span>:<span className="rpos">{i+1}°</span>}</td>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Av player={p} size="sm"/>
                      <span style={{fontWeight:500}}>{p.name}</span>
                    </div>
                  </td>
                  <td className="r"><span className="rsrs">{p.totalSeries}</span></td>
                  <td className="r"><span className="rpts">{p.totalPts}</span></td>
                  <td className="r">
                    {p.extraTotal!==0&&<span className={p.extraTotal>0?"rxp":"rxn"}>{p.extraTotal>0?`+${p.extraTotal}`:p.extraTotal}</span>}
                  </td>
                  <td className="r"><span className="ravg">{p.avg.toFixed(2)}</span></td>
                  <td>
                    <div className="rbarw">
                      <div className="rbar" style={{width:`${maxAvg>0?(p.avg/maxAvg)*100:0}%`, background:`linear-gradient(90deg,${accentCol},var(--accent2))`}} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── REGISTRO ────────────────────────────────────────────────────────────────
// ─── REGISTRO HUB ────────────────────────────────────────────────────────────
function RegistroHub({ players, sessions, setSessions, splits }) {
  const [vista, setVista] = useState("manual");
  const props = { players, sessions, setSessions, splits };
  return (
    <div>
      <div style={{marginBottom:24}}>
        <div className="ph2">REGISTRO</div>
        <div className="psub">Introduce los resultados manualmente o por voz / texto libre</div>
      </div>
      <div className="tabs">
        <button className={`tbtn ${vista==="manual"?"on":""}`} onClick={()=>setVista("manual")}>✏️ Manual</button>
        <button className={`tbtn ${vista==="rapido"?"on":""}`} onClick={()=>setVista("rapido")}>🎙️ Registro rápido</button>
      </div>
      {vista==="manual" && <RegistroPage  {...props} hideHeader />}
      {vista==="rapido" && <RegistroRapido {...props} hideHeader />}
    </div>
  );
}

function RegistroPage({ players, sessions, setSessions, splits, hideHeader }) {
  const [mode, setMode] = useState("list");
  const [editing, setEditing] = useState(null);

  if (mode!=="list") {
    return (
      <SessionForm
        players={players} splits={splits} sessions={sessions} initial={editing}
        onSave={s=>{
          setSessions(prev=>s.id&&prev.find(x=>x.id===s.id)?prev.map(x=>x.id===s.id?s:x):[...prev,{...s,id:`s${Date.now()}`}]);
          setMode("list"); setEditing(null);
        }}
        onCancel={()=>{setMode("list");setEditing(null);}}
      />
    );
  }

  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20}}>
        {!hideHeader && <div><div className="ph2">REGISTRO</div><div className="psub">Sesiones y resultados por tarea</div></div>}
        <button className="btn bp" style={{marginLeft:"auto"}} onClick={()=>setMode("new")}>+ Nueva sesión</button>
      </div>
      {sessions.length===0
        ? <div className="empty"><div className="ei">📋</div>Sin sesiones registradas</div>
        : [...sessions].reverse().map(s=>{
            const sp = splits.find(x=>x.id===s.split);
            return (
              <div key={s.id} className="sitem">
                <div>
                  <div style={{fontWeight:600,fontSize:15,display:"flex",alignItems:"center",gap:8}}>
                    {sp&&<span style={{display:"inline-block",width:10,height:10,borderRadius:"50%",background:sp.color,flexShrink:0}}/>}
                    {sp?.name??s.split} · {s.month} · Semana {s.microciclo}
                    {s.id==="session_m26"&&<span className="bdg ba" style={{marginLeft:4}}>M26</span>}
                  </div>
                  <div style={{fontSize:12,color:"var(--muted)",marginTop:4}}>
                    {s.tasks.length} tarea(s) · {s.tasks.reduce((a,t)=>a+t.series.length,0)} series
                    {s.tasks.some(t=>t.isDouble)&&<span className="bdg bd" style={{marginLeft:8}}>Doble</span>}
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="btn bs bsm" onClick={()=>{setEditing(s);setMode("edit");}}>Editar</button>
                  <button className="btn bdd bsm" onClick={()=>setSessions(prev=>prev.filter(x=>x.id!==s.id))}>Eliminar</button>
                </div>
              </div>
            );
          })
      }
    </div>
  );
}

// ─── SESSION FORM ─────────────────────────────────────────────────────────────
function SessionForm({ players, splits, sessions, initial, onSave, onCancel }) {
  const firstSplit = splits[0];
  const [splitId, setSplitId] = useState(initial?.split ?? firstSplit?.id ?? "");
  const currentSplit = splits.find(s=>s.id===splitId)??firstSplit;
  const [month, setMonth]   = useState(initial?.month ?? currentSplit?.months?.[0] ?? "Enero");
  const [semana, setSemana]         = useState(initial?.microciclo ?? 1);
  const year = initial?.year ?? 2026;
  // Set of microciclos already taken (excluding the current session being edited)
  const takenMcs = useMemo(() => {
    const s = new Set();
    sessions.forEach(sess => { if (sess.id !== initial?.id) s.add(sess.microciclo); });
    return s;
  }, [sessions, initial?.id]);
  const [tasks, setTasks]   = useState(initial?.tasks ?? []);
  const [extras, setExtras] = useState(initial?.extras ?? {});

  const addTask = ()=>setTasks(p=>[...p,{id:`t${Date.now()}`,name:`Tarea ${p.length+1}`,isDouble:false,series:[]}]);
  const updTask = (tid,f,v)=>setTasks(p=>p.map(t=>t.id===tid?{...t,[f]:v}:t));
  const delTask = (tid)=>setTasks(p=>p.filter(t=>t.id!==tid));
  const addSerie = (tid)=>{
    const res={}; players.forEach(p=>{res[p.id]=undefined;});
    setTasks(p=>p.map(t=>t.id===tid?{...t,series:[...t.series,{id:`sr${Date.now()}`,results:res}]}:t));
  };
  const delSerie = (tid,sid)=>setTasks(p=>p.map(t=>t.id===tid?{...t,series:t.series.filter(s=>s.id!==sid)}:t));
  const setRes   = (tid,sid,pid,val)=>setTasks(p=>p.map(t=>
    t.id===tid?{...t,series:t.series.map(s=>{
      if(s.id!==sid) return s;
      // toggle off if same value clicked again
      const cur=s.results[pid];
      const next={...s.results,[pid]:cur===val?undefined:val};
      return {...s,results:next};
    })}:t
  ));

  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28}}>
        <div>
          <div className="ph2">{initial?"EDITAR SESIÓN":"NUEVA SESIÓN"}</div>
          <div className="psub">Registra tareas, series y resultados</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button className="btn bs" onClick={onCancel}>Cancelar</button>
          <button
            className="btn bp"
            style={{opacity: takenMcs.has(semana) && semana !== initial?.microciclo ? .4 : 1}}
            disabled={takenMcs.has(semana) && semana !== initial?.microciclo}
            onClick={()=>onSave({id:initial?.id,split:splitId,month,microciclo:semana,year,tasks,extras})}
          >Guardar sesión</button>
        </div>
      </div>

      <div className="card">
        <div className="ctitle">📅 Contexto temporal</div>
        <div className="fgrid">
          <div className="fg">
            <label className="flbl">Split</label>
            <select className="fin sel" value={splitId} onChange={e=>{setSplitId(e.target.value);setMonth((splits.find(s=>s.id===e.target.value)?.months??ALL_MONTHS)[0]);}}>
              {splits.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div className="fg">
            <label className="flbl">Mes</label>
            <select className="fin sel" value={month} onChange={e=>setMonth(e.target.value)}>
              {(currentSplit?.months??ALL_MONTHS).map(m=><option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="fg" style={{gridColumn:"1 / -1"}}>
            <MicrocicloSelector
              value={semana}
              onChange={setSemana}
              year={year}
              takenMcs={takenMcs}
              editingMc={initial?.microciclo ?? null}
            />
          </div>
        </div>
      </div>

      <div className="card" style={{marginTop:16}}>
        <div className="ctitle">⭐ Puntos extra / penalizaciones</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:8}}>
          {players.map(p=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--bg)",borderRadius:8,padding:"8px 10px",border:"1px solid var(--border)"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <Av player={p} size="sm"/>
                <span style={{fontSize:13,fontWeight:500}}>{p.name}</span>
              </div>
              <input
                type="number" className="fin"
                style={{width:60,padding:"4px 8px",textAlign:"center"}}
                value={extras[p.id]??0}
                onChange={e=>setExtras(prev=>({...prev,[p.id]:e.target.value===""?0:Number(e.target.value)}))}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{marginTop:24}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
          <span style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:2}}>TAREAS</span>
          <button className="btn bs" onClick={addTask}>+ Añadir tarea</button>
        </div>

        {tasks.length===0&&<div className="empty"><div className="ei">⚽</div>Añade tareas a esta sesión</div>}

        {tasks.map((task,ti)=>(
          <div className="tblk" key={task.id}>
            <div className="thead">
              <div style={{display:"flex",gap:12,alignItems:"center"}}>
                <input className="fin" style={{width:190}} value={task.name} onChange={e=>updTask(task.id,"name",e.target.value)} placeholder={`Tarea ${ti+1}`}/>
                <label className="togw">
                  <input type="checkbox" className="togi" checked={task.isDouble} onChange={e=>updTask(task.id,"isDouble",e.target.checked)}/>
                  <div className={`togt ${task.isDouble?"on":""}`}>
                    <div className="togth" style={{transform:task.isDouble?"translateX(17px)":"none"}}/>
                  </div>
                  <span style={{fontSize:13,color:task.isDouble?"#818cf8":"var(--muted)"}}>
                    Doble {task.isDouble&&<span className="bdg bd">×2</span>}
                  </span>
                </label>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button className="btn bok bsm" onClick={()=>addSerie(task.id)}>+ Serie</button>
                <button className="btn bdd bsm" onClick={()=>delTask(task.id)}>✕</button>
              </div>
            </div>
            <div className="tbody">
              {task.series.length===0&&<div style={{textAlign:"center",color:"var(--muted)",padding:"14px 0",fontSize:13}}>Añade series a esta tarea</div>}
              {task.series.map((serie,si)=>(
                <div key={serie.id} style={{marginBottom:14,paddingBottom:14,borderBottom:si<task.series.length-1?"1px solid var(--border)":"none"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
                    <span className="bdg bb">Serie {si+1}</span>
                    <button className="btn bdd bsm bic" onClick={()=>delSerie(task.id,serie.id)}>✕</button>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(225px,1fr))",gap:6}}>
                    {players.map(p=>(
                      <div key={p.id} style={{display:"flex",alignItems:"center",justifyContent:"space-between",background:"var(--bg)",borderRadius:8,padding:"7px 10px",border:"1px solid var(--border)"}}>
                        <div style={{display:"flex",alignItems:"center",gap:7}}>
                          <Av player={p} size="sm"/>
                          <span style={{fontSize:12,fontWeight:500}}>{p.name}</span>
                        </div>
                        <div style={{display:"flex",gap:3}}>
                          {RESULT_OPTIONS.map(opt=>(
                            <button
                              key={opt.label}
                              className={`rbtn ${serie.results[p.id]===opt.value?"s"+opt.label:""}`}
                              onClick={()=>setRes(task.id,serie.id,p.id,opt.value)}
                            >{opt.label}</button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── SPLITS PAGE ──────────────────────────────────────────────────────────────
function SplitsPage({ splits, setSplits, sessions, setSessions }) {
  const [modal, setModal]       = useState(null);
  const [dragging, setDragging] = useState(null); // { month, fromSplitId }
  const [overCol, setOverCol]   = useState(null); // splitId | "unassigned"

  function saveSplit(sp) {
    setSplits(prev =>
      sp.id && prev.find(x=>x.id===sp.id)
        ? prev.map(x=>x.id===sp.id?sp:x)
        : [...prev, { ...sp, id:`sp${Date.now()}` }]
    );
    setModal(null);
  }

  function deleteSplit(id) {
    if (sessions.some(s=>s.split===id)) {
      alert("Este split tiene sesiones registradas. Elimina primero las sesiones asociadas.");
      return;
    }
    setSplits(prev=>prev.filter(s=>s.id!==id));
  }

  // Move month from one split to another (or to unassigned)
  function moveMonth(month, fromSplitId, toSplitId) {
    if (fromSplitId === toSplitId) return;
    setSplits(prev => prev.map(sp => {
      if (sp.id === fromSplitId) return { ...sp, months: sp.months.filter(m=>m!==month) };
      if (sp.id === toSplitId)   return { ...sp, months: [...sp.months, month] };
      return sp;
    }));
  }

  // Drag handlers
  function onDragStart(e, month, fromSplitId) {
    setDragging({ month, fromSplitId });
    e.dataTransfer.effectAllowed = "move";
    // Ghost image: just the chip
    e.dataTransfer.setData("text/plain", month);
  }

  function onDragEnd() {
    setDragging(null);
    setOverCol(null);
  }

  function onDragOver(e, colId) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverCol(colId);
  }

  function onDrop(e, toSplitId) {
    e.preventDefault();
    if (!dragging) return;
    if (dragging.fromSplitId === toSplitId) { setDragging(null); setOverCol(null); return; }
    if (toSplitId === "unassigned") {
      // Remove from current split
      setSplits(prev => prev.map(sp =>
        sp.id === dragging.fromSplitId ? { ...sp, months: sp.months.filter(m=>m!==dragging.month) } : sp
      ));
    } else {
      moveMonth(dragging.month, dragging.fromSplitId, toSplitId);
    }
    setDragging(null);
    setOverCol(null);
  }

  const assignedMonths = new Set(splits.flatMap(s=>s.months));
  const unassigned = ALL_MONTHS.filter(m=>!assignedMonths.has(m));

  return (
    <div>
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:28}}>
        <div>
          <div className="ph2">SPLITS</div>
          <div className="psub">Arrastra los meses entre splits para reorganizarlos · o edita manualmente con ✏️</div>
        </div>
        <button className="btn bp" onClick={()=>setModal({name:"",color:SPLIT_COLORS[0],months:[]})}>+ Nuevo split</button>
      </div>

      {/* ── DRAG & DROP BOARD */}
      <div className="dnd-board">
        {splits.map(sp=>(
          <div
            key={sp.id}
            className={`dnd-split-col ${overCol===sp.id?"drag-over":""}`}
            style={{borderColor: overCol===sp.id ? sp.color : sp.color+"44"}}
            onDragOver={e=>onDragOver(e, sp.id)}
            onDragLeave={()=>setOverCol(null)}
            onDrop={e=>onDrop(e, sp.id)}
          >
            {/* Column header */}
            <div className="dnd-col-head" style={{background: sp.color+"18"}}>
              <div style={{width:12,height:12,borderRadius:"50%",background:sp.color,flexShrink:0}}/>
              <span style={{fontFamily:"var(--fd)",fontSize:17,letterSpacing:2,color:"white",flex:1}}>{sp.name.toUpperCase()}</span>
              <div style={{display:"flex",gap:4}}>
                <button className="btn bs bsm bic" onClick={()=>setModal({...sp})} title="Editar">✏️</button>
                <button className="btn bdd bsm bic" onClick={()=>deleteSplit(sp.id)} title="Eliminar">✕</button>
              </div>
            </div>

            {/* Month chips */}
            <div className="dnd-col-body">
              {sp.months.length===0 && (
                <span style={{fontSize:12,color:"var(--muted)",padding:"4px 2px"}}>Suelta meses aquí</span>
              )}
              {ALL_MONTHS.filter(m=>sp.months.includes(m)).map(m=>(
                <span
                  key={m}
                  className={`dnd-month ${dragging?.month===m?"dragging":""}`}
                  style={{
                    background: sp.color+"2a",
                    borderColor: sp.color+"88",
                    color: "white",
                  }}
                  draggable
                  onDragStart={e=>onDragStart(e, m, sp.id)}
                  onDragEnd={onDragEnd}
                  title="Arrastra para mover"
                >
                  ⠿ {m}
                  <button
                    onClick={e=>{ e.stopPropagation(); setSplits(prev=>prev.map(s=>s.id===sp.id?{...s,months:s.months.filter(x=>x!==m)}:s)); }}
                    title="Quitar mes"
                    style={{
                      background:"none", border:"none", cursor:"pointer",
                      color: sp.color, opacity:.7, fontSize:13,
                      padding:"0 0 0 4px", lineHeight:1, fontWeight:700,
                      transition:"opacity .15s",
                    }}
                    onMouseEnter={e=>e.currentTarget.style.opacity=1}
                    onMouseLeave={e=>e.currentTarget.style.opacity=.7}
                  >×</button>
                </span>
              ))}
            </div>

            <div style={{padding:"6px 12px 10px",fontSize:11,color:"var(--muted)"}}>
              {sessions.filter(s=>s.split===sp.id).length} sesiones registradas
            </div>
          </div>
        ))}
      </div>

      {/* ── UNASSIGNED MONTHS */}
      {unassigned.length > 0 && (
        <div style={{marginBottom:20}}>
          <div style={{fontSize:11,color:"var(--muted)",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>
            Meses sin asignar
          </div>
          <div
            className={`dnd-unassigned-col ${overCol==="unassigned"?"drag-over":""}`}
            onDragOver={e=>onDragOver(e,"unassigned")}
            onDragLeave={()=>setOverCol(null)}
            onDrop={e=>onDrop(e,"unassigned")}
          >
            {unassigned.map(m=>(
              <span
                key={m}
                className="dnd-month dnd-month-unassigned"
                draggable
                onDragStart={e=>onDragStart(e, m, null)}
                onDragEnd={onDragEnd}
              >
                ⠿ {m}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="dnd-hint">
        <span>💡</span> Arrastra cualquier mes a otro split para reasignarlo. Suéltalo en "Meses sin asignar" para desvincularlo.
      </div>

      {modal!==null && (
        <SplitModal
          initial={modal}
          splits={splits}
          onSave={saveSplit}
          onClose={()=>setModal(null)}
        />
      )}
    </div>
  );
}

// ─── SPLIT MODAL ──────────────────────────────────────────────────────────────
function SplitModal({ initial, splits, onSave, onClose }) {
  const [name, setName]     = useState(initial.name ?? "");
  const [color, setColor]   = useState(initial.color ?? SPLIT_COLORS[0]);
  const [months, setMonths] = useState(initial.months ?? []);

  // months already used by other splits
  const usedMonths = useMemo(()=>{
    const used = new Set();
    splits.forEach(s=>{ if(s.id!==initial.id) s.months.forEach(m=>used.add(m)); });
    return used;
  },[splits,initial.id]);

  function toggleMonth(m) {
    if (usedMonths.has(m)) return;
    setMonths(prev=>prev.includes(m)?prev.filter(x=>x!==m):[...prev,m]);
  }

  function handleSave() {
    if (!name.trim()) return;
    onSave({ id:initial.id, name:name.trim(), color, months });
  }

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="mtitle">{initial.id?"EDITAR SPLIT":"NUEVO SPLIT"}</div>

        <div className="fg" style={{marginBottom:16}}>
          <label className="flbl">Nombre del split</label>
          <input className="fin" placeholder="Ej: Pretemporada, Otoño…" value={name} onChange={e=>setName(e.target.value)}/>
        </div>

        <div className="fg" style={{marginBottom:20}}>
          <label className="flbl">Color identificativo</label>
          <div className="swatches">
            {SPLIT_COLORS.map(c=>(
              <div
                key={c}
                className={`swatch ${color===c?"on":""}`}
                style={{background:c}}
                onClick={()=>setColor(c)}
              />
            ))}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:10}}>
            <div style={{width:26,height:26,borderRadius:6,background:color,flexShrink:0}}/>
            <input
              className="fin" style={{width:110,padding:"6px 10px",fontSize:13}}
              value={color} onChange={e=>setColor(e.target.value)}
              placeholder="#rrggbb"
            />
          </div>
        </div>

        <div className="fg" style={{marginBottom:20}}>
          <label className="flbl">Meses del split</label>
          <div style={{fontSize:11,color:"var(--muted)",marginBottom:8}}>Los meses grises ya están asignados a otro split</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
            {ALL_MONTHS.map(m=>{
              const taken = usedMonths.has(m);
              const active = months.includes(m);
              return (
                <div
                  key={m}
                  onClick={()=>toggleMonth(m)}
                  style={{
                    padding:"8px 10px", borderRadius:8, textAlign:"center",
                    fontSize:13, fontWeight:600, cursor:taken?"not-allowed":"pointer",
                    border:`1px solid ${active?color+"88":taken?"#1a1e28":"var(--border)"}`,
                    background:active?color+"33":taken?"var(--bg)":"var(--surface2)",
                    color:active?"white":taken?"#2a3040":"var(--muted)",
                    transition:"all .15s", opacity:taken?.45:1,
                  }}
                >
                  {m}
                </div>
              );
            })}
          </div>
        </div>

        {/* Preview */}
        <div style={{background:"var(--surface2)",borderRadius:8,padding:"10px 14px",marginBottom:20,border:`1px solid ${color}44`}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <div style={{width:10,height:10,borderRadius:"50%",background:color}}/>
            <span style={{fontFamily:"var(--fd)",fontSize:16,letterSpacing:2,color:"white"}}>{name||"NOMBRE SPLIT"}</span>
          </div>
          <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {months.length===0
              ? <span style={{fontSize:11,color:"var(--muted)"}}>Sin meses</span>
              : months.map(m=><span key={m} style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:color+"33",color:"white",border:`1px solid ${color}55`}}>{m}</span>)
            }
          </div>
        </div>

        <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
          <button className="btn bs" onClick={onClose}>Cancelar</button>
          <button className="btn bp" onClick={handleSave} style={{opacity:name.trim()?1:.5}}>
            {initial.id?"Guardar cambios":"Crear split"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── JUGADORES ────────────────────────────────────────────────────────────────
function JugadoresPage({ players, setPlayers }) {
  const [newName, setNewName] = useState("");
  const [photoModal, setPhotoModal] = useState(null);

  const addPlayer = () => {
    const name = newName.trim();
    if (!name) return;
    setPlayers(p=>[...p,{id:`p${Date.now()}`,name,photo:null}]);
    setNewName("");
  };

  const modalPlayer = players.find(p=>p.id===photoModal);

  return (
    <div>
      <div style={{marginBottom:28}}>
        <div className="ph2">JUGADORES</div>
        <div className="psub">Gestiona el roster y las fotos</div>
      </div>

      <div className="card" style={{marginBottom:24}}>
        <div className="ctitle">➕ Añadir jugador</div>
        <div style={{display:"flex",gap:12,alignItems:"center"}}>
          <input className="fin" style={{flex:1,maxWidth:360}} placeholder="Nombre del jugador…" value={newName} onChange={e=>setNewName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPlayer()}/>
          <button className="btn bp" onClick={addPlayer}>Añadir</button>
        </div>
      </div>

      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
        <span style={{fontFamily:"var(--fd)",fontSize:20,letterSpacing:2}}>ROSTER</span>
        <span className="bdg bb">{players.length} jugadores</span>
      </div>

      <div className="pgrid">
        {players.map((p,i)=>(
          <div key={p.id} className="pcard">
            <Av player={p} size="md"/>
            <div style={{flex:1,minWidth:0}}>
              <div className="pname">{p.name}</div>
              <div className="pid">#{String(i+1).padStart(2,"0")}</div>
            </div>
            <div style={{display:"flex",gap:6,flexShrink:0}}>
              <button className="btn bs bsm bic" title="Cambiar foto" onClick={()=>setPhotoModal(p.id)}>📷</button>
              <button className="btn bdd bsm bic" title="Eliminar" onClick={()=>setPlayers(prev=>prev.filter(x=>x.id!==p.id))}>✕</button>
            </div>
          </div>
        ))}
      </div>

      {photoModal&&modalPlayer&&(
        <PhotoModal
          player={modalPlayer}
          onSave={photo=>{setPlayers(prev=>prev.map(p=>p.id===modalPlayer.id?{...p,photo}:p));setPhotoModal(null);}}
          onClose={()=>setPhotoModal(null)}
        />
      )}
    </div>
  );
}

// ─── PHOTO MODAL ──────────────────────────────────────────────────────────────
function PhotoModal({ player, onSave, onClose }) {
  const [tab,setTab]         = useState("upload");
  const [preview,setPreview] = useState(player.photo||null);
  const [url,setUrl]         = useState(player.photo?.startsWith("http")?player.photo:"");
  const fileRef              = useRef();

  const handleFile = e=>{
    const file=e.target.files[0]; if(!file) return;
    const r=new FileReader();
    r.onload=ev=>setPreview(ev.target.result);
    r.readAsDataURL(file);
  };

  return (
    <div className="overlay" onClick={onClose}>
      <div className="modal" onClick={e=>e.stopPropagation()}>
        <div className="mtitle">📷 {player.name.toUpperCase()}</div>
        <div style={{display:"flex",justifyContent:"center",marginBottom:20}}>
          <div style={{width:88,height:88,borderRadius:"50%",overflow:"hidden",border:"3px solid var(--border)",background:"var(--surface2)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"var(--fd)",fontSize:26,color:"var(--muted)"}}>
            {preview?<img src={preview} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={()=>setPreview(null)}/>:initials(player.name)}
          </div>
        </div>
        <div className="tabs" style={{marginBottom:16}}>
          <button className={`tbtn ${tab==="upload"?"on":""}`} onClick={()=>setTab("upload")}>Subir archivo</button>
          <button className={`tbtn ${tab==="url"?"on":""}`} onClick={()=>setTab("url")}>URL de imagen</button>
        </div>
        {tab==="upload"&&(
          <>
            <div className="pdrop" onClick={()=>fileRef.current.click()}>
              <div style={{fontSize:28,marginBottom:8}}>📁</div>
              <div style={{fontSize:13,color:"var(--muted)"}}>Clic para seleccionar imagen</div>
              <div style={{fontSize:11,color:"var(--muted)",marginTop:4}}>JPG · PNG · WEBP</div>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}} onChange={handleFile}/>
          </>
        )}
        {tab==="url"&&(
          <div style={{display:"flex",gap:8}}>
            <input className="fin" style={{flex:1}} placeholder="https://…" value={url} onChange={e=>setUrl(e.target.value)} onKeyDown={e=>e.key==="Enter"&&url.trim()&&setPreview(url.trim())}/>
            <button className="btn bs" onClick={()=>url.trim()&&setPreview(url.trim())}>Ver</button>
          </div>
        )}
        <div style={{display:"flex",gap:8,marginTop:20,justifyContent:"flex-end"}}>
          {player.photo&&<button className="btn bdd" onClick={()=>onSave(null)}>Eliminar foto</button>}
          <button className="btn bs" onClick={onClose}>Cancelar</button>
          <button className="btn bp" onClick={()=>onSave(preview)} style={{opacity:preview?1:.5}}>Guardar</button>
        </div>
      </div>
    </div>
  );
}

// ─── REGISTRO RÁPIDO ──────────────────────────────────────────────────────────
function RegistroRapido({ players, sessions, setSessions, splits, hideHeader }) {
  const [text, setText]           = useState("");
  const [status, setStatus]       = useState(null); // null | {type, msg}
  const [preview, setPreview]     = useState(null); // parsed session object
  const [recording, setRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const mediaRef  = useRef(null);
  const chunksRef = useRef([]);

  // ── Transcribe audio via Whisper (base64 → text via Claude prompt workaround)
  // We use the Anthropic messages API with the audio as a document and ask Claude to transcribe
  async function transcribeAudio(blob) {
    setStatus({ type:"loading", msg:"Transcribiendo audio…" });
    try {
      const b64 = await blobToBase64(blob);
      const mediaType = blob.type || "audio/webm";
      // Ask Claude to transcribe using vision/document API
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{
            role:"user",
            content:[
              {
                type:"text",
                text:"Transcribe exactamente el audio que te adjunto. Devuelve SOLO la transcripción, sin explicaciones ni prefijos."
              },
              {
                type:"document",
                source:{ type:"base64", media_type: mediaType, data: b64 }
              }
            ]
          }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const transcribed = data.content?.map(c=>c.text||"").join("").trim();
      setTranscript(transcribed);
      setText(transcribed);
      setStatus({ type:"success", msg:"Audio transcrito correctamente" });
    } catch(e) {
      setStatus({ type:"error", msg:"Error al transcribir: " + e.message });
    }
  }

  // ── Recording controls
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      const mr = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg" });
      chunksRef.current = [];
      mr.ondataavailable = e => { if(e.data.size>0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType });
        stream.getTracks().forEach(t=>t.stop());
        await transcribeAudio(blob);
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(true);
      setStatus({ type:"loading", msg:"Grabando… Pulsa el botón para detener" });
    } catch(e) {
      setStatus({ type:"error", msg:"No se pudo acceder al micrófono: " + e.message });
    }
  }

  function stopRecording() {
    mediaRef.current?.stop();
    setRecording(false);
  }

  function toggleRecording() {
    if (recording) stopRecording();
    else startRecording();
  }

  // ── Parse text with Claude
  async function parseText() {
    if (!text.trim()) return;
    setStatus({ type:"loading", msg:"Interpretando texto con IA…" });
    setPreview(null);

    const playerList = players.map(p=>`- ${p.name} (id: ${p.id})`).join("\n");
    const splitList  = splits.map(s=>`- ${s.name} (id: ${s.id}), meses: ${s.months.join(", ")}`).join("\n");
    const takenWeeks = sessions.map(s=>s.microciclo).join(", ");

    const systemPrompt = `Eres un asistente que convierte descripciones de entrenamiento de fútbol en datos estructurados JSON.

JUGADORES DISPONIBLES:
${playerList}

SPLITS DISPONIBLES:
${splitList}

SEMANAS YA REGISTRADAS (no repetir): ${takenWeeks || "ninguna"}

REGLAS DE PUNTUACIÓN:
- Victoria (V) = 3 puntos
- Empate (E) = 1 punto  
- Derrota (D) = 0 puntos
- Tarea doble: isDouble=true (cuenta el doble en el promedio)
- Extras: puntos bonus o penalización individuales (pueden ser positivos o negativos)

INSTRUCCIONES:
1. Identifica el split, mes y número de semana del texto. Si no se menciona, usa valores por defecto razonables.
2. Identifica las tareas y sus series. Cada tarea puede tener múltiples series.
3. Para cada serie, asocia cada jugador mencionado a su resultado (V/E/D).
4. Usa fuzzy matching para los nombres (ej: "álvaro"→Álvaro Torre, "boro"→Boro Martínez, "joan"→Joan Santos).
5. Si se mencionan puntos extra o penalizaciones para jugadores, inclúyelos en extras.
6. Los jugadores no mencionados en una serie NO tienen resultado (no los incluyas en results).

DEVUELVE SOLO JSON VÁLIDO con esta estructura exacta, sin markdown ni explicaciones:
{
  "split": "id_del_split",
  "month": "Nombre del mes",
  "microciclo": número,
  "year": 2026,
  "extras": { "player_id": número_entero },
  "tasks": [
    {
      "id": "t1",
      "name": "Nombre de la tarea",
      "isDouble": false,
      "series": [
        {
          "id": "s1",
          "results": { "player_id": 3 }
        }
      ]
    }
  ],
  "interpretation": "Resumen breve de lo interpretado en lenguaje natural"
}`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method:"POST",
        headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:2000,
          system: systemPrompt,
          messages:[{ role:"user", content: text }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);

      const raw = data.content?.map(c=>c.text||"").join("").trim();
      const clean = raw.replace(/^```json\s*/,"").replace(/```\s*$/,"").trim();
      const parsed = JSON.parse(clean);

      // Validate / enrich
      parsed.id = `s${Date.now()}`;
      parsed.tasks = (parsed.tasks||[]).map((t,i)=>({
        ...t,
        id: t.id || `t${Date.now()}_${i}`,
        series: (t.series||[]).map((s,j)=>({
          ...s,
          id: s.id || `sr${Date.now()}_${i}_${j}`,
        }))
      }));

      setPreview(parsed);
      setStatus({ type:"success", msg: parsed.interpretation || "Sesión interpretada correctamente" });
    } catch(e) {
      setStatus({ type:"error", msg:"Error al interpretar: " + e.message });
    }
  }

  function confirmSave() {
    if (!preview) return;
    const { interpretation, ...session } = preview;
    setSessions(prev => [...prev, session]);
    setPreview(null);
    setText("");
    setTranscript("");
    setStatus({ type:"success", msg:"✓ Sesión guardada correctamente" });
  }

  // ── Helpers
  const getSplitName = (id) => splits.find(s=>s.id===id)?.name ?? id;
  const getPlayerName = (id) => players.find(p=>p.id===id)?.name ?? id;
  const getPlayer = (id) => players.find(p=>p.id===id);
  const resultLabel = (v) => v===3?"V":v===1?"E":v===0?"D":"?";

  return (
    <div>
      <div style={{marginBottom:28}}>
        {!hideHeader && <><div className="ph2">REGISTRO RÁPIDO</div>
        <div className="psub">Dicta o escribe los resultados en lenguaje natural — la IA los interpreta automáticamente</div></>}
      </div>

      <div className="rr-container">
        {/* ── LEFT: INPUT PANEL */}
        <div className="rr-input-panel">

          {/* Audio recording */}
          <div className="card">
            <div className="ctitle">🎙️ Grabación de voz</div>
            <div className="rr-audio-row">
              <button
                className={`rr-mic-btn ${recording?"recording":""}`}
                onClick={toggleRecording}
                title={recording?"Detener grabación":"Iniciar grabación"}
              >
                {recording ? "⏹" : "🎤"}
              </button>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:14,marginBottom:4}}>
                  {recording ? "Grabando…" : "Pulsa para grabar"}
                </div>
                <div className="rr-audio-label">
                  {recording
                    ? "Habla con claridad. Pulsa ⏹ para terminar."
                    : "Tu voz se transcribirá automáticamente al texto de abajo."}
                </div>
              </div>
            </div>
            {transcript && (
              <div style={{marginTop:12}}>
                <div className="flbl" style={{marginBottom:6}}>Transcripción</div>
                <div className="rr-transcript-box">{transcript}</div>
              </div>
            )}
          </div>

          {/* Text input */}
          <div className="card">
            <div className="ctitle">✍️ Texto libre</div>
            <textarea
              className="rr-textarea"
              placeholder={`Ejemplo:\n"Semana 27, split invierno, febrero. Tarea 1, primera serie: han ganado Álvaro, Joan, Boro y Eric. Han perdido Marc, Gerard y Raúl. Segunda serie: empate general. Tarea 2 doble, han ganado todos menos Mateo y Jaheim que no jugaron. Penalización de -1 a Diego."`}
              value={text}
              onChange={e=>setText(e.target.value)}
            />
            <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"flex-end"}}>
              <button className="btn bs" onClick={()=>{setText("");setTranscript("");setPreview(null);setStatus(null);}}>Limpiar</button>
              <button className="btn bp" onClick={parseText} disabled={!text.trim()} style={{opacity:text.trim()?1:.4}}>
                ✨ Interpretar
              </button>
            </div>
          </div>

          {/* Status */}
          {status && (
            <div className={`rr-status ${status.type}`}>
              {status.type==="loading" && <span className="rr-spin">⟳</span>}
              {status.type==="error"   && <span>⚠</span>}
              {status.type==="success" && <span>✓</span>}
              <span>{status.msg}</span>
            </div>
          )}
        </div>

        {/* ── RIGHT: PREVIEW PANEL */}
        <div className="rr-preview">
          {!preview ? (
            <div className="card rr-preview-empty">
              <div style={{fontSize:48}}>🔍</div>
              <div style={{textAlign:"center"}}>
                <div style={{fontWeight:600,color:"var(--text)",marginBottom:6}}>Vista previa</div>
                <div>Escribe o graba una sesión y pulsa<br/><strong>Interpretar</strong> para ver el resultado aquí</div>
              </div>
            </div>
          ) : (
            <>
              {/* Session header */}
              <div className="card">
                <div className="ctitle">📋 Sesión interpretada</div>
                <div style={{display:"flex",gap:12,flexWrap:"wrap",marginBottom:16}}>
                  {[
                    ["Split",   getSplitName(preview.split)],
                    ["Mes",     preview.month],
                    ["Semana",  preview.microciclo],
                    ["Tareas",  preview.tasks?.length ?? 0],
                  ].map(([lbl,val])=>(
                    <div key={lbl} className="statpill" style={{minWidth:80}}>
                      <span className="spv" style={{fontSize:20}}>{val}</span>
                      <span className="spl">{lbl}</span>
                    </div>
                  ))}
                </div>

                {/* Extras */}
                {preview.extras && Object.keys(preview.extras).filter(k=>preview.extras[k]!==0).length > 0 && (
                  <div style={{marginBottom:16}}>
                    <div className="flbl" style={{marginBottom:8}}>Puntos extra / penalizaciones</div>
                    <div className="rr-extra-list">
                      {Object.entries(preview.extras).filter(([,v])=>v!==0).map(([pid,val])=>(
                        <span key={pid} className="rr-extra-chip">
                          {getPlayerName(pid)}: {val>0?`+${val}`:val}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {preview.tasks?.map((task,ti)=>(
                  <div key={task.id} className="rr-task-preview" style={{marginBottom:10}}>
                    <div className="rr-task-head">
                      <span style={{fontFamily:"var(--fd)",fontSize:16,letterSpacing:1,color:"white"}}>{task.name}</span>
                      {task.isDouble && <span className="bdg bd">×2 Doble</span>}
                      <span className="bdg bb" style={{marginLeft:"auto"}}>{task.series?.length} serie(s)</span>
                    </div>
                    {task.series?.map((serie,si)=>(
                      <div key={serie.id} className="rr-serie">
                        <div className="rr-serie-title">Serie {si+1}</div>
                        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                          {Object.entries(serie.results).map(([pid,val])=>{
                            const p = getPlayer(pid);
                            const lbl = resultLabel(val);
                            return (
                              <div key={pid} style={{display:"flex",alignItems:"center",gap:5,background:"var(--bg)",borderRadius:6,padding:"4px 8px",border:"1px solid var(--border)"}}>
                                {p && <Av player={p} size="sm"/>}
                                <span style={{fontSize:12,fontWeight:500}}>{getPlayerName(pid)}</span>
                                <span className={`rr-result-chip rr-${lbl}`}>{lbl}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                ))}

                {/* Confirm */}
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:16,paddingTop:16,borderTop:"1px solid var(--border)"}}>
                  <button className="btn bs" onClick={()=>setPreview(null)}>Descartar</button>
                  <button className="btn bp" onClick={confirmSave}>
                    💾 Guardar sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── UTILS ───────────────────────────────────────────────────────────────────
function blobToBase64(blob) {
  return new Promise((res,rej)=>{
    const r = new FileReader();
    r.onload  = ()=> res(r.result.split(",")[1]);
    r.onerror = ()=> rej(new Error("FileReader error"));
    r.readAsDataURL(blob);
  });
}
