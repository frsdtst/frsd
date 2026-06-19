const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const app = express();

// --- Načítanie .env (bez externej knižnice) ---
// Do súboru .env v tomto priečinku daj riadok: OPENAI_API_KEY=sk-...
(function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
      const t = line.trim();
      if (!t || t.startsWith('#')) continue;
      const i = t.indexOf('=');
      if (i === -1) continue;
      const key = t.slice(0, i).trim();
      let val = t.slice(i + 1).trim().replace(/^["']|["']$/g, '');
      if (!(key in process.env)) process.env[key] = val;
    }
  } catch (e) { console.warn('Nepodarilo sa načítať .env:', e.message); }
})();

// --- Konfigurácia OpenAI ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

const { db, auth } = require('./firebaseConfig');
const { collection, getDocs, addDoc, Timestamp } = require('firebase/firestore');
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require('firebase/auth');

const PORT = 3000;

const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir);
}

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage: storageConfig });

app.use(express.urlencoded({ extended: true }));
app.use('/files', express.static(path.join(__dirname, 'uploads')));

// --- DOČASNÁ SIMULÁCIA STAVU PRE MOMENTY, ONBOARDING A LEADY ---
// Stavy dopytu (lead lifecycle) pre tracker "Moje dopyty" (spec 6.4)
const LEAD_STATES = {
  PRIJATA: "Žiadosť prijatá",
  KONTAKTUJE: "Partner kontaktuje",
  PONUKA: "Ponuka pripravená",
  USPECH: "Uzavreté – úspešné (Success Fee)",
  STORNO: "Zrušené používateľom (Storno)"
};

let mockUserProfiles = {};
let systemLeads = [
  {
    id: "L1", uid: "demo", email: "peter.test@gmail.com", legalForm: "SZČO", stage: "začiatočník",
    moment: "🏢 Hľadám hypotéku / financovanie ako SZČO", momentId: "M3",
    partner: "Insia Finans (SLSP metodika)", status: LEAD_STATES.KONTAKTUJE,
    statusNote: "Partner ťa bude telefonicky kontaktovať najneskôr zajtra do 14:00.",
    financialContext: "Tržby 30 000 € / odhad bonity 144 000 €",
    billing: "CPL", closed: false, date: "18. 06. 2026", note: "Tržby prevažne zo zahraničia."
  }
];

// Marketplace partneri (CRUD v admine). cpl = cena za doručený kvalifikovaný lead.
let systemPartners = [
  { id: "P1", name: "Insia Finans", category: "Poistenie & Úvery", moment: "M3", clicks: 24, leads: 1, cpl: 65, spotlight: true },
  { id: "P2", name: "TopÚčtovník s.r.o.", category: "Účtovníctvo", moment: "M5", clicks: 42, leads: 0, cpl: 40, spotlight: false },
  { id: "P3", name: "PrávnikPreFirmy", category: "Právne služby", moment: "M8", clicks: 11, leads: 0, cpl: 50, spotlight: false },
  { id: "P4", name: "ČSOB Biznis účet", category: "Bankovníctvo", moment: "M2", clicks: 30, leads: 0, cpl: 35, spotlight: true },
  { id: "P5", name: "Allianz – Poistenie firmy", category: "Poistenie", moment: "M7", clicks: 8, leads: 0, cpl: 45, spotlight: false }
];

let partnerSeq = 6; // pre generovanie nových ID partnerov v admine

// --- DIZAJNOVÝ SYSTÉM (MODERN, MOBILE-FIRST) ---
const CSS_STYLES = `
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #2456c7; --primary-600:#1d47a6; --secondary: #2456c7; --dark: #16233f;
      --navy: #16233f; --navy-2: #1f3257;
      --accent: #f5821f; --accent-600:#e0710f;
      --bg: #f3f5fa; --success: #16a34a; --danger: #ef4444; --warning: #f59e0b;
      --muted:#7b879c; --line:#ebeef4; --line-soft:#f3f5f9;
      --grad-primary: linear-gradient(135deg, #2f6df0 0%, #2456c7 100%);
      --grad-accent: linear-gradient(135deg, #ff9a3c 0%, #f5821f 100%);
      --grad-navy: linear-gradient(150deg, #1f3257 0%, #16233f 100%);
      --grad-success: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
      --shadow-sm: 0 1px 2px rgba(22,35,63,.05), 0 1px 3px rgba(22,35,63,.06);
      --shadow-md: 0 6px 18px rgba(22,35,63,.07), 0 2px 6px rgba(22,35,63,.04);
      --shadow-lg: 0 18px 40px rgba(22,35,63,.12), 0 6px 12px rgba(22,35,63,.06);
      --radius: 18px;
    }
    * { box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, 'Segoe UI', Arial, sans-serif;
      margin: 0; padding: 0; color: #283447; letter-spacing: -0.01em;
      background: var(--bg);
      -webkit-font-smoothing: antialiased;
    }
    body.has-bottom-nav { padding-bottom: 84px; }
    .container { max-width: 1080px; margin: 0 auto; padding: 24px; }
    h1,h2,h3,h4 { color: var(--dark); letter-spacing:-0.02em; }
    a { color: var(--primary); }
    .text-center { text-align: center; }

    .card {
      background: #fff; padding: 22px; border-radius: var(--radius);
      box-shadow: var(--shadow-md); margin-bottom: 20px; border: 1px solid var(--line);
      transition: box-shadow .2s ease, transform .2s ease;
    }
    .card:hover { box-shadow: var(--shadow-lg); }

    /* Sticky sklenená navigácia */
    .top-bar {
      position: sticky; top: 0; z-index: 900;
      display: flex; justify-content: space-between; align-items: center; gap: 12px;
      background: rgba(255,255,255,.72); backdrop-filter: saturate(180%) blur(14px);
      -webkit-backdrop-filter: saturate(180%) blur(14px);
      padding: 14px 24px; border-bottom: 1px solid var(--line);
    }
    .top-bar h2 { margin: 0; font-size: 19px; font-weight: 800; display:flex; align-items:center; gap:8px; }
    .nav-links { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }

    /* Spodná navigácia */
    .bottom-nav {
      position: fixed; bottom: 14px; left: 50%; transform: translateX(-50%);
      width: calc(100% - 28px); max-width: 520px; height: 62px;
      background: rgba(255,255,255,.85); backdrop-filter: saturate(180%) blur(16px);
      -webkit-backdrop-filter: saturate(180%) blur(16px);
      box-shadow: var(--shadow-lg); border: 1px solid var(--line);
      display: flex; justify-content: space-around; align-items: center; z-index: 1000;
      border-radius: 20px; padding: 0 6px;
    }
    .bottom-nav a {
      text-decoration: none; color: var(--muted); font-size: 12px; font-weight: 600;
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 8px 12px; border-radius: 14px; transition: .15s;
    }
    .bottom-nav a.active { color: var(--primary); background: rgba(79,70,229,.10); }

    /* Inputy */
    input, select, textarea {
      width: 100%; padding: 12px 14px; margin: 7px 0; border: 1px solid #e2e8f0;
      border-radius: 12px; font-size: 14px; font-family: inherit; background: #fff; color:#1e293b;
      transition: border-color .15s, box-shadow .15s;
    }
    input:focus, select:focus, textarea:focus {
      outline: none; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(79,70,229,.12);
    }
    label { color:#334155; }

    /* Tlačidlá – default = oranžová akcia */
    button, .btn {
      display: inline-flex; align-items:center; justify-content:center; gap:6px;
      background: var(--grad-accent); color: #fff; padding: 11px 18px; border: none;
      border-radius: 12px; cursor: pointer; font-size: 14px; font-weight: 600; font-family: inherit;
      text-decoration: none; text-align: center; box-shadow: 0 6px 16px rgba(245,130,31,.28);
      transition: transform .15s ease, box-shadow .15s ease, opacity .15s;
    }
    button:hover, .btn:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(245,130,31,.34); }
    button:active, .btn:active { transform: translateY(0); }
    .btn-block { width: 100%; }
    .btn-secondary { background: #fff; color: #334155; border: 1px solid #e2e8f0; box-shadow: var(--shadow-sm); }
    .btn-secondary:hover { box-shadow: var(--shadow-md); }
    .btn-success { background: var(--grad-success); box-shadow: 0 6px 16px rgba(22,163,74,.25); }
    .btn-danger { background: linear-gradient(135deg,#f87171,#ef4444); box-shadow: 0 6px 16px rgba(239,68,68,.22); }
    .btn-purple, .btn-navy { background: var(--grad-navy); box-shadow: 0 6px 16px rgba(22,35,63,.22); }
    .btn-blue { background: var(--grad-primary); box-shadow: 0 6px 16px rgba(36,86,199,.24); }
    .btn-calc { background: var(--grad-navy); }
    .btn-ghost { background: transparent; color: var(--primary); box-shadow:none; padding:8px 10px; }
    .btn-ghost:hover { background: rgba(36,86,199,.08); box-shadow:none; }

    /* Progress bar */
    .progress-container { background: #eef0f6; border-radius: 100px; height: 10px; width: 100%; margin: 12px 0 18px 0; overflow: hidden; }
    .progress-bar { background: var(--grad-success); height: 100%; width: 0%; border-radius:100px; transition: width .5s cubic-bezier(.4,0,.2,1); }

    /* Checklist */
    .task-item { display: flex; align-items: flex-start; padding: 12px; border-radius: 12px; transition: background .15s; }
    .task-item:hover { background: #f8fafc; }
    .task-checkbox { width: 20px; height:20px; flex:0 0 20px; margin-right: 12px; margin-top: 2px; cursor: pointer; accent-color: var(--primary); }
    .task-content { flex: 1; }
    .task-title { font-weight: 600; margin: 0; font-size: 15px; color:#1e293b; }
    .task-desc { color: var(--muted); font-size: 13px; margin: 3px 0 0 0; line-height:1.5; }

    .grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }

    /* Reminders */
    .reminder-badge { display: inline-block; padding: 4px 10px; border-radius: 100px; font-size: 11px; font-weight: 700; margin-top: 5px; }
    .badge-danger { background: #fee2e2; color: #b91c1c; }
    .badge-warning { background: #fef3c7; color: #b45309; }
    .badge-success { background: #d1fae5; color: #047857; }

    /* Tabuľky */
    .fin-table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 13px; }
    .fin-table th, .fin-table td { padding: 11px 12px; text-align: left; border-bottom: 1px solid var(--line); }
    .fin-table th { background: transparent; color: var(--muted); font-weight:600; text-transform:uppercase; font-size:11px; letter-spacing:.03em; }
    .fin-table tbody tr:hover { background:#f8fafc; }
    .text-right { text-align: right; }

    /* Marketplace karta */
    .partner-card { background: linear-gradient(135deg,#faf5ff,#f5f3ff); padding: 16px; border-radius: 14px; margin-top: 15px; border:1px solid #ede9fe; position:relative; }
    .partner-card::before { content:""; position:absolute; left:0; top:14px; bottom:14px; width:4px; border-radius:4px; background:var(--grad-primary); }
    .chart-container { margin-top: 25px; position: relative; height:250px; width:100%; }
    .result-box { background: #f8fafc; padding: 16px; border-radius: 14px; margin-top: 15px; border-left: 4px solid var(--success); }

    /* Onboarding stepper */
    .stepper { display:flex; justify-content:center; gap:10px; margin:0 0 22px 0; }
    .step-dot { width:34px; height:34px; border-radius:50%; background:#eef0f6; color:#94a3b8; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:14px; transition:.2s; }
    .step-dot.active { background:var(--grad-primary); color:#fff; box-shadow:0 4px 12px rgba(79,70,229,.3); }
    .step-dot.done { background:var(--grad-success); color:#fff; }
    .opt-grid { display:grid; grid-template-columns:repeat(auto-fit, minmax(150px,1fr)); gap:10px; margin:10px 0; }
    .opt-tile { border:1.5px solid #e2e8f0; border-radius:14px; padding:16px; cursor:pointer; text-align:center; font-size:14px; font-weight:500; background:#fff; transition:.15s; }
    .opt-tile:hover { border-color:var(--primary); transform:translateY(-1px); box-shadow:var(--shadow-sm); }
    input[type=radio]:checked + .opt-tile, .opt-tile.sel { border-color:var(--primary); background:linear-gradient(135deg,#eef2ff,#f5f3ff); box-shadow:0 0 0 3px rgba(79,70,229,.12); }

    /* Status pills */
    .pill { display:inline-block; padding:5px 12px; border-radius:100px; font-size:11px; font-weight:700; }
    .pill-blue { background:#dbeafe; color:#1d4ed8; }
    .pill-orange { background:#ffedd5; color:#c2410c; }
    .pill-green { background:#d1fae5; color:#047857; }
    .pill-grey { background:#eef0f6; color:#475569; }
    .lead-row { border:1px solid var(--line); border-radius:14px; padding:16px; margin-bottom:12px; background:#fff; transition:.15s; }
    .lead-row:hover { box-shadow:var(--shadow-sm); }

    /* AI asistent Drawer */
    .drawer-overlay { position:fixed; inset:0; background:rgba(15,23,42,.4); backdrop-filter:blur(2px); z-index:1500; display:none; opacity:0; transition:opacity .25s; }
    .drawer-overlay.open { display:block; opacity:1; }
    .drawer { position:fixed; left:0; right:0; bottom:0; max-height:85vh; background:#fff; border-radius:24px 24px 0 0; box-shadow:0 -10px 40px rgba(15,23,42,.25); z-index:1600; transform:translateY(100%); transition:transform .3s cubic-bezier(.4,0,.2,1); display:flex; flex-direction:column; }
    .drawer.open { transform:translateY(0); }
    .drawer-head { padding:18px 22px; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; }
    .drawer-body { padding:18px 22px; overflow-y:auto; }
    .ai-chip { display:block; width:100%; text-align:left; background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px; padding:14px; margin:8px 0; cursor:pointer; font-size:14px; font-weight:500; color:var(--dark); box-shadow:none; transition:.15s; }
    .ai-chip:hover { background:#eef2ff; border-color:var(--primary); transform:translateY(-1px); box-shadow:var(--shadow-sm); }
    .ai-msg { background:linear-gradient(135deg,#eef2ff,#faf5ff); border-left:3px solid var(--primary); padding:14px 16px; border-radius:12px; margin:10px 0; font-size:14px; line-height:1.6; }
    .ai-source { font-size:11px; color:#94a3b8; margin-top:6px; }
    @media (min-width:760px){ .drawer { left:auto; right:0; top:0; bottom:0; width:440px; max-height:none; border-radius:0; transform:translateX(100%); } .drawer.open{ transform:translateX(0);} }

    /* Jemný nábeh obsahu */
    @keyframes rise { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform:none;} }
    .main > * { animation: rise .4s ease both; }

    /* ===== APP SHELL: SIDEBAR + MAIN ===== */
    .app { display:flex; min-height:100vh; }
    .sidebar {
      width:256px; flex:0 0 256px; background:#fff; border-right:1px solid var(--line);
      position:sticky; top:0; height:100vh; display:flex; flex-direction:column; padding:22px 16px;
    }
    .brand { display:flex; gap:11px; align-items:center; padding:4px 8px 16px; }
    .brand .logo { width:42px; height:42px; border-radius:13px; background:var(--grad-primary); display:flex; align-items:center; justify-content:center; color:#fff; font-size:20px; box-shadow:0 6px 14px rgba(36,86,199,.3); }
    .brand .bname { font-weight:800; color:var(--dark); font-size:15px; line-height:1.1; }
    .brand .btag { font-size:9px; letter-spacing:.14em; color:var(--accent); font-weight:800; margin-top:3px; }
    .side-label { font-size:10px; letter-spacing:.16em; color:#aab3c4; font-weight:800; margin:12px 12px 8px; }
    .side-nav { display:flex; flex-direction:column; gap:3px; }
    .side-nav a {
      display:flex; align-items:center; gap:12px; padding:11px 13px; border-radius:13px;
      text-decoration:none; color:#5b687e; font-weight:600; font-size:14px; position:relative; transition:.15s;
    }
    .side-nav a .ico { font-size:17px; width:20px; text-align:center; }
    .side-nav a:hover { background:#f5f7fb; color:var(--dark); }
    .side-nav a.active { background:var(--grad-navy); color:#fff; box-shadow:0 8px 18px rgba(22,35,63,.25); }
    .side-nav a.active .dot { position:absolute; right:13px; width:7px; height:7px; border-radius:50%; background:var(--accent); }
    .side-foot { margin-top:auto; border-top:1px solid var(--line); padding-top:14px; }
    .user-chip { display:flex; gap:10px; align-items:center; padding:6px 8px 10px; }
    .avatar { width:36px; height:36px; border-radius:50%; background:var(--grad-navy); color:#fff; display:flex; align-items:center; justify-content:center; font-weight:700; flex:0 0 36px; }
    .logout { display:block; text-align:center; font-size:13px; font-weight:600; color:var(--muted); text-decoration:none; padding:9px; border-radius:10px; border:1px solid var(--line); }
    .logout:hover { background:#fef2f2; color:var(--danger); border-color:#fecaca; }

    .main { flex:1; min-width:0; padding:28px 34px; max-width:1180px; }
    .page-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:22px; flex-wrap:wrap; }
    .page-head h1 { margin:0; font-size:27px; font-weight:800; }
    .page-head .sub { color:var(--muted); font-size:11px; letter-spacing:.12em; font-weight:800; text-transform:uppercase; margin-top:6px; }

    /* Stat karty */
    .stat-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:16px; margin-bottom:26px; }
    .stat { background:#fff; border:1px solid var(--line); border-radius:18px; padding:20px; box-shadow:var(--shadow-sm); transition:.2s; }
    .stat:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); }
    .stat .stat-label { font-size:10.5px; letter-spacing:.1em; text-transform:uppercase; color:var(--muted); font-weight:800; }
    .stat .stat-num { font-size:38px; font-weight:800; color:var(--dark); line-height:1.1; margin:6px 0 2px; }
    .stat .stat-foot { font-size:11px; color:var(--muted); font-weight:600; letter-spacing:.04em; text-transform:uppercase; }
    .stat.dark { background:var(--grad-navy); border:none; color:#fff; box-shadow:var(--shadow-lg); }
    .stat.dark .stat-label { color:rgba(255,255,255,.65); }
    .stat.dark .stat-num { color:#fff; }
    .stat.dark .stat-foot { color:var(--accent); }
    .stat.accent .stat-num { color:var(--success); }
    .stat .stat-ico { float:right; font-size:18px; opacity:.9; }

    /* Sekcie */
    .section-head { display:flex; justify-content:space-between; align-items:center; margin:6px 2px 14px; }
    .section-head h3 { margin:0; font-size:17px; display:flex; align-items:center; gap:8px; }
    .link-more { color:var(--muted); font-size:10.5px; font-weight:800; letter-spacing:.08em; text-decoration:none; text-transform:uppercase; }
    .link-more:hover { color:var(--primary); }

    /* Míľnik riadky */
    .milestone { display:flex; align-items:center; gap:15px; background:#fff; border:1px solid var(--line); border-radius:16px; padding:17px 18px; margin-bottom:12px; transition:.15s; text-decoration:none; }
    .milestone:hover { box-shadow:var(--shadow-md); transform:translateY(-1px); border-color:#dfe5ef; }
    .m-icon { width:46px; height:46px; flex:0 0 46px; border-radius:13px; background:linear-gradient(135deg,#eaf1ff,#f4f1ff); color:var(--primary); display:flex; align-items:center; justify-content:center; font-size:21px; }
    .m-body { flex:1; min-width:0; }
    .m-title { font-weight:800; color:var(--dark); font-size:14.5px; text-transform:uppercase; letter-spacing:.01em; }
    .m-meta { font-size:11.5px; color:var(--muted); margin-top:3px; }
    .m-chip { font-size:11px; font-weight:800; letter-spacing:.03em; color:var(--success); display:inline-flex; align-items:center; gap:5px; margin-top:6px; text-transform:uppercase; }
    .m-cta { color:var(--muted); font-size:10.5px; font-weight:800; letter-spacing:.07em; text-transform:uppercase; white-space:nowrap; }
    .m-arrow { width:34px; height:34px; flex:0 0 34px; border-radius:50%; background:#f5f7fb; color:var(--dark); display:flex; align-items:center; justify-content:center; font-size:16px; }
    .milestone:hover .m-arrow { background:var(--grad-accent); color:#fff; }
    .mini-bar { height:6px; background:#eef0f6; border-radius:100px; overflow:hidden; margin-top:8px; max-width:220px; }
    .mini-bar > div { height:100%; background:var(--grad-success); border-radius:100px; }

    /* Odporúčané karty */
    .rec-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:14px; }
    .rec-card { background:#fff; border:1px solid var(--line); border-radius:16px; padding:18px; box-shadow:var(--shadow-sm); border-top:3px solid var(--accent); transition:.15s; display:flex; flex-direction:column; }
    .rec-card:hover { box-shadow:var(--shadow-md); transform:translateY(-2px); }
    .rec-card h4 { margin:0 0 8px; font-size:14.5px; }
    .rec-card .q { font-style:italic; color:#56627a; font-size:12.5px; line-height:1.55; flex:1; }
    .rec-card .src { font-size:9.5px; letter-spacing:.12em; color:var(--muted); font-weight:800; margin-top:12px; display:flex; justify-content:space-between; align-items:center; }

    /* Termín riadky */
    .termin-row { display:flex; align-items:center; gap:14px; background:#fff; border:1px solid var(--line); border-radius:14px; padding:14px 16px; margin-bottom:10px; }
    .termin-ico { width:42px; height:42px; flex:0 0 42px; border-radius:12px; background:#fff7ed; color:var(--accent); display:flex; align-items:center; justify-content:center; font-size:18px; border:1px solid #ffedd5; }
    .termin-row .t-title { font-weight:700; font-size:14px; }
    .termin-row .t-meta { font-size:11.5px; color:var(--muted); margin-top:2px; }

    /* Trezor info pruh */
    .trezor-bar { display:flex; align-items:center; gap:12px; background:linear-gradient(135deg,#f0f7ff,#eef2ff); border:1px solid #dbe7fb; border-radius:14px; padding:14px 16px; margin-bottom:14px; }
    .trezor-bar .lock { width:40px; height:40px; border-radius:11px; background:var(--grad-success); color:#fff; display:flex; align-items:center; justify-content:center; font-size:18px; }

    /* Responzívne: sidebar -> horný pás */
    @media (max-width: 900px) {
      .app { flex-direction:column; }
      .sidebar { width:100%; height:auto; flex-direction:column; position:sticky; top:0; z-index:800; padding:14px 16px; }
      .side-label { display:none; }
      .side-nav { flex-direction:row; overflow-x:auto; gap:6px; padding-bottom:4px; }
      .side-nav a { white-space:nowrap; padding:9px 12px; }
      .side-nav a .dot { display:none; }
      .side-foot { display:none; }
      .main { padding:20px 16px; }
      .brand { padding-bottom:10px; }
    }
  </style>
`;

// --- KATALÓG 10 BIZNIS MOMENTOV (MÍĽNIKOV) ---
// Každý moment: tasks (checklist 5-7+), article (podnikajte.sk), partner (s personalizovaným
// odôvodnením – spec 6.1) a ai (RAG kontext pre asistenta – spec 6.2).
function ziskajMomentyPreProfil(legalForm) {
  const jeSro = legalForm === "s.r.o.";
  return [
    {
      id: "M1",
      title: jeSro ? "🚀 Zakladám s.r.o. na Slovensku" : "🚀 Zakladám živnosť (SZČO)",
      partnerId: "P2",
      article: { title: jeSro ? "Založenie a vznik s.r.o. v roku 2026" : "Založenie živnosti v roku 2026", url: jeSro ? "https://www.podnikajte.sk/sro/zalozenie-vznik-sro-v-2026" : "https://www.podnikajte.sk/zivnost/zalozenie-zivnosti-2026" },
      ai: {
        source: jeSro ? "Založenie s.r.o. 2026" : "Založenie živnosti 2026",
        dolezite: "Pre " + legalForm + " je kľúčový výber predmetov podnikania a overené sídlo. Pri elektronickom podaní cez slovensko.sk máte zľavu 50 % na správnych poplatkoch.",
        terminy: "Do 30 dní od vzniku oprávnenia sa musíte zaregistrovať na daňovom úrade. Pokuta za nesplnenie registračnej povinnosti je do 3 000 €.",
        naklady: jeSro ? "Súdny poplatok za zápis s.r.o. elektronicky je 150 €, plus 150 € základné imanie a notár/živnostenský list." : "Voľná živnosť elektronicky 0 € (inak 5 €), remeselná/viazaná 7,50 € elektronicky za každú."
      },
      tasks: [
        { id: "t1_1", title: "Výber predmetov podnikania (živností)", desc: "Zvoľte si voľné, remeselné alebo viazané živnosti podľa vášho zamerania." },
        { id: "t1_2", title: "Určenie miesta podnikania / Sídla", desc: "Zabezpečte si vlastnú nehnuteľnosť alebo overené registračné sídlo so súhlasom vlastníka." },
        { id: "t1_3", title: jeSro ? "Spísanie spoločenskej zmluvy" : "Ohlásenie živnosti cez slovensko.sk", desc: jeSro ? "Pri jednoosobovej s.r.o. zakladateľská listina, inak spoločenská zmluva s podpismi." : "Podajte ohlásenie elektronicky cez slovensko.sk so zľavou 50 % na poplatkoch." },
        { id: "t1_4", title: "Aktivácia elektronickej schránky (eID)", desc: "Zabezpečte si občiansky preukaz s čipom pre prístup k správam od štátu." },
        { id: "t1_5", title: "Registrácia na daňovom úrade (DIČ)", desc: "Do 30 dní od získania oprávnenia. Vybavíte aj elektronicky." },
        { id: "t1_6", title: "Otvorenie podnikateľského účtu", desc: "Vyberte si banku, ktorá ponúka začínajúcim podnikateľom vedenie účtu na rok zadarmo." }
      ]
    },
    {
      id: "M2",
      title: "🏦 Otváram podnikateľský účet",
      partnerId: "P4",
      article: { title: "Ako si vybrať podnikateľský účet", url: "https://www.podnikajte.sk/financny-manazment/ako-si-vybrat-podnikatelsky-ucet" },
      ai: {
        source: "Podnikateľský účet 2026",
        dolezite: jeSro ? "S.r.o. zo zákona potrebuje samostatný firemný účet oddelený od osobných financií." : "SZČO nemusí mať firemný účet, ale pri platbách nad limit a kvôli prehľadu sa odporúča.",
        terminy: "Účet otvoríte spravidla do 1-2 dní. Nie sú tu zákonné termíny, ale bez účtu nepodáte niektoré dotácie.",
        naklady: "Mesačné vedenie 0–15 €. Mnohé banky majú prvý rok zadarmo pre nové firmy."
      },
      tasks: [
        { id: "t2_1", title: "Porovnanie poplatkov za vedenie účtu", desc: "Sledujte poplatky za platby, výbery a mesačné vedenie." },
        { id: "t2_2", title: "Príprava dokladov (oprávnenie + eID)", desc: "Banka vyžaduje živnostenský list / výpis z ORSR a doklad totožnosti." },
        { id: "t2_3", title: "Aktivácia internet bankingu a platobnej brány", desc: "Pre e-shop si over podporu platobných brán (Stripe, GoPay)." },
        { id: "t2_4", title: "Nastavenie trvalých príkazov na odvody", desc: "Automatizuj platby do Sociálnej a zdravotnej poisťovne." },
        { id: "t2_5", title: "Prepojenie účtu s účtovným softvérom", desc: "Bankové API/feed šetrí hodiny pri párovaní platieb." }
      ]
    },
    {
      id: "M3",
      title: "🏢 Hľadám hypotéku / financovanie ako SZČO",
      partnerId: "P1",
      article: { title: "Hypotéka pre živnostníkov (SZČO) a majiteľov s.r.o.", url: "https://www.podnikajte.sk/osobne-financie/hypoteka-pre-zivnostnikov-szco-majitelov-s-r-o" },
      ai: {
        source: "Hypotéka pre podnikateľa 2026",
        dolezite: "Banky posudzujú príjem SZČO buď z čistého zisku, alebo percentom z tržieb (10–60 %). SLSP akceptuje až 60 % tržieb pri paušálnych výdavkoch – to výrazne dvíha bonitu.",
        terminy: "Daňové priznanie musíš mať podané (banka chce potvrdenie o podaní). Schvaľovací proces trvá 2–4 týždne.",
        naklady: "Poplatok za poskytnutie 0–1 %, znalecký posudok 150–250 €, poistenie nehnuteľnosti povinné."
      },
      tasks: [
        { id: "t3_1", title: "Analýza daňového priznania", desc: "Skontrolujte ročné tržby a čistý zisk – banky sa na ne pozerajú odlišne." },
        { id: "t3_2", title: "Kalkulácia bonity podľa obratov (60 % tržieb)", desc: "Použi našu kalkulačku bonity – SLSP akceptuje až 60 % tržieb pri paušále." },
        { id: "t3_3", title: "Príprava potvrdenia o podaní DP a o dani", desc: "Z finančnej správy oficiálny dokument pre bankový audit." },
        { id: "t3_4", title: "Preverenie registra dlžníkov", desc: "Žiadne podlžnosti v Sociálnej či zdravotnej poisťovni." },
        { id: "t3_5", title: "Znalecký posudok nehnuteľnosti", desc: "Banka určuje max. úver aj podľa hodnoty zakladanej nehnuteľnosti (LTV)." },
        { id: "t3_6", title: "Porovnanie ponúk cez sprostredkovateľa", desc: "Jeden dopyt = ponuky z viacerých bánk naraz." }
      ]
    },
    {
      id: "M4",
      title: "👨‍💼 Prijímam prvého zamestnanca",
      partnerId: "P2",
      article: { title: "Prvý zamestnanec: povinnosti zamestnávateľa", url: "https://www.podnikajte.sk/pracovne-pravo-bozp/prvy-zamestnanec-povinnosti-zamestnavatela" },
      ai: {
        source: "Prvý zamestnanec 2026",
        dolezite: "Cena práce je o ~35,2 % vyššia ako hrubá mzda kvôli odvodom zamestnávateľa. Pred nástupom musíš zamestnanca prihlásiť do Sociálnej poisťovne.",
        terminy: "Prihlásenie do Sociálnej poisťovne najneskôr deň pred nástupom. Do zdravotnej do 8 dní. Mzda splatná do dohodnutého výplatného termínu.",
        naklady: "K hrubej mzde priplácaš ~35,2 % odvodov + PZS a BOZP (rádovo desiatky € mesačne)."
      },
      tasks: [
        { id: "t4_1", title: "Výpočet celkovej ceny práce", desc: "Cena práce je o 35,2 % vyššia ako hrubá mzda – over v mzdovej kalkulačke." },
        { id: "t4_2", title: "Registrácia zamestnávateľa v Sociálnej poisťovni", desc: "Najneskôr v deň predchádzajúci nástupu prvého človeka." },
        { id: "t4_3", title: "Prihlásenie do zdravotnej poisťovne", desc: "Do 8 dní od vzniku pracovného pomeru." },
        { id: "t4_4", title: "Príprava pracovnej zmluvy", desc: "Druh práce, miesto výkonu, mzdové podmienky a výplatný termín." },
        { id: "t4_5", title: "Zabezpečenie PZS a školenia BOZP", desc: "Zo zákona povinné už pri prvom zamestnancovi." },
        { id: "t4_6", title: "Nastavenie spracovania miezd", desc: "Mzdová účtovníčka alebo softvér na výplatné pásky a výkazy." }
      ]
    },
    {
      id: "M5",
      title: "🧾 Hľadám účtovníka",
      partnerId: "P2",
      article: { title: "Účtovníctvo živnostníka a výber účtovníka", url: "https://www.podnikajte.sk/uctovnictvo/uctovnictvo-zivnostnika" },
      ai: {
        source: "Výber účtovníka 2026",
        dolezite: "Proaktívny účtovník ti šetrí dane, nielen spracúva doklady. Pýtaj sa na komunikáciu, odbornosť v tvojom odvetví a poistenie zodpovednosti.",
        terminy: "Odovzdávaj doklady priebežne, nie raz ročne. Mesačné DPH priznania do 25. dňa nasledujúceho mesiaca.",
        naklady: "Paušál pre malú SZČO od 40–80 € / mesiac, podľa počtu dokladov a platcovstva DPH."
      },
      tasks: [
        { id: "t5_1", title: "Definovanie rozsahu služieb", desc: "Len daňové priznanie, alebo kompletné vedenie účtovníctva a miezd?" },
        { id: "t5_2", title: "Overenie referencií a odvetvia", desc: "Hľadaj účtovníka so skúsenosťou s tvojím typom podnikania." },
        { id: "t5_3", title: "Kontrola poistenia zodpovednosti", desc: "Chráni ťa, ak účtovník urobí chybu s pokutou." },
        { id: "t5_4", title: "Dohoda o spôsobe odovzdávania dokladov", desc: "Digitálne (fotka/sken) vs. papierovo – rieš efektivitu." },
        { id: "t5_5", title: "Podpis zmluvy a udelenie prístupov", desc: "Splnomocnenie na elektronickú komunikáciu s úradmi." }
      ]
    },
    {
      id: "M6",
      title: "📊 Daňové priznanie a odvody",
      partnerId: "P2",
      article: { title: "Daňové priznanie fyzickej osoby typu B za rok 2025", url: "https://www.podnikajte.sk/dan-z-prijmov/danove-priznanie-fyzickej-osoby-typu-b-za-rok-2025" },
      ai: {
        source: "Daňové priznanie a odvody 2026",
        dolezite: "Porovnaj paušálne výdavky (60 %, max 20 000 €) oproti skutočným nákladom. Od 2026 sa mení sadzba zdravotných odvodov – zohľadni to v cashflowe.",
        terminy: "Daňové priznanie a daň do 31. marca (možnosť odkladu o 3–6 mesiacov). Nové odvody do Sociálnej poisťovne od júla po podaní DP.",
        naklady: "Daň z príjmu 15 % (do 100 000 €) alebo 19/25 %. Zdravotné a sociálne odvody podľa vymeriavacieho základu."
      },
      tasks: [
        { id: "t6_1", title: "Rozhodnutie paušál vs. skutočné výdavky", desc: "Simuluj obe možnosti v daňovom simulátore a vyber výhodnejšiu." },
        { id: "t6_2", title: "Kompletizácia príjmov a výdavkov", desc: "Skontroluj, či máš všetky faktúry a doklady za rok." },
        { id: "t6_3", title: "Výpočet a podanie daňového priznania", desc: "Termín 31. marec, možný odklad podaním oznámenia." },
        { id: "t6_4", title: "Úprava preddavkov na odvody", desc: "Po podaní DP sa od júla mení výška odvodov – uprav trvalý príkaz." },
        { id: "t6_5", title: "Kontrola nároku na odpočítateľné položky", desc: "Nezdaniteľná časť, daňový bonus na deti, príspevky." }
      ]
    },
    {
      id: "M7",
      title: "🛡️ Poistenie firmy a majetku",
      partnerId: "P5",
      article: { title: "Poistenie zodpovednosti za škodu pre firmy", url: "https://www.podnikajte.sk/financny-manazment/poistenie-zodpovednosti-za-skodu-pre-firmy" },
      ai: {
        source: "Poistenie podnikania 2026",
        dolezite: "Najpodceňovanejšie je poistenie prerušenia prevádzky a zodpovednosti za škodu. Pri kľúčových ľuďoch zvážTe poistenie kľúčových osôb.",
        terminy: "Poistenie nemá zákonný termín, ale škoda môže prísť kedykoľvek – nečakaj. Sleduj dátum exspirácie zmluvy vo Vaulte.",
        naklady: "Poistenie zodpovednosti od ~10 € / mesiac, majetkové podľa hodnoty, prerušenie prevádzky podľa obratu."
      },
      tasks: [
        { id: "t7_1", title: "Analýza rizík v tvojom odvetví", desc: "Čo ťa najviac ohrozí – škoda klientovi, požiar, výpadok?" },
        { id: "t7_2", title: "Poistenie zodpovednosti za škodu", desc: "Kryje škody spôsobené pri výkone podnikania." },
        { id: "t7_3", title: "Poistenie majetku a prevádzky", desc: "Budova, vybavenie, zásoby a prerušenie prevádzky." },
        { id: "t7_4", title: "Zváženie poistenia kľúčových osôb", desc: "Ak firma stojí na 1-2 ľuďoch, ich výpadok je riziko." },
        { id: "t7_5", title: "Uloženie poistiek do Vaultu so strážením exspirácie", desc: "Systém ťa upozorní 30 dní pred koncom platnosti." }
      ]
    },
    {
      id: "M8",
      title: "⚖️ Zmluvy a právna ochrana",
      partnerId: "P3",
      article: { title: "Základné pravidlá pri spisovaní obchodných zmlúv", url: "https://www.podnikajte.sk/obchodne-pravo/pravidla-obchodne-zmluvy" },
      ai: {
        source: "Zmluvy a právna ochrana 2026",
        dolezite: "Dobrá zmluva rieši splatnosť, sankcie z omeškania, vlastníctvo výsledkov práce a ukončenie. GDPR a spracovanie údajov je povinnosť, nie možnosť.",
        terminy: "Reklamačné a premlčacie lehoty sa líšia – obchodné záväzky sa premlčujú spravidla za 4 roky. Revíziu zmlúv rob aspoň raz ročne.",
        naklady: "Vzorová zmluva od právnika 50–200 €, paušálna právna podpora od ~100 € / mesiac."
      },
      tasks: [
        { id: "t8_1", title: "Štandardizácia obchodných podmienok (VOP)", desc: "Jednotné podmienky pre klientov šetria spory." },
        { id: "t8_2", title: "Zmluvy s dodávateľmi a klientmi", desc: "Splatnosť, sankcie, vlastníctvo výsledkov práce." },
        { id: "t8_3", title: "GDPR a spracovanie osobných údajov", desc: "Zásady ochrany údajov a súhlasy sú povinné." },
        { id: "t8_4", title: "Ochrana duševného vlastníctva", desc: "Ochranná známka, autorské práva, know-how." },
        { id: "t8_5", title: "Ročná revízia kľúčových zmlúv", desc: "Over platnosť, ceny a podmienky aspoň raz ročne." }
      ]
    },
    {
      id: "M9",
      title: "📈 Rast, škálovanie a dotácie",
      partnerId: "P2",
      article: { title: "Možnosti rozvoja a financovania firiem v roku 2026", url: "https://www.podnikajte.sk/podpora-podnikania/moznosti-rozvoja-financovania-firiem-2026-ktore-programy-granty-pomozu-rast" },
      ai: {
        source: "Rast a dotácie 2026",
        dolezite: "Pri raste sleduj cashflow, nie len obrat. Dotácie z eurofondov a Plánu obnovy môžu financovať digitalizáciu a zelené investície.",
        terminy: "Výzvy na dotácie majú pevné termíny podania – sleduj harmonogram. Vyúčtovanie projektu býva prísne na lehoty.",
        naklady: "Spolufinancovanie projektu býva 10–50 %. Spracovanie žiadosti cez poradcu 5–15 % z dotácie."
      },
      tasks: [
        { id: "t9_1", title: "Finančný plán a cashflow projekcia", desc: "Rast bez riadenia cashflow býva najčastejšou príčinou krachu." },
        { id: "t9_2", title: "Mapovanie vhodných výziev a dotácií", desc: "Eurofondy, Plán obnovy, regionálne granty." },
        { id: "t9_3", title: "Posúdenie potreby externého kapitálu", desc: "Úver, investor alebo reinvestícia zisku?" },
        { id: "t9_4", title: "Optimalizácia procesov a automatizácia", desc: "Pred prijatím ľudí zváž, čo sa dá zautomatizovať." },
        { id: "t9_5", title: "Zváženie zmeny právnej formy", desc: "Pri vyšších ziskoch môže byť s.r.o. daňovo výhodnejšia." }
      ]
    },
    {
      id: "M10",
      title: "🔚 Prerušenie alebo ukončenie podnikania",
      partnerId: "P2",
      article: { title: "Prerušenie živnosti v roku 2026 online", url: "https://www.podnikajte.sk/ukoncenie-podnikania/prerusenie-zivnosti-2026-online" },
      ai: {
        source: "Ukončenie podnikania 2026",
        dolezite: "Prerušenie živnosti pozastaví odvodové povinnosti, ale musíš to oznámiť úradom. Pri s.r.o. je likvidácia formálne náročnejšia.",
        terminy: "Zmenu oznám živnostenskému úradu; do 8 dní odhlás z poisťovní. Posledné daňové priznanie podaj v riadnom termíne.",
        naklady: "Prerušenie živnosti elektronicky 0 €. Likvidácia s.r.o. stojí stovky € (notár, súd, audit)."
      },
      tasks: [
        { id: "t10_1", title: "Rozhodnutie prerušiť vs. zrušiť", desc: "Prerušenie je dočasné a lacné, zrušenie je definitívne." },
        { id: "t10_2", title: "Oznámenie živnostenskému úradu", desc: "Elektronicky cez slovensko.sk." },
        { id: "t10_3", title: "Odhlásenie zo Sociálnej a zdravotnej poisťovne", desc: "Do 8 dní, inak platíš odvody zbytočne ďalej." },
        { id: "t10_4", title: "Vysporiadanie záväzkov a faktúr", desc: "Doplať dane, odvody a uzavri pohľadávky." },
        { id: "t10_5", title: "Archivácia účtovných dokladov", desc: "Doklady uchovávaj zákonom stanovenú dobu (až 10 rokov)." }
      ]
    }
  ];
}

// Pomocník: nájde moment podľa ID v rámci profilu
function najdiMoment(legalForm, momentId) {
  return ziskajMomentyPreProfil(legalForm).find(m => m.id === momentId);
}

// Personalizované odôvodnenie výberu partnera (spec 6.1) – prepája výstup kalkulačiek/profilu
function partnerJustification(momentId, profil) {
  const trzby = profil.trzby ? Number(profil.trzby) : null;
  switch (momentId) {
    case "M3":
      return trzby
        ? `Pri tvojich tržbách ${trzby.toLocaleString('sk-SK')} € akceptujú ako jedni z mála 60 % tržieb ako príjem pri paušálnych výdavkoch – to ti zdvihne bonitu oproti výpočtu zo zisku.`
        : "Ako jedni z mála akceptujú 60 % tržieb ako príjem pri paušálnych výdavkoch, čo výrazne zvyšuje tvoju bonitu.";
    case "M2":
      return "Pre tvoju právnu formu ponúkajú vedenie účtu prvý rok zadarmo a platobnú bránu pre e-shop.";
    case "M5": case "M6":
      return `Špecializujú sa na ${profil.legalForm} v štádiu „${profil.stage}“ a vedia ti reálne optimalizovať dane, nielen spracovať doklady.`;
    case "M4":
      return "Prevezmú celú mzdovú agendu vrátane PZS a BOZP, ktoré sú pri prvom zamestnancovi povinné.";
    case "M7":
      return "Riešia poistenie prerušenia prevádzky a zodpovednosti šité na tvoje odvetvie, nie plošný balík.";
    case "M8":
      return "Pripravia VOP, GDPR a zmluvy so splatnosťou a sankciami presne pre tvoj typ podnikania.";
    default:
      return `Overený partner s referenciami pre ${profil.legalForm} v štádiu „${profil.stage}“.`;
  }
}

// Farba pillu podľa stavu dopytu
function statusPill(status) {
  if (status === LEAD_STATES.PRIJATA) return "pill-blue";
  if (status === LEAD_STATES.KONTAKTUJE) return "pill-orange";
  if (status === LEAD_STATES.PONUKA) return "pill-orange";
  if (status === LEAD_STATES.USPECH) return "pill-green";
  return "pill-grey";
}

// Markup + ovládanie AI asistenta v drawer (spec 6.2). Otázky bežia v uzavretom RAG kontexte.
function aiDrawerMarkup() {
  return `
    <div class="drawer-overlay" id="aiOverlay" onclick="closeAI()"></div>
    <div class="drawer" id="aiDrawer">
      <div class="drawer-head">
        <div><b>🤖 AI asistent</b><div class="ai-source" id="aiSource"></div></div>
        <button class="btn btn-secondary" style="padding:6px 12px;" onclick="closeAI()">Zavrieť</button>
      </div>
      <div class="drawer-body">
        <a id="aiArticle" href="#" target="_blank" class="btn btn-secondary btn-block" style="font-size:13px; margin-bottom:14px;">📄 Otvoriť celý článok na podnikajte.sk ↗</a>
        <p style="font-size:13px; color:#718096;">Rýchle otázky podľa tvojho profilu:</p>
        <div id="aiButtons">
          <button class="ai-chip" onclick="askAI('dolezite')">⚡ Čo je z tohto dôležité pre moje podnikanie?</button>
          <button class="ai-chip" onclick="askAI('terminy')">📅 Aké presné termíny a pokuty mi hrozia?</button>
          <button class="ai-chip" onclick="askAI('naklady')">💰 Koľko ma to bude stáť na poplatkoch?</button>
        </div>
        <div id="aiThread"></div>
        <div style="display:flex; gap:8px; margin-top:14px; position:sticky; bottom:0; background:#fff; padding-top:8px;">
          <input id="aiInput" type="text" placeholder="Spýtaj sa čokoľvek – prehľadám podnikajte.sk…" style="margin:0;" onkeydown="if(event.key==='Enter'){event.preventDefault();askFree();}">
          <button type="button" onclick="askFree()" style="white-space:nowrap;">Odoslať</button>
        </div>
      </div>
    </div>
    <script>
      let aiMoment = null, aiUrl = '#', aiTitle = '';
      function openAI(momentId, source, url, title){
        aiMoment = momentId; aiUrl = url || '#'; aiTitle = title || source;
        document.getElementById('aiSource').textContent = 'Zdroj: ' + source + ' (podnikajte.sk)';
        var a = document.getElementById('aiArticle');
        a.href = aiUrl; a.style.display = aiUrl && aiUrl !== '#' ? 'inline-flex' : 'none';
        document.getElementById('aiThread').innerHTML = '';
        document.getElementById('aiOverlay').classList.add('open');
        document.getElementById('aiDrawer').classList.add('open');
      }
      function closeAI(){
        document.getElementById('aiOverlay').classList.remove('open');
        document.getElementById('aiDrawer').classList.remove('open');
      }
      function aiPolozka(html){
        const thread = document.getElementById('aiThread');
        thread.insertAdjacentHTML('beforeend', html);
        thread.lastElementChild.scrollIntoView({ behavior: 'smooth', block: 'end' });
        return thread.lastElementChild;
      }
      async function dopytAI(params, otazkaText){
        if (otazkaText) aiPolozka('<div class="ai-msg" style="background:#fff7ed; border-left-color:var(--accent);"><b>Ty:</b> ' + otazkaText + '</div>');
        const cakam = aiPolozka('<div class="ai-msg" style="background:#f1f5f9; border-left-color:#94a3b8;">Premýšľam…</div>');
        try {
          const res = await fetch('/api/ai-ask?moment=' + encodeURIComponent(aiMoment) + '&' + params);
          const data = await res.json();
          let link;
          if (Array.isArray(data.sources) && data.sources.length) {
            link = '🔎 Zdroje (podnikajte.sk): ' + data.sources.map(function(s){ return '<a href="' + s.url + '" target="_blank" style="font-weight:700;">' + s.title + '</a>'; }).join(' · ');
          } else {
            const url = data.url || aiUrl, title = data.title || aiTitle || data.source;
            link = (url && url !== '#') ? '📄 Zdroj: <a href="' + url + '" target="_blank" style="font-weight:700;">' + (title || 'článok') + ' ↗</a>' : 'Zdroj: ' + (data.source || '');
          }
          cakam.outerHTML = '<div class="ai-msg">' + data.answer + '<div class="ai-source">' + link + '</div></div>';
        } catch(e) {
          cakam.outerHTML = '<div class="ai-msg" style="border-left-color:var(--danger);">Prepáč, odpoveď sa nepodarilo načítať.</div>';
        }
      }
      function askAI(kind){ dopytAI('kind=' + kind); }
      function askFree(){
        const inp = document.getElementById('aiInput');
        const q = inp.value.trim();
        if (!q) return;
        inp.value = '';
        dopytAI('q=' + encodeURIComponent(q), q.replace(/</g,'&lt;'));
      }
    </script>
  `;
}

function ziskajPripomienky(legalForm) {
  const d = new Date();
  return [
    { title: "Preddavok na zdravotné poistenie (sadzba 2026)", date: `08. ${String(d.getMonth()+2).padStart(2,'0')}. 2026`, badge: "badge-warning", note: "Nezabudnite upraviť trvalý príkaz v banke kvôli novej legislatíve." },
    { title: "Podanie daňového priznania k dani z príjmov", date: "31. 03. 2027", badge: "badge-success", note: "Riadny termín. Možnosť odkladu o 3 až 6 mesiacov." },
    { title: "Odvody do Sociálnej poisťovne za predošlý mesiac", date: "Ihneď", badge: "badge-danger", note: "Zmeškaná lehota! Hrozí penále a sankcia." }
  ];
}

// --- APP SHELL: ľavý sidebar + hlavný obsah (jednotný layout) ---
function renderShell(active, userEmail, content) {
  const nav = [
    { key: 'dashboard', href: '/', icon: '🧭', label: 'Dashboard' },
    { key: 'milniky', href: '/#milniky', icon: '🎯', label: 'Moje Milníky' },
    { key: 'kalkulacky', href: '/kalkulacka-modul', icon: '🧮', label: 'Kalkulačky' },
    { key: 'trezor', href: '/#trezor', icon: '🗄️', label: 'Môj Trezor' },
    { key: 'dopyty', href: '/moje-dopyty', icon: '📨', label: 'Moje dopyty' },
    { key: 'pripomienky', href: '/#terminy', icon: '🔔', label: 'Pripomienky' },
    { key: 'admin', href: '/admin', icon: '⚙️', label: 'Admin' }
  ];
  const initial = (userEmail || 'P').charAt(0).toUpperCase();
  return `${CSS_STYLES}
  <div class="app">
    <aside class="sidebar">
      <div class="brand">
        <div class="logo">🧭</div>
        <div><div class="bname">Cesta Podnikateľa</div><div class="btag">VÁŠ BIZNIS KOMPAS</div></div>
      </div>
      <div class="side-label">HLAVNÉ MENU</div>
      <nav class="side-nav">
        ${nav.map(n => `<a href="${n.href}" class="${active === n.key ? 'active' : ''}"><span class="ico">${n.icon}</span>${n.label}${active === n.key ? '<span class="dot"></span>' : ''}</a>`).join('')}
      </nav>
      <div class="side-foot">
        <div class="user-chip">
          <div class="avatar">${initial}</div>
          <div style="flex:1; min-width:0;">
            <div style="font-weight:700; font-size:13px; color:var(--dark);">Podnikateľ</div>
            <div style="font-size:11px; color:var(--muted); overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${userEmail || ''}</div>
          </div>
        </div>
        <a href="/logout" class="logout">Odhlásiť sa</a>
      </div>
    </aside>
    <main class="main">${content}</main>
  </div>
  ${aiDrawerMarkup()}`;
}

// --- 1. ROUTA: MAIN DASHBOARD ---
app.get('/', async (req, res) => {
  const user = auth.currentUser;

  if (!user) {
    return res.send(`
      ${CSS_STYLES}
      <div style="min-height:100vh; display:grid; grid-template-columns:1.1fr 1fr;">
        <div style="background:var(--grad-navy); color:#fff; padding:56px 48px; display:flex; flex-direction:column; justify-content:center;">
          <div style="display:flex; gap:12px; align-items:center; margin-bottom:32px;">
            <div style="width:46px; height:46px; border-radius:14px; background:var(--grad-primary); display:flex; align-items:center; justify-content:center; font-size:22px;">🧭</div>
            <div><div style="font-weight:800; font-size:17px;">Cesta Podnikateľa</div><div style="font-size:10px; letter-spacing:.14em; color:var(--accent); font-weight:800;">VÁŠ BIZNIS KOMPAS</div></div>
          </div>
          <h1 style="color:#fff; font-size:34px; line-height:1.2; margin:0 0 14px;">Digitálny kopilot<br>svetom vášho biznisu.</h1>
          <p style="color:rgba(255,255,255,.75); font-size:15px; line-height:1.6; max-width:440px;">Interaktívne checklisty, finančné kalkulačky, bezpečný trezor a proaktívne pripomienky termínov – všetko prispôsobené vašej právnej forme a štádiu podnikania.</p>
          <div style="display:flex; gap:22px; margin-top:32px; flex-wrap:wrap;">
            <div><div style="font-size:24px; font-weight:800; color:var(--accent);">10</div><div style="font-size:12px; color:rgba(255,255,255,.7);">biznis míľnikov</div></div>
            <div><div style="font-size:24px; font-weight:800; color:var(--accent);">5+</div><div style="font-size:12px; color:rgba(255,255,255,.7);">kalkulačiek</div></div>
            <div><div style="font-size:24px; font-weight:800; color:var(--accent);">AI</div><div style="font-size:12px; color:rgba(255,255,255,.7);">asistent k článkom</div></div>
          </div>
        </div>
        <div style="display:flex; align-items:center; justify-content:center; padding:32px;">
          <div class="card" style="max-width:380px; width:100%;">
            <h3 style="margin-top:0;">🔒 Prihlásenie do účtu</h3>
            <form action="/login" method="POST">
              <input type="email" name="email" placeholder="E-mail" required />
              <input type="password" name="password" placeholder="Heslo" required />
              <button type="submit" class="btn-block">Vstúpiť do kopilota</button>
            </form>
            <div style="display:flex; align-items:center; gap:10px; margin:22px 0; color:var(--muted); font-size:12px;"><span style="flex:1; height:1px; background:var(--line);"></span>NOVÝ NA PLATFORME?<span style="flex:1; height:1px; background:var(--line);"></span></div>
            <form action="/register" method="POST">
              <input type="email" name="email" placeholder="Váš E-mail" required />
              <input type="password" name="password" placeholder="Zvoľte si bezpečné heslo" required />
              <button type="submit" class="btn-secondary btn-block">Vytvoriť profil podnikateľa</button>
            </form>
          </div>
        </div>
      </div>
      <style>@media(max-width:820px){ body > div[style*="grid-template-columns"]{ grid-template-columns:1fr !important; } body > div[style*="grid-template-columns"] > div:first-child{ padding:36px 24px !important; } }</style>
    `);
  }

  if (!mockUserProfiles[user.uid]) {
    mockUserProfiles[user.uid] = { legalForm: "SZČO", stage: "začiatočník", completedTasks: [], onboardingDone: false };
  }

  const profil = mockUserProfiles[user.uid];

  // 3-krokový onboarding pred prvým vstupom na dashboard (spec 0 + 1)
  if (!profil.onboardingDone) return res.redirect('/onboarding');

  const momenty = ziskajMomentyPreProfil(profil.legalForm);
  const pripomienky = ziskajPripomienky(profil.legalForm);
  const mojeDopyty = systemLeads.filter(l => l.uid === user.uid);

  let celkovoUloh = 0;
  let splnenoUloh = 0;
  momenty.forEach(m => {
    m.tasks.forEach(t => {
      celkovoUloh++;
      if (profil.completedTasks.includes(t.id)) splnenoUloh++;
    });
  });
  const percentoProgresu = celkovoUloh > 0 ? Math.round((splnenoUloh / celkovoUloh) * 100) : 0;

  // Per-moment progres + počet rozpracovaných míľnikov
  const momentyProgres = momenty.map(m => {
    const done = m.tasks.filter(t => profil.completedTasks.includes(t.id)).length;
    return { m, done, total: m.tasks.length, pct: Math.round((done / m.tasks.length) * 100) };
  });
  const rozpracovane = momentyProgres.filter(x => x.done > 0 && x.done < x.total).length;
  const allReminders = [...pripomienky, ...(profil.reminders || [])];
  const odporucane = ['M3', 'M1', 'M6'].map(id => momenty.find(x => x.id === id)).filter(Boolean);
  const aiStav = OPENAI_API_KEY ? { val: 'EXPERT', foot: 'OPTIMALIZOVANÉ AI', cls: 'accent' } : { val: 'DEMO', foot: 'NASTAV OPENAI KĽÚČ', cls: '' };
  const otvoreneDopyty = mojeDopyty.filter(l => !l.closed).length;

  const content = `
    <div class="page-head">
      <div>
        <h1>Váš biznis kompas</h1>
        <div class="sub">Prehľad míľnikov a odporúčaní</div>
      </div>
      <div style="display:flex; gap:10px; align-items:center;">
        <details style="position:relative;">
          <summary class="btn btn-secondary" style="list-style:none;">⚙️ Prispôsobiť</summary>
          <div class="card" style="position:absolute; right:0; top:48px; width:300px; z-index:50; box-shadow:var(--shadow-lg);">
            <form action="/update-profile" method="POST">
              <label style="font-size:12px; font-weight:700;">Právna forma</label>
              <select name="legalForm">
                <option value="SZČO" ${profil.legalForm === 'SZČO' ? 'selected' : ''}>Živnosť (SZČO)</option>
                <option value="s.r.o." ${profil.legalForm === 's.r.o.' ? 'selected' : ''}>Spoločnosť s.r.o.</option>
                <option value="Nepodnikám" ${profil.legalForm === 'Nepodnikám' ? 'selected' : ''}>Ešte nepodnikám</option>
              </select>
              <label style="font-size:12px; font-weight:700;">Štádium firmy</label>
              <select name="stage">
                <option value="začiatočník" ${profil.stage === 'začiatočník' ? 'selected' : ''}>Začínam (0-1 rok)</option>
                <option value="zabehnutá" ${profil.stage === 'zabehnutá' ? 'selected' : ''}>Zabehnutá (1-3 roky)</option>
                <option value="expert" ${profil.stage === 'expert' ? 'selected' : ''}>Matador (3+ rokov)</option>
              </select>
              <button type="submit" class="btn-block" style="margin-top:8px;">Uložiť a adaptovať</button>
            </form>
          </div>
        </details>
        <a href="#milniky" class="btn">＋ Nový míľnik</a>
      </div>
    </div>

    <div class="stat-grid">
      <div class="stat dark">
        <span class="stat-ico">🎯</span>
        <div class="stat-label">Moje aktívne milníky</div>
        <div class="stat-num">${rozpracovane || momenty.length}</div>
        <div class="stat-foot">${rozpracovane ? 'práve rozpracované' : 'pripravených na štart'}</div>
      </div>
      <div class="stat">
        <span class="stat-ico">🔔</span>
        <div class="stat-label">Termíny & pripomienky</div>
        <div class="stat-num">${allReminders.length}</div>
        <div class="stat-foot">najbližšie udalosti</div>
      </div>
      <div class="stat ${aiStav.cls}">
        <span class="stat-ico">🤖</span>
        <div class="stat-label">AI stav analýzy</div>
        <div class="stat-num" style="font-size:30px;">${aiStav.val}</div>
        <div class="stat-foot">${aiStav.foot}</div>
      </div>
      <div class="stat">
        <span class="stat-ico">🏁</span>
        <div class="stat-label">Celkový postup</div>
        <div class="stat-num">${percentoProgresu}%</div>
        <div class="stat-foot">${splnenoUloh}/${celkovoUloh} úloh hotových</div>
      </div>
    </div>

    <div class="section-head" id="milniky">
      <h3>📌 Aktuálne biznis milníky</h3>
      <a href="/kalkulacka-modul" class="link-more">Všetky míľniky ›</a>
    </div>
    ${momentyProgres.map(({ m, done, total, pct }) => {
      const emoji = m.title.split(' ')[0];
      const titulok = m.title.substring(emoji.length).trim();
      const chip = done === 0 ? 'Roadmapa pripravená' : (done === total ? 'Dokončené ✓' : 'Rozpracované');
      return `
      <a href="/moment/${m.id}" class="milestone">
        <div class="m-icon">${emoji}</div>
        <div class="m-body">
          <div class="m-title">${titulok}</div>
          <div class="m-meta">${total} krokov · ${done}/${total} hotových</div>
          <div class="m-chip">✦ ${chip}</div>
          ${done > 0 ? `<div class="mini-bar"><div style="width:${pct}%;"></div></div>` : ''}
        </div>
        <div class="m-cta">Zobraziť progres</div>
        <div class="m-arrow">›</div>
      </a>`;
    }).join('')}

    <div class="section-head" style="margin-top:30px;">
      <h3>📖 Odporúčané pre váš rozvoj</h3>
      <span class="link-more">Zdroj: podnikajte.sk</span>
    </div>
    <div class="rec-grid">
      ${odporucane.map(m => `
        <div class="rec-card">
          <h4><a href="/clanok/${m.id}" target="_blank" style="color:inherit; text-decoration:none;">${m.article.title} ↗</a></h4>
          <div class="q">„${m.ai.dolezite.length > 130 ? m.ai.dolezite.slice(0, 130) + '…' : m.ai.dolezite}"</div>
          <div class="src">
            <a href="/clanok/${m.id}" target="_blank" style="color:var(--muted); letter-spacing:.12em;">PODNIKAJTE.SK ↗</a>
            <button type="button" class="btn-ghost" style="font-size:11px;" onclick="openAI('${m.id}','${m.ai.source.replace(/'/g, "")}','/clanok/${m.id}','${m.article.title.replace(/'/g, "")}')">🤖 Prečítať s AI</button>
          </div>
        </div>`).join('')}
    </div>

    <div class="section-head" id="terminy" style="margin-top:30px;">
      <h3>🔔 Termíny a pripomienky</h3>
      <span class="link-more">Proaktívny strážca 2026</span>
    </div>
    ${allReminders.map(p => `
      <div class="termin-row">
        <div class="termin-ico">📅</div>
        <div style="flex:1;">
          <div class="t-title">${p.title}</div>
          <div class="t-meta">${p.note}</div>
        </div>
        <span class="reminder-badge ${p.badge}">${p.date}</span>
      </div>`).join('')}
    <details style="margin-top:6px;">
      <summary class="btn btn-secondary" style="list-style:none; display:inline-flex; font-size:13px;">＋ Pridať vlastný termín</summary>
      <form action="/add-reminder" method="POST" class="card" style="margin-top:10px; display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
        <div style="flex:2; min-width:200px;"><label style="font-size:12px; font-weight:700;">Názov termínu</label><input type="text" name="title" placeholder="napr. Revízia poistnej zmluvy" required></div>
        <div style="flex:1; min-width:150px;"><label style="font-size:12px; font-weight:700;">Dátum</label><input type="date" name="date" required></div>
        <button type="submit">Pridať</button>
      </form>
    </details>

    <div class="section-head" id="trezor" style="margin-top:30px;">
      <h3>🗄️ Bezpečný Trezor</h3>
      <span class="link-more">Šifrované AES-256</span>
    </div>
    <div class="card">
      <div class="trezor-bar">
        <div class="lock">🔒</div>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:14px;">Vaše dokumenty sú chránené šifrovaním AES-256</div>
          <div style="font-size:12px; color:var(--muted);">Prístup má výhradne váš účet. Systém upozorní 30 dní pred exspiráciou.</div>
        </div>
      </div>
      <form action="/add-vault-document" method="POST" enctype="multipart/form-data" style="display:flex; gap:10px; flex-wrap:wrap; align-items:flex-end;">
        <div style="flex:2; min-width:200px;"><input type="text" name="name" placeholder="Názov (napr. Poistná zmluva budovy)" required /></div>
        <div style="flex:1; min-width:150px;"><input type="date" name="expiryDate" title="Dátum exspirácie" required /></div>
        <div style="flex:1; min-width:150px;"><input type="file" name="documentFile" accept="image/*,application/pdf" /></div>
        <button type="submit">Nahrať</button>
      </form>
      <h4 style="margin:16px 0 8px;">Uložené záznamy:</h4>
      <div id="vault-list"></div>
    </div>

    <div class="section-head" style="margin-top:30px;">
      <h3>📨 Moje dopyty ${otvoreneDopyty ? `<span class="pill pill-orange">${otvoreneDopyty} aktívne</span>` : ''}</h3>
      <a href="/moje-dopyty" class="link-more">Celý prehľad ›</a>
    </div>
    ${mojeDopyty.length === 0
      ? `<div class="card text-center" style="color:var(--muted); font-size:13px;">Zatiaľ nemáš žiadne odoslané dopyty. Klikni na míľnik a prekonzultuj ho s partnerom.</div>`
      : mojeDopyty.map(l => `
      <div class="lead-row">
        <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
          <b style="font-size:14px;">${l.partner}</b>
          <span class="pill ${statusPill(l.status)}">${l.status}</span>
        </div>
        <p style="font-size:12px; color:var(--muted); margin:6px 0;">${l.moment}</p>
        <p style="font-size:12px; color:#475569; margin:0 0 8px 0;">${l.statusNote || ''}</p>
        ${l.closed ? `<span style="font-size:12px; color:#94a3b8;">🔒 Dopyt uzavretý – kontaktovanie deaktivované.</span>` : `
        <div style="display:flex; gap:8px; flex-wrap:wrap;">
          <form action="/lead-action" method="POST" style="margin:0;">
            <input type="hidden" name="id" value="${l.id}"><input type="hidden" name="action" value="success">
            <button class="btn btn-success" style="font-size:11px; padding:7px 11px;">✅ Vyriešené s partnerom</button>
          </form>
          <form action="/lead-action" method="POST" style="margin:0;">
            <input type="hidden" name="id" value="${l.id}"><input type="hidden" name="action" value="storno">
            <button class="btn btn-secondary" style="font-size:11px; padding:7px 11px;">🚫 Zrušiť kontaktovanie</button>
          </form>
        </div>`}
      </div>`).join('')}
  `;

  let html = renderShell('dashboard', user.email, content);

  try {
    const docsRef = collection(db, 'users', user.uid, 'documents');
    const qSnapshot = await getDocs(docsRef);
    let vaultItemsHtml = '';
    
    if (qSnapshot.empty) {
      vaultItemsHtml = `<p style="font-size:12px; color:#a0aec0; text-align:center;">V úložisku zatiall nemáte dokumenty.</p>`;
    } else {
      qSnapshot.forEach(doc => {
        const data = doc.data();
        let expText = "Bez exspirácie";
        let colorStyle = "color:#2d3748;";
        if (data.expiryDate) {
          const dnes = new Date();
          const expDate = data.expiryDate.toDate();
          const dni = Math.ceil((expDate.getTime() - dnes.getTime()) / (1000 * 3600 * 24));
          expText = expDate.toLocaleDateString('sk-SK');
          if (dni < 0) { expText += " 🚨 EXSPIROVALO"; colorStyle = "color:var(--danger); font-weight:bold;"; }
          else if (dni <= 30) { expText += ` ⚠️ (${dni} dní do konca)`; colorStyle = "color:var(--warning); font-weight:bold;"; }
        }
        vaultItemsHtml += `
          <div style="font-size:13px; padding:8px 0; border-bottom:1px dashed #e2e8f0;">
            <b>📄 ${data.name}</b><br>
            <span style="font-size:11px; ${colorStyle}">Platnosť do: ${expText}</span><br>
            ${data.fileUrl ? `<a href="${data.fileUrl}" target="_blank" style="font-size:11px; color:var(--primary);">📂 Otvoriť prílohu</a>` : ''}
          </div>
        `;
      });
    }
    html = html.replace('<div id="vault-list"></div>', `<div id="vault-list">${vaultItemsHtml}</div>`);
    res.send(html);
  } catch (err) {
    res.send(html + `<p>Chyba načítania Vaultu: ${err.message}</p>`);
  }
});


// --- DETAIL MÍĽNIKA: checklist + partner + AI (spec 2 + 6) ---
app.get('/moment/:id', (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.redirect('/');
  const profil = mockUserProfiles[user.uid];
  if (!profil || !profil.onboardingDone) return res.redirect('/');
  const m = najdiMoment(profil.legalForm, req.params.id);
  if (!m) return res.redirect('/');

  const done = m.tasks.filter(t => profil.completedTasks.includes(t.id)).length;
  const total = m.tasks.length;
  const pct = Math.round((done / total) * 100);
  const emoji = m.title.split(' ')[0];
  const titulok = m.title.substring(emoji.length).trim();
  const par = systemPartners.find(p => p.id === m.partnerId) || systemPartners[0];
  const alt = systemPartners.filter(p => p.id !== par.id).slice(0, 2);

  const content = `
    <div class="page-head">
      <div>
        <a href="/" class="link-more" style="text-decoration:none;">‹ Späť na dashboard</a>
        <h1 style="margin-top:6px;">${emoji} ${titulok}</h1>
        <div class="sub">Míľnik ${m.id} · ${done}/${total} krokov hotových</div>
      </div>
      <a href="/interaktivny-lead?moment=${m.id}" class="btn">Prekonzultovať s expertom</a>
    </div>

    <div class="card">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 style="margin:0;">Checklist krokov</h3>
        <span style="font-size:13px; color:var(--muted); font-weight:700;">${pct} %</span>
      </div>
      <div class="progress-container"><div class="progress-bar" style="width:${pct}%;"></div></div>
      ${m.tasks.map(t => {
        const checked = profil.completedTasks.includes(t.id);
        return `
        <form action="/toggle-task" method="POST" class="task-item" style="margin:0;">
          <input type="hidden" name="taskId" value="${t.id}">
          <input type="checkbox" class="task-checkbox" onchange="this.form.submit()" ${checked ? 'checked' : ''}>
          <div class="task-content">
            <p class="task-title" style="${checked ? 'text-decoration:line-through; color:#a0aec0;' : ''}">${t.title}</p>
            <p class="task-desc">${t.desc}</p>
          </div>
        </form>`;
      }).join('')}
    </div>

    <div class="card">
      <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; justify-content:space-between;">
        <div style="flex:1; min-width:200px;">📚 Doporučené čítanie: <a href="/clanok/${m.id}" target="_blank" style="font-weight:700;">${m.article.title} ↗</a></div>
        <button type="button" class="btn-navy" onclick="openAI('${m.id}','${m.ai.source.replace(/'/g, "")}','/clanok/${m.id}','${m.article.title.replace(/'/g, "")}')">🤖 Prečítať s AI asistentom</button>
      </div>
    </div>

    <div class="partner-card">
      <h4 style="margin:0 0 4px 0; color:var(--primary);">💡 Odporúčaný partner: ${par.name}</h4>
      <p style="margin:0 0 12px 0; font-size:13px; color:#475569;"><b>Prečo práve oni:</b> ${partnerJustification(m.id, profil)}</p>
      <a href="/interaktivny-lead?moment=${m.id}" class="btn btn-block">Mám záujem – prekonzultovať (zadarmo)</a>
      <details style="margin-top:12px;">
        <summary style="font-size:12px; color:var(--muted); cursor:pointer; font-weight:700;">Porovnať s ${alt.length} alternatívami</summary>
        ${alt.map(a => `<div style="font-size:13px; padding:8px 0; border-bottom:1px dashed #e2e8f0;">${a.name} <span style="color:#94a3b8;">(${a.category})</span></div>`).join('')}
      </details>
    </div>
  `;
  res.send(renderShell('milniky', user.email, content));
});

// Toggle jednej úlohy (funguje naprieč stránkami, nepremaže ostatné)
app.post('/toggle-task', (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.redirect('/');
  const p = mockUserProfiles[user.uid];
  if (p) {
    if (!p.completedTasks) p.completedTasks = [];
    const i = p.completedTasks.indexOf(req.body.taskId);
    if (i >= 0) p.completedTasks.splice(i, 1); else p.completedTasks.push(req.body.taskId);
  }
  res.redirect(req.get('referer') || '/');
});

// Pridanie vlastného termínu / pripomienky
app.post('/add-reminder', (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.redirect('/');
  const p = mockUserProfiles[user.uid];
  if (p && req.body.title) {
    if (!p.reminders) p.reminders = [];
    const d = req.body.date ? new Date(req.body.date) : null;
    p.reminders.push({
      title: req.body.title,
      date: d ? d.toLocaleDateString('sk-SK') : 'Bez dátumu',
      badge: 'badge-warning',
      note: 'Vlastný termín'
    });
  }
  res.redirect((req.get('referer') || '/') + '#terminy');
});


// --- 2. ROUTA: INTELIGENTNÉ KALKULAČKY ---
app.get('/kalkulacka-modul', (req, res) => {
  if (!auth.currentUser) return res.redirect('/');

  const trzby = parseFloat(req.query.trzby) || 30000;
  const zisk = parseFloat(req.query.zisk) || 12000;
  const mzdaZamestnanca = parseFloat(req.query.mzdaZamestnanca) || 1500;

  const cistyPríjemTrzby = (trzby * 0.60) / 12; 
  const cistyPrijemZisk = zisk / 12;
  const maxUverTrzby = Math.round(cistyPríjemTrzby * 12 * 8);
  const maxUverZisk = Math.round(cistyPrijemZisk * 12 * 8);

  const r = 0.042 / 12;
  const n = 30 * 12;
  const mesacnaSplatkaTrzby = Math.round(maxUverTrzby * (r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1)) || 0;

  let pausalneVydavky = trzby * 0.60;
  if (pausalneVydavky > 24000) pausalneVydavky = 24000;
  
  const zakladDanePausal = Math.max(0, trzby - pausalneVydavky);
  const rocneZdravotne = Math.max(105 * 12, zakladDanePausal * 0.15); 
  const rocneSocialne = Math.max(240 * 12, zakladDanePausal * 0.3315);
  const danZPríjmu = Math.max(0, (zakladDanePausal - (rocneZdravotne + rocneSocialne)) * 0.15);
  
  const mesacneTrzby = Math.round(trzby / 12);
  const mZdravotka = Math.round(rocneZdravotne / 12);
  const mSocialka = Math.round(rocneSocialne / 12);
  const mDan = Math.round(danZPríjmu / 12);
  const cistyMesacnyZisk = Math.max(0, Math.round(mesacneTrzby - (mZdravotka + mSocialka + mDan)));

  const odvodyZamestnavatela = Math.round(mzdaZamestnanca * 0.352);
  const celkovaCenaPrace = Math.round(mzdaZamestnanca + odvodyZamestnavatela);
  const cistaMzdaZamestnanca = Math.round(mzdaZamestnanca * 0.74);

  let calcContent = `
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>

    <div class="page-head">
      <div><h1>🧮 Finančné kalkulačky</h1><div class="sub">Srdce aplikácie · model reality 2026</div></div>
    </div>
    <div>
      <div class="card" style="background:#faf5ff; border:1px dashed var(--secondary);">
        <h3 style="margin-top:0; color:var(--secondary);">✍️ Hlavný finančný simulátor</h3>
        <p style="font-size:13px; color:#555; margin-top:-10px;">Zadajte vaše reálne alebo plánované ročné tržby, zisk a mzdu zamestnanca pre výpočty.</p>
        <form action="/kalkulacka-modul" method="GET" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px;">
          <div>
            <label style="font-size:12px; font-weight:bold;">Ročné TRŽBY firmy (€):</label>
            <input type="number" name="trzby" value="${trzby}" required />
          </div>
          <div>
            <label style="font-size:12px; font-weight:bold;">Čistý ročný ZISK (€):</label>
            <input type="number" name="zisk" value="${zisk}" required />
          </div>
          <div>
            <label style="font-size:12px; font-weight:bold;">Hrubá mzda zamestnanca (€):</label>
            <input type="number" name="mzdaZamestnanca" value="${mzdaZamestnanca}" required />
          </div>
          <div style="padding-top:22px;">
            <button type="submit" class="btn-purple btn-block">Prepočítať model reality</button>
          </div>
        </form>
      </div>

      <div class="grid-2">
        <div class="card">
          <h3 style="color:var(--dark); margin-top:0;">🏢 Hypotekárna kalkulačka SZČO</h3>
          <p style="font-size:13px; color:#718096;">Prepočet bonity podľa dvoch základných metodík slovenských komerčných bánk.</p>
          
          <div class="result-box" style="border-left-color: var(--primary);">
            <h4>Akceptácia percenta z obratov (Model SLSP - 60%):</h4>
            <p>Vypočítaný mesačný príjem: <b>${Math.round(cistyPríjemTrzby)} €</b></p>
            <p>Odhadovaný max. úver (DTI): <b style="color:var(--primary); font-size:1.2em;">${maxUverTrzby.toLocaleString()} €</b></p>
            <p style="font-size:12px; color:#718096; margin-bottom:0;">Odhadovaná splátka (30r, 4.2%): <b>~${mesacnaSplatkaTrzby} € / mesiac</b></p>
          </div>

          <div class="result-box" style="border-left-color: #95a5a6;">
            <h4>Štandardná metodika (Čistý zisk / 12):</h4>
            <p>Vypočítaný mesačný príjem: <b>${Math.round(cistyPrijemZisk)} €</b></p>
            <p style="margin-bottom:0;">Odhadovaný max. úver: <b>${maxUverZisk.toLocaleString()} €</b></p>
          </div>
          
          <a href="/interaktivny-lead?moment=M3&trzby=${trzby}&zisk=${zisk}&bonita=${maxUverTrzby}" class="btn btn-block" style="margin-top:15px; font-size:13px;">Odoslať dopyt do Insia pre overenie ponuky</a>
        </div>

        <div class="card">
          <h3 style="color:var(--dark); margin-top:0;">📊 Odvody a Čistý príjem SZČO (2026)</h3>
          
          <table class="fin-table">
            <thead>
              <tr><th>Položka</th><th class="text-right">Mesačne</th><th class="text-right">Ročne</th></tr>
            </thead>
            <tbody>
              <tr><td>Hrubé tržby</td><td class="text-right">${mesacneTrzby} €</td><td class="text-right">${Math.round(trzby)} €</td></tr>
              <tr><td>Zdravotné (15 %)</td><td class="text-right" style="color:var(--danger); font-weight:bold;">-${mZdravotka} €</td><td class="text-right">-${Math.round(rocneZdravotne)} €</td></tr>
              <tr><td>Sociálne (33.15 %)</td><td class="text-right" style="color:var(--danger); font-weight:bold;">-${mSocialka} €</td><td class="text-right">-${Math.round(rocneSocialne)} €</td></tr>
              <tr><td>Daň z príjmu</td><td class="text-right" style="color:var(--danger); font-weight:bold;">-${mDan} €</td><td class="text-right">-${Math.round(danZPríjmu)} €</td></tr>
              <tr style="background:#f0fff4;"><td><b>Čistý cashflow</b></td><td class="text-right" style="color:var(--success); font-weight:bold;">${cistyMesacnyZisk} €</td><td class="text-right" style="color:var(--success); font-weight:bold;">${cistyMesacnyZisk * 12} €</td></tr>
            </tbody>
          </table>

          <div class="chart-container">
            <canvas id="moneyChart"></canvas>
          </div>
        </div>
      </div>

      <div class="card" style="margin-top:10px; border-top: 4px solid var(--success);">
        <h3 style="margin-top:0;">👥 Kalkulačka „Prvý zamestnanec“</h3>
        <p style="font-size:13px; color:#718096; margin-top:-10px;">Modeluje finančné dopady a reálne bremeno na rozpočet firmy pri prechode z One-Man Show na tím.</p>
        
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:20px; margin-top:15px;">
          <div style="background:#f7fafc; padding:15px; border-radius:8px; border-left:4px solid var(--secondary);">
            <span style="font-size:12px; text-transform:uppercase; color:#718096; font-weight:bold;">Náklady Zamestnávateľa</span>
            <h2 style="margin:5px 0 0 0; color:var(--dark);">${celkovaCenaPrace} € <span style="font-size:14px; font-weight:normal;">/ mesiac</span></h2>
            <p style="font-size:12px; color:#555; margin:8px 0 0 0;">Z toho čistá mzda človeka: <b>${cistaMzdaZamestnanca} €</b></p>
            <p style="font-size:12px; color:#555; margin:3px 0 0 0;">Odvody, ktoré doplácate vy (35.2%): <span style="color:var(--danger); font-weight:bold;">+${odvodyZamestnavatela} €</span></p>
          </div>
          
          <div style="background:#faf5ff; padding:15px; border-radius:8px; display:flex; flex-direction:column; justify-content:center;">
            <p style="margin:0; font-size:13px; font-weight:bold; color:var(--secondary);">⚠️ Skryté administratívne zaťaženie</p>
            <p style="margin:5px 0 0 0; font-size:12px; color:#555;">S prijatím prvého človeka musíte zo zákona zabezpečiť <b>Pracovnú zdravotnú službu (PZS)</b> a školenie <b>BOZP</b>. Odporúčame prenechať agendu mzdovej účtovníčke.</p>
          </div>
        </div>
      </div>
    </div>

    <script>
      Chart.register(ChartDataLabels);
      const ctx = document.getElementById('moneyChart').getContext('2d');
      new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: ['Čistý zisk', 'Sociálne', 'Zdravotné', 'Daň'],
          datasets: [{
            data: [${cistyMesacnyZisk}, ${mSocialka}, ${mZdravotka}, ${mDan}],
            backgroundColor: ['#16a34a', '#f5821f', '#f59e0b', '#ef4444'],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { position: 'right', labels: { boxWidth: 12, font: { size: 11 } } },
            datalabels: {
              color: '#fff',
              font: { weight: 'bold', size: 11 },
              formatter: (val) => val === 0 ? '' : val + ' €'
            }
          }
        }
      });
    </script>
  `;
  res.send(renderShell('kalkulacky', auth.currentUser.email, calcContent));
});


// --- 3. ROUTA: INTERAKTÍVNY LEAD CAPTURE MODAL (spec 6.3) ---
app.get('/interaktivny-lead', (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.redirect('/');
  const profil = mockUserProfiles[user.uid] || { legalForm: "Neznáma", stage: "Neznáme" };
  const moment = najdiMoment(profil.legalForm, req.query.moment) || { id: req.query.moment || "X", title: "Všeobecný dopyt", partnerId: "P1" };
  const partner = systemPartners.find(p => p.id === moment.partnerId) || systemPartners[0];

  // Finančný kontext z kalkulačiek (predvyplnený a posielaný partnerovi)
  let finText = "";
  if (req.query.trzby) finText = `Tržby ${Number(req.query.trzby).toLocaleString('sk-SK')} €` + (req.query.bonita ? ` / odhad bonity ${Number(req.query.bonita).toLocaleString('sk-SK')} €` : "");

  res.send(`
    ${CSS_STYLES}
    <div class="container" style="max-width: 550px; margin-top:40px;">
      <div class="card" style="border-top: 5px solid var(--secondary);">
        <h2 style="color:var(--dark); margin-top:0;">🎓 Edukačná kvalifikácia partnera</h2>
        <p style="font-size:14px; color:#555;">Míľnik: <b>${moment.title}</b><br>Odporúčaný partner: <b>${partner.name}</b></p>

        <div style="background:#f7fafc; padding:15px; border-radius:6px; margin:15px 0; border-left:4px solid var(--secondary); font-size:13px; line-height:1.5;">
          <b>Prečo práve oni:</b> ${partnerJustification(moment.id, profil)}
        </div>

        <div style="background:#ebf5ff; padding:12px; border-radius:6px; font-size:13px; margin-bottom:15px;">
          <b>📋 Tieto údaje posielame partnerovi (z tvojho profilu):</b>
          <ul style="margin:8px 0 0 0; padding-left:18px; color:#475569;">
            <li>Kontakt: ${user.email}</li>
            <li>Právna forma a štádium: ${profil.legalForm}, ${profil.stage}</li>
            <li>Moment a krok: ${moment.title}</li>
            ${finText ? `<li>Finančný kontext: ${finText}</li>` : ''}
          </ul>
        </div>

        <form action="/submit-lead" method="POST">
          <input type="hidden" name="momentId" value="${moment.id}" />
          <input type="hidden" name="momentTitle" value="${moment.title}" />
          <input type="hidden" name="partnerId" value="${partner.id}" />
          <input type="hidden" name="financialContext" value="${finText}" />

          <label style="font-size:13px; font-weight:bold; display:block; margin-top:10px;">Otázka pre verifikáciu leadu:</label>
          <p style="font-size:13px; color:#555; margin:4px 0;">Chcete, aby sme tieto riziká prekonzultovali s odborníkom, ktorý sa špecializuje na vaše odvetvie?</p>

          <select name="expertConsent" required>
            <option value="Áno – bezplatná telefonická konzultácia do 24 hodín">Áno – bezplatná telefonická konzultácia do 24 hodín</option>
            <option value="Len predbežné cenové ponuky e-mailom">Len predbežné cenové ponuky e-mailom</option>
          </select>

          <label style="font-size:13px; font-weight:bold;">Doplňujúca poznámka pre experta (nepovinné):</label>
          <textarea name="note" rows="3" placeholder="napr. Mám tržby prevažne zo zahraničia, hľadám optimálnu banku..." style="width:100%; border-radius:6px; border:1px solid #ccc; padding:10px; background:#fafafa; font-family:sans-serif; font-size:14px; box-sizing:border-box; margin-top:5px;"></textarea>

          <button type="submit" class="btn-purple btn-block" style="margin-top:15px;">Overiť a bezpečne odoslať dopyt partnerovi</button>
        </form>
        <a href="/" class="btn btn-secondary btn-block" style="margin-top:8px; font-size:13px;">Zrušiť a vrátiť sa späť</a>
      </div>
    </div>
  `);
});

app.post('/submit-lead', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).send("Neprihlásený používateľ.");

  const { momentId, momentTitle, partnerId, financialContext, note } = req.body;
  const profil = mockUserProfiles[user.uid] || { legalForm: "Neznáma", stage: "Neznáme" };
  const partner = systemPartners.find(p => p.id === partnerId) || systemPartners[0];

  const novyLead = {
    id: "L" + (systemLeads.length + 1),
    uid: user.uid,
    email: user.email,
    legalForm: profil.legalForm,
    stage: profil.stage,
    moment: momentTitle || momentId,
    momentId: momentId,
    partner: partner.name,
    status: LEAD_STATES.PRIJATA,
    statusNote: "Žiadosť prijatá. Partner ťa bude telefonicky kontaktovať najneskôr zajtra do 14:00.",
    financialContext: financialContext || "—",
    billing: "CPL", // fixná platba za doručený kvalifikovaný lead (spec 6.5)
    closed: false,
    date: new Date().toLocaleDateString('sk-SK'),
    note: note || 'Žiadna poznámka'
  };

  systemLeads.push(novyLead);
  partner.clicks++; partner.leads = (partner.leads || 0) + 1;

  res.send(`
    ${CSS_STYLES}
    <div class="container" style="max-width:480px; margin-top:60px;">
      <div class="card text-center">
        <h2 style="color:var(--success);">🚀 Lead úspešne verifikovaný a odoslaný!</h2>
        <p style="font-size:14px; color:#555;">Štruktúrovaný kontext (Forma: <b>${profil.legalForm}</b>, Míľnik: <b>${novyLead.moment}</b>${financialContext ? `, ${financialContext}` : ''}) bol priradený partnerovi <b>${partner.name}</b>.</p>
        <p style="font-size:13px; color:#718096;">Stav žiadosti sleduj v sekcii „Moje dopyty“ na Dashboarde.</p>
        <a href="/" class="btn" style="margin-top:10px;">Návrat na Môj Dashboard</a>
      </div>
    </div>
  `);
});

// --- LEAD ACTIONS: Safe-Mode uzavretie (spec 6.5) ---
app.post('/lead-action', (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).send("Neprihlásený.");
  const lead = systemLeads.find(l => l.id === req.body.id && l.uid === user.uid);
  if (lead) {
    if (req.body.action === 'success') {
      // Uzavretie s partnerom – fakturuje sa Success Fee
      lead.status = LEAD_STATES.USPECH;
      lead.statusNote = "Označené ako úspešne vyriešené. Partnerovi sa odosiela potvrdenie pre fakturáciu (Success Fee).";
      lead.billing = "Success Fee";
    } else {
      // Storno – stiahnutie súhlasu, ostáva fixné CPL za doručený lead
      lead.status = LEAD_STATES.STORNO;
      lead.statusNote = "Kontaktovanie zrušené, súhlas so spracovaním stiahnutý. Účtuje sa fixné CPL za doručený kvalifikovaný lead.";
      lead.billing = "CPL";
    }
    lead.closed = true;
  }
  res.redirect(req.get('referer') && req.get('referer').includes('moje-dopyty') ? '/moje-dopyty' : '/');
});

// --- DYNAMICKÝ VYHĽADÁVAČ ČLÁNKOV (Genkit-style retrieval) ---
// Naživo nájde najrelevantnejší reálny článok na podnikajte.sk pre daný moment.
const articleCache = {};
const bezDiakritiky = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '');

async function najdiRealnyClanok(moment) {
  if (articleCache[moment.id]) return articleCache[moment.id];
  const dopyt = moment.article.title;
  const searchUrl = `https://www.podnikajte.sk/vyhladavanie?q=${encodeURIComponent(dopyt)}`;
  const kws = bezDiakritiky(dopyt.toLowerCase()).split(/[^a-z0-9]+/).filter(w => w.length >= 5).map(w => w.slice(0, 6));
  try {
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 4500);
    const r = await fetch(searchUrl, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 CestaPodnikatela' } });
    clearTimeout(to);
    const html = await r.text();
    const re = /href="(\/[a-z0-9-]+\/[a-z0-9-]+)"/g;
    let m, prveDvojsegment = null, najlepsi = null;
    const videne = new Set();
    while ((m = re.exec(html))) {
      const p = m[1];
      if (videne.has(p)) continue;
      videne.add(p);
      if (/^\/(o-nas|kontakt|reklama|registracia|prihlasenie|cookies|ochrana-osobnych|vyhladavanie|autori|temy|kategorie)\b/.test(p)) continue;
      if (!prveDvojsegment) prveDvojsegment = p;
      if (kws.some(k => p.includes(k))) { najlepsi = p; break; }
    }
    const cesta = najlepsi || prveDvojsegment;
    const finalUrl = cesta ? 'https://www.podnikajte.sk' + cesta : searchUrl;
    articleCache[moment.id] = finalUrl;
    return finalUrl;
  } catch (e) {
    return searchUrl; // fallback: reálna stránka výsledkov vyhľadávania
  }
}

// --- WEB SEARCH OBMEDZENÝ NA podnikajte.sk (pre voľný chat) ---
async function stiahni(url, timeoutMs = 5000) {
  const ctrl = new AbortController();
  const to = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0 CestaPodnikatela' } });
    const t = await r.text();
    clearTimeout(to);
    return t;
  } catch (e) { clearTimeout(to); return ''; }
}

// Všetky kandidátske článkové cesty (dvojsegmentové) zo stránky výsledkov
function vsetkyClankove(html) {
  const re = /href="(\/[a-z0-9-]+\/[a-z0-9-]+)"/g;
  const seen = new Set(); const out = []; let m;
  while ((m = re.exec(html))) {
    const p = m[1];
    if (seen.has(p)) continue;
    seen.add(p);
    if (/^\/(o-nas|kontakt|reklama|registracia|prihlasenie|cookies|ochrana-osobnych|vyhladavanie|autori|temy|kategorie|sekcie|spravy|newsletter)\b/.test(p)) continue;
    out.push(p);
  }
  return out;
}

function htmlNaText(html) {
  const am = html.match(/<article[\s\S]*?<\/article>/i);
  let t = (am ? am[0] : html)
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>');
  return t.replace(/\s+/g, ' ').trim();
}

function titulZHtml(html) {
  const m = html.match(/<title>([^<]+)<\/title>/i);
  return m ? m[1].replace(/\s*\|\s*Podnikajte\.sk.*/i, '').trim() : 'Článok – podnikajte.sk';
}

// Naživo prehľadá podnikajte.sk a vráti text top článkov ako kontext + zoznam zdrojov.
async function hladajNaPodnikajte(dopyt) {
  const searchUrl = `https://www.podnikajte.sk/vyhladavanie?q=${encodeURIComponent(dopyt)}`;
  const shtml = await stiahni(searchUrl, 5000);
  // Zoradíme kandidátov podľa zhody slugu s kľúčovými slovami otázky (odfiltruje sidebar/populárne).
  const kws = bezDiakritiky(dopyt.toLowerCase()).split(/[^a-z0-9]+/).filter(w => w.length >= 5).map(w => w.slice(0, 6));
  const vsetky = vsetkyClankove(shtml);
  const skore = p => kws.reduce((n, k) => n + (p.includes(k) ? 1 : 0), 0);
  const zoradene = vsetky.map(p => ({ p, s: skore(p) })).sort((a, b) => b.s - a.s);
  let cesty = zoradene.filter(x => x.s > 0).slice(0, 3).map(x => x.p);
  if (!cesty.length) cesty = vsetky.slice(0, 3);
  if (!cesty.length) return { context: '', sources: [], searchUrl };
  const stranky = await Promise.all(cesty.map(p => stiahni('https://www.podnikajte.sk' + p, 5000)));
  const sources = []; let context = '';
  stranky.forEach((ahtml, i) => {
    if (!ahtml) return;
    const url = 'https://www.podnikajte.sk' + cesty[i];
    const title = titulZHtml(ahtml);
    const text = htmlNaText(ahtml).slice(0, 1600);
    if (text.length < 120) return;
    sources.push({ title, url });
    context += `\n=== Zdroj ${sources.length}: ${title} (${url}) ===\n${text}\n`;
  });
  return { context, sources, searchUrl };
}

// Presmeruje na reálny článok (všetky odkazy v UI smerujú sem)
app.get('/clanok/:id', async (req, res) => {
  const user = auth.currentUser;
  const lf = (user && mockUserProfiles[user.uid] && mockUserProfiles[user.uid].legalForm) || 'SZČO';
  const moment = najdiMoment(lf, req.params.id);
  if (!moment) return res.redirect('https://www.podnikajte.sk');
  // Overené reálne URL z katalógu (dvojsegmentová cesta = konkrétny článok); inak dynamické vyhľadanie
  const u = moment.article.url;
  if (u && /^https:\/\/www\.podnikajte\.sk\/[a-z0-9-]+\/[a-z0-9-]+/.test(u)) return res.redirect(u);
  res.redirect(await najdiRealnyClanok(moment));
});

// --- AI ASISTENT (RAG endpoint, spec 6.2) ---
const AI_OTAZKY = {
  dolezite: "Čo je z tohto článku dôležité práve pre moje podnikanie?",
  terminy: "Aké presné termíny a pokuty mi hrozia?",
  naklady: "Koľko ma to bude stáť na poplatkoch?"
};

app.get('/api/ai-ask', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ answer: "Neprihlásený používateľ.", source: "" });
  const profil = mockUserProfiles[user.uid] || { legalForm: "SZČO", stage: "začiatočník" };
  const moment = najdiMoment(profil.legalForm, req.query.moment);
  if (!moment) return res.json({ answer: "Pre tento krok nemám naviazaný článok.", source: "" });

  const kind = req.query.kind;
  const ai = moment.ai;
  const art = moment.article;
  const clanokUrl = '/clanok/' + moment.id;            // odkaz na reálny článok
  const freeQ = (req.query.q || '').trim();            // voľná otázka od používateľa

  // Volanie OpenAI chat completions; vráti text odpovede alebo vyhodí chybu.
  async function opytajSaGPT(system, userContent) {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: OPENAI_MODEL, temperature: 0.2, max_tokens: 500,
        messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }]
      })
    });
    if (!r.ok) { const t = await r.text(); throw new Error(`${r.status} ${t.slice(0, 200)}`); }
    const data = await r.json();
    return (data.choices?.[0]?.message?.content || '').trim();
  }

  // ===== VOĽNÁ OTÁZKA -> WEB SEARCH IBA NA podnikajte.sk =====
  if (freeQ) {
    if (!OPENAI_API_KEY) {
      return res.json({ answer: `Voľné otázky vyžadujú nastavený OPENAI_API_KEY. <span style="color:#94a3b8;">(zatiaľ viem odpovedať na 3 prednastavené otázky)</span>`, source: ai.source, url: clanokUrl, title: art.title });
    }
    try {
      const { context, sources, searchUrl } = await hladajNaPodnikajte(freeQ);
      if (!sources.length) {
        return res.json({ answer: `Na podnikajte.sk som k tejto otázke nenašiel relevantný článok. Skús ju preformulovať alebo skontaktuj partnera.`, sources: [{ title: 'Vyhľadávanie na podnikajte.sk ↗', url: searchUrl }] });
      }
      const system = `Si AI asistent v aplikácii Cesta Podnikateľa. Odpovedaj po slovensky, stručne a prakticky (max 6 viet) VÝHRADNE na základe nižšie uvedených ZDROJOV z webu podnikajte.sk. Nič mimo zdrojov si nevymýšľaj. Ak odpoveď v zdrojoch nie je, jasne to napíš. Kde to dáva zmysel, odvolaj sa na číslo zdroja (napr. „podľa Zdroja 2“). Zohľadni profil používateľa: právna forma ${profil.legalForm}, štádium ${profil.stage}.`;
      const answer = await opytajSaGPT(system, `ZDROJE Z podnikajte.sk:\n${context}\n\nOTÁZKA: ${freeQ}`);
      return res.json({ answer: answer || 'Nenašiel som odpoveď v zdrojoch.', sources });
    } catch (err) {
      console.error('Web-search AI výnimka:', err.message);
      return res.json({ answer: `Vyhľadávanie sa nepodarilo dokončiť. <span style="color:#ef4444;">(${err.message})</span>`, sources: [] });
    }
  }

  // ===== PREDNASTAVENÉ OTÁZKY -> grounding na konkrétny článok momentu =====
  const otazka = AI_OTAZKY[kind] || "Vysvetli mi tento krok.";
  const kontext = `Téma/článok: "${moment.article.title}"
Dôležité: ${ai.dolezite}
Termíny a pokuty: ${ai.terminy}
Náklady a poplatky: ${ai.naklady}`;

  if (!OPENAI_API_KEY) {
    const fallback = ai[kind] || "Túto informáciu článok neobsahuje.";
    return res.json({ answer: `<b>Pre tvoju ${profil.legalForm} (${profil.stage}):</b> ${fallback} <span style="color:#94a3b8;">(simulované – nastav OPENAI_API_KEY pre reálne AI)</span>`, source: ai.source, url: clanokUrl, title: art.title });
  }

  try {
    const system = `Si AI asistent v slovenskej aplikácii Cesta Podnikateľa. Odpovedáš VÝHRADNE na základe poskytnutého KONTEXTU – nič si nevymýšľaj. Ak kontext odpoveď neobsahuje, povedz, že informácia sa v článku nenachádza a nech sa obráti na partnera. Odpovedaj po slovensky, stručne (2–4 vety), konkrétne a prakticky. Zohľadni profil: právna forma ${profil.legalForm}, štádium ${profil.stage}.`;
    const answer = await opytajSaGPT(system, `KONTEXT:\n${kontext}\n\nOTÁZKA: ${otazka}`);
    res.json({ answer: answer || (ai[kind] || "Nemám odpoveď."), source: ai.source, url: clanokUrl, title: art.title });
  } catch (err) {
    console.error('OpenAI výnimka:', err.message);
    res.json({ answer: `${ai[kind] || "Túto informáciu sa nepodarilo načítať."} <span style="color:#ef4444;">(AI nedostupné: ${err.message})</span>`, source: ai.source, url: clanokUrl, title: art.title });
  }
});

// --- MOJE DOPYTY (plná stránka, spec 6.4) ---
app.get('/moje-dopyty', (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.redirect('/');
  const mojeDopyty = systemLeads.filter(l => l.uid === user.uid);
  const dopytyContent = `
    <div class="page-head">
      <div><h1>📨 Moje dopyty</h1><div class="sub">Transparentný tracker stavu · Safe-Mode</div></div>
    </div>
    <div>
      <p style="font-size:13px; color:var(--muted);">Sleduj stav žiadostí v reálnom čase. Po vyriešení môžeš kontaktovanie zastaviť (Safe-Mode).</p>
      ${mojeDopyty.length === 0 ? `<div class="card text-center"><p style="color:#a0aec0;">Zatiaľ nemáš žiadne odoslané dopyty.</p></div>` : mojeDopyty.map(l => `
        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap;">
            <h3 style="margin:0;">${l.partner}</h3>
            <span class="pill ${statusPill(l.status)}">${l.status}</span>
          </div>
          <p style="font-size:13px; color:#718096; margin:8px 0 4px;">${l.moment}</p>
          <p style="font-size:13px; color:#475569; margin:0 0 4px;">${l.statusNote || ''}</p>
          <p style="font-size:12px; color:#94a3b8; margin:0 0 10px;">Finančný kontext: ${l.financialContext} · Fakturácia: ${l.billing} · Dátum: ${l.date}</p>
          ${l.closed ? `<span style="font-size:12px; color:#94a3b8;">🔒 Dopyt uzavretý – kontaktovanie deaktivované.</span>` : `
          <div style="display:flex; gap:8px; flex-wrap:wrap;">
            <form action="/lead-action" method="POST" style="margin:0;">
              <input type="hidden" name="id" value="${l.id}"><input type="hidden" name="action" value="success">
              <button class="btn btn-success" style="font-size:12px; padding:7px 12px;">✅ Vyriešené s partnerom</button>
            </form>
            <form action="/lead-action" method="POST" style="margin:0;">
              <input type="hidden" name="id" value="${l.id}"><input type="hidden" name="action" value="storno">
              <button class="btn btn-secondary" style="font-size:12px; padding:7px 12px;">🚫 Zrušiť kontaktovanie / vyriešené mimo</button>
            </form>
          </div>`}
        </div>`).join('')}
    </div>
  `;
  res.send(renderShell('dopyty', user.email, dopytyContent));
});


// --- 4. ROUTA: ADMIN PANEL PLATFORMY ---
app.get('/admin', (req, res) => {
  if (!auth.currentUser) return res.redirect('/');

  const adminContent = `
    <div class="page-head">
      <div><h1>⚙️ Admin Panel</h1><div class="sub">Lead Engine · Partner Management</div></div>
    </div>
    <div>
      ${(() => {
        const obrat = systemPartners.reduce((s, p) => s + (p.leads || 0) * (p.cpl || 0), 0);
        const najpop = [...systemPartners].sort((a, b) => (b.leads || 0) - (a.leads || 0))[0];
        return `
      <div class="grid-2" style="grid-template-columns: repeat(auto-fit, minmax(180px,1fr)); margin-bottom:5px;">
        <div class="card text-center"><span style="font-size:12px; color:#718096;">NAZBIERANÉ LEADY</span><h2 style="margin:5px 0; color:var(--primary);">${systemLeads.length}</h2></div>
        <div class="card text-center"><span style="font-size:12px; color:#718096;">PARTNERI</span><h2 style="margin:5px 0; color:var(--secondary);">${systemPartners.length}</h2></div>
        <div class="card text-center"><span style="font-size:12px; color:#718096;">CPL OBRAT (odhad)</span><h2 style="margin:5px 0; color:var(--success);">${obrat} €</h2></div>
        <div class="card text-center"><span style="font-size:12px; color:#718096;">TOP PARTNER</span><h2 style="margin:5px 0; font-size:16px;">${najpop ? najpop.name : '—'}</h2></div>
      </div>`;
      })()}

      <div class="grid-2" style="grid-template-columns: 1fr 2fr;">
        <div class="card">
          <h3 style="margin-top:0;">🤝 Partner Management (CRUD)</h3>
          <table class="fin-table">
            <thead><tr><th>Partner</th><th>Moment</th><th class="text-right">Leady</th><th class="text-right">CPL</th><th></th></tr></thead>
            <tbody>
              ${systemPartners.map(p => `
                <tr>
                  <td><b>${p.name}</b><br><span style="font-size:11px; color:#94a3b8;">${p.category}${p.spotlight ? ' · ⭐ Spotlight' : ''}</span></td>
                  <td>${p.moment}</td>
                  <td class="text-right">${p.leads || 0}</td>
                  <td class="text-right">${p.cpl} €</td>
                  <td class="text-right"><form action="/admin/delete-partner" method="POST" style="margin:0;"><input type="hidden" name="id" value="${p.id}"><button class="btn btn-danger" style="padding:3px 8px; font-size:11px;">✕</button></form></td>
                </tr>`).join('')}
            </tbody>
          </table>
          <hr style="border:0; border-top:1px solid #edf2f7; margin:15px 0;">
          <h4 style="margin:0 0 8px;">➕ Pridať partnera</h4>
          <form action="/admin/add-partner" method="POST">
            <input type="text" name="name" placeholder="Názov partnera" required>
            <input type="text" name="category" placeholder="Kategória (napr. Bankovníctvo)" required>
            <select name="moment">${ziskajMomentyPreProfil('SZČO').map(m => `<option value="${m.id}">${m.id} – ${m.title.replace(/[^\wÀ-ž \-]/g, '').trim()}</option>`).join('')}</select>
            <div style="display:flex; gap:8px; align-items:center;">
              <input type="number" name="cpl" placeholder="CPL €" value="40" style="flex:1;">
              <label style="font-size:12px; white-space:nowrap;"><input type="checkbox" name="spotlight" style="width:auto;"> ⭐ Spotlight</label>
            </div>
            <button class="btn-success btn-block" style="margin-top:8px;">Pridať do marketplace</button>
          </form>
        </div>

        <div class="card">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
            <h3 style="margin:0;">📥 Doručené leady</h3>
            <a href="/admin/export-leads.csv" class="btn btn-secondary" style="font-size:12px; padding:7px 12px;">⬇️ Export do CSV</a>
          </div>
          <p style="font-size:12px; color:#718096;">Kompletný biznis kontext + finančné parametre, pripravené na CRM.</p>
          <table class="fin-table">
            <thead>
              <tr><th>Užívateľ</th><th>Forma</th><th>Míľnik</th><th>Fin. kontext</th><th>Partner</th><th>Fakturácia</th><th>Status</th></tr>
            </thead>
            <tbody>
              ${systemLeads.map(l => `
                <tr>
                  <td><b>${l.email}</b></td>
                  <td><span style="background:#edf2f7; padding:2px 5px; border-radius:4px; font-size:11px;">${l.legalForm}</span></td>
                  <td>${l.moment}</td>
                  <td style="font-size:11px;">${l.financialContext || '—'}</td>
                  <td>${l.partner}</td>
                  <td><span style="font-size:11px;">${l.billing}</span></td>
                  <td><span class="pill ${statusPill(l.status)}">${l.status}</span></td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  res.send(renderShell('admin', auth.currentUser.email, adminContent));
});

// Admin: export leadov do CSV (spec 7)
app.get('/admin/export-leads.csv', (req, res) => {
  if (!auth.currentUser) return res.redirect('/');
  const hlavicka = ["ID", "Email", "Pravna forma", "Stadium", "Moment", "Partner", "Financny kontext", "Fakturacia", "Status", "Datum", "Poznamka"];
  const riadky = systemLeads.map(l => [l.id, l.email, l.legalForm, l.stage || '', l.moment, l.partner, l.financialContext || '', l.billing, l.status, l.date, (l.note || '').replace(/"/g, "'")]
    .map(v => `"${String(v)}"`).join(';'));
  const csv = "﻿" + [hlavicka.join(';'), ...riadky].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leady-cesta-podnikatela.csv"');
  res.send(csv);
});

app.post('/admin/add-partner', (req, res) => {
  if (!auth.currentUser) return res.redirect('/');
  const { name, category, moment, cpl, spotlight } = req.body;
  systemPartners.push({ id: "P" + (partnerSeq++), name, category, moment, clicks: 0, leads: 0, cpl: Number(cpl) || 40, spotlight: !!spotlight });
  res.redirect('/admin');
});

app.post('/admin/delete-partner', (req, res) => {
  if (!auth.currentUser) return res.redirect('/');
  systemPartners = systemPartners.filter(p => p.id !== req.body.id);
  res.redirect('/admin');
});


// --- POST OPERAČNÉ ROUTY ---
app.post('/update-profile', (req, res) => {
  const user = auth.currentUser;
  if (user) {
    mockUserProfiles[user.uid].legalForm = req.body.legalForm;
    mockUserProfiles[user.uid].stage = req.body.stage;
  }
  res.redirect('/');
});

app.post('/toggle-tasks', (req, res) => {
  const user = auth.currentUser;
  if (user) {
    let checkedTasks = req.body.tasks || [];
    if (!Array.isArray(checkedTasks)) checkedTasks = [checkedTasks];
    mockUserProfiles[user.uid].completedTasks = checkedTasks;
  }
  res.redirect('/');
});

app.post('/add-vault-document', upload.single('documentFile'), async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).send("Prístup odmietnutý.");
  const { name, expiryDate } = req.body;
  let fileUrl = null;
  if (req.file) fileUrl = `/files/${req.file.filename}`;

  try {
    await addDoc(collection(db, 'users', user.uid, 'documents'), {
      name,
      expiryDate: Timestamp.fromDate(new Date(expiryDate)),
      fileUrl,
      createdAt: Timestamp.fromDate(new Date())
    });
    res.redirect('/');
  } catch (error) { res.status(500).send(`Chyba: ${error.message}`); }
});

app.post('/login', async (req, res) => {
  try { await signInWithEmailAndPassword(auth, req.body.email, req.body.password); res.redirect('/'); }
  catch (error) { res.send(`${CSS_STYLES}<div class="container" style="max-width:400px; margin-top:60px;"><div class="card text-center"><p style="color:var(--danger)">❌ ${error.message}</p><a href="/" class="btn btn-block">Skúsiť znova</a></div></div>`); }
});

app.post('/register', async (req, res) => {
  try { await createUserWithEmailAndPassword(auth, req.body.email, req.body.password); res.redirect('/'); }
  catch (error) { res.send(`${CSS_STYLES}<div class="container" style="max-width:400px; margin-top:60px;"><div class="card text-center"><p style="color:var(--danger)">❌ ${error.message}</p><a href="/" class="btn btn-block">Skúsiť znova</a></div></div>`); }
});

app.get('/logout', async (req, res) => { await signOut(auth); res.redirect('/'); });

// --- 3-KROKOVÝ ONBOARDING + PERSONALIZÁCIA (spec 0 + 1) ---
app.get('/onboarding', (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.redirect('/');
  if (!mockUserProfiles[user.uid]) mockUserProfiles[user.uid] = { legalForm: "SZČO", stage: "začiatočník", completedTasks: [], onboardingDone: false };
  const ciele = ziskajMomentyPreProfil('SZČO');

  res.send(`
    ${CSS_STYLES}
    <div class="container" style="max-width:540px; margin-top:30px;">
      <div class="card">
        <div class="stepper">
          <div class="step-dot active" id="d1">1</div>
          <div class="step-dot" id="d2">2</div>
          <div class="step-dot" id="d3">3</div>
        </div>
        <form action="/onboarding" method="POST" id="obForm">

          <section class="ob-step" data-step="1">
            <h2 style="margin-top:0; color:var(--dark);">Vitaj v Ceste Podnikateľa 💼</h2>
            <p style="font-size:13px; color:#718096;">Akú máš právnu formu? Podľa toho adaptujeme celý obsah.</p>
            <div class="opt-grid" data-field="legalForm">
              ${["SZČO", "s.r.o.", "j.s.a.", "Nepodnikám"].map((v, i) => `<label><input type="radio" name="legalForm" value="${v}" ${i === 0 ? 'checked' : ''} hidden><div class="opt-tile ${i === 0 ? 'sel' : ''}">${v === 'Nepodnikám' ? '🌱 Ešte nepodnikám' : v}</div></label>`).join('')}
            </div>
            <button type="button" class="btn-block" onclick="go(2)">Pokračovať →</button>
          </section>

          <section class="ob-step" data-step="2" style="display:none;">
            <h2 style="margin-top:0; color:var(--dark);">V akom si štádiu?</h2>
            <p style="font-size:13px; color:#718096;">Iný obsah pre začiatočníka, iný pre zabehnutú firmu.</p>
            <div class="opt-grid" data-field="stage">
              ${[["začiatočník", "Začínam (0–1 rok)"], ["zabehnutá", "Zabehnutá (1–3 roky)"], ["expert", "Matador (3+ rokov)"]].map((v, i) => `<label><input type="radio" name="stage" value="${v[0]}" ${i === 0 ? 'checked' : ''} hidden><div class="opt-tile ${i === 0 ? 'sel' : ''}">${v[1]}</div></label>`).join('')}
            </div>
            <p style="font-size:13px; color:#718096; margin-top:15px;">Pre lepšiu personalizáciu kalkulačiek (nepovinné):</p>
            <div style="display:flex; gap:10px;">
              <div style="flex:1;"><label style="font-size:12px;">Ročné tržby (€)</label><input type="number" name="trzby" placeholder="napr. 30000"></div>
              <div style="flex:1;"><label style="font-size:12px;">Odvetvie</label><input type="text" name="odvetvie" placeholder="napr. IT služby"></div>
            </div>
            <div style="display:flex; gap:10px; margin-top:8px;">
              <button type="button" class="btn-secondary" style="flex:1;" onclick="go(1)">← Späť</button>
              <button type="button" style="flex:2;" onclick="go(3)">Pokračovať →</button>
            </div>
          </section>

          <section class="ob-step" data-step="3" style="display:none;">
            <h2 style="margin-top:0; color:var(--dark);">Čo riešiš práve teraz?</h2>
            <p style="font-size:13px; color:#718096;">Vyber svoj aktuálny cieľ – aktivujeme príslušný checklist.</p>
            <select name="goal" style="margin-bottom:10px;">
              ${ciele.map(m => `<option value="${m.id}">${m.title}</option>`).join('')}
            </select>
            <div style="display:flex; gap:10px; margin-top:8px;">
              <button type="button" class="btn-secondary" style="flex:1;" onclick="go(2)">← Späť</button>
              <button type="submit" class="btn-success" style="flex:2;">Vstúpiť do kopilota 🚀</button>
            </div>
          </section>
        </form>
      </div>
    </div>
    <script>
      document.querySelectorAll('.opt-grid').forEach(grid => {
        grid.querySelectorAll('label').forEach(lbl => lbl.addEventListener('click', () => {
          grid.querySelectorAll('.opt-tile').forEach(t => t.classList.remove('sel'));
          lbl.querySelector('.opt-tile').classList.add('sel');
        }));
      });
      function go(step){
        document.querySelectorAll('.ob-step').forEach(s => s.style.display = (s.dataset.step == step ? 'block' : 'none'));
        for (let i=1;i<=3;i++){ const d=document.getElementById('d'+i); d.classList.remove('active','done'); if(i<step)d.classList.add('done'); if(i==step)d.classList.add('active'); }
      }
    </script>
  `);
});

app.post('/onboarding', (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.redirect('/');
  const p = mockUserProfiles[user.uid] || { completedTasks: [] };
  p.legalForm = req.body.legalForm || "SZČO";
  p.stage = req.body.stage || "začiatočník";
  p.trzby = req.body.trzby || null;
  p.odvetvie = req.body.odvetvie || null;
  p.goal = req.body.goal || null;
  p.onboardingDone = true;
  if (!p.completedTasks) p.completedTasks = [];
  mockUserProfiles[user.uid] = p;
  res.redirect('/');
});

// FALLBACK PRE STARÚ ADRESU (Ochrana pred chybou 404 / Cannot GET /kalkulacka)
app.get('/kalkulacka', (req, res) => {
  res.redirect('/kalkulacka-modul' + (req.url.includes('?') ? req.url.substring(req.url.indexOf('?')) : ''));
});

app.listen(PORT, () => console.log(`Cesta Podnikateľa úspešne beží na: http://localhost:${PORT}`));