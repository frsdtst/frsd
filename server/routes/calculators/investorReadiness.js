const express = require('express');
const router = express.Router();

const MULTIPLES = {
  saas: { low: 5, mid: 10, high: 20, label: 'SaaS / Softvér' },
  ecommerce: { low: 1.5, mid: 3, high: 5, label: 'E-commerce' },
  marketplace: { low: 3, mid: 6, high: 12, label: 'Marketplace' },
  fintech: { low: 4, mid: 8, high: 15, label: 'Fintech' },
  health: { low: 3, mid: 7, high: 14, label: 'Health-tech' },
  services: { low: 1, mid: 2.5, high: 5, label: 'Služby / Agency' },
  hardware: { low: 1, mid: 2, high: 4, label: 'Hardvér / Výroba' }
};

router.post('/', (req, res) => {
  const { arr = 100000, growthRate = 30, margin = 20, investicia = 200000, sektor = 'saas' } = req.body;
  const a = Number(arr);
  const gr = Number(growthRate) / 100;
  const m = Number(margin) / 100;
  const inv = Number(investicia);
  const mult = MULTIPLES[sektor] || MULTIPLES.saas;

  const valuaciaLow = Math.round(a * mult.low);
  const valuaciaMid = Math.round(a * mult.mid);
  const valuaciaHigh = Math.round(a * mult.high);

  const dilutionLow = inv > 0 ? Math.round((inv / (valuaciaLow + inv)) * 100) : 0;
  const dilutionMid = inv > 0 ? Math.round((inv / (valuaciaMid + inv)) * 100) : 0;
  const dilutionHigh = inv > 0 ? Math.round((inv / (valuaciaHigh + inv)) * 100) : 0;

  const arrPo12m = Math.round(a * (1 + gr));
  const arrPo24m = Math.round(a * Math.pow(1 + gr, 2));

  const zdravyRast = gr >= 0.20 && m >= 0.10;
  const sektory = Object.entries(MULTIPLES).map(([k, v]) => ({ value: k, label: v.label }));

  const leadTrigger = zdravyRast && a >= 50000 ? {
    fired: true,
    type: 'opportunity',
    message: `Vaša firma vykazuje zdravý rast (${Math.round(gr * 100)} % YoY). Predložte projekt investičným partnerom platformy.`,
    cta: 'Predložiť anonymný teaser investorom',
    momentId: 'M9',
    params: { arr: a, valuacia: valuaciaMid, sektor }
  } : { fired: false };

  res.json({
    inputs: { arr: a, growthRate: gr * 100, margin: m * 100, investicia: inv, sektor },
    sektorLabel: mult.label,
    multiples: { low: mult.low, mid: mult.mid, high: mult.high },
    valuacia: { low: valuaciaLow, mid: valuaciaMid, high: valuaciaHigh },
    dilution: { low: dilutionLow, mid: dilutionMid, high: dilutionHigh },
    projekcia: { arrPo12m, arrPo24m },
    zdravyRast,
    sektory,
    leadTrigger
  });
});

module.exports = router;
