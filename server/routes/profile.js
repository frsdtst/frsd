const express = require('express');
const router = express.Router();
const { auth } = require('../../firebaseConfig');
const { getProfile, saveProfile } = require('../utils/firestore');

router.post('/update', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  await saveProfile(user.uid, { legalForm: req.body.legalForm, stage: req.body.stage });
  const profil = await getProfile(user.uid);
  res.json({ success: true, profile: profil });
});

router.post('/reminders', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  if (!req.body.title) return res.status(400).json({ error: 'Názov je povinný' });

  const profil = await getProfile(user.uid);
  const reminders = profil.reminders || [];
  reminders.push({
    title: req.body.title,
    isoDate: req.body.date || null,
    type: req.body.type || 'custom',
    note: req.body.note || '',
    createdAt: new Date().toISOString()
  });
  await saveProfile(user.uid, { reminders });
  res.json({ success: true });
});

router.post('/reminders/delete', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  const profil = await getProfile(user.uid);
  const reminders = profil.reminders || [];
  const idx = req.body.index;
  if (typeof idx === 'number' && idx >= 0 && idx < reminders.length) {
    reminders.splice(idx, 1);
    await saveProfile(user.uid, { reminders });
  }
  res.json({ success: true });
});

module.exports = router;
