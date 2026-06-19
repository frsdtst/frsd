const express = require('express');
const router = express.Router();
const { auth, db } = require('../../firebaseConfig');
const { collection, getDocs } = require('firebase/firestore');
const { systemLeads } = require('../data/state');
const { ziskajMomentyPreProfil } = require('../data/moments');
const { getProfile } = require('../utils/firestore');

function computeUrgency(isoDate) {
  if (!isoDate) return { badge: 'badge-grey', label: 'Bez dátumu', daysLeft: null };
  const now = new Date();
  const target = new Date(isoDate);
  const days = Math.ceil((target.getTime() - now.getTime()) / (1000 * 3600 * 24));
  if (days < 0) return { badge: 'badge-danger', label: 'Po termíne!', daysLeft: days };
  if (days === 0) return { badge: 'badge-danger', label: 'Dnes!', daysLeft: 0 };
  if (days <= 7) return { badge: 'badge-danger', label: `${days} dní`, daysLeft: days };
  if (days <= 30) return { badge: 'badge-warning', label: `${days} dní`, daysLeft: days };
  return { badge: 'badge-success', label: target.toLocaleDateString('sk-SK'), daysLeft: days };
}

router.get('/', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });

  const profil = await getProfile(user.uid);
  if (!profil.onboardingDone) return res.json({ needsOnboarding: true });

  const momenty = ziskajMomentyPreProfil(profil.legalForm);
  const mojeDopyty = systemLeads.filter(l => l.uid === user.uid);

  let celkovoUloh = 0, splnenoUloh = 0;
  momenty.forEach(m => m.tasks.forEach(t => { celkovoUloh++; if (profil.completedTasks.includes(t.id)) splnenoUloh++; }));
  const percentoProgresu = celkovoUloh > 0 ? Math.round((splnenoUloh / celkovoUloh) * 100) : 0;

  const momentyProgres = momenty.map(m => {
    const done = m.tasks.filter(t => profil.completedTasks.includes(t.id)).length;
    return { ...m, done, total: m.tasks.length, pct: Math.round((done / m.tasks.length) * 100) };
  });
  const rozpracovane = momentyProgres.filter(x => x.done > 0 && x.done < x.total).length;

  // User termíny + pripomienky
  const userReminders = (profil.reminders || []).map((r, i) => ({
    ...r,
    index: i,
    dateFormatted: r.isoDate ? new Date(r.isoDate).toLocaleDateString('sk-SK') : (r.date || 'Bez dátumu'),
    urgency: computeUrgency(r.isoDate)
  }));

  // System termíny from vault document expirations
  const systemTerminy = [];
  let vaultItems = [];
  try {
    const docsRef = collection(db, 'users', user.uid, 'documents');
    const qSnapshot = await getDocs(docsRef);
    qSnapshot.forEach(docSnap => {
      const data = docSnap.data();
      let expText = "Bez exspirácie", expired = false, expiringSoon = false, daysLeft = null;
      if (data.expiryDate) {
        const dnes = new Date();
        const expDate = data.expiryDate.toDate();
        daysLeft = Math.ceil((expDate.getTime() - dnes.getTime()) / (1000 * 3600 * 24));
        expText = expDate.toLocaleDateString('sk-SK');
        if (daysLeft < 0) expired = true;
        else if (daysLeft <= 30) expiringSoon = true;
        if (daysLeft !== null && daysLeft <= 60) {
          systemTerminy.push({
            title: `Exspirácia: ${data.name}`,
            isoDate: expDate.toISOString(),
            dateFormatted: expText,
            type: 'system',
            note: expired ? 'Dokument expiroval!' : `Zostáva ${daysLeft} dní`,
            urgency: computeUrgency(expDate.toISOString())
          });
        }
      }
      vaultItems.push({ id: docSnap.id, name: data.name, expText, expired, expiringSoon, daysLeft, fileUrl: data.fileUrl || null });
    });
  } catch (err) {}

  const otvoreneDopyty = mojeDopyty.filter(l => !l.closed).length;

  // Sort all termíny by urgency
  const allTerminy = [...systemTerminy, ...userReminders].sort((a, b) => {
    const dA = a.urgency?.daysLeft ?? 9999;
    const dB = b.urgency?.daysLeft ?? 9999;
    return dA - dB;
  });

  res.json({
    needsOnboarding: false,
    profil,
    momenty: momentyProgres,
    rozpracovane,
    terminy: allTerminy,
    mojeDopyty,
    otvoreneDopyty,
    percentoProgresu,
    splnenoUloh,
    celkovoUloh,
    vaultItems
  });
});

module.exports = router;
