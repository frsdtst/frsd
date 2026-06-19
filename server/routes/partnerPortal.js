const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { db } = require('../../firebaseConfig');
const { doc, getDoc } = require('firebase/firestore');
const state = require('../data/state');

const partnerSessions = {};

function generateToken() { return crypto.randomBytes(32).toString('hex'); }

function requirePartner(req, res, next) {
  const token = req.headers['x-partner-token'];
  if (!token || !partnerSessions[token]) return res.status(401).json({ error: 'Neautorizovaný prístup.' });
  req.partner = partnerSessions[token];
  next();
}

function getPartnerLeads(partnerName) {
  return state.systemLeads.filter(l => l.partner === partnerName || l.partner.includes(partnerName));
}

const PIPELINE_STAGES = [
  { key: 'new', label: 'Nový', icon: '🆕', color: '#3b82f6' },
  { key: 'contacted', label: 'Kontaktovaný', icon: '📞', color: '#f59e0b' },
  { key: 'negotiating', label: 'Rozjednaný', icon: '🤝', color: '#8b5cf6' },
  { key: 'won', label: 'Vyhratý', icon: '✅', color: '#16a34a' },
  { key: 'lost', label: 'Zamietnutý', icon: '❌', color: '#ef4444' }
];

function mapStatusToStage(status) {
  if (!status) return 'new';
  if (status.includes('prijatá')) return 'new';
  if (status.includes('kontaktuje')) return 'contacted';
  if (status.includes('pripravená') || status.includes('Rozjednan')) return 'negotiating';
  if (status.includes('úspešné') || status.includes('Vyhrat')) return 'won';
  if (status.includes('Zrušené') || status.includes('Zamietnut')) return 'lost';
  return 'new';
}

router.post('/login', async (req, res) => {
  const { partnerId, accessKey } = req.body;
  if (!partnerId || !accessKey) return res.status(400).json({ error: 'Zadajte ID partnera a prístupový kľúč.' });
  try {
    const snap = await getDoc(doc(db, 'partner_accounts', partnerId));
    if (!snap.exists()) return res.status(401).json({ error: 'Partner nenájdený.' });
    const data = snap.data();
    if (data.accessKey !== accessKey) return res.status(401).json({ error: 'Nesprávny prístupový kľúč.' });
    const token = generateToken();
    const partner = state.systemPartners.find(p => p.id === partnerId);
    partnerSessions[token] = { partnerId, partnerName: partner?.name || data.name || partnerId, loginAt: new Date().toISOString() };
    res.json({ success: true, token, partner: { id: partnerId, name: partner?.name || data.name } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/logout', (req, res) => {
  const token = req.headers['x-partner-token'];
  if (token) delete partnerSessions[token];
  res.json({ success: true });
});

router.get('/me', requirePartner, (req, res) => {
  const partner = state.systemPartners.find(p => p.id === req.partner.partnerId);
  res.json({
    partnerId: req.partner.partnerId,
    partnerName: req.partner.partnerName,
    category: partner?.category || '',
    moment: partner?.moment || '',
    clicks: partner?.clicks || 0,
    totalLeads: partner?.leads || 0,
    cpl: partner?.cpl || 0
  });
});

router.get('/leads', requirePartner, (req, res) => {
  const leads = getPartnerLeads(req.partner.partnerName);
  const enriched = leads.map(l => ({
    id: l.id, email: l.email, legalForm: l.legalForm, stage: l.stage,
    moment: l.moment, momentId: l.momentId,
    status: l.status, statusNote: l.statusNote,
    pipelineStage: mapStatusToStage(l.status),
    financialContext: l.financialContext,
    billing: l.billing, closed: l.closed, date: l.date, note: l.note,
    phone: l.phone || null,
    companyName: l.companyName || null,
    ico: l.ico || null,
    employees: l.employees || null,
    calcResults: l.calcResults || null
  }));
  const pipeline = {};
  PIPELINE_STAGES.forEach(s => { pipeline[s.key] = enriched.filter(l => l.pipelineStage === s.key).length; });
  res.json({ leads: enriched, total: leads.length, pipeline, stages: PIPELINE_STAGES });
});

router.get('/leads/:id', requirePartner, (req, res) => {
  const lead = state.systemLeads.find(l => l.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead nenájdený.' });
  const partnerName = req.partner.partnerName;
  if (!lead.partner.includes(partnerName)) return res.status(403).json({ error: 'Tento lead nepatrí vášmu účtu.' });
  res.json({
    ...lead,
    pipelineStage: mapStatusToStage(lead.status),
    phone: lead.phone || null,
    companyName: lead.companyName || null,
    ico: lead.ico || null,
    employees: lead.employees || null,
    calcResults: lead.calcResults || null,
    history: lead.history || []
  });
});

router.put('/leads/:id/status', requirePartner, (req, res) => {
  const partnerName = req.partner.partnerName;
  const lead = state.systemLeads.find(l => l.id === req.params.id && l.partner.includes(partnerName));
  if (!lead) return res.status(404).json({ error: 'Lead nenájdený.' });

  const prevStatus = lead.status;
  if (req.body.status) lead.status = req.body.status;
  if (req.body.statusNote) lead.statusNote = req.body.statusNote;
  if (req.body.pipelineStage === 'won') { lead.closed = true; lead.billing = 'Success Fee'; }
  if (req.body.pipelineStage === 'lost') { lead.closed = true; }

  if (!lead.history) lead.history = [];
  lead.history.push({
    from: prevStatus, to: lead.status,
    note: req.body.feedbackNote || '',
    by: partnerName,
    at: new Date().toISOString()
  });

  res.json({ success: true, lead });
});

router.get('/stats', requirePartner, (req, res) => {
  const leads = getPartnerLeads(req.partner.partnerName);
  const partner = state.systemPartners.find(p => p.id === req.partner.partnerId);
  const byMonth = {};
  leads.forEach(l => {
    const month = l.date ? l.date.substring(l.date.lastIndexOf('.') + 2).trim() : 'unknown';
    byMonth[month] = (byMonth[month] || 0) + 1;
  });
  const noFeedback = leads.filter(l => !l.closed && (!l.history || l.history.length === 0)).length;
  res.json({
    totalLeads: leads.length,
    openLeads: leads.filter(l => !l.closed).length,
    successLeads: leads.filter(l => l.status === state.LEAD_STATES.USPECH).length,
    cancelledLeads: leads.filter(l => l.status === state.LEAD_STATES.STORNO).length,
    clicks: partner?.clicks || 0, cpl: partner?.cpl || 0,
    estimatedRevenue: leads.length * (partner?.cpl || 0),
    noFeedback, byMonth
  });
});

router.get('/export.csv', requirePartner, (req, res) => {
  const leads = getPartnerLeads(req.partner.partnerName);
  const header = ["ID","Email","Pravna forma","Stadium","Moment","Financny kontext","Status","Pipeline","Fakturacia","Datum","Poznamka"];
  const rows = leads.map(l =>
    [l.id, l.email, l.legalForm, l.stage||'', l.moment, l.financialContext||'', l.status, mapStatusToStage(l.status), l.billing, l.date, (l.note||'').replace(/"/g,"'")]
      .map(v => `"${String(v)}"`).join(';')
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="leady-${req.partner.partnerId}.csv"`);
  res.send("﻿" + [header.join(';'), ...rows].join('\r\n'));
});

module.exports = router;
