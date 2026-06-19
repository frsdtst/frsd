const express = require('express');
const router = express.Router();
const { auth, db } = require('../../firebaseConfig');
const { collection, getDocs } = require('firebase/firestore');
const { requireAdmin } = require('../middleware/adminCheck');
const state = require('../data/state');
const { ziskajMomentyPreProfil } = require('../data/moments');

router.use(requireAdmin);

router.get('/stats', async (req, res) => {
  const obrat = state.systemPartners.reduce((s, p) => s + (p.leads || 0) * (p.cpl || 0), 0);
  const najpop = [...state.systemPartners].sort((a, b) => (b.leads || 0) - (a.leads || 0))[0];

  let totalUsers = 0;
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    totalUsers = usersSnap.size;
  } catch {}

  const momentStats = {};
  state.systemLeads.forEach(l => {
    const mid = l.momentId || 'unknown';
    momentStats[mid] = (momentStats[mid] || 0) + 1;
  });
  const popularMoments = Object.entries(momentStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id, count]) => ({ id, count }));

  res.json({
    totalLeads: state.systemLeads.length,
    totalPartners: state.systemPartners.length,
    totalUsers,
    obrat,
    topPartner: najpop ? najpop.name : '—',
    openLeads: state.systemLeads.filter(l => !l.closed).length,
    closedLeads: state.systemLeads.filter(l => l.closed).length,
    popularMoments,
    partners: state.systemPartners,
    leads: state.systemLeads,
    moments: ziskajMomentyPreProfil('szco').map(m => ({ id: m.id, title: m.title }))
  });
});

router.get('/export-leads.csv', (req, res) => {
  const hlavicka = ["ID", "Email", "Pravna forma", "Stadium", "Moment", "Partner", "Financny kontext", "Fakturacia", "Status", "Datum", "Poznamka"];
  const riadky = state.systemLeads.map(l =>
    [l.id, l.email, l.legalForm, l.stage || '', l.moment, l.partner, l.financialContext || '', l.billing, l.status, l.date, (l.note || '').replace(/"/g, "'")]
      .map(v => `"${String(v)}"`).join(';')
  );
  const csv = "﻿" + [hlavicka.join(';'), ...riadky].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="leady-cesta-podnikatela.csv"');
  res.send(csv);
});

router.post('/partners', (req, res) => {
  const { name, category, moment, cpl, spotlight } = req.body;
  const newPartner = {
    id: "P" + state.partnerSeq,
    name, category, moment, clicks: 0, leads: 0,
    cpl: Number(cpl) || 40,
    spotlight: !!spotlight
  };
  state.partnerSeq = state.partnerSeq + 1;
  state.systemPartners.push(newPartner);
  res.json({ success: true, partner: newPartner });
});

router.put('/partners/:id', (req, res) => {
  const p = state.systemPartners.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Partner nenájdený' });
  if (req.body.name) p.name = req.body.name;
  if (req.body.category) p.category = req.body.category;
  if (req.body.moment) p.moment = req.body.moment;
  if (req.body.cpl !== undefined) p.cpl = Number(req.body.cpl);
  if (req.body.spotlight !== undefined) p.spotlight = !!req.body.spotlight;
  res.json({ success: true, partner: p });
});

router.delete('/partners/:id', (req, res) => {
  const idx = state.systemPartners.findIndex(p => p.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Partner nenájdený' });
  state.systemPartners.splice(idx, 1);
  res.json({ success: true });
});

router.put('/leads/:id/status', (req, res) => {
  const lead = state.systemLeads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead nenájdený' });
  if (req.body.status) lead.status = req.body.status;
  if (req.body.statusNote) lead.statusNote = req.body.statusNote;
  if (req.body.closed !== undefined) lead.closed = req.body.closed;
  if (req.body.billing) lead.billing = req.body.billing;
  res.json({ success: true, lead });
});

module.exports = router;
