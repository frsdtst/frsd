const { db } = require('../../firebaseConfig');
const { doc, getDoc, setDoc } = require('firebase/firestore');

const DEFAULT_PROFILE = {
  legalForm: "szco",
  stage: "začiatočník",
  completedTasks: [],
  reminders: [],
  onboardingDone: false,
  trzby: null,
  odvetvie: null,
  goal: null
};

async function getProfile(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (snap.exists()) return { ...DEFAULT_PROFILE, ...snap.data() };
  return { ...DEFAULT_PROFILE };
}

async function saveProfile(uid, data) {
  await setDoc(doc(db, 'users', uid), data, { merge: true });
}

module.exports = { getProfile, saveProfile, DEFAULT_PROFILE };
