const express = require('express');
const router = express.Router();
const { auth, db, storage } = require('../../firebaseConfig');
const { collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, Timestamp } = require('firebase/firestore');
const { ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// --- Salt management (stored in Firestore, NOT the key itself) ---
router.get('/salt', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  try {
    const snap = await getDoc(doc(db, 'users', user.uid, 'vault_meta', 'encryption'));
    if (snap.exists()) return res.json({ salt: snap.data().salt, initialized: true });
    return res.json({ salt: null, initialized: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/salt', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  try {
    await setDoc(doc(db, 'users', user.uid, 'vault_meta', 'encryption'), {
      salt: req.body.salt,
      createdAt: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Document listing ---
router.get('/documents', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  try {
    const docsRef = collection(db, 'users', user.uid, 'documents');
    const snap = await getDocs(docsRef);
    const items = [];
    snap.forEach(docSnap => {
      const data = docSnap.data();
      let expText = "Bez exspirácie", expired = false, expiringSoon = false, daysLeft = null;
      if (data.expiryDate) {
        const now = new Date();
        const expDate = data.expiryDate.toDate();
        daysLeft = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 3600 * 24));
        expText = expDate.toLocaleDateString('sk-SK');
        if (daysLeft < 0) expired = true;
        else if (daysLeft <= 30) expiringSoon = true;
      }
      items.push({
        id: docSnap.id, name: data.name,
        expText, expired, expiringSoon, daysLeft,
        fileUrl: data.fileUrl || null,
        storagePath: data.storagePath || null,
        encrypted: data.encrypted || false,
        originalName: data.originalName || null,
        mimeType: data.mimeType || null
      });
    });
    res.json({ documents: items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Unencrypted upload (legacy / fallback) ---
router.post('/upload', upload.single('documentFile'), async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Prístup odmietnutý.' });
  const { name, expiryDate } = req.body;
  if (!name || !expiryDate) return res.status(400).json({ error: 'Názov a dátum exspirácie sú povinné.' });

  let fileUrl = null, storagePath = null;
  try {
    if (req.file) {
      const safeName = req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
      storagePath = `users/${user.uid}/documents/${Date.now()}-${safeName}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, req.file.buffer, { contentType: req.file.mimetype });
      fileUrl = await getDownloadURL(storageRef);
    }
    await addDoc(collection(db, 'users', user.uid, 'documents'), {
      name, expiryDate: Timestamp.fromDate(new Date(expiryDate)),
      fileUrl, storagePath, encrypted: false,
      createdAt: Timestamp.fromDate(new Date())
    });
    res.json({ success: true, fileUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- Encrypted upload (E2EE: client sends already-encrypted binary via multipart) ---
router.post('/upload-encrypted', upload.single('documentFile'), async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Prístup odmietnutý.' });

  const { name, expiryDate, originalName, mimeType } = req.body;
  if (!name || !expiryDate || !req.file) return res.status(400).json({ error: 'Chýbajú povinné polia alebo súbor.' });

  try {
    const safeName = (originalName || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storagePath = `users/${user.uid}/documents/${Date.now()}-${safeName}.enc`;
    const storageRef = ref(storage, storagePath);
    await uploadBytes(storageRef, req.file.buffer, { contentType: 'application/octet-stream' });
    const fileUrl = await getDownloadURL(storageRef);

    await addDoc(collection(db, 'users', user.uid, 'documents'), {
      name, expiryDate: Timestamp.fromDate(new Date(expiryDate)),
      fileUrl, storagePath,
      encrypted: true,
      originalName: originalName || null,
      mimeType: mimeType || null,
      createdAt: Timestamp.fromDate(new Date())
    });
    res.json({ success: true, fileUrl });
  } catch (error) {
    console.error('Encrypted upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Download proxy (avoids CORS on Firebase Storage URLs) ---
router.get('/download/:id', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  try {
    const docRef = doc(db, 'users', user.uid, 'documents', req.params.id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return res.status(404).json({ error: 'Dokument nenájdený' });
    const data = snap.data();
    if (!data.storagePath) return res.status(404).json({ error: 'Súbor nenájdený' });

    const storageRef = ref(storage, data.storagePath);
    const url = await getDownloadURL(storageRef);
    const fileRes = await fetch(url);
    if (!fileRes.ok) return res.status(502).json({ error: 'Firebase Storage nedostupné' });

    const buffer = await fileRes.arrayBuffer();
    res.setHeader('Content-Type', data.encrypted ? 'application/octet-stream' : (data.mimeType || 'application/octet-stream'));
    res.setHeader('Content-Length', buffer.byteLength);
    res.send(Buffer.from(buffer));
  } catch (error) {
    console.error('Vault download error:', error);
    res.status(500).json({ error: error.message });
  }
});

// --- Delete ---
router.delete('/documents/:id', async (req, res) => {
  const user = auth.currentUser;
  if (!user) return res.status(401).json({ error: 'Neprihlásený' });
  try {
    const docRef = doc(db, 'users', user.uid, 'documents', req.params.id);
    const snap = await getDoc(docRef);
    if (snap.exists() && snap.data().storagePath) {
      try { await deleteObject(ref(storage, snap.data().storagePath)); } catch {}
    }
    await deleteDoc(docRef);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
