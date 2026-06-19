const express = require('express');
const path = require('path');
const fs = require('fs');

// --- Načítanie .env ---
(function loadEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
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

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/moments', require('./routes/moments'));
app.use('/api/calculator', require('./routes/calculator'));
app.use('/api/leads', require('./routes/leads'));
app.use('/api/calculators', require('./routes/calculators'));
app.use('/api/ai-ask', require('./routes/ai'));
app.use('/api/vault', require('./routes/vault'));
app.use('/api/onboarding', require('./routes/onboarding'));
app.use('/api/profile', require('./routes/profile'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/partner', require('./routes/partnerPortal'));

// --- Serve React build v produkcii ---
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get('{*path}', (req, res) => {
    res.sendFile(path.join(clientBuild, 'index.html'));
  });
}

app.listen(PORT, () => console.log(`Cesta Podnikateľa API beží na: http://localhost:${PORT}`));
