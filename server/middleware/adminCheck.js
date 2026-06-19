const { auth, db } = require('../../firebaseConfig');
const { doc, getDoc } = require('firebase/firestore');

async function isAdmin(uid) {
  try {
    const snap = await getDoc(doc(db, 'admins', uid));
    return snap.exists() && snap.data().role === 'admin';
  } catch {
    return false;
  }
}

function requireAdmin(req, res, next) {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  isAdmin(user.uid).then(admin => {
    if (!admin) return res.status(403).json({ error: 'Prístup zamietnutý. Vyžaduje sa admin rola.' });
    next();
  });
}

module.exports = { isAdmin, requireAdmin };
