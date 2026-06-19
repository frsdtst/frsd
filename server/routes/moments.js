const express = require('express');
const router = express.Router();
const { auth } = require('../../firebaseConfig');
const { systemPartners } = require('../data/state');
const { najdiMoment, partnerJustification } = require('../data/moments');
const { getProfile, saveProfile } = require('../utils/firestore');

router.get('/:id', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  const profil = await getProfile(user.uid);
  if (!profil.onboardingDone) return res.status(403).json({ error: 'Onboarding nedokončený' });

  const m = najdiMoment(profil.legalForm, req.params.id);
  if (!m) return res.status(404).json({ error: 'Míľnik nenájdený' });

  const done = m.tasks.filter(t => profil.completedTasks.includes(t.id)).length;
  const total = m.tasks.length;
  const pct = Math.round((done / total) * 100);
  const par = systemPartners.find(p => p.id === m.partnerId) || systemPartners[0];
  const alt = systemPartners.filter(p => p.id !== par.id).slice(0, 2);

  res.json({
    moment: m,
    done,
    total,
    pct,
    partner: par,
    alternatives: alt,
    justification: partnerJustification(m.id, profil),
    completedTasks: profil.completedTasks
  });
});

router.post('/toggle-task', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  const profil = await getProfile(user.uid);
  const tasks = profil.completedTasks || [];
  const i = tasks.indexOf(req.body.taskId);
  if (i >= 0) tasks.splice(i, 1);
  else tasks.push(req.body.taskId);
  await saveProfile(user.uid, { completedTasks: tasks });
  res.json({ success: true, completedTasks: tasks });
});

module.exports = router;
