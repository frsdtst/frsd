const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { hrubaMzda = 1500, typ = 'tpp' } = req.body;
  const hm = Number(hrubaMzda);

  const SP_ZAMESTNAVATEL = 0.252;
  const ZP_ZAMESTNAVATEL = 0.10;
  const URAZOVE = 0.008;
  const GARANCNE = 0.0025;
  const REZERVNY_FOND = 0.0475;
  const CELKOM_ZAMESTNAVATEL = 0.352;

  const SP_ZAMESTNANEC = 0.094;
  const ZP_ZAMESTNANEC = 0.04;
  const CELKOM_ZAMESTNANEC = 0.134;

  let odvodyZamestnavatel, odvodyZamestnanec, zakladDane, dan, cistaMzda, celkovaCena;

  if (typ === 'dohoda') {
    odvodyZamestnavatel = Math.round(hm * 0.252);
    odvodyZamestnanec = Math.round(hm * 0.094);
    zakladDane = hm - odvodyZamestnanec;
    dan = Math.round(zakladDane * 0.19);
    cistaMzda = Math.round(hm - odvodyZamestnanec - dan);
    celkovaCena = Math.round(hm + odvodyZamestnavatel);
  } else {
    odvodyZamestnavatel = Math.round(hm * CELKOM_ZAMESTNAVATEL);
    odvodyZamestnanec = Math.round(hm * CELKOM_ZAMESTNANEC);
    zakladDane = hm - odvodyZamestnanec;
    const nezdanitelna = 477.72;
    const zdanitelny = Math.max(0, zakladDane - nezdanitelna);
    dan = zdanitelny <= 3876.31 ? Math.round(zdanitelny * 0.19) : Math.round(3876.31 * 0.19 + (zdanitelny - 3876.31) * 0.25);
    cistaMzda = Math.round(hm - odvodyZamestnanec - dan);
    celkovaCena = Math.round(hm + odvodyZamestnavatel);
  }

  const rozpis = {
    sp: { zamestnavatel: Math.round(hm * SP_ZAMESTNAVATEL), zamestnanec: Math.round(hm * SP_ZAMESTNANEC) },
    zp: { zamestnavatel: Math.round(hm * ZP_ZAMESTNAVATEL), zamestnanec: Math.round(hm * ZP_ZAMESTNANEC) },
    urazove: Math.round(hm * URAZOVE),
    garancne: Math.round(hm * GARANCNE),
    rezervnyFond: Math.round(hm * REZERVNY_FOND)
  };

  const porovnanie = {
    tpp: { celkovaCena: Math.round(hm * 1.352), cistaMzda: typ === 'tpp' ? cistaMzda : null },
    dohoda: { celkovaCena: Math.round(hm * 1.252), cistaMzda: typ === 'dohoda' ? cistaMzda : null }
  };

  const leadTrigger = celkovaCena > 2500 ? {
    fired: true,
    type: 'savings',
    message: `Celková cena práce ${celkovaCena} €/mesiac. Nechajte mzdovú agendu a BOZP na profesionálov.`,
    cta: 'Získať balík mzdových služieb',
    momentId: 'M4',
    params: { hrubaMzda: hm, celkovaCena }
  } : { fired: false };

  res.json({
    inputs: { hrubaMzda: hm, typ },
    hrubaMzda: hm,
    odvodyZamestnavatel,
    odvodyZamestnanec,
    zakladDane: Math.round(zakladDane),
    dan,
    cistaMzda,
    celkovaCena,
    rozpis,
    porovnanie,
    leadTrigger
  });
});

module.exports = router;
