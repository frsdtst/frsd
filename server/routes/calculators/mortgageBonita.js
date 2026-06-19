const express = require('express');
const router = express.Router();

const NACE_PERCENTAGES = {
  'it': 0.60, 'programovanie': 0.60, 'konzultacie': 0.50, 'marketing': 0.45,
  'stavebnictvo': 0.30, 'obchod': 0.35, 'gastro': 0.20, 'doprava': 0.25,
  'zdravotnictvo': 0.50, 'vzdelavanie': 0.45, 'financie': 0.55,
  'remeslo': 0.30, 'sluzby': 0.40, 'vyrobca': 0.25, 'default': 0.40
};

router.post('/', (req, res) => {
  const { trzby = 30000, zisk = 12000, nace = 'default', existujuceSplatky = 0, legalForm = 'szco' } = req.body;
  const t = Number(trzby);
  const z = Number(zisk);
  const splatky = Number(existujuceSplatky);
  const pct = NACE_PERCENTAGES[nace] || NACE_PERCENTAGES.default;

  const metodikaObrat = {
    bank: 'SLSP (obratová metodika)',
    percent: Math.round(pct * 100),
    mesacnyPrijem: Math.round((t * pct) / 12),
    disponibilny: Math.round((t * pct) / 12 - splatky),
    maxUver: Math.round(((t * pct) / 12 - splatky) * 12 * 8)
  };

  const metodikaZisk = {
    bank: 'Štandardná (čistý zisk)',
    percent: 100,
    mesacnyPrijem: Math.round(z / 12),
    disponibilny: Math.round(z / 12 - splatky),
    maxUver: Math.round((z / 12 - splatky) * 12 * 8)
  };

  const r = 0.042 / 12;
  const n = 30 * 12;
  const splatkaMesacna = (uver) => uver > 0 ? Math.round(uver * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)) : 0;

  metodikaObrat.mesacnaSplatka = splatkaMesacna(metodikaObrat.maxUver);
  metodikaZisk.mesacnaSplatka = splatkaMesacna(metodikaZisk.maxUver);

  const lepsiaMetodika = metodikaObrat.maxUver > metodikaZisk.maxUver ? metodikaObrat : metodikaZisk;

  const leadTrigger = lepsiaMetodika.maxUver > 50000 ? {
    fired: true,
    type: 'opportunity',
    message: `Vaša odhadovaná bonita je ${lepsiaMetodika.maxUver.toLocaleString('sk-SK')} €. Odošlite dopyt pre overenie v bankách.`,
    cta: 'Odoslať dopyt do bánk',
    momentId: 'M3',
    params: { trzby: t, zisk: z, bonita: lepsiaMetodika.maxUver }
  } : { fired: false };

  res.json({
    inputs: { trzby: t, zisk: z, nace, existujuceSplatky: splatky, legalForm },
    metodikaObrat,
    metodikaZisk,
    nacePercent: Math.round(pct * 100),
    naceCategories: Object.keys(NACE_PERCENTAGES).filter(k => k !== 'default'),
    leadTrigger
  });
});

module.exports = router;
