const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { cenaVozidla = 25000, akontacia = 20, obdobie = 48, rocnyNajazd = 20000, odpisovaSkupina = 1 } = req.body;
  const cena = Number(cenaVozidla);
  const akontPct = Number(akontacia) / 100;
  const mesiace = Number(obdobie);
  const najazd = Number(rocnyNajazd);

  const danMotorovych = najazd <= 20000 ? 50 * 12 : (najazd <= 40000 ? 80 * 12 : 120 * 12);
  const odpisyRoky = odpisovaSkupina === 1 ? 4 : 6;

  // ── Priama kúpa ──
  const kupaCelkom = cena;
  const kupaOdpisRocny = Math.round(cena / odpisyRoky);
  const kupaDanovaUspora = Math.round(kupaOdpisRocny * 0.15);
  const kupaEfektivnaCena = Math.round(cena - (kupaDanovaUspora * odpisyRoky) + (danMotorovych / 12 * mesiace));

  // ── Finančný leasing ──
  const flAkontacia = Math.round(cena * akontPct);
  const flIstina = cena - flAkontacia;
  const flUrok = 0.049 / 12;
  const flSplatka = Math.round(flIstina * (flUrok * Math.pow(1 + flUrok, mesiace)) / (Math.pow(1 + flUrok, mesiace) - 1));
  const flCelkom = Math.round(flAkontacia + flSplatka * mesiace);
  const flPreplatenie = flCelkom - cena;

  // ── Operatívny leasing ──
  const olMesacnaSplatka = Math.round(cena * 0.018);
  const olCelkom = Math.round(olMesacnaSplatka * mesiace);
  const olVratenie = true;

  const najlacnejsie = kupaCelkom <= flCelkom && kupaCelkom <= olCelkom ? 'kupa' : (flCelkom <= olCelkom ? 'financny' : 'operativny');

  const leadTrigger = cena > 15000 ? {
    fired: true,
    type: 'opportunity',
    message: `Získajte nezáväznú kalkuláciu fleetového operatívneho leasingu s exkluzívnou zľavou pre Podnikajte.sk.`,
    cta: 'Získať ponuku leasingu',
    momentId: 'M3',
    params: { cenaVozidla: cena, typ: najlacnejsie }
  } : { fired: false };

  res.json({
    inputs: { cenaVozidla: cena, akontacia: akontPct * 100, obdobie: mesiace, rocnyNajazd: najazd },
    kupa: { celkovaCena: kupaCelkom, odpisRocny: kupaOdpisRocny, danovaUspora: kupaDanovaUspora, efektivnaCena: kupaEfektivnaCena, danMotorovychRocne: danMotorovych },
    financnyLeasing: { akontacia: flAkontacia, mesacnaSplatka: flSplatka, celkovaCena: flCelkom, preplatenie: flPreplatenie },
    operativnyLeasing: { mesacnaSplatka: olMesacnaSplatka, celkovaCena: olCelkom, vraciaSa: olVratenie },
    najlacnejsie,
    leadTrigger
  });
});

module.exports = router;
