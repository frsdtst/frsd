const express = require('express');
const router = express.Router();
const { auth } = require('../../firebaseConfig');
const { najdiMoment } = require('../data/moments');
const { najdiRealnyClanok } = require('../utils/scraper');
const { getProfile } = require('../utils/firestore');

router.get('/:id', async (req, res) => {
  const user = auth.currentUser;
  let lf = 'szco';
  if (user) {
    const profil = await getProfile(user.uid);
    lf = profil.legalForm || 'szco';
  }
  const moment = najdiMoment(lf, req.params.id);
  if (!moment) return res.redirect('https://www.podnikajte.sk');
  const u = moment.article.url;
  if (u && /^https:\/\/www\.podnikajte\.sk\/[a-z0-9-]+\/[a-z0-9-]+/.test(u)) return res.redirect(u);
  res.redirect(await najdiRealnyClanok(moment));
});

module.exports = router;
