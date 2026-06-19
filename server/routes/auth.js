const express = require('express');
const router = express.Router();
const { auth, db } = require('../../firebaseConfig');
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } = require('firebase/auth');
const { doc, getDoc, setDoc } = require('firebase/firestore');
const { getProfile, saveProfile, DEFAULT_PROFILE } = require('../utils/firestore');
const { isAdmin } = require('../middleware/adminCheck');

router.get('/me', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.json({ user: null });
  const profil = await getProfile(user.uid);
  const admin = await isAdmin(user.uid);
  res.json({
    user: { uid: user.uid, email: user.email, isAdmin: admin },
    profile: profil
  });
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    await signInWithEmailAndPassword(auth, email, password);
    const user = auth.currentUser;
    let profil = await getProfile(user.uid);
    if (!profil.onboardingDone && !profil._exists) {
      await saveProfile(user.uid, DEFAULT_PROFILE);
      profil = { ...DEFAULT_PROFILE };
    }
    const admin = await isAdmin(user.uid);
    res.json({ success: true, user: { uid: user.uid, email: user.email, isAdmin: admin }, profile: profil });
  } catch (error) {
    res.status(401).json({ success: false, error: error.message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;
    await createUserWithEmailAndPassword(auth, email, password);
    const user = auth.currentUser;
    await saveProfile(user.uid, DEFAULT_PROFILE);
    res.json({ success: true, user: { uid: user.uid, email: user.email }, profile: { ...DEFAULT_PROFILE } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

router.post('/logout', async (req, res) => {
  try {
    await signOut(auth);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/save-credentials', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  try {
    await setDoc(doc(db, 'savedLogins', user.uid), {
      email: req.body.email,
      rememberMe: true,
      lastLogin: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/saved-credentials', async (req, res) => {
  try {
    const snap = await getDoc(doc(db, 'savedLogins', 'last'));
    if (snap.exists()) return res.json({ email: snap.data().email });
    res.json({ email: null });
  } catch {
    res.json({ email: null });
  }
});

module.exports = router;
