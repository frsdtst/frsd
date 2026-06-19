const express = require('express');
const router = express.Router();

const DPH_LIMIT_2026 = 49790;

router.post('/', (req, res) => {
  const { mesacneObraty = [] } = req.body;
  const obraty = Array.isArray(mesacneObraty) ? mesacneObraty.map(Number) : Array(12).fill(0);
  while (obraty.length < 12) obraty.push(0);

  const kumulativny = obraty.reduce((s, v) => s + v, 0);
  const zostatok = Math.max(0, DPH_LIMIT_2026 - kumulativny);
  const percentLimit = Math.min(100, Math.round((kumulativny / DPH_LIMIT_2026) * 100));
  const priemer = Math.round(kumulativny / Math.max(1, obraty.filter(v => v > 0).length));
  const mesiacovDoLimitu = priemer > 0 ? Math.max(0, Math.ceil(zostatok / priemer)) : null;

  const prekroceny = kumulativny >= DPH_LIMIT_2026;

  const leadTrigger = (mesiacovDoLimitu !== null && mesiacovDoLimitu <= 3) || prekroceny ? {
    fired: true,
    type: 'threshold',
    message: prekroceny
      ? `Prekročili ste limit ${DPH_LIMIT_2026.toLocaleString('sk-SK')} € – povinná registrácia k DPH!`
      : `Do povinnej registrácie k DPH vám zostávajú odhadom ${mesiacovDoLimitu} mesiace.`,
    cta: 'Prepojiť sa s expertom na DPH registráciu',
    momentId: 'M6',
    params: { kumulativny, zostatok }
  } : { fired: false };

  res.json({
    inputs: { mesacneObraty: obraty },
    kumulativny,
    limit: DPH_LIMIT_2026,
    zostatok,
    percentLimit,
    priemerMesacny: priemer,
    mesiacovDoLimitu,
    prekroceny,
    leadTrigger
  });
});

module.exports = router;
