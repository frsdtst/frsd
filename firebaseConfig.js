const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore");
const { getAuth } = require("firebase/auth");
const { getStorage } = require("firebase/storage");

const firebaseConfig = {
  apiKey: "AIzaSyDBLReg6wAOnAZDYOjCOrVTdYp0WBjxv5Y",
  authDomain: "frsd-fa868.firebaseapp.com",
  projectId: "frsd-fa868",
  storageBucket: "frsd-fa868.firebasestorage.app",
  messagingSenderId: "229606839682",
  appId: "1:229606839682:web:a45fb92a86ae38cdc22b9b",
  measurementId: "G-6F4GG92G8W"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app, "gs://frsd-fa868.firebasestorage.app");

module.exports = { db, auth, storage };
