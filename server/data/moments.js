const LF_META = {
  szco: { label: 'SZČO', full: 'Živnostník (SZČO)' },
  sro: { label: 's.r.o.', full: 'Spoločnosť s ručením obmedzeným' },
  jsa: { label: 'j.s.a.', full: 'Jednoduchá spoločnosť na akcie' },
  as: { label: 'a.s.', full: 'Akciová spoločnosť' }
};

function m(lf) { return LF_META[lf] || LF_META.szco; }
const jePO = lf => lf === 'sro' || lf === 'jsa' || lf === 'as';
const jeKorp = lf => lf === 'jsa' || lf === 'as';

// ─── M1: ZAKLADANIE ───
function zakladanie(lf) {
  if (lf === 'szco') return {
    id: "M1", title: "🚀 Ohlásenie živnosti (SZČO)", ui_style: "high", partnerId: "P2",
    article: { title: "Založenie živnosti v roku 2026", url: "https://www.podnikajte.sk/zivnost/zalozenie-zivnosti-2026" },
    ai: { source: "Založenie živnosti 2026", dolezite: "Pre SZČO je kľúčový výber predmetov podnikania (voľné, remeselné, viazané) a miesto podnikania. Elektronické podanie cez slovensko.sk znižuje poplatky o 50 %.", terminy: "Do 30 dní od vzniku oprávnenia sa musíte zaregistrovať na daňovom úrade. Pokuta do 3 000 €.", naklady: "Voľná živnosť elektronicky 0 € (inak 5 €), remeselná/viazaná 7,50 € elektronicky za každú." },
    extended_info: {
      short_description: "Ohlásenie živnosti je prvý právny krok k podnikaniu ako SZČO. Vyberiete si predmety podnikania a podáte ohlásenie na živnostenský úrad.",
      detailed_guide: "**Čo to je:** Ohlásenie živnosti je registrácia vášho oprávnenia podnikať v SR ako fyzická osoba.\n\n**Prečo je to dôležité:** Bez živnostenského oprávnenia nemôžete legálne fakturovať, uzatvárať obchodné zmluvy ani sa registrovať na daňovom úrade.\n\n**Ako to reálne vybaviť:**\n- Zvoľte si predmety podnikania (voľné sú zadarmo, remeselné/viazané vyžadujú prax alebo vzdelanie)\n- Podajte ohlásenie elektronicky cez slovensko.sk s eID (zľava 50 % na poplatkoch)\n- Živnostenský úrad vydá osvedčenie do 3 pracovných dní\n- Do 30 dní sa zaregistrujte na daňovom úrade pre pridelenie DIČ",
      estimated_time: "3–5 pracovných dní",
      financial_cost: "Voľná živnosť elektronicky 0 €, remeselná 7,50 €",
      useful_links: [
        { label: "Slovensko.sk – Ohlásenie živnosti", url: "https://www.slovensko.sk/sk/zivotne-situacie/zivotna-situacia/_zakladanie-prevadzkovanie-a-/" },
        { label: "Podnikajte.sk – Založenie živnosti 2026", url: "https://www.podnikajte.sk/zivnost/zalozenie-zivnosti-2026" }
      ]
    },
    tasks: [
      { id: "t1_1", title: "Výber predmetov podnikania (živností)", desc: "Zvoľte si voľné, remeselné alebo viazané živnosti podľa vášho zamerania. Voľné sú bez poplatku.", processing_time: "Okamžite (vaše rozhodnutie)", article: { title: "Voľné, remeselné a viazané živnosti", url: "https://www.podnikajte.sk/zivnost/volne-zivnosti" } },
      { id: "t1_2", title: "Určenie miesta podnikania", desc: "Vlastná adresa alebo registračné sídlo so súhlasom vlastníka nehnuteľnosti.", processing_time: "1–2 dni (overenie súhlasu)", article: { title: "Sídlo podnikania SZČO", url: "https://www.podnikajte.sk/zivnost/sidlo-podnikania-szco" } },
      { id: "t1_3", title: "Ohlásenie živnosti cez slovensko.sk", desc: "Elektronické podanie s eID – zľava 50 % na správnych poplatkoch.", processing_time: "3 pracovné dni (živnostenský úrad)", article: { title: "Založenie živnosti online 2026", url: "https://www.podnikajte.sk/zivnost/zalozenie-zivnosti-2026" } },
      { id: "t1_4", title: "Aktivácia elektronickej schránky (eID)", desc: "Občiansky preukaz s čipom pre elektronickú komunikáciu so štátom.", processing_time: "Okamžite po aktivácii eID", article: { title: "Elektronická schránka podnikateľa", url: "https://www.podnikajte.sk/zakony-a-legislativa/elektronicka-schranka" } },
      { id: "t1_5", title: "Registrácia na daňovom úrade (DIČ)", desc: "Do 30 dní od získania oprávnenia. Pokuta za nesplnenie do 3 000 €.", processing_time: "Do 30 dní (zákonný termín)", article: { title: "Registrácia na daňovom úrade", url: "https://www.podnikajte.sk/dan-z-prijmov/registracia-danovy-urad" } },
      { id: "t1_6", title: "Otvorenie podnikateľského účtu", desc: "Nie je povinný pre SZČO, ale silne odporúčaný pre prehľad v peniazoch.", processing_time: "1–2 pracovné dni", article: { title: "Podnikateľský účet pre SZČO", url: "https://www.podnikajte.sk/financny-manazment/ako-si-vybrat-podnikatelsky-ucet" } }
    ]
  };

  if (lf === 'sro') return {
    id: "M1", title: "🚀 Zakladanie s.r.o. na Slovensku", ui_style: "high", partnerId: "P2",
    article: { title: "Založenie a vznik s.r.o. v roku 2026", url: "https://www.podnikajte.sk/sro/zalozenie-vznik-sro-v-2026" },
    ai: { source: "Založenie s.r.o. 2026", dolezite: "Pre s.r.o. je kľúčový zápis do Obchodného registra SR (ORSR), spoločenská zmluva a splatenie základného imania. Konatelia zodpovedajú celým svojím majetkom.", terminy: "Zápis do ORSR do 2 pracovných dní od podania. Registrácia na daňovom úrade do 30 dní.", naklady: "Súdny poplatok elektronicky 150 €, základné imanie min. 5 000 € (min. 1 € splatené pri založení)." },
    extended_info: {
      short_description: "Založenie s.r.o. zahŕňa prípravu spoločenskej zmluvy, splatenie základného imania a zápis do Obchodného registra SR.",
      detailed_guide: "**Čo to je:** S.r.o. je právnická osoba s obmedzeným ručením spoločníkov (len do výšky nesplateného vkladu).\n\n**Prečo je to dôležité:** Oddeľuje osobný majetok od firemného. Konateľ však zodpovedá za škodu spôsobenú porušením povinností celým svojím majetkom.\n\n**Ako to reálne vybaviť:**\n- Pripravte spoločenskú zmluvu (pri jednoosobovej s.r.o. zakladateľskú listinu)\n- Splaťte základné imanie min. 5 000 € (stačí 1 € pri založení, zvyšok do 5 rokov)\n- Podajte návrh na zápis do ORSR elektronicky cez slovensko.sk\n- Registrujte sa na daňovom úrade do 30 dní od zápisu",
      estimated_time: "5–10 pracovných dní",
      financial_cost: "Súdny poplatok 150 € elektronicky + základné imanie 5 000 €",
      useful_links: [
        { label: "ORSR – Obchodný register SR", url: "https://www.orsr.sk" },
        { label: "Podnikajte.sk – Založenie s.r.o. 2026", url: "https://www.podnikajte.sk/sro/zalozenie-vznik-sro-v-2026" }
      ]
    },
    tasks: [
      { id: "t1_1", title: "Výber obchodného mena a predmetov podnikania", desc: "Overte dostupnosť názvu v ORSR. Predmety podnikania sú rovnaké ako živnosti.", processing_time: "Okamžite (overenie v ORSR)", article: { title: "Obchodné meno s.r.o.", url: "https://www.podnikajte.sk/sro/obchodne-meno-sro" } },
      { id: "t1_2", title: "Spísanie spoločenskej zmluvy", desc: "Pri jednoosobovej s.r.o. zakladateľská listina. Musí obsahovať sídlo, konateľov, vklady.", processing_time: "1–3 dni (príprava dokumentov)", article: { title: "Spoločenská zmluva s.r.o.", url: "https://www.podnikajte.sk/sro/spolocenska-zmluva-sro" } },
      { id: "t1_3", title: "Určenie sídla spoločnosti", desc: "Vlastná nehnuteľnosť alebo registračné sídlo s úradne overeným súhlasom vlastníka.", processing_time: "1–2 dni (overenie u notára)", article: { title: "Sídlo s.r.o.", url: "https://www.podnikajte.sk/sro/sidlo-sro" } },
      { id: "t1_4", title: "Splatenie základného imania", desc: "Min. 5 000 €, pri založení stačí splatiť 1 €. Správca vkladu potvrdí splatenie.", processing_time: "1 deň (bankový prevod)", article: { title: "Základné imanie s.r.o.", url: "https://www.podnikajte.sk/sro/zakladne-imanie-sro" } },
      { id: "t1_5", title: "Zápis do Obchodného registra (ORSR)", desc: "Elektronické podanie cez slovensko.sk, poplatok 150 €. Zápis do 2 pracovných dní.", processing_time: "2 pracovné dni (registrový súd)", article: { title: "Zápis s.r.o. do ORSR", url: "https://www.podnikajte.sk/sro/zalozenie-vznik-sro-v-2026" } },
      { id: "t1_6", title: "Registrácia na daňovom úrade (DIČ)", desc: "Do 30 dní od zápisu do ORSR. Automaticky pri elektronickom podaní.", processing_time: "Do 30 dní (zákonný termín)", article: { title: "Registrácia s.r.o. na DÚ", url: "https://www.podnikajte.sk/dan-z-prijmov/registracia-danovy-urad" } },
      { id: "t1_7", title: "Aktivácia elektronickej schránky", desc: "Povinná pre PO. Schránka sa aktivuje automaticky, skontrolujte prístupy.", processing_time: "Automaticky do 10 dní od zápisu", article: { title: "Elektronická schránka PO", url: "https://www.podnikajte.sk/zakony-a-legislativa/elektronicka-schranka" } }
    ]
  };

  if (lf === 'jsa') return {
    id: "M1", title: "🚀 Založenie j.s.a.", ui_style: "high", partnerId: "P3",
    article: { title: "Jednoduchá spoločnosť na akcie (j.s.a.)", url: "https://www.podnikajte.sk/obchodne-pravo/jednoducha-spolocnost-na-akcie" },
    ai: { source: "Založenie j.s.a. 2026", dolezite: "J.s.a. je ideálna pre startupy – umožňuje flexibilné rozdeľovanie podielov cez akcie s minimálnym imaním 1 €.", terminy: "Zápis do ORSR do 2 pracovných dní. Registrácia na DÚ do 30 dní.", naklady: "Súdny poplatok 150 € elektronicky, základné imanie min. 1 €." },
    extended_info: {
      short_description: "J.s.a. kombinuje jednoduché zakladanie s flexibilitou akciovej spoločnosti – ideálna pre startupy a investorské vstupy.",
      detailed_guide: "**Čo to je:** Jednoduchá spoločnosť na akcie je hybridná právna forma s min. imaním 1 € a možnosťou vydávať akcie.\n\n**Prečo je to dôležité:** Umožňuje jednoducho pridávať investorov cez vydanie nových akcií bez zmeny zakladateľských dokumentov.\n\n**Ako to reálne vybaviť:**\n- Pripravte zakladateľskú zmluvu (listinu pri 1 zakladateľovi)\n- Stanovy definujú druhy akcií, práva akcionárov\n- Splaťte základné imanie (min. 1 €)\n- Zapíšte sa do ORSR elektronicky",
      estimated_time: "5–10 pracovných dní",
      financial_cost: "Súdny poplatok 150 € elektronicky, imanie min. 1 €",
      useful_links: [
        { label: "Podnikajte.sk – J.s.a. pre startupy", url: "https://www.podnikajte.sk/obchodne-pravo/jednoducha-spolocnost-na-akcie" },
        { label: "ORSR – Obchodný register", url: "https://www.orsr.sk" }
      ]
    },
    tasks: [
      { id: "t1_1", title: "Príprava zakladateľskej zmluvy a stanov", desc: "Stanovy definujú druhy akcií, hlasovanie, prevoditeľnosť. Právnik je nevyhnutný.", processing_time: "3–5 dní (príprava s právnikom)", article: { title: "Založenie j.s.a.", url: "https://www.podnikajte.sk/obchodne-pravo/jednoducha-spolocnost-na-akcie" } },
      { id: "t1_2", title: "Rozhodnutie o druhoch akcií", desc: "Kmeňové, prioritné alebo zamestnanecké akcie – každý druh má iné práva.", processing_time: "Okamžite (vaše rozhodnutie)", article: { title: "Druhy akcií j.s.a.", url: "https://www.podnikajte.sk/obchodne-pravo/jednoducha-spolocnost-na-akcie" } },
      { id: "t1_3", title: "Splatenie základného imania (min. 1 €)", desc: "Flexibilné – môžete začať s 1 € a navyšovať pri vstupe investorov.", processing_time: "1 deň", article: { title: "Základné imanie j.s.a.", url: "https://www.podnikajte.sk/obchodne-pravo/jednoducha-spolocnost-na-akcie" } },
      { id: "t1_4", title: "Určenie sídla a štatutárnych orgánov", desc: "Predstavenstvo (min. 1 člen), dozorná rada nie je povinná pri j.s.a.", processing_time: "1–2 dni", article: { title: "Orgány j.s.a.", url: "https://www.podnikajte.sk/obchodne-pravo/jednoducha-spolocnost-na-akcie" } },
      { id: "t1_5", title: "Zápis do Obchodného registra", desc: "Elektronicky cez slovensko.sk, poplatok 150 €.", processing_time: "2 pracovné dni (registrový súd)", article: { title: "Zápis do ORSR", url: "https://www.podnikajte.sk/obchodne-pravo/jednoducha-spolocnost-na-akcie" } },
      { id: "t1_6", title: "Registrácia na daňovom úrade", desc: "Do 30 dní od zápisu. DIČ a prípadná registrácia k DPH.", processing_time: "Do 30 dní (zákonný termín)", article: { title: "Registrácia na DÚ", url: "https://www.podnikajte.sk/dan-z-prijmov/registracia-danovy-urad" } }
    ]
  };

  return {
    id: "M1", title: "🚀 Založenie a.s.", ui_style: "high", partnerId: "P3",
    article: { title: "Založenie akciovej spoločnosti", url: "https://www.podnikajte.sk/obchodne-pravo/zalozenie-akciovej-spolocnosti" },
    ai: { source: "Založenie a.s. 2026", dolezite: "A.s. vyžaduje základné imanie 25 000 €, predstavenstvo, dozornú radu a notársky overené stanovy.", terminy: "Zápis do ORSR do 2 pracovných dní. Ustanovujúce valné zhromaždenie pred zápisom.", naklady: "Súdny poplatok 150 € elektronicky, ZI min. 25 000 €, notár ~200–500 €." },
    extended_info: {
      short_description: "Akciová spoločnosť je najformálnejšia právna forma – vyžaduje 25 000 € imanie, predstavenstvo a dozornú radu.",
      detailed_guide: "**Čo to je:** A.s. je kapitálová spoločnosť vhodná pre väčšie podnikanie, verejné obchodovanie alebo holding.\n\n**Prečo je to dôležité:** Poskytuje najvyššiu dôveryhodnosť voči bankám a obchodným partnerom.\n\n**Ako to reálne vybaviť:**\n- Pripravte stanovy (notársky overené), zakladateľská zmluva/listina\n- Ustanovujúce valné zhromaždenie zvolí predstavenstvo a dozornú radu\n- Splaťte min. 30 % menovitej hodnoty akcií pred zápisom\n- Zapíšte spoločnosť do ORSR",
      estimated_time: "10–20 pracovných dní",
      financial_cost: "Súdny poplatok 150 €, ZI 25 000 €, notár 200–500 €",
      useful_links: [
        { label: "Podnikajte.sk – Založenie a.s.", url: "https://www.podnikajte.sk/obchodne-pravo/zalozenie-akciovej-spolocnosti" },
        { label: "ORSR – Obchodný register", url: "https://www.orsr.sk" }
      ]
    },
    tasks: [
      { id: "t1_1", title: "Príprava stanov a zakladateľskej zmluvy", desc: "Stanovy musia byť notársky overené. Definujú orgány, akcie, hlasovanie.", processing_time: "5–10 dní (notár + právnik)", article: { title: "Založenie a.s.", url: "https://www.podnikajte.sk/obchodne-pravo/zalozenie-akciovej-spolocnosti" } },
      { id: "t1_2", title: "Ustanovujúce valné zhromaždenie", desc: "Zvolí predstavenstvo a dozornú radu, schváli stanovy.", processing_time: "1 deň (formálne zasadnutie)", article: { title: "Valné zhromaždenie a.s.", url: "https://www.podnikajte.sk/obchodne-pravo/zalozenie-akciovej-spolocnosti" } },
      { id: "t1_3", title: "Splatenie základného imania (min. 25 000 €)", desc: "Min. 30 % menovitej hodnoty upísaných akcií pred zápisom do ORSR.", processing_time: "1–3 dni (bankový prevod)", article: { title: "Základné imanie a.s.", url: "https://www.podnikajte.sk/obchodne-pravo/zalozenie-akciovej-spolocnosti" } },
      { id: "t1_4", title: "Voľba predstavenstva a dozornej rady", desc: "Predstavenstvo min. 1 člen, dozorná rada min. 3 členovia.", processing_time: "Súčasť valného zhromaždenia", article: { title: "Orgány a.s.", url: "https://www.podnikajte.sk/obchodne-pravo/zalozenie-akciovej-spolocnosti" } },
      { id: "t1_5", title: "Zápis do Obchodného registra", desc: "Elektronicky cez slovensko.sk s notársky overenými prílohami.", processing_time: "2 pracovné dni (registrový súd)", article: { title: "Zápis a.s. do ORSR", url: "https://www.podnikajte.sk/obchodne-pravo/zalozenie-akciovej-spolocnosti" } },
      { id: "t1_6", title: "Registrácia na daňovom úrade", desc: "Do 30 dní od zápisu. DIČ + povinná registrácia k dani z príjmu PO.", processing_time: "Do 30 dní (zákonný termín)", article: { title: "Registrácia na DÚ", url: "https://www.podnikajte.sk/dan-z-prijmov/registracia-danovy-urad" } }
    ]
  };
}

// ─── M2: PODNIKATEĽSKÝ ÚČET ───
function ucet(lf) {
  const povinny = jePO(lf);
  return {
    id: "M2", title: "🏦 Podnikateľský účet", ui_style: "normal", partnerId: "P4",
    article: { title: "Ako si vybrať podnikateľský účet", url: "https://www.podnikajte.sk/financny-manazment/ako-si-vybrat-podnikatelsky-ucet" },
    ai: { source: "Podnikateľský účet 2026", dolezite: povinny ? `${m(lf).label} zo zákona potrebuje samostatný firemný účet oddelený od osobných financií.` : "SZČO nemusí mať firemný účet, ale pri platbách nad limit a kvôli prehľadu sa odporúča.", terminy: "Účet otvoríte do 1–2 dní. Bez účtu nepodáte niektoré dotácie.", naklady: "Mesačné vedenie 0–15 €. Prvý rok často zadarmo." },
    extended_info: {
      short_description: povinny ? `Pre ${m(lf).label} je firemný účet zo zákona povinný – musí byť oddelený od osobných financií.` : "Firemný účet nie je pre SZČO povinný, ale výrazne zjednodušuje účtovníctvo a odvody.",
      detailed_guide: `**Čo to je:** Podnikateľský bankový účet určený výhradne pre firemné transakcie.\n\n**Prečo je to dôležité:** ${povinny ? 'Pre právnické osoby je oddelenie osobných a firemných financií zákonná povinnosť.' : 'Zjednodušuje daňové priznanie, automatizuje odvody a zvyšuje dôveryhodnosť.'}\n\n**Ako to reálne vybaviť:**\n- Porovnajte mesačné poplatky, limity transakcií a dostupnosť API\n- Pripravte si ${povinny ? 'výpis z ORSR' : 'živnostenský list'} a doklad totožnosti\n- Aktivujte internet banking a nastavte trvalé príkazy na odvody\n- ${povinny ? 'Nastavte prístupy pre konateľov a účtovníka' : 'Prepojte účet s účtovným softvérom'}`,
      estimated_time: "1–2 pracovné dni",
      financial_cost: "Vedenie 0–15 €/mesiac, prvý rok často zadarmo",
      useful_links: [
        { label: "Podnikajte.sk – Výber podnikateľského účtu", url: "https://www.podnikajte.sk/financny-manazment/ako-si-vybrat-podnikatelsky-ucet" }
      ]
    },
    tasks: [
      { id: "t2_1", title: "Porovnanie bankových ponúk", desc: "Sledujte poplatky za vedenie, platby, výbery a dostupnosť platobnej brány.", processing_time: "Okamžite (online porovnanie)", article: { title: "Porovnanie podnikateľských účtov", url: "https://www.podnikajte.sk/financny-manazment/ako-si-vybrat-podnikatelsky-ucet" } },
      { id: "t2_2", title: `Príprava dokladov (${povinny ? 'výpis z ORSR' : 'živnostenský list'} + eID)`, desc: "Banka vyžaduje doklad o oprávnení podnikať a totožnosť.", processing_time: "Okamžite (ak máte doklady)", article: { title: "Otvorenie účtu pre podnikateľa", url: "https://www.podnikajte.sk/financny-manazment/ako-si-vybrat-podnikatelsky-ucet" } },
      { id: "t2_3", title: "Aktivácia internet bankingu", desc: "Pre e-shop overte podporu platobných brán (Stripe, GoPay, Comgate).", processing_time: "1 pracovný deň", article: { title: "Internet banking pre firmy", url: "https://www.podnikajte.sk/financny-manazment/ako-si-vybrat-podnikatelsky-ucet" } },
      { id: "t2_4", title: "Nastavenie trvalých príkazov na odvody", desc: "Automatizujte platby do Sociálnej a zdravotnej poisťovne.", processing_time: "Okamžite (v internet bankingu)", article: { title: "Odvody SZČO", url: lf === 'szco' ? "https://www.podnikajte.sk/socialne-a-zdravotne-odvody/odvody-szco" : "https://www.podnikajte.sk/financny-manazment/ako-si-vybrat-podnikatelsky-ucet" } },
      { id: "t2_5", title: "Prepojenie s účtovným softvérom", desc: "Bankové API šetrí hodiny pri párovaní platieb s faktúrami.", processing_time: "1–2 hodiny (nastavenie)", article: { title: "Účtovný softvér pre podnikateľov", url: "https://www.podnikajte.sk/uctovnictvo/uctovnictvo-zivnostnika" } }
    ]
  };
}

// ─── M3: FINANCOVANIE ───
function financovanie(lf) {
  if (lf === 'szco') return {
    id: "M3", title: "🏢 Hypotéka / financovanie SZČO", ui_style: "normal", partnerId: "P1",
    article: { title: "Hypotéka pre živnostníkov (SZČO)", url: "https://www.podnikajte.sk/osobne-financie/hypoteka-pre-zivnostnikov-szco-majitelov-s-r-o" },
    ai: { source: "Hypotéka pre SZČO 2026", dolezite: "Banky posudzujú príjem SZČO buď z čistého zisku, alebo percentom z tržieb (10–60 %). SLSP akceptuje až 60 % tržieb pri paušále.", terminy: "Schvaľovací proces trvá 2–4 týždne. Daňové priznanie musí byť podané.", naklady: "Poplatok za poskytnutie 0–1 %, znalecký posudok 150–250 €." },
    extended_info: {
      short_description: "Ako SZČO získate hypotéku na základe percenta z tržieb – niektoré banky akceptujú až 60 % obratu ako príjem.",
      detailed_guide: "**Čo to je:** Banky majú pre SZČO špeciálne metodiky posudzovania príjmu – nie len zo zisku, ale aj z tržieb.\n\n**Prečo je to dôležité:** Ak uplatňujete paušálne výdavky, váš daňový zisk je nízky, ale tržby môžu byť vysoké. SLSP akceptuje až 60 % tržieb.\n\n**Ako to reálne vybaviť:**\n- Pripravte potvrdenie o podaní daňového priznania a o výške dane\n- Kalkulačkou si prepočítajte bonitu z tržieb aj zo zisku\n- Porovnajte ponuky cez sprostredkovateľa – jeden dopyt = viac ponúk\n- Zabezpečte znalecký posudok nehnuteľnosti",
      estimated_time: "2–4 týždne (schvaľovanie)",
      financial_cost: "Poplatok 0–1 % z úveru, znalecký posudok 150–250 €",
      useful_links: [{ label: "Podnikajte.sk – Hypotéka pre SZČO", url: "https://www.podnikajte.sk/osobne-financie/hypoteka-pre-zivnostnikov-szco-majitelov-s-r-o" }]
    },
    tasks: [
      { id: "t3_1", title: "Analýza daňového priznania (tržby vs. zisk)", desc: "Banky sa pozerajú na tržby aj zisk – rozhoduje metodika konkrétnej banky.", processing_time: "Okamžite (analýza dokladov)", article: { title: "Hypotéka pre SZČO z tržieb", url: "https://www.podnikajte.sk/osobne-financie/hypoteka-pre-zivnostnikov-szco-majitelov-s-r-o" } },
      { id: "t3_2", title: "Kalkulácia bonity (60 % tržieb)", desc: "Použi kalkulačku bonity – SLSP akceptuje až 60 % tržieb pri paušále.", processing_time: "Okamžite (kalkulačka)", article: { title: "Bonita živnostníka", url: "https://www.podnikajte.sk/osobne-financie/hypoteka-pre-zivnostnikov-szco-majitelov-s-r-o" } },
      { id: "t3_3", title: "Potvrdenie o podaní DP a výške dane", desc: "Dokumenty z finančnej správy – podmienka každej banky.", processing_time: "1–3 dni (finančná správa)", article: { title: "Potvrdenie o podaní DP", url: "https://www.podnikajte.sk/dan-z-prijmov/danove-priznanie-fyzickej-osoby-typu-b-za-rok-2025" } },
      { id: "t3_4", title: "Preverenie registra dlžníkov", desc: "Žiadne podlžnosti v SP/ZP. Skontrolujte aj RPMN.", processing_time: "Okamžite (online register)", article: { title: "Register dlžníkov", url: "https://www.podnikajte.sk/osobne-financie/hypoteka-pre-zivnostnikov-szco-majitelov-s-r-o" } },
      { id: "t3_5", title: "Znalecký posudok nehnuteľnosti", desc: "Banka určuje max. úver podľa LTV (pomer úveru k hodnote nehnuteľnosti).", processing_time: "5–10 pracovných dní (znalec)", article: { title: "Znalecký posudok", url: "https://www.podnikajte.sk/osobne-financie/hypoteka-pre-zivnostnikov-szco-majitelov-s-r-o" } },
      { id: "t3_6", title: "Porovnanie ponúk cez sprostredkovateľa", desc: "Jeden dopyt = ponuky z viacerých bánk naraz.", processing_time: "2–4 týždne (schvaľovanie)", article: { title: "Sprostredkovanie hypotéky", url: "https://www.podnikajte.sk/osobne-financie/hypoteka-pre-zivnostnikov-szco-majitelov-s-r-o" } }
    ]
  };

  if (lf === 'sro') return {
    id: "M3", title: "🏢 Podnikateľský úver pre s.r.o.", ui_style: "normal", partnerId: "P1",
    article: { title: "Úvery pre firmy a podnikateľov", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" },
    ai: { source: "Firemný úver 2026", dolezite: "S.r.o. môže čerpať úver na IČO. Banka posudzuje tržby, ziskovosť a históriu. Konateľ často ručí osobne.", terminy: "Schválenie 1–3 týždne podľa výšky úveru a typu zabezpečenia.", naklady: "Úroková sadzba 4–8 %, poplatok za spracovanie 0,5–1 %." },
    extended_info: {
      short_description: "S.r.o. získava financovanie na IČO firmy – banka posudzuje obrat, ziskovosť a zabezpečenie.",
      detailed_guide: "**Čo to je:** Podnikateľský úver pre právnickú osobu – firma je dlžníkom, konateľ často spoluzodpovedá.\n\n**Prečo je to dôležité:** Oddeľuje firemný dlh od osobného, ale banky bežne vyžadujú ručenie konateľa.\n\n**Ako to reálne vybaviť:**\n- Pripravte účtovnú závierku za posledné 2 roky\n- Zostavte podnikateľský plán s cashflow projekciou\n- Porovnajte ponuky bánk a alternatívnych finančníkov\n- Zvážte leasing alebo faktoring ako alternatívu",
      estimated_time: "1–3 týždne",
      financial_cost: "Úrok 4–8 %, poplatok 0,5–1 %",
      useful_links: [{ label: "Podnikajte.sk – Podnikateľské úvery", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" }]
    },
    tasks: [
      { id: "t3_1", title: "Príprava účtovnej závierky", desc: "Banka chce súvahu a výkaz ziskov za posledné 2 roky.", processing_time: "Závisí od účtovníka (1–5 dní)", article: { title: "Účtovná závierka s.r.o.", url: "https://www.podnikajte.sk/uctovnictvo/podvojne-uctovnictvo" } },
      { id: "t3_2", title: "Podnikateľský plán s cashflow", desc: "Projekcia príjmov a výdavkov na obdobie splácania.", processing_time: "2–5 dní (príprava)", article: { title: "Podnikateľský plán", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" } },
      { id: "t3_3", title: "Porovnanie bankových ponúk", desc: "Porovnajte úrokové sadzby, zabezpečenie a flexibilitu splácania.", processing_time: "1–3 týždne (schvaľovanie)", article: { title: "Porovnanie úverov pre firmy", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" } },
      { id: "t3_4", title: "Posúdenie alternatív (leasing, faktoring)", desc: "Nie vždy je úver najlepšia voľba – faktoring uvoľní cashflow rýchlejšie.", processing_time: "Okamžite (konzultácia)", article: { title: "Faktoring pre firmy", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" } },
      { id: "t3_5", title: "Ručenie konateľa – zváženie rizík", desc: "Väčšina bánk vyžaduje osobné ručenie. Poraďte sa s právnikom.", processing_time: "Okamžite (rozhodnutie)", article: { title: "Ručenie za úver s.r.o.", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" } }
    ]
  };

  return {
    id: "M3", title: jeKorp(lf) ? "📊 Investičné financovanie a akcie" : "📊 Financovanie firmy", ui_style: "normal", partnerId: "P1",
    article: { title: "Možnosti financovania firiem", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" },
    ai: { source: "Investičné financovanie 2026", dolezite: `${m(lf).label} môže získať kapitál cez emisiu nových akcií, vstup investora alebo bankový úver.`, terminy: "Investičné kolo trvá typicky 2–6 mesiacov.", naklady: "Právne náklady na investičnú dokumentáciu 2 000–10 000 €." },
    extended_info: {
      short_description: `${m(lf).label} má výhodu emisie akcií pre prilákanie investorov bez zložitých zmien zakladateľských dokumentov.`,
      detailed_guide: `**Čo to je:** Získavanie kapitálu pre rast – cez investorov (equity) alebo dlhové financovanie.\n\n**Prečo je to dôležité:** ${lf === 'jsa' ? 'J.s.a. bola vytvorená práve pre jednoduché investičné vstupy.' : 'A.s. umožňuje verejné aj súkromné emisie akcií.'}\n\n**Ako to reálne vybaviť:**\n- Pripravte pitch deck a finančný model\n- Definujte valuáciu a podmienky vstup investora\n- Pripravte term sheet a akcionársku zmluvu\n- Zabezpečte právnu due diligence`,
      estimated_time: "2–6 mesiacov",
      financial_cost: "Právne náklady 2 000–10 000 €",
      useful_links: [{ label: "Podnikajte.sk – Financovanie firiem", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" }]
    },
    tasks: [
      { id: "t3_1", title: "Príprava pitch decku a finančného modelu", desc: "Investor chce vidieť trakciu, unit economics a projekciu rastu.", processing_time: "1–2 týždne", article: { title: "Investičné financovanie", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" } },
      { id: "t3_2", title: "Stanovenie valuácie spoločnosti", desc: "Pre-money vs. post-money valuácia – ovplyvní rozriedenie zakladateľov.", processing_time: "1–3 dni (analýza)", article: { title: "Valuácia startupu", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" } },
      { id: "t3_3", title: "Príprava term sheetu", desc: "Hlavné podmienky investície – preferenčné práva, anti-dilution, vesting.", processing_time: "1–2 týždne (s právnikom)", article: { title: "Term sheet", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" } },
      { id: "t3_4", title: "Akcionárska zmluva", desc: "Definuje práva a povinnosti akcionárov, drag-along, tag-along, exit scenáre.", processing_time: "2–4 týždne (právna príprava)", article: { title: "Akcionárska zmluva", url: "https://www.podnikajte.sk/obchodne-pravo/pravidla-obchodne-zmluvy" } },
      { id: "t3_5", title: "Právna a finančná due diligence", desc: "Investor preverí právny stav, zmluvy, dane a záväzky spoločnosti.", processing_time: "2–4 týždne", article: { title: "Due diligence", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" } }
    ]
  };
}

// ─── M4: PRVÝ ZAMESTNANEC ───
function zamestnanec(lf) {
  return {
    id: "M4", title: "👨‍💼 Prvý zamestnanec", ui_style: "high", partnerId: "P2",
    article: { title: "Prvý zamestnanec: povinnosti zamestnávateľa", url: "https://www.podnikajte.sk/pracovne-pravo-bozp/prvy-zamestnanec-povinnosti-zamestnavatela" },
    ai: { source: "Prvý zamestnanec 2026", dolezite: "Cena práce je o ~35,2 % vyššia ako hrubá mzda kvôli odvodom. Prihlásenie do SP najneskôr deň pred nástupom.", terminy: "SP: najneskôr deň pred nástupom. ZP: do 8 dní. Mzda splatná podľa dohody.", naklady: "K hrubej mzde +35,2 % odvodov + PZS a BOZP (desiatky € mesačne)." },
    extended_info: {
      short_description: "Prijatie prvého zamestnanca znamená registráciu zamestnávateľa, odvody +35,2 % k hrubej mzde a povinné PZS a BOZP.",
      detailed_guide: `**Čo to je:** Prechod z one-man show na zamestnávateľa.\n\n**Prečo je to dôležité:** Celková cena práce je výrazne vyššia ako hrubá mzda. Neprihlásenie do SP je priestupok.\n\n**Ako to reálne vybaviť:**\n- Vypočítajte celkovú cenu práce (hrubá mzda × 1,352)\n- Zaregistrujte sa ako zamestnávateľ v SP a ZP\n- Pripravte pracovnú zmluvu\n- Zabezpečte PZS a školenie BOZP`,
      estimated_time: "3–5 pracovných dní",
      financial_cost: "Odvody +35,2 % k hrubej mzde, PZS ~20–50 €/mesiac",
      useful_links: [
        { label: "Sociálna poisťovňa", url: "https://www.socpoist.sk" },
        { label: "Podnikajte.sk – Prvý zamestnanec", url: "https://www.podnikajte.sk/pracovne-pravo-bozp/prvy-zamestnanec-povinnosti-zamestnavatela" }
      ]
    },
    tasks: [
      { id: "t4_1", title: "Výpočet celkovej ceny práce", desc: "Hrubá mzda × 1,352 = celkové náklady. Kalkulačka pomôže s presným odhadom.", processing_time: "Okamžite (kalkulačka)", article: { title: "Cena práce zamestnanca 2026", url: "https://www.podnikajte.sk/pracovne-pravo-bozp/cena-prace-zamestnanca" } },
      { id: "t4_2", title: "Registrácia zamestnávateľa v SP", desc: "Najneskôr deň pred nástupom prvého zamestnanca.", processing_time: "1 pracovný deň (Sociálna poisťovňa)", article: { title: "Registrácia zamestnávateľa v SP", url: "https://www.podnikajte.sk/pracovne-pravo-bozp/prvy-zamestnanec-povinnosti-zamestnavatela" } },
      { id: "t4_3", title: "Prihlásenie do zdravotnej poisťovne", desc: "Do 8 dní od vzniku pracovného pomeru.", processing_time: "Do 8 dní (zákonný termín)", article: { title: "Prihlásenie zamestnanca do ZP", url: "https://www.podnikajte.sk/pracovne-pravo-bozp/prvy-zamestnanec-povinnosti-zamestnavatela" } },
      { id: "t4_4", title: "Príprava pracovnej zmluvy", desc: "Druh práce, miesto výkonu, mzdové podmienky a výplatný termín.", processing_time: "1–2 dni (príprava)", article: { title: "Pracovná zmluva – vzor", url: "https://www.podnikajte.sk/pracovne-pravo-bozp/pracovna-zmluva" } },
      { id: "t4_5", title: "Zabezpečenie PZS a BOZP", desc: "Povinné zo zákona už pri prvom zamestnancovi – pokuta do 100 000 €.", processing_time: "1–3 dni (nastavenie služby)", article: { title: "PZS a BOZP povinnosti", url: "https://www.podnikajte.sk/pracovne-pravo-bozp/pracovna-zdravotna-sluzba" } },
      { id: "t4_6", title: "Nastavenie spracovania miezd", desc: "Mzdová účtovníčka alebo softvér – výplatné pásky, výkazy, ELDP.", processing_time: "1–2 dni (nastavenie)", article: { title: "Spracovanie miezd", url: "https://www.podnikajte.sk/pracovne-pravo-bozp/prvy-zamestnanec-povinnosti-zamestnavatela" } }
    ]
  };
}

// ─── M5: ÚČTOVNÍCTVO ───
function uctovnik(lf) {
  const podvojne = jePO(lf);
  const auditPovinny = lf === 'as';
  return {
    id: "M5", title: podvojne ? "🧾 Podvojné účtovníctvo" : "🧾 Účtovníctvo a daňová evidencia", ui_style: "normal", partnerId: "P2",
    article: { title: podvojne ? "Podvojné účtovníctvo pre firmy" : "Účtovníctvo živnostníka", url: podvojne ? "https://www.podnikajte.sk/uctovnictvo/podvojne-uctovnictvo" : "https://www.podnikajte.sk/uctovnictvo/uctovnictvo-zivnostnika" },
    ai: { source: "Účtovníctvo 2026", dolezite: podvojne ? `${m(lf).label} musí viesť podvojné účtovníctvo.${auditPovinny ? ' A.s. má povinný audit.' : ''}` : "SZČO si môže vybrať medzi daňovou evidenciou a jednoduchým účtovníctvom.", terminy: "Mesačné DPH do 25. dňa. Účtovnú závierku podajte s DP.", naklady: podvojne ? "100–300 €/mesiac." : "40–80 €/mesiac." },
    extended_info: {
      short_description: podvojne ? `${m(lf).label} musí zo zákona viesť podvojné účtovníctvo.${auditPovinny ? ' Audit je povinný.' : ''}` : "SZČO má na výber – daňová evidencia, jednoduché účtovníctvo alebo paušálne výdavky.",
      detailed_guide: podvojne
        ? `**Čo to je:** Podvojné účtovníctvo zachytáva každú transakciu na dvoch účtoch.\n\n**Prečo je to dôležité:** Zo zákona povinné pre PO.${auditPovinny ? ' A.s. musí mať audítora.' : ''}\n\n**Ako to reálne vybaviť:**\n- Nájdite účtovníka so skúsenosťou s ${m(lf).label}\n- Overte poistenie zodpovednosti\n- Nastavte digitálne odovzdávanie dokladov\n- Pripravte splnomocnenie na komunikáciu s úradmi`
        : "**Čo to je:** Evidencia príjmov a výdavkov pre výpočet dane z príjmu.\n\n**Prečo je to dôležité:** Správne vedená evidencia = správne dane a odvody.\n\n**Ako to reálne vybaviť:**\n- Rozhodnite sa: paušálne výdavky (60 %, max 20 000 €) vs. skutočné\n- Nájdite účtovníka alebo používajte softvér (iDoklad, SuperFaktúra)\n- Odovzdávajte doklady priebežne",
      estimated_time: "1–2 týždne na nastavenie",
      financial_cost: podvojne ? "100–300 €/mesiac" : "40–80 €/mesiac",
      useful_links: [{ label: "Podnikajte.sk – Účtovníctvo", url: podvojne ? "https://www.podnikajte.sk/uctovnictvo/podvojne-uctovnictvo" : "https://www.podnikajte.sk/uctovnictvo/uctovnictvo-zivnostnika" }]
    },
    tasks: [
      { id: "t5_1", title: podvojne ? "Výber účtovnej firmy pre podvojné účtovníctvo" : "Rozhodnutie: paušál vs. skutočné výdavky", desc: podvojne ? "Hľadajte skúsenosť s vašou právnou formou." : "Simulujte obe varianty v kalkulačke.", processing_time: "1–3 dni (výber)", article: { title: podvojne ? "Výber účtovníka" : "Paušálne výdavky SZČO", url: podvojne ? "https://www.podnikajte.sk/uctovnictvo/podvojne-uctovnictvo" : "https://www.podnikajte.sk/dan-z-prijmov/pausalne-vydavky" } },
      { id: "t5_2", title: "Overenie referencií a poistenia účtovníka", desc: "Poistenie zodpovednosti vás chráni, ak účtovník urobí chybu.", processing_time: "1 deň", article: { title: "Poistenie účtovníka", url: podvojne ? "https://www.podnikajte.sk/uctovnictvo/podvojne-uctovnictvo" : "https://www.podnikajte.sk/uctovnictvo/uctovnictvo-zivnostnika" } },
      { id: "t5_3", title: "Nastavenie digitálneho odovzdávania dokladov", desc: "Fotka/sken cez mobil je rýchlejší a lacnejší ako papier.", processing_time: "1 deň (nastavenie)", article: { title: "Digitalizácia účtovníctva", url: podvojne ? "https://www.podnikajte.sk/uctovnictvo/podvojne-uctovnictvo" : "https://www.podnikajte.sk/uctovnictvo/uctovnictvo-zivnostnika" } },
      { id: "t5_4", title: "Splnomocnenie na komunikáciu s úradmi", desc: "Účtovník za vás komunikuje s FS, SP a ZP elektronicky.", processing_time: "1 deň (podpis splnomocnenia)", article: { title: "Splnomocnenie pre účtovníka", url: podvojne ? "https://www.podnikajte.sk/uctovnictvo/podvojne-uctovnictvo" : "https://www.podnikajte.sk/uctovnictvo/uctovnictvo-zivnostnika" } },
      { id: "t5_5", title: podvojne ? "Nastavenie účtového rozvrhu" : "Výber fakturačného softvéru", desc: podvojne ? "Účtovník nastaví rozvrh podľa vašej činnosti." : "iDoklad, SuperFaktúra, Billdu – overte prepojenie s bankou.", processing_time: podvojne ? "1–2 dni" : "Okamžite (registrácia)", article: { title: podvojne ? "Účtový rozvrh" : "Fakturačný softvér", url: podvojne ? "https://www.podnikajte.sk/uctovnictvo/podvojne-uctovnictvo" : "https://www.podnikajte.sk/uctovnictvo/uctovnictvo-zivnostnika" } }
    ]
  };
}

// ─── M6: DANE A ODVODY ───
function dane(lf) {
  const po = jePO(lf);
  return {
    id: "M6", title: po ? "📊 Daň z príjmu PO a dividendy" : "📊 Daňové priznanie a odvody SZČO", ui_style: "high", partnerId: "P2",
    article: { title: po ? "Daň z príjmu právnickej osoby 2026" : "Daňové priznanie FO typ B za rok 2025", url: po ? "https://www.podnikajte.sk/dan-z-prijmov/dan-z-prijmov-pravnickej-osoby" : "https://www.podnikajte.sk/dan-z-prijmov/danove-priznanie-fyzickej-osoby-typu-b-za-rok-2025" },
    ai: { source: po ? "Daň PO 2026" : "Dane SZČO 2026", dolezite: po ? `Sadzba dane PO je 15 % (do 100 000 €) alebo 21 %. Dividendy 7 % zrážková.` : "Paušálne výdavky 60 % (max 20 000 €) vs. skutočné. Sadzba 15 % do 100 000 €.", terminy: "DP a daň do 31. marca (odklad 3–6 mesiacov).", naklady: po ? "Daň PO 15/21 %, dividendy 7 %." : "Daň 15 %, zdravotné + sociálne odvody." },
    extended_info: {
      short_description: po ? `${m(lf).label} platí daň PO (15/21 %) a dividendy 7 %.` : "SZČO podáva DP typ B – kľúčové je rozhodnutie paušál vs. skutočné výdavky.",
      detailed_guide: po
        ? `**Čo to je:** Daň z príjmu PO a zdanenie dividend.\n\n**Prečo je to dôležité:** Efektívna sadzba pri výplate zisku ~20,95 %.\n\n**Ako to vybaviť:**\n- Sadzba 15 % do 100 000 €, inak 21 %\n- Dividendy 7 % zrážková\n- Preddavky štvrťročne/mesačne\n- Termín DP: 31. marec`
        : "**Čo to je:** DP FO typ B a výpočet odvodov.\n\n**Prečo je to dôležité:** Správna voľba ušetrí stovky €.\n\n**Ako to vybaviť:**\n- Simulujte paušál vs. skutočné\n- Sadzba 15 % do 100 000 €\n- Od júla nové odvody\n- Nezdaniteľná časť, bonus na deti",
      estimated_time: "1–3 dni",
      financial_cost: po ? "Daň PO 15/21 %, dividendy 7 %" : "Daň 15 %, zdravotné + sociálne",
      useful_links: [
        { label: "Finančná správa SR", url: "https://www.financnasprava.sk" },
        { label: "Podnikajte.sk – Dane", url: po ? "https://www.podnikajte.sk/dan-z-prijmov/dan-z-prijmov-pravnickej-osoby" : "https://www.podnikajte.sk/dan-z-prijmov/danove-priznanie-fyzickej-osoby-typu-b-za-rok-2025" }
      ]
    },
    tasks: po ? [
      { id: "t6_1", title: "Príprava účtovnej závierky", desc: "Súvaha, výkaz ziskov a strát, poznámky.", processing_time: "5–10 dní (účtovník)", article: { title: "Účtovná závierka PO", url: "https://www.podnikajte.sk/dan-z-prijmov/dan-z-prijmov-pravnickej-osoby" } },
      { id: "t6_2", title: "Výpočet a podanie DP PO", desc: "Termín 31. marec, možný odklad.", processing_time: "Do 31.3. (zákonný termín)", article: { title: "Daňové priznanie PO", url: "https://www.podnikajte.sk/dan-z-prijmov/dan-z-prijmov-pravnickej-osoby" } },
      { id: "t6_3", title: "Nastavenie preddavkov na daň", desc: "Štvrťročne alebo mesačne.", processing_time: "Okamžite po podaní DP", article: { title: "Preddavky na daň PO", url: "https://www.podnikajte.sk/dan-z-prijmov/dan-z-prijmov-pravnickej-osoby" } },
      { id: "t6_4", title: "Plánovanie výplaty dividend", desc: "7 % zrážková daň. Len z nerozdeleného zisku.", processing_time: "Okamžite (rozhodnutie VZ)", article: { title: "Zdanenie dividend", url: "https://www.podnikajte.sk/dan-z-prijmov/zdanenie-dividend" } },
      { id: "t6_5", title: "Kontrola transferového oceňovania", desc: "Transakcie medzi prepojenými osobami za trhové ceny.", processing_time: "Priebežne", article: { title: "Transferové oceňovanie", url: "https://www.podnikajte.sk/dan-z-prijmov/dan-z-prijmov-pravnickej-osoby" } }
    ] : [
      { id: "t6_1", title: "Rozhodnutie: paušál vs. skutočné výdavky", desc: "Simulujte obe varianty.", processing_time: "Okamžite (kalkulačka)", article: { title: "Paušálne výdavky SZČO 2026", url: "https://www.podnikajte.sk/dan-z-prijmov/pausalne-vydavky" } },
      { id: "t6_2", title: "Kompletizácia príjmov a výdavkov", desc: "Skontrolujte všetky faktúry a doklady.", processing_time: "1–3 dni", article: { title: "Daňová evidencia SZČO", url: "https://www.podnikajte.sk/dan-z-prijmov/danove-priznanie-fyzickej-osoby-typu-b-za-rok-2025" } },
      { id: "t6_3", title: "Výpočet a podanie DP typ B", desc: "Termín 31. marec, možný odklad.", processing_time: "Do 31.3. (zákonný termín)", article: { title: "Daňové priznanie FO typ B", url: "https://www.podnikajte.sk/dan-z-prijmov/danove-priznanie-fyzickej-osoby-typu-b-za-rok-2025" } },
      { id: "t6_4", title: "Úprava odvodov do SP a ZP", desc: "Od júla nové odvody – upravte trvalé príkazy.", processing_time: "Automaticky od júla", article: { title: "Odvody SZČO 2026", url: "https://www.podnikajte.sk/socialne-a-zdravotne-odvody/odvody-szco" } },
      { id: "t6_5", title: "Nezdaniteľné časti a bonusy", desc: "Nezdaniteľná časť, daňový bonus na deti, III. pilier.", processing_time: "Okamžite (v rámci DP)", article: { title: "Nezdaniteľná časť 2026", url: "https://www.podnikajte.sk/dan-z-prijmov/nezdanitelna-cast-zakladu-dane" } }
    ]
  };
}

// ─── M7–M11 (menšia zmena – pridanie processing_time a article) ───
function poistenie(lf) {
  return {
    id: "M7", title: "🛡️ Poistenie firmy a majetku", ui_style: "normal", partnerId: "P5",
    article: { title: "Poistenie zodpovednosti za škodu pre firmy", url: "https://www.podnikajte.sk/financny-manazment/poistenie-zodpovednosti-za-skodu-pre-firmy" },
    ai: { source: "Poistenie podnikania 2026", dolezite: "Najpodceňovanejšie je poistenie prerušenia prevádzky a zodpovednosti za škodu.", terminy: "Nemá zákonný termín, ale škoda môže prísť kedykoľvek.", naklady: "Zodpovednosť od ~10 €/mesiac." },
    extended_info: {
      short_description: "Poistenie zodpovednosti, majetku a prerušenia prevádzky chráni firmu pred nečakanými stratami.",
      detailed_guide: "**Čo to je:** Balík poistení kryjúci škody klientom, zničenie majetku a výpadok príjmu.\n\n**Prečo je to dôležité:** Jedna chyba môže zlikvidovať roky práce.\n\n**Ako to vybaviť:**\n- Analyzujte hlavné riziká\n- Poistite zodpovednosť za škodu\n- Zvážte poistenie majetku a prerušenia prevádzky\n- Uložte zmluvy do Trezoru",
      estimated_time: "2–5 pracovných dní",
      financial_cost: "Zodpovednosť od 10 €/mesiac",
      useful_links: [{ label: "Podnikajte.sk – Poistenie firmy", url: "https://www.podnikajte.sk/financny-manazment/poistenie-zodpovednosti-za-skodu-pre-firmy" }]
    },
    tasks: [
      { id: "t7_1", title: "Analýza rizík v odvetví", desc: "Čo vás môže najviac ohroziť.", processing_time: "Okamžite (kvíz v kalkulačke)", article: { title: "Riziká podnikania podľa odvetvia", url: "https://www.podnikajte.sk/financny-manazment/poistenie-zodpovednosti-za-skodu-pre-firmy" } },
      { id: "t7_2", title: "Poistenie zodpovednosti za škodu", desc: "Kryje škody tretím stranám.", processing_time: "1–3 dni (schválenie poisťovňou)", article: { title: "Poistenie zodpovednosti", url: "https://www.podnikajte.sk/financny-manazment/poistenie-zodpovednosti-za-skodu-pre-firmy" } },
      { id: "t7_3", title: "Poistenie majetku a prevádzky", desc: "Budova, vybavenie, zásoby + prerušenie.", processing_time: "1–3 dni", article: { title: "Poistenie majetku firmy", url: "https://www.podnikajte.sk/financny-manazment/poistenie-zodpovednosti-za-skodu-pre-firmy" } },
      { id: "t7_4", title: "Poistenie kľúčových osôb", desc: "Výpadok kľúčového človeka je existenčné riziko.", processing_time: "1–5 dní", article: { title: "Poistenie kľúčových osôb", url: "https://www.podnikajte.sk/financny-manazment/poistenie-zodpovednosti-za-skodu-pre-firmy" } },
      { id: "t7_5", title: "Uloženie poistiek do Trezoru", desc: "Upozornenie 30 dní pred koncom platnosti.", processing_time: "Okamžite", article: { title: "Správa firemných dokumentov", url: "https://www.podnikajte.sk/financny-manazment/poistenie-zodpovednosti-za-skodu-pre-firmy" } }
    ]
  };
}

function zmluvy(lf) {
  const korp = jeKorp(lf);
  const tasks = [
    { id: "t8_1", title: "Štandardizácia VOP", desc: "Jednotné podmienky pre klientov.", processing_time: "3–5 dní (príprava s právnikom)", article: { title: "Všeobecné obchodné podmienky", url: "https://www.podnikajte.sk/obchodne-pravo/pravidla-obchodne-zmluvy" } },
    { id: "t8_2", title: "Zmluvy s dodávateľmi a klientmi", desc: "Splatnosť, sankcie, vlastníctvo výsledkov.", processing_time: "1–2 týždne (príprava)", article: { title: "Obchodné zmluvy", url: "https://www.podnikajte.sk/obchodne-pravo/pravidla-obchodne-zmluvy" } },
    { id: "t8_3", title: "GDPR a ochrana osobných údajov", desc: "Zo zákona povinné.", processing_time: "1–2 týždne (implementácia)", article: { title: "GDPR pre podnikateľov", url: "https://www.podnikajte.sk/zakony-a-legislativa/gdpr-ochrana-osobnych-udajov" } },
    { id: "t8_4", title: "Ochrana duševného vlastníctva", desc: "Ochranná známka, autorské práva.", processing_time: "3–6 mesiacov (registrácia OZ)", article: { title: "Ochranná známka", url: "https://www.podnikajte.sk/obchodne-pravo/ochranna-znamka" } },
    { id: "t8_5", title: "Ročná revízia kľúčových zmlúv", desc: "Overte platnosť a podmienky.", processing_time: "1–2 dni (revízia)", article: { title: "Revízia zmlúv", url: "https://www.podnikajte.sk/obchodne-pravo/pravidla-obchodne-zmluvy" } }
  ];
  if (korp) tasks.push({ id: "t8_6", title: "Akcionárska zmluva a corporate governance", desc: "Hlasovanie, exit scenáre, drag/tag-along.", processing_time: "2–4 týždne (právna príprava)", article: { title: "Akcionárska zmluva", url: "https://www.podnikajte.sk/obchodne-pravo/pravidla-obchodne-zmluvy" } });
  return {
    id: "M8", title: "⚖️ Zmluvy a právna ochrana", ui_style: "normal", partnerId: "P3",
    article: { title: "Pravidlá pri spisovaní obchodných zmlúv", url: "https://www.podnikajte.sk/obchodne-pravo/pravidla-obchodne-zmluvy" },
    ai: { source: "Zmluvy 2026", dolezite: "Dobrá zmluva rieši splatnosť, sankcie, vlastníctvo výsledkov a ukončenie. GDPR je povinnosť.", terminy: "Obchodné záväzky sa premlčujú za 4 roky.", naklady: "Zmluva od právnika 50–200 €, paušál od ~100 €/mesiac." },
    extended_info: {
      short_description: `Právna ochrana zahŕňa VOP, zmluvy, GDPR${korp ? ' a akcionársku zmluvu' : ''}.`,
      detailed_guide: `**Čo to je:** Právny rámec chrániaci podnikanie.\n\n**Prečo je to dôležité:** Bez kvalitných zmlúv nemáte páky pri sporoch. GDPR porušenie = až 4 % obratu.\n\n**Ako to vybaviť:**\n- Pripravte VOP\n- Revízujte zmluvy raz ročne\n- Implementujte GDPR${korp ? '\n- Akcionárska zmluva s exit scenármi' : ''}`,
      estimated_time: "1–2 týždne",
      financial_cost: "50–200 € za zmluvu, paušál od 100 €/mesiac",
      useful_links: [{ label: "Podnikajte.sk – Obchodné zmluvy", url: "https://www.podnikajte.sk/obchodne-pravo/pravidla-obchodne-zmluvy" }]
    },
    tasks
  };
}

function rast(lf) {
  const korp = jeKorp(lf);
  return {
    id: "M9", title: "📈 Rast, škálovanie a dotácie", ui_style: "low", partnerId: "P2",
    article: { title: "Možnosti financovania firiem v roku 2026", url: "https://www.podnikajte.sk/podpora-podnikania/moznosti-rozvoja-financovania-firiem-2026-ktore-programy-granty-pomozu-rast" },
    ai: { source: "Rast a dotácie 2026", dolezite: "Pri raste sledujte cashflow. Dotácie z eurofondov môžu financovať digitalizáciu.", terminy: "Výzvy na dotácie majú pevné termíny.", naklady: "Spolufinancovanie 10–50 %. Poradca 5–15 % z dotácie." },
    extended_info: {
      short_description: `Plánovanie rastu, dotácie a ${korp ? 'príprava na investičné kolo' : 'optimalizácia procesov'}.`,
      detailed_guide: `**Čo to je:** Strategický rast firmy.\n\n**Prečo je to dôležité:** Rast bez riadenia cashflow = najčastejšia príčina krachu.\n\n**Ako to vybaviť:**\n- Finančný plán na 12–24 mesiacov\n- Zmapujte eurofondy, Plán obnovy, SBA\n- Automatizujte pred prijímaním ľudí${korp ? '\n- Pripravte sa na Series A / exit' : '\n- Zvážte zmenu právnej formy'}`,
      estimated_time: "Priebežne",
      financial_cost: "Spolufinancovanie 10–50 %",
      useful_links: [
        { label: "Podnikajte.sk – Dotácie a rast", url: "https://www.podnikajte.sk/podpora-podnikania/moznosti-rozvoja-financovania-firiem-2026-ktore-programy-granty-pomozu-rast" },
        { label: "SBA – Slovak Business Agency", url: "https://www.sbagency.sk" }
      ]
    },
    tasks: [
      { id: "t9_1", title: "Finančný plán a cashflow projekcia", desc: "Projekcia na 12–24 mesiacov.", processing_time: "3–5 dní (príprava)", article: { title: "Finančné plánovanie firmy", url: "https://www.podnikajte.sk/podpora-podnikania/moznosti-rozvoja-financovania-firiem-2026-ktore-programy-granty-pomozu-rast" } },
      { id: "t9_2", title: "Mapovanie výziev a dotácií", desc: "Eurofondy, Plán obnovy, regionálne granty, SBA.", processing_time: "Priebežne (sledovanie výziev)", article: { title: "Dotácie pre podnikateľov 2026", url: "https://www.podnikajte.sk/podpora-podnikania/moznosti-rozvoja-financovania-firiem-2026-ktore-programy-granty-pomozu-rast" } },
      { id: "t9_3", title: "Posúdenie externého kapitálu", desc: korp ? "Angel investor, VC fond alebo strategický partner." : "Úver, reinvestícia alebo tichý spoločník.", processing_time: "2–4 týždne (analýza)", article: { title: "Externé financovanie", url: "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" } },
      { id: "t9_4", title: "Optimalizácia a automatizácia", desc: "Pred prijatím ľudí zvážte automatizáciu.", processing_time: "Priebežne", article: { title: "Automatizácia vo firme", url: "https://www.podnikajte.sk/podpora-podnikania/moznosti-rozvoja-financovania-firiem-2026-ktore-programy-granty-pomozu-rast" } },
      { id: "t9_5", title: korp ? "Príprava na investičné kolo / exit" : "Zváženie zmeny právnej formy", desc: korp ? "Clean cap table, audit-ready financie." : "S.r.o. môže byť daňovo výhodnejšia.", processing_time: korp ? "2–6 mesiacov" : "1–2 mesiace (konzultácia)", article: { title: korp ? "Príprava na investora" : "Zmena právnej formy", url: korp ? "https://www.podnikajte.sk/financny-manazment/podnikatelske-uvery" : "https://www.podnikajte.sk/sro/zalozenie-vznik-sro-v-2026" } }
    ]
  };
}

function ukoncenie(lf) {
  const po = jePO(lf);
  return {
    id: "M10", title: po ? "🔚 Likvidácia spoločnosti" : "🔚 Prerušenie alebo ukončenie živnosti", ui_style: "low", partnerId: "P2",
    article: { title: po ? "Likvidácia spoločnosti krok za krokom" : "Prerušenie živnosti v roku 2026", url: po ? "https://www.podnikajte.sk/ukoncenie-podnikania/likvidacia-spolocnosti" : "https://www.podnikajte.sk/ukoncenie-podnikania/prerusenie-zivnosti-2026-online" },
    ai: { source: po ? "Likvidácia 2026" : "Ukončenie živnosti 2026", dolezite: po ? "Likvidácia je formálne náročná – 6+ mesiacov." : "Prerušenie pozastaví odvody. Zrušenie je definitívne.", terminy: po ? "Min. 6 mesiacov." : "Do 8 dní odhláste z poisťovní.", naklady: po ? "Stovky až tisíce €." : "Elektronicky 0 €." },
    extended_info: {
      short_description: po ? `Likvidácia ${m(lf).label} je viacmesačný proces.` : "Prerušenie je dočasné a lacné. Zrušenie je definitívne.",
      detailed_guide: po
        ? "**Čo to je:** Formálne ukončenie existencie PO.\n\n**Prečo je to dôležité:** Nefunkčná firma stále generuje povinnosti.\n\n**Ako to vybaviť:**\n- Rozhodnutie spoločníkov, vymenovanie likvidátora\n- Zverejnenie v Obchodnom vestníku (3 mesiace)\n- Vysporiadanie záväzkov\n- Návrh na výmaz z ORSR"
        : "**Čo to je:** Prerušenie = dočasné pozastavenie. Zrušenie = koniec.\n\n**Prečo je to dôležité:** Pri prerušení neplatíte odvody.\n\n**Ako to vybaviť:**\n- Prerušenie: 6 mes – 3 roky\n- Oznámte živnostenskému úradu cez slovensko.sk\n- Do 8 dní sa odhláste z SP a ZP\n- Podajte posledné DP",
      estimated_time: po ? "6–12 mesiacov" : "3–5 pracovných dní",
      financial_cost: po ? "Stovky až tisíce €" : "Elektronicky 0 €",
      useful_links: [{ label: po ? "Podnikajte.sk – Likvidácia" : "Podnikajte.sk – Prerušenie živnosti", url: po ? "https://www.podnikajte.sk/ukoncenie-podnikania/likvidacia-spolocnosti" : "https://www.podnikajte.sk/ukoncenie-podnikania/prerusenie-zivnosti-2026-online" }]
    },
    tasks: po ? [
      { id: "t10_1", title: "Rozhodnutie o vstupe do likvidácie", desc: "Rozhodnutie spoločníkov, vymenovanie likvidátora.", processing_time: "1 deň (rozhodnutie VZ)", article: { title: "Likvidácia spoločnosti", url: "https://www.podnikajte.sk/ukoncenie-podnikania/likvidacia-spolocnosti" } },
      { id: "t10_2", title: "Zverejnenie v Obchodnom vestníku", desc: "Min. 3 mesiace čakacia doba.", processing_time: "3 mesiace (zákonná lehota)", article: { title: "Obchodný vestník", url: "https://www.podnikajte.sk/ukoncenie-podnikania/likvidacia-spolocnosti" } },
      { id: "t10_3", title: "Vysporiadanie záväzkov", desc: "Uhraďte dane, odvody a záväzky.", processing_time: "1–3 mesiace", article: { title: "Vysporiadanie záväzkov", url: "https://www.podnikajte.sk/ukoncenie-podnikania/likvidacia-spolocnosti" } },
      { id: "t10_4", title: "Likvidačná súvaha", desc: "Zostatok sa rozdelí medzi spoločníkov.", processing_time: "1–2 týždne (účtovník)", article: { title: "Likvidačná súvaha", url: "https://www.podnikajte.sk/ukoncenie-podnikania/likvidacia-spolocnosti" } },
      { id: "t10_5", title: "Návrh na výmaz z ORSR", desc: "Spoločnosť zanikne dňom výmazu.", processing_time: "2 pracovné dni (registrový súd)", article: { title: "Výmaz z ORSR", url: "https://www.podnikajte.sk/ukoncenie-podnikania/likvidacia-spolocnosti" } }
    ] : [
      { id: "t10_1", title: "Rozhodnutie: prerušiť vs. zrušiť", desc: "Prerušenie (6 mes – 3 roky). Zrušenie je definitívne.", processing_time: "Okamžite (vaše rozhodnutie)", article: { title: "Prerušenie živnosti", url: "https://www.podnikajte.sk/ukoncenie-podnikania/prerusenie-zivnosti-2026-online" } },
      { id: "t10_2", title: "Oznámenie živnostenskému úradu", desc: "Elektronicky cez slovensko.sk – zadarmo.", processing_time: "3 pracovné dni (spracovanie)", article: { title: "Prerušenie živnosti online", url: "https://www.podnikajte.sk/ukoncenie-podnikania/prerusenie-zivnosti-2026-online" } },
      { id: "t10_3", title: "Odhlásenie z SP a ZP", desc: "Do 8 dní.", processing_time: "Do 8 dní (zákonný termín)", article: { title: "Odhlásenie z poisťovní", url: "https://www.podnikajte.sk/ukoncenie-podnikania/prerusenie-zivnosti-2026-online" } },
      { id: "t10_4", title: "Vysporiadanie záväzkov", desc: "Doplatte dane, odvody, pohľadávky.", processing_time: "1–2 týždne", article: { title: "Záväzky pri ukončení", url: "https://www.podnikajte.sk/ukoncenie-podnikania/prerusenie-zivnosti-2026-online" } },
      { id: "t10_5", title: "Archivácia účtovných dokladov", desc: "Uchovávajte 10 rokov.", processing_time: "Okamžite (uloženie)", article: { title: "Archivácia dokladov", url: "https://www.podnikajte.sk/ukoncenie-podnikania/prerusenie-zivnosti-2026-online" } }
    ]
  };
}

function akcie(lf) {
  return {
    id: "M11", title: "📋 Akcie a register partnerov", ui_style: "low", partnerId: "P3",
    article: { title: "Register partnerov verejného sektora", url: "https://www.podnikajte.sk/obchodne-pravo/register-partnerov-verejneho-sektora" },
    ai: { source: "Akcie a RPVS 2026", dolezite: `${m(lf).label} musí evidovať akcie a akcionárov.`, terminy: "RPVS zápis pred podaním ponuky vo verejnom obstarávaní.", naklady: "RPVS zápis 200–500 €." },
    extended_info: {
      short_description: "Evidencia akcionárov, emisie akcií a registrácia v RPVS.",
      detailed_guide: `**Čo to je:** Správa akcií a transparencia voči štátu.\n\n**Prečo je to dôležité:** ${lf === 'jsa' ? 'Správna evidencia je kľúčová pre investorov.' : 'A.s. musí viesť zoznam akcionárov.'}\n\n**Ako to vybaviť:**\n- Veďte zoznam akcionárov\n- Pri emisii dodržte stanovy\n- RPVS zápis cez oprávnenú osobu`,
      estimated_time: "3–10 pracovných dní",
      financial_cost: "RPVS zápis 200–500 €",
      useful_links: [
        { label: "RPVS", url: "https://rpvs.gov.sk" },
        { label: "Podnikajte.sk – RPVS", url: "https://www.podnikajte.sk/obchodne-pravo/register-partnerov-verejneho-sektora" }
      ]
    },
    tasks: [
      { id: "t11_1", title: "Vedenie zoznamu akcionárov", desc: "Meno, počet akcií, druh, menovitá hodnota.", processing_time: "Priebežne", article: { title: "Zoznam akcionárov", url: lf === 'jsa' ? "https://www.podnikajte.sk/obchodne-pravo/jednoducha-spolocnost-na-akcie" : "https://www.podnikajte.sk/obchodne-pravo/zalozenie-akciovej-spolocnosti" } },
      { id: "t11_2", title: "Definovanie druhov akcií", desc: "Kmeňové, prioritné, zamestnanecké.", processing_time: "1–2 dni (stanovy)", article: { title: "Druhy akcií", url: lf === 'jsa' ? "https://www.podnikajte.sk/obchodne-pravo/jednoducha-spolocnost-na-akcie" : "https://www.podnikajte.sk/obchodne-pravo/zalozenie-akciovej-spolocnosti" } },
      { id: "t11_3", title: "Postup pri emisii nových akcií", desc: "Rozhodnutie VZ, predkupné právo, zápis do ORSR.", processing_time: "2–4 týždne", article: { title: "Emisie akcií", url: lf === 'jsa' ? "https://www.podnikajte.sk/obchodne-pravo/jednoducha-spolocnost-na-akcie" : "https://www.podnikajte.sk/obchodne-pravo/zalozenie-akciovej-spolocnosti" } },
      { id: "t11_4", title: "Posúdenie povinnosti RPVS", desc: "Povinné pri verejných zákazkách a dotáciách.", processing_time: "Okamžite (posúdenie)", article: { title: "Kedy je RPVS povinný", url: "https://www.podnikajte.sk/obchodne-pravo/register-partnerov-verejneho-sektora" } },
      { id: "t11_5", title: "Zápis do RPVS", desc: "Oprávnená osoba overí konečných užívateľov výhod.", processing_time: "5–10 pracovných dní", article: { title: "Zápis do RPVS", url: "https://www.podnikajte.sk/obchodne-pravo/register-partnerov-verejneho-sektora" } }
    ]
  };
}

// ═══════════════════════════════════════
// HLAVNÉ EXPORTY
// ═══════════════════════════════════════

function ziskajMomentyPreProfil(legalForm) {
  const lf = legalForm || 'szco';
  const base = [zakladanie(lf), ucet(lf), financovanie(lf), zamestnanec(lf), uctovnik(lf), dane(lf), poistenie(lf), zmluvy(lf), rast(lf), ukoncenie(lf)];
  if (jeKorp(lf)) base.splice(3, 0, akcie(lf));
  return base;
}

function najdiMoment(legalForm, momentId) {
  return ziskajMomentyPreProfil(legalForm).find(m => m.id === momentId);
}

function partnerJustification(momentId, profil) {
  const trzby = profil.trzby ? Number(profil.trzby) : null;
  const lf = profil.legalForm || 'szco';
  switch (momentId) {
    case "M3":
      if (lf === 'szco') return trzby ? `Pri tržbách ${trzby.toLocaleString('sk-SK')} € akceptujú 60 % tržieb ako príjem.` : "Akceptujú 60 % tržieb ako príjem pri paušálnych výdavkoch.";
      return `Špecializujú sa na financovanie pre ${m(lf).label}.`;
    case "M2": return `Pre ${m(lf).label} ponúkajú vedenie účtu prvý rok zadarmo.`;
    case "M5": case "M6": return `Špecializujú sa na ${m(lf).label} v štádiu „${profil.stage}" a optimalizujú dane.`;
    case "M4": return "Prevezmú celú mzdovú agendu vrátane PZS a BOZP.";
    case "M7": return "Riešia poistenie šité na vaše odvetvie.";
    case "M8": case "M11": return `Pripravia VOP, GDPR a zmluvy pre ${m(lf).label}.`;
    default: return `Overený partner pre ${m(lf).label} v štádiu „${profil.stage}".`;
  }
}

function ziskajPripomienky() {
  return [];
}

module.exports = { ziskajMomentyPreProfil, najdiMoment, partnerJustification, ziskajPripomienky, LF_META };
