const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { trzby = 30000, naklady = 0 } = req.body;
  const t = Number(trzby);
  const n = Number(naklady);

  // ── SZČO (paušálne výdavky 60%, max 20 000 €) ──
  let pausalneVydavky = Math.min(t * 0.60, 20000);
  const zakladSzco = Math.max(0, t - Math.max(pausalneVydavky, n));
  const nezdanitelna = 5733;
  const zdanitelnySzco = Math.max(0, zakladSzco - nezdanitelna);
  const danSzco = zdanitelnySzco <= 47537 ? Math.round(zdanitelnySzco * 0.19) : Math.round(47537 * 0.19 + (zdanitelnySzco - 47537) * 0.25);

  const vymZakladZP = Math.max(0, zakladSzco) * 0.5;
  const zpSzco = Math.max(105 * 12, Math.round(vymZakladZP * 0.15));
  const vymZakladSP = Math.max(0, zakladSzco) * 0.5;
  const spSzco = Math.max(240 * 12, Math.round(vymZakladSP * 0.3315));
  const odvodySpoluSzco = zpSzco + spSzco;
  const cistySzco = Math.round(t - Math.max(pausalneVydavky, n) - danSzco - odvodySpoluSzco);

  // ── S.R.O. (15% daň PO do 100k, 21% nad) ──
  const zakladSro = Math.max(0, t - n);
  const danSro = zakladSro <= 100000 ? Math.round(zakladSro * 0.15) : Math.round(100000 * 0.15 + (zakladSro - 100000) * 0.21);
  const cistZiskSro = zakladSro - danSro;
  const dividendy = Math.round(cistZiskSro * 0.07);
  const cistySro = Math.round(cistZiskSro - dividendy);
  const odvodySpoluSro = 0;

  const uspora = cistySro - cistySzco;
  const vyhodnejsie = uspora > 0 ? 'sro' : 'szco';

  const leadTrigger = uspora > 1000 ? {
    fired: true,
    type: 'savings',
    message: `S.R.O. vám ušetrí ${uspora.toLocaleString('sk-SK')} € ročne oproti živnosti. Založenie s.r.o. na kľúč od 150 €.`,
    cta: 'Prekonzultovať prechod na s.r.o.',
    momentId: 'M1',
    params: { trzby: t, naklady: n, uspora }
  } : { fired: false };

  res.json({
    inputs: { trzby: t, naklady: n },
    szco: {
      zaklad: zakladSzco,
      pausalneVydavky: Math.round(pausalneVydavky),
      dan: danSzco,
      zdravotne: zpSzco,
      socialne: spSzco,
      odvodySpolu: odvodySpoluSzco,
      cistyPrijem: Math.max(0, cistySzco)
    },
    sro: {
      zaklad: zakladSro,
      danPO: danSro,
      cistZisk: Math.round(cistZiskSro),
      dividendyDan: dividendy,
      cistyPrijem: Math.max(0, cistySro),
      odvodySpolu: odvodySpoluSro
    },
    uspora: Math.abs(uspora),
    vyhodnejsie,
    leadTrigger
  });
});

module.exports = router;
