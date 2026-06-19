const express = require('express');
const router = express.Router();
const { auth } = require('../../firebaseConfig');
const { najdiMoment } = require('../data/moments');
const { hladajNaPodnikajte } = require('../utils/scraper');
const { getProfile } = require('../utils/firestore');

const OPENAI_API_KEY = () => process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = () => process.env.OPENAI_MODEL || 'gpt-4o-mini';

const AI_OTAZKY = {
  dolezite: "Čo je z tohto článku dôležité práve pre moje podnikanie?",
  terminy: "Aké presné termíny a pokuty mi hrozia?",
  naklady: "Koľko ma to bude stáť na poplatkoch?"
};

async function opytajSaGPT(system, userContent) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY()}` },
    body: JSON.stringify({ model: OPENAI_MODEL(), temperature: 0.2, max_tokens: 500, messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }] })
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`${r.status} ${t.slice(0, 200)}`); }
  const data = await r.json();
  return (data.choices?.[0]?.message?.content || '').trim();
}

async function streamGPT(system, userContent, res) {
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${OPENAI_API_KEY()}` },
    body: JSON.stringify({ model: OPENAI_MODEL(), temperature: 0.2, max_tokens: 500, stream: true, messages: [{ role: 'system', content: system }, { role: 'user', content: userContent }] })
  });
  if (!r.ok) { const t = await r.text(); throw new Error(`${r.status} ${t.slice(0, 200)}`); }
  const reader = r.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ')) continue;
      const payload = trimmed.slice(6);
      if (payload === '[DONE]') { res.write('data: [DONE]\n\n'); return; }
      try {
        const json = JSON.parse(payload);
        const token = json.choices?.[0]?.delta?.content;
        if (token) res.write(`data: ${JSON.stringify({ token })}\n\n`);
      } catch {}
    }
  }
  res.write('data: [DONE]\n\n');
}

// SSE streaming endpoint
router.get('/stream', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  const profil = await getProfile(user.uid);
  const moment = najdiMoment(profil.legalForm, req.query.moment);
  if (!moment) return res.status(404).json({ error: 'Míľnik nenájdený' });

  const kind = req.query.kind;
  const ai = moment.ai;
  const freeQ = (req.query.q || '').trim();

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Send sources first
  if (freeQ && OPENAI_API_KEY()) {
    try {
      const { context, sources, searchUrl } = await hladajNaPodnikajte(freeQ);
      res.write(`data: ${JSON.stringify({ sources: sources.length ? sources : [{ title: 'Vyhľadávanie na podnikajte.sk', url: searchUrl }] })}\n\n`);
      if (!sources.length) {
        res.write(`data: ${JSON.stringify({ token: 'Na podnikajte.sk som k tejto otázke nenašiel relevantný článok.' })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
      const system = `Si AI asistent v aplikácii Cesta Podnikateľa. Odpovedaj po slovensky, stručne a prakticky (max 6 viet) VÝHRADNE na základe nižšie uvedených ZDROJOV. Nič si nevymýšľaj. Zohľadni profil: ${profil.legalForm}, ${profil.stage}.`;
      await streamGPT(system, `ZDROJE:\n${context}\n\nOTÁZKA: ${freeQ}`, res);
    } catch (err) {
      res.write(`data: ${JSON.stringify({ token: `Chyba: ${err.message}` })}\n\n`);
      res.write('data: [DONE]\n\n');
    }
    return res.end();
  }

  // Preset question or no API key
  const otazka = AI_OTAZKY[kind] || "Vysvetli mi tento krok.";
  const kontext = `Téma: "${moment.article.title}"\nDôležité: ${ai.dolezite}\nTermíny: ${ai.terminy}\nNáklady: ${ai.naklady}`;

  res.write(`data: ${JSON.stringify({ sources: [{ title: moment.article.title, url: moment.article.url }] })}\n\n`);

  if (!OPENAI_API_KEY()) {
    const fallback = ai[kind] || "Túto informáciu článok neobsahuje.";
    const text = `Pre tvoju ${profil.legalForm} (${profil.stage}): ${fallback}`;
    for (const ch of text) {
      res.write(`data: ${JSON.stringify({ token: ch })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  try {
    const system = `Si AI asistent v slovenskej aplikácii Cesta Podnikateľa. Odpovedáš VÝHRADNE na základe KONTEXTU. Odpovedaj po slovensky, stručne (2–4 vety). Zohľadni profil: ${profil.legalForm}, ${profil.stage}.`;
    await streamGPT(system, `KONTEXT:\n${kontext}\n\nOTÁZKA: ${otazka}`, res);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ token: `(AI nedostupné: ${err.message})` })}\n\n`);
    res.write('data: [DONE]\n\n');
  }
  res.end();
});

// Original JSON endpoint (for AIDrawer / backward compat)
router.get('/', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ answer: "Neprihlásený používateľ.", source: "" });
  const profil = await getProfile(user.uid);
  const moment = najdiMoment(profil.legalForm, req.query.moment);
  if (!moment) return res.json({ answer: "Pre tento krok nemám naviazaný článok.", source: "" });

  const kind = req.query.kind;
  const ai = moment.ai;
  const art = moment.article;
  const clanokUrl = '/api/articles/' + moment.id;
  const freeQ = (req.query.q || '').trim();

  if (freeQ) {
    if (!OPENAI_API_KEY()) return res.json({ answer: 'Voľné otázky vyžadujú OPENAI_API_KEY.', source: ai.source, url: clanokUrl, title: art.title });
    try {
      const { context, sources, searchUrl } = await hladajNaPodnikajte(freeQ);
      if (!sources.length) return res.json({ answer: 'Nenašiel som relevantný článok.', sources: [{ title: 'Vyhľadávanie', url: searchUrl }] });
      const system = `Si AI asistent. Odpovedaj po slovensky, stručne (max 6 viet) VÝHRADNE na základe ZDROJOV. Profil: ${profil.legalForm}, ${profil.stage}.`;
      const answer = await opytajSaGPT(system, `ZDROJE:\n${context}\n\nOTÁZKA: ${freeQ}`);
      return res.json({ answer: answer || 'Nenašiel som odpoveď.', sources });
    } catch (err) {
      return res.json({ answer: `Chyba: ${err.message}`, sources: [] });
    }
  }

  const otazka = AI_OTAZKY[kind] || "Vysvetli mi tento krok.";
  const kontext = `Téma: "${art.title}"\nDôležité: ${ai.dolezite}\nTermíny: ${ai.terminy}\nNáklady: ${ai.naklady}`;
  if (!OPENAI_API_KEY()) {
    return res.json({ answer: `Pre tvoju ${profil.legalForm} (${profil.stage}): ${ai[kind] || 'Informácia nedostupná.'} (demo)`, source: ai.source, url: clanokUrl, title: art.title });
  }
  try {
    const system = `Si AI asistent. Odpovedáš VÝHRADNE na základe KONTEXTU, po slovensky, stručne (2–4 vety). Profil: ${profil.legalForm}, ${profil.stage}.`;
    const answer = await opytajSaGPT(system, `KONTEXT:\n${kontext}\n\nOTÁZKA: ${otazka}`);
    res.json({ answer: answer || (ai[kind] || "Nemám odpoveď."), source: ai.source, url: clanokUrl, title: art.title });
  } catch (err) {
    res.json({ answer: `${ai[kind] || 'Chyba.'} (${err.message})`, source: ai.source, url: clanokUrl, title: art.title });
  }
});

module.exports = router;
