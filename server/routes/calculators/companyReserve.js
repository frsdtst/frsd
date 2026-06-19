const express = require('express');
const router = express.Router();

router.post('/', (req, res) => {
  const { suma = 50000, roky = 3, inflacia = 3.5 } = req.body;
  const s = Number(suma);
  const r = Number(roky);
  const inf = Number(inflacia) / 100;

  const hodnotaPoInflacii = Math.round(s / Math.pow(1 + inf, r));
  const strataInflaciou = s - hodnotaPoInflacii;
  const strataRocne = Math.round(strataInflaciou / r);

  const scenare = [
    { nazov: 'Bežný účet (0 %)', rocnyVynos: 0, hodnota: s, zisk: 0, strataVsInflacia: -strataInflaciou },
    { nazov: 'Termínovaný vklad (3,2 %)', rocnyVynos: 3.2, hodnota: Math.round(s * Math.pow(1 + 0.032, r)), zisk: Math.round(s * Math.pow(1 + 0.032, r) - s), strataVsInflacia: Math.round(s * Math.pow(1 + 0.032, r) - s - strataInflaciou) },
    { nazov: 'Štátne dlhopisy (3,8 %)', rocnyVynos: 3.8, hodnota: Math.round(s * Math.pow(1 + 0.038, r)), zisk: Math.round(s * Math.pow(1 + 0.038, r) - s), strataVsInflacia: Math.round(s * Math.pow(1 + 0.038, r) - s - strataInflaciou) },
    { nazov: 'ETF fond (7 % priem.)', rocnyVynos: 7, hodnota: Math.round(s * Math.pow(1 + 0.07, r)), zisk: Math.round(s * Math.pow(1 + 0.07, r) - s), strataVsInflacia: Math.round(s * Math.pow(1 + 0.07, r) - s - strataInflaciou) }
  ];

  const leadTrigger = strataRocne > 500 ? {
    fired: true,
    type: 'opportunity',
    message: `Vaša firma prichádza nečinnosťou o ${strataRocne.toLocaleString('sk-SK')} € ročne. Zvážte zhodnotenie firemnej rezervy.`,
    cta: 'Otvoriť firemný investičný účet',
    momentId: 'M9',
    params: { suma: s, strataRocne }
  } : { fired: false };

  res.json({
    inputs: { suma: s, roky: r, inflacia: inf * 100 },
    strataInflaciou,
    strataRocne,
    hodnotaPoInflacii,
    scenare,
    leadTrigger
  });
});

module.exports = router;
