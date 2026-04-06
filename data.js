// ═══════════════════════════════════════════════════════
// SinnerTracker — Dati centralizzati
// Unica fonte di verita per tutte le tab.
// Quando colleghiamo il backend, questo file diventa
// una fetch() verso /api/* invece di un oggetto statico.
// ═══════════════════════════════════════════════════════

const DATA = {
  lastUpdated: "2026-04-06T12:00:00Z",

  sinner: {
    name: "J. Sinner",
    flag: "\u{1F1EE}\u{1F1F9}",
    rank: 2,
    points: 12400,
    wl: "17\u20131",
    titles2026: 2,
    setsM1000: 34,
    m1000Career: 7,
    bigTitles: 13,
    winPctM1000: "77.9%",
    prizeMoney: "$51.2M",
  },

  alcaraz: {
    name: "C. Alcaraz",
    flag: "\u{1F1EA}\u{1F1F8}",
    rank: 1,
    points: 13590,
  },

  gap: -1190,
  virtualGap: -190,

  ranking: [
    { rank: 1, name: "C. Alcaraz", flag: "\u{1F1EA}\u{1F1F8}", points: 13590, status: "OUT Miami R3 \u00B7 difende ~1.000 pts a Monte Carlo", highlight: false },
    { rank: 2, name: "J. Sinner", flag: "\u{1F1EE}\u{1F1F9}", points: 12400, status: "\u{1F3C6} Campione Miami 2026 \u00B7 Sunshine Double", highlight: true },
    { rank: 3, name: "A. Zverev", flag: "\u{1F1E9}\u{1F1EA}", points: 8015, status: "SF Miami", highlight: false },
    { rank: 4, name: "T. Fritz", flag: "\u{1F1FA}\u{1F1F8}", points: 5890, status: "OUT Miami R4", highlight: false },
    { rank: 5, name: "D. Medvedev", flag: "\u{1F1F7}\u{1F1FA}", points: 5700, status: "OUT Miami R3", highlight: false },
  ],

  currentTournament: {
    name: "Monte Carlo Masters 2026",
    dates: "5\u201312 Apr 2026",
    surface: "Clay",
    location: "Roquebrune-Cap-Martin",
    category: "Masters 1000",
    sinnerDefends: 0,
    alcarazDefends: 1000,
    sinnerSeed: 2,
    alcarazSeed: 1,
    sinnerNextMatch: {
      round: "R2",
      opponent: "\u{1F1EB}\u{1F1F7} U. Humbert",
      opponentRank: 18,
      scheduled: "Mar 7 Apr",
      h2h: "Sinner conduce 3\u20130",
    },
    sinnerPath: [
      { round: "R2", opponent: "U. Humbert \u{1F1EB}\u{1F1F7}", seed: "14" },
      { round: "R3", opponent: "F. Cerundolo \u{1F1E6}\u{1F1F7} / Qualifier", seed: "" },
      { round: "QF", opponent: "F. Auger-Aliassime \u{1F1E8}\u{1F1E6}", seed: "8" },
      { round: "SF", opponent: "A. Zverev \u{1F1E9}\u{1F1EA}", seed: "3" },
      { round: "F", opponent: "C. Alcaraz \u{1F1EA}\u{1F1F8}", seed: "1" },
    ],
    r1Results: [
      { winner: "C. Norrie \u{1F1EC}\u{1F1E7}", loser: "M. Kecmanovic \u{1F1F7}\u{1F1F8}", score: "6\u20132 4\u20136 7\u20136(0)" },
      { winner: "G. Monfils \u{1F1EB}\u{1F1F7}", loser: "T. Griekspoor \u{1F1F3}\u{1F1F1}", score: "6\u20137(7) 6\u20131 6\u20134" },
      { winner: "U. Humbert \u{1F1EB}\u{1F1F7}", loser: "M. Kouame \u{1F1EB}\u{1F1F7}", score: "6\u20133 7\u20135" },
      { winner: "A. Tabilo \u{1F1E8}\u{1F1F1}", loser: "M. Fucsovics \u{1F1ED}\u{1F1FA}", score: "6\u20134 6\u20133" },
    ],
  },

  nextTournament: null,

  miamiRecap: {
    title: "Miami Open 2026",
    matches: [
      { round: "R2", opponent: "\u{1F1E7}\u{1F1E6} D. D\u017Eumhur", seed: "Qual.", score: "6\u20133  6\u20133", note: "", won: true },
      { round: "R3", opponent: "\u{1F1EB}\u{1F1F7} C. Moutet", seed: "30", score: "6\u20131  6\u20134", note: "26\u00B0 set di fila \u2014 record ATP", won: true },
      { round: "R4", opponent: "\u{1F1FA}\u{1F1F8} A. Michelsen", seed: "40", score: "7\u20135  7\u20136", note: "Rimonta da 2\u20135 nel 2\u00B0 set", won: true },
      { round: "QF", opponent: "\u{1F1FA}\u{1F1F8} F. Tiafoe", seed: "19", score: "6\u20132  6\u20132", note: "Dominato \u00B7 14 ace \u00B7 33 vincenti", won: true },
      { round: "SF", opponent: "\u{1F1E9}\u{1F1EA} A. Zverev", seed: "3", score: "6\u20133  7\u20136", note: "Ronaldo il Fenomeno in tribuna", won: true },
      { round: "FINALE", opponent: "\u{1F1E8}\u{1F1FF} J. Lehecka", seed: "22", score: "6\u20134  6\u20134", note: "Due stop pioggia \u00B7 34\u00B0 set di fila \u2014 record", won: true, isFinal: true },
    ],
  },

  recentForm: [
    { result: "W", detail: "Finale Lehecka 6-4 6-4 \u{1F3C6}" },
    { result: "W", detail: "SF Zverev 6-3 7-6(4)" },
    { result: "W", detail: "QF Tiafoe 6-2 6-2" },
    { result: "W", detail: "R4 Michelsen 7-5 7-6" },
    { result: "W", detail: "R3 Moutet 6-1 6-4" },
    { result: "W", detail: "IW Finale Medvedev 7-6 7-6 \u{1F3C6}" },
    { result: "W", detail: "IW SF Zverev 6-2 6-4" },
    { result: "L", detail: "AO SF Alcaraz" },
  ],

  news: [
    {
      type: "orange", icon: "\u{1F3BE}",
      tag: "Live", tagDate: "5\u20136 Apr",
      headline: "Monte Carlo al via \u2014 Sinner pesca Humbert al R2, possibile finale con Alcaraz",
      desc: "Sorteggio completato. Sinner [2] debutta marted\u00EC vs Humbert (H2H 3-0). Percorso: Cerundolo (R3), Auger-Aliassime (QF), Zverev (SF). Alcaraz [1] dall\u2019altra parte. Sinner ha anche vinto il doppio con Bergs al primo turno.",
      source: "ATP Tour \u00B7 Puntodebreak \u00B7 Sky Sport",
      sourceDate: "5\u20136 Apr",
      url: "https://www.atptour.com/en/scores/current/monte-carlo/410/daily-schedule",
    },
    {
      type: "green", icon: "\u{1F3C6}",
      tag: "Chiuso", tagDate: "30 Mar",
      headline: "Sunshine Double completato \u2014 6-4 6-4 su Lehecka, storia scritta",
      desc: "Primo uomo a vincere Indian Wells e Miami nella stessa stagione senza perdere un set. 34 set consecutivi ai M1000. Dedica: \u201CBez, Kimi, Italia\u201D \u{1F1EE}\u{1F1F9}",
      source: "Sky Sport \u00B7 Olympics.com \u00B7 Il Fatto Quotidiano",
      sourceDate: "30 Mar",
      url: "https://sport.sky.it/tennis",
    },
    {
      type: "orange", icon: "\u{1F3AF}",
      tag: "In corso", tagDate: "5\u201312 Apr",
      headline: "Monte Carlo: gap virtuale a inizio torneo solo 190 pts \u2014 N.1 a portata",
      desc: "Alcaraz difende 1.000 pts, Sinner zero. Se Sinner vince: sale a 13.400 pts, Alcaraz non pu\u00F2 raggiungerlo neppure in finale. Vittoria = ritorno automatico al N.1.",
      source: "Eurosport \u00B7 Sport&Finanza \u00B7 OASport",
      sourceDate: "30 Mar",
      url: "https://www.eurosport.it/tennis/",
    },
    {
      type: "gray", icon: "\u{1F92B}",
      tag: "Dichiarazioni", tagDate: "30 Mar",
      headline: "Sinner: \u201CMontecarlo sar\u00E0 di preparazione\u201D \u2014 ma gli analisti non ci credono",
      desc: "Ma secondo Ambesi (Eurosport) \u201CSinner non lascer\u00E0 nulla di intentato per tornare N.1.\u201D Si \u00E8 iscritto anche al doppio con Zizou Bergs per accumulare ore sulla terra.",
      source: "SportMediaset \u00B7 OASport \u00B7 Sport&Finanza",
      sourceDate: "30\u201331 Mar",
      url: "https://www.oasport.it/tennis/",
    },
    {
      type: "green", icon: "\u{1F4CA}",
      tag: "Stagione 2026", tagDate: "",
      headline: "17-1, 2 titoli M1000, 34 set di fila: il marzo pi\u00F9 dominante della storia recente",
      desc: "12 partite, 12 vittorie, 0 set persi. 7 Masters 1000 in carriera, tutti su cemento. La terra \u00E8 la prossima sfida.",
      source: "Olympics.com \u00B7 Il Fatto Quotidiano",
      sourceDate: "30 Mar",
      url: "https://olympics.com/it/notizie/tennis",
    },
    {
      type: "gray", icon: "\u{1F4C5}",
      tag: "Clay Swing", tagDate: "",
      headline: "Il programma: Monte Carlo \u2192 Madrid \u2192 Roma \u2192 Roland Garros",
      desc: "Alcaraz difende punti pesanti ovunque. Sinner nel 2025 era assente e non difende nulla fino a Parigi. Il calendario \u00E8 strutturalmente favorevole.",
      source: "OASport \u00B7 Eurosport",
      sourceDate: "30\u201331 Mar",
      url: "https://www.oasport.it/tennis/",
    },
    {
      type: "red", icon: "\u{1F605}",
      tag: "Contrasto del mese", tagDate: "",
      headline: "Alcaraz a padel, Sinner nella storia \u2014 gap ora 1.190 pts",
      desc: "Alcaraz eliminato al R3 da Korda, poi a giocare a padel. Sinner: 12 vittorie, 0 set persi, Sunshine Double. Gap sceso da 2.150 a 1.190 pts.",
      source: "Sky Sport \u00B7 Equipe",
      sourceDate: "22\u201330 Mar",
      url: "https://sport.sky.it/tennis",
    },
  ],

  calendario: {
    giocati: [
      { dates: "Gen 12\u201326", name: "Australian Open", surface: "Hard \u00B7 Melbourne \u00B7 Grand Slam", pts: "+720", status: "SF", statusType: "gray" },
      { dates: "Mar 5\u201316", name: "Indian Wells (BNP Paribas Open)", surface: "Hard \u00B7 California \u00B7 Masters 1000", pts: "+1000", status: "\u{1F3C6} Vinto", statusType: "green" },
      { dates: "Mar 17\u201330", name: "Miami Open", surface: "Hard \u00B7 Florida \u00B7 Masters 1000", pts: "+1000", status: "\u{1F3C6} Vinto", statusType: "green" },
    ],
    claySwinG: [
      { dates: "Apr 5\u201312", name: "Monte Carlo Masters", surface: "Terra \u00B7 Monaco \u00B7 Masters 1000", pts: "fino 1000", status: "\u{1F534} In corso", statusType: "orange" },
      { dates: "Apr 28\u2013Mag 4", name: "Mutua Madrid Open", surface: "Terra \u00B7 Spagna \u00B7 Masters 1000", pts: "fino 1000", status: "Upcoming", statusType: "gray" },
      { dates: "Mag 7\u201318", name: "Internazionali BNL d\u2019Italia \u{1F1EE}\u{1F1F9}", surface: "Terra \u00B7 Roma \u00B7 Masters 1000", pts: "fino 1000", status: "Upcoming", statusType: "gray" },
      { dates: "Mag 25\u2013Giu 8", name: "Roland Garros", surface: "Terra \u00B7 Parigi \u00B7 Grand Slam", pts: "fino 2000", status: "Upcoming", statusType: "gray" },
    ],
    secondoSemestre: [
      { dates: "Giu 23\u2013Lug 6", name: "Wimbledon", surface: "Erba \u00B7 Londra \u00B7 Grand Slam", pts: "fino 2000", status: "Upcoming", statusType: "gray" },
      { dates: "Ago 18\u2013Set 7", name: "US Open", surface: "Hard \u00B7 New York \u00B7 Grand Slam", pts: "fino 2000", status: "Upcoming", statusType: "gray" },
      { dates: "Nov 2\u20139", name: "Rolex Paris Masters", surface: "Hard \u00B7 Parigi \u00B7 M1000 \u00B7 Vinto nel 2025 \u{1F3C6}", pts: "\u20131000", status: "Da difendere", statusType: "red" },
      { dates: "Nov 9\u201316", name: "Nitto ATP Finals \u{1F1EE}\u{1F1F9}", surface: "Hard \u00B7 Torino \u00B7 ATP Finals", pts: "fino 1500", status: "Upcoming", statusType: "gray" },
    ],
  },

  scenari: [
    { type: "best", tag: "Scenario ottimista", date: "Fine aprile", desc: "Sinner vince Monte Carlo. Sale a 13.400 \u2014 Alcaraz non pu\u00F2 raggiungerlo neppure in finale (max 13.240). N.1 automatico.", prob: "~40%" },
    { type: "mid", tag: "Scenario probabile", date: "Giugno 2026", desc: "Sinner vince Madrid o Roma. Sorpasso alla vigilia di Roland Garros.", prob: "~45%" },
    { type: "worst", tag: "Scenario prudente", date: "Estate\u2013Autunno", desc: "Alcaraz domina la terra battuta. Sinner punta a sorpassarlo a US Open o alle ATP Finals di Torino.", prob: "~15%" },
  ],

  previsione: [
    { torneo: "Miami", sinnerMax: "+1000", alcarazDifende: "0", barWidth: "100%", barColor: "#FF7A00", done: true },
    { torneo: "Monte Carlo", sinnerMax: "+1000", alcarazDifende: "\u20131000", barWidth: "80%", barColor: "#FF7A00" },
    { torneo: "Madrid", sinnerMax: "+1000", alcarazDifende: "\u2013600", barWidth: "70%", barColor: "#FF7A00" },
    { torneo: "Roma \u{1F1EE}\u{1F1F9}", sinnerMax: "+1000", alcarazDifende: "~0", barWidth: "55%", barColor: "#FF7A00" },
    { torneo: "Roland Garros", sinnerMax: "+2000", alcarazDifende: "\u20132000", barWidth: "35%", barColor: "#C9A227" },
  ],

  quote: {
    nextMatch: null,
    speciali: [
      { market: "Sinner vince Monte Carlo 2026", sub: "Masters 1000 \u00B7 Clay \u00B7 Monaco", val1: "1.90", lbl1: "Sinner", val2: "2.20", lbl2: "Alcaraz", tag: "Favorito", tagType: "green" },
      { market: "Sinner N.1 ATP entro Roland Garros", sub: "Entro 8 giugno 2026", val1: "1.60", lbl1: "S\u00EC", val2: "2.30", lbl2: "No", tag: "Caldo", tagType: "orange" },
      { market: "Sinner vince Roland Garros 2026", sub: "Grand Slam \u00B7 Clay \u00B7 Parigi", val1: "4.50", lbl1: "Sinner", val2: "2.20", lbl2: "Alcaraz", tag: "Da seguire", tagType: "orange" },
      { market: "Sinner vince Wimbledon 2026", sub: "Grand Slam \u00B7 Erba \u00B7 Londra", val1: "3.00", lbl1: "Sinner", val2: "2.80", lbl2: "Alcaraz", tag: "Equilibrato", tagType: "orange" },
      { market: "Sinner vince US Open 2026", sub: "Grand Slam \u00B7 Hard \u00B7 New York", val1: "2.50", lbl1: "Sinner", val2: "3.20", lbl2: "Alcaraz", tag: "Favorito", tagType: "green" },
      { market: "Sinner chiude 2026 come N.1 ATP", sub: "Race di fine anno", val1: "1.85", lbl1: "Sinner", val2: "1.95", lbl2: "Alcaraz", tag: "50\u201350", tagType: "orange" },
    ],
  },
};
