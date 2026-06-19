const express = require('express');
const router = express.Router();
const { auth } = require('../../firebaseConfig');
const { systemLeads, systemPartners, LEAD_STATES } = require('../data/state');
const { najdiMoment, partnerJustification } = require('../data/moments');
const { getProfile } = require('../utils/firestore');

router.get('/', (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  const mojeDopyty = systemLeads.filter(l => l.uid === user.uid);
  res.json({ leads: mojeDopyty });
});

router.get('/form-data', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  const profil = await getProfile(user.uid);
  const moment = najdiMoment(profil.legalForm, req.query.moment) || { id: req.query.moment || "X", title: "Všeobecný dopyt", partnerId: "P1" };
  const partner = systemPartners.find(p => p.id === moment.partnerId) || systemPartners[0];

  res.json({
    moment,
    partner,
    profil: { legalForm: profil.legalForm, stage: profil.stage },
    email: user.email,
    justification: partnerJustification(moment.id, profil)
  });
});

router.post('/submit', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });

  const { momentId, momentTitle, partnerId, financialContext, note } = req.body;
  const profil = await getProfile(user.uid);
  const partner = systemPartners.find(p => p.id === partnerId) || systemPartners[0];

  const novyLead = {
    id: "L" + (systemLeads.length + 1),
    uid: user.uid,
    email: user.email,
    legalForm: profil.legalForm,
    stage: profil.stage,
    moment: momentTitle || momentId,
    momentId,
    partner: partner.name,
    status: LEAD_STATES.PRIJATA,
    statusNote: "Žiadosť prijatá. Partner ťa bude telefonicky kontaktovať najneskôr zajtra do 14:00.",
    financialContext: financialContext || "—",
    billing: "CPL",
    closed: false,
    date: new Date().toLocaleDateString('sk-SK'),
    note: note || 'Žiadna poznámka'
  };

  systemLeads.push(novyLead);
  partner.clicks++;
  partner.leads = (partner.leads || 0) + 1;

  res.json({ success: true, lead: novyLead });
});

router.post('/action', (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  const lead = systemLeads.find(l => l.id === req.body.id && l.uid === user.uid);
  if (!lead) return res.status(404).json({ error: 'Lead nenájdený' });

  if (req.body.action === 'success') {
    lead.status = LEAD_STATES.USPECH;
    lead.statusNote = "Označené ako úspešne vyriešené. Partnerovi sa odosiela potvrdenie pre fakturáciu (Success Fee).";
    lead.billing = "Success Fee";
  } else {
    lead.status = LEAD_STATES.STORNO;
    lead.statusNote = "Kontaktovanie zrušené, súhlas so spracovaním stiahnutý. Účtuje sa fixné CPL za doručený kvalifikovaný lead.";
    lead.billing = "CPL";
  }
  lead.closed = true;

  res.json({ success: true, lead });
});

module.exports = router;
