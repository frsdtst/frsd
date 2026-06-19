const LEAD_STATES = {
  PRIJATA: "Žiadosť prijatá",
  KONTAKTUJE: "Partner kontaktuje",
  PONUKA: "Ponuka pripravená",
  USPECH: "Uzavreté – úspešné (Success Fee)",
  STORNO: "Zrušené používateľom (Storno)"
};

let mockUserProfiles = {};

let systemLeads = [
  {
    id: "L1", uid: "demo", email: "peter.test@gmail.com", legalForm: "SZČO", stage: "začiatočník",
    moment: "🏢 Hľadám hypotéku / financovanie ako SZČO", momentId: "M3",
    partner: "Insia Finans (SLSP metodika)", status: LEAD_STATES.KONTAKTUJE,
    statusNote: "Partner ťa bude telefonicky kontaktovať najneskôr zajtra do 14:00.",
    financialContext: "Tržby 30 000 € / odhad bonity 144 000 €",
    billing: "CPL", closed: false, date: "18. 06. 2026", note: "Tržby prevažne zo zahraničia."
  }
];

let systemPartners = [
  { id: "P1", name: "Insia Finans", category: "Poistenie & Úvery", moment: "M3", clicks: 24, leads: 1, cpl: 65, spotlight: true },
  { id: "P2", name: "TopÚčtovník s.r.o.", category: "Účtovníctvo", moment: "M5", clicks: 42, leads: 0, cpl: 40, spotlight: false },
  { id: "P3", name: "PrávnikPreFirmy", category: "Právne služby", moment: "M8", clicks: 11, leads: 0, cpl: 50, spotlight: false },
  { id: "P4", name: "ČSOB Biznis účet", category: "Bankovníctvo", moment: "M2", clicks: 30, leads: 0, cpl: 35, spotlight: true },
  { id: "P5", name: "Allianz – Poistenie firmy", category: "Poistenie", moment: "M7", clicks: 8, leads: 0, cpl: 45, spotlight: false }
];

let partnerSeq = 6;

module.exports = {
  LEAD_STATES,
  mockUserProfiles,
  systemLeads,
  systemPartners,
  get partnerSeq() { return partnerSeq; },
  set partnerSeq(v) { partnerSeq = v; }
};
