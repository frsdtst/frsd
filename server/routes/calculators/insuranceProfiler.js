const express = require('express');
const router = express.Router();

const INDUSTRY_RISKS = {
  'it': { label: 'IT a softvér', risks: ['Kybernetický útok', 'Zodpovednosť za kód/produkt', 'Únik dát klientov'], baseScore: 55 },
  'stavebnictvo': { label: 'Stavebníctvo', risks: ['Úraz na pracovisku', 'Škoda na majetku tretích osôb', 'Oneskorenie projektu'], baseScore: 85 },
  'gastro': { label: 'Gastronómia', risks: ['Potravinová bezpečnosť', 'Požiar a záplava', 'Prerušenie prevádzky'], baseScore: 70 },
  'obchod': { label: 'Maloobchod / veľkoobchod', risks: ['Krádež zásob', 'Zodpovednosť za výrobok', 'Prerušenie dodávateľského reťazca'], baseScore: 50 },
  'doprava': { label: 'Doprava a logistika', risks: ['Havária vozidla', 'Poškodenie tovaru', 'Zodpovednosť vodiča'], baseScore: 75 },
  'sluzby': { label: 'Služby a poradenstvo', risks: ['Profesijná zodpovednosť', 'GDPR porušenie', 'Strata klientskych dát'], baseScore: 45 },
  'zdravotnictvo': { label: 'Zdravotníctvo', risks: ['Profesijná zodpovednosť', 'Infekčné riziko', 'Škoda na zdraví pacienta'], baseScore: 80 },
  'vyrobca': { label: 'Výroba', risks: ['Úraz na pracovisku', 'Požiar', 'Zodpovednosť za výrobok'], baseScore: 75 }
};

router.post('/', (req, res) => {
  const { industry = 'sluzby', vlastnePriestory = false, rocnyObrat = 50000 } = req.body;
  const obrat = Number(rocnyObrat);
  const info = INDUSTRY_RISKS[industry] || INDUSTRY_RISKS.sluzby;

  let riskScore = info.baseScore;
  if (vlastnePriestory) riskScore += 10;
  if (obrat > 100000) riskScore += 10;
  if (obrat > 500000) riskScore += 10;
  riskScore = Math.min(100, riskScore);

  const riskLevel = riskScore >= 70 ? 'high' : (riskScore >= 45 ? 'medium' : 'low');

  const recommended = [
    { typ: 'Zodpovednosť za škodu', priorita: 'vysoká', odhadCena: '10–30 €/mesiac' }
  ];
  if (vlastnePriestory) recommended.push({ typ: 'Poistenie majetku', priorita: 'vysoká', odhadCena: '20–80 €/mesiac' });
  if (riskScore >= 60) recommended.push({ typ: 'Prerušenie prevádzky', priorita: 'stredná', odhadCena: '15–50 €/mesiac' });
  if (industry === 'it' || industry === 'sluzby') recommended.push({ typ: 'Kyber poistenie', priorita: 'stredná', odhadCena: '10–25 €/mesiac' });

  const statPercent = industry === 'it' ? 82 : (industry === 'stavebnictvo' ? 91 : (industry === 'gastro' ? 76 : 68));

  const leadTrigger = riskScore >= 45 ? {
    fired: true,
    type: 'risk',
    message: `${statPercent} % firiem vo vašej kategórii (${info.label}) kryje zodpovednosť za škodu do výšky 50 000 €.`,
    cta: 'Porovnať balíky firemného poistenia',
    momentId: 'M7',
    params: { industry, riskScore, obrat }
  } : { fired: false };

  res.json({
    inputs: { industry, vlastnePriestory, rocnyObrat: obrat },
    industryLabel: info.label,
    risks: info.risks,
    riskScore,
    riskLevel,
    recommended,
    statPercent,
    industries: Object.entries(INDUSTRY_RISKS).map(([k, v]) => ({ value: k, label: v.label })),
    leadTrigger
  });
});

module.exports = router;
