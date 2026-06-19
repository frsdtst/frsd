const express = require('express');
const router = express.Router();
const { auth } = require('../../firebaseConfig');

router.get('/', (req, res) => {
  if (!auth.currentUser) return res.status(401).json({ error: 'Neprihlásený' });

  const trzby = parseFloat(req.query.trzby) || 30000;
  const zisk = parseFloat(req.query.zisk) || 12000;
  const mzdaZamestnanca = parseFloat(req.query.mzdaZamestnanca) || 1500;

  const cistyPrijemTrzby = (trzby * 0.60) / 12;
  const cistyPrijemZisk = zisk / 12;
  const maxUverTrzby = Math.round(cistyPrijemTrzby * 12 * 8);
  const maxUverZisk = Math.round(cistyPrijemZisk * 12 * 8);

  const r = 0.042 / 12;
  const n = 30 * 12;
  const mesacnaSplatkaTrzby = Math.round(maxUverTrzby * (r * Math.pow(1+r, n)) / (Math.pow(1+r, n) - 1)) || 0;

  let pausalneVydavky = trzby * 0.60;
  if (pausalneVydavky > 24000) pausalneVydavky = 24000;

  const zakladDanePausal = Math.max(0, trzby - pausalneVydavky);
  const rocneZdravotne = Math.max(105 * 12, zakladDanePausal * 0.15);
  const rocneSocialne = Math.max(240 * 12, zakladDanePausal * 0.3315);
  const danZPrijmu = Math.max(0, (zakladDanePausal - (rocneZdravotne + rocneSocialne)) * 0.15);

  const mesacneTrzby = Math.round(trzby / 12);
  const mZdravotka = Math.round(rocneZdravotne / 12);
  const mSocialka = Math.round(rocneSocialne / 12);
  const mDan = Math.round(danZPrijmu / 12);
  const cistyMesacnyZisk = Math.max(0, Math.round(mesacneTrzby - (mZdravotka + mSocialka + mDan)));

  const odvodyZamestnavatela = Math.round(mzdaZamestnanca * 0.352);
  const celkovaCenaPrace = Math.round(mzdaZamestnanca + odvodyZamestnavatela);
  const cistaMzdaZamestnanca = Math.round(mzdaZamestnanca * 0.74);

  res.json({
    inputs: { trzby, zisk, mzdaZamestnanca },
    hypoteka: {
      cistyPrijemTrzby: Math.round(cistyPrijemTrzby),
      cistyPrijemZisk: Math.round(cistyPrijemZisk),
      maxUverTrzby,
      maxUverZisk,
      mesacnaSplatkaTrzby
    },
    odvody: {
      mesacneTrzby,
      rocneTrzby: Math.round(trzby),
      mZdravotka,
      rocneZdravotne: Math.round(rocneZdravotne),
      mSocialka,
      rocneSocialne: Math.round(rocneSocialne),
      mDan,
      rocnaDan: Math.round(danZPrijmu),
      cistyMesacnyZisk,
      cistyRocnyZisk: cistyMesacnyZisk * 12
    },
    zamestnanec: {
      odvodyZamestnavatela,
      celkovaCenaPrace,
      cistaMzdaZamestnanca
    }
  });
});

module.exports = router;
