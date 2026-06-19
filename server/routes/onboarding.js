const express = require('express');
const router = express.Router();
const { auth } = require('../../firebaseConfig');
const { ziskajMomentyPreProfil } = require('../data/moments');
const { getProfile, saveProfile } = require('../utils/firestore');

router.get('/data', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  const profil = await getProfile(user.uid);
  const lf = profil.legalForm || 'szco';
  const ciele = ziskajMomentyPreProfil(lf).map(m => ({ id: m.id, title: m.title }));
  res.json({ goals: ciele });
});

router.post('/', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  const data = {
    legalForm: req.body.legalForm || "szco",
    stage: req.body.stage || "začiatočník",
    trzby: req.body.trzby || null,
    odvetvie: req.body.odvetvie || null,
    goal: req.body.goal || null,
    onboardingDone: true
  };
  await saveProfile(user.uid, data);
  res.json({ success: true, profile: data });
});

module.exports = router;
