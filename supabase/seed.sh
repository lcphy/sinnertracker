#!/bin/bash
# ═══════════════════════════════════════════════════════
# SinnerTracker — Seed database with current data
# Run once after schema.sql to populate initial data
# ═══════════════════════════════════════════════════════

API="https://czcszeoylcelgtduijqc.supabase.co/rest/v1"
KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3N6ZW95bGNlbGd0ZHVpanFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ5MzgzMCwiZXhwIjoyMDkxMDY5ODMwfQ.fRKT2Lu_gh8ziBiycmDAM5j38AaC5mP3VWJ8fgixHM0"
H1="apikey: $KEY"
H2="Authorization: Bearer $KEY"
H3="Content-Type: application/json"
H4="Prefer: return=minimal"

post() {
  local table=$1
  local data=$2
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API/$table" -H "$H1" -H "$H2" -H "$H3" -H "$H4" -d "$data")
  if [ "$STATUS" = "201" ]; then echo "  ✅ $table"; else echo "  ❌ $table (HTTP $STATUS)"; fi
}

echo "═══ Seeding SinnerTracker database ═══"
echo ""

# ── Meta ──
echo "Meta..."
post "meta" '[
  {"key":"gap","value":"-1190"},
  {"key":"virtual_gap","value":"-190"},
  {"key":"alcaraz_rank","value":"1"},
  {"key":"alcaraz_points","value":"13590"},
  {"key":"alcaraz_flag","value":"🇪🇸"},
  {"key":"last_updated","value":"2026-04-06T12:00:00Z"}
]'

# ── Sinner Profile ──
echo "Sinner Profile..."
post "sinner_profile" '{"id":1,"rank":2,"points":12400,"wl":"17–1","titles_2026":2,"sets_m1000":34,"m1000_career":7,"big_titles":13,"win_pct_m1000":"77.9%","prize_money":"$51.2M"}'

# ── Rankings ──
echo "Rankings..."
post "rankings" '[
  {"rank":1,"name":"C. Alcaraz","flag":"🇪🇸","points":13590,"status":"Campione MC 2025 · difende 1.000 pts","is_sinner":false},
  {"rank":2,"name":"J. Sinner","flag":"🇮🇹","points":12400,"status":"🏆 Campione Miami 2026 · Sunshine Double","is_sinner":true},
  {"rank":3,"name":"A. Zverev","flag":"🇩🇪","points":8015,"status":"SF Miami","is_sinner":false},
  {"rank":4,"name":"T. Fritz","flag":"🇺🇸","points":5890,"status":"OUT Miami R4","is_sinner":false},
  {"rank":5,"name":"D. Medvedev","flag":"🇷🇺","points":5700,"status":"OUT Miami R3","is_sinner":false}
]'

# ── Current Tournament ──
echo "Current Tournament..."
post "current_tournament" '{"id":1,"name":"Monte Carlo Masters 2026","dates":"5–12 Apr 2026","surface":"Clay","location":"Roquebrune-Cap-Martin","category":"Masters 1000","sinner_seed":2,"alcaraz_seed":1,"sinner_defends":0,"alcaraz_defends":1000,"is_active":true,"next_round":"R2","next_opponent":"🇫🇷 U. Humbert","next_opponent_rank":18,"next_scheduled":"Mar 7 Apr","next_h2h":"Sinner conduce 3–0"}'

# ── Draw Path ──
echo "Draw Path..."
post "draw_path" '[
  {"round":"R2","opponent":"U. Humbert 🇫🇷","seed":"14","sort_order":1},
  {"round":"R3","opponent":"F. Cerundolo 🇦🇷 / Qualifier","seed":"","sort_order":2},
  {"round":"QF","opponent":"F. Auger-Aliassime 🇨🇦","seed":"8","sort_order":3},
  {"round":"SF","opponent":"A. Zverev 🇩🇪","seed":"3","sort_order":4},
  {"round":"F","opponent":"C. Alcaraz 🇪🇸","seed":"1","sort_order":5}
]'

# ── Miami Recap Matches ──
echo "Miami Recap..."
post "matches" '[
  {"tournament":"Miami Open 2026","round":"R2","opponent":"🇧🇦 D. Džumhur","seed":"Qual.","score":"6–3  6–3","note":"","won":true,"is_final":false,"sort_order":1},
  {"tournament":"Miami Open 2026","round":"R3","opponent":"🇫🇷 C. Moutet","seed":"30","score":"6–1  6–4","note":"26° set di fila — record ATP","won":true,"is_final":false,"sort_order":2},
  {"tournament":"Miami Open 2026","round":"R4","opponent":"🇺🇸 A. Michelsen","seed":"40","score":"7–5  7–6","note":"Rimonta da 2–5 nel 2° set","won":true,"is_final":false,"sort_order":3},
  {"tournament":"Miami Open 2026","round":"QF","opponent":"🇺🇸 F. Tiafoe","seed":"19","score":"6–2  6–2","note":"Dominato · 14 ace · 33 vincenti","won":true,"is_final":false,"sort_order":4},
  {"tournament":"Miami Open 2026","round":"SF","opponent":"🇩🇪 A. Zverev","seed":"3","score":"6–3  7–6","note":"Ronaldo il Fenomeno in tribuna","won":true,"is_final":false,"sort_order":5},
  {"tournament":"Miami Open 2026","round":"FINALE","opponent":"🇨🇿 J. Lehecka","seed":"22","score":"6–4  6–4","note":"Due stop pioggia · 34° set di fila — record","won":true,"is_final":true,"sort_order":6}
]'

# ── Recent Form ──
echo "Recent Form..."
post "recent_form" '[
  {"result":"W","detail":"Finale Lehecka 6-4 6-4 🏆","sort_order":1},
  {"result":"W","detail":"SF Zverev 6-3 7-6(4)","sort_order":2},
  {"result":"W","detail":"QF Tiafoe 6-2 6-2","sort_order":3},
  {"result":"W","detail":"R4 Michelsen 7-5 7-6","sort_order":4},
  {"result":"W","detail":"R3 Moutet 6-1 6-4","sort_order":5},
  {"result":"W","detail":"IW Finale Medvedev 7-6 7-6 🏆","sort_order":6},
  {"result":"W","detail":"IW SF Zverev 6-2 6-4","sort_order":7},
  {"result":"L","detail":"AO SF Alcaraz","sort_order":8}
]'

# ── Tournaments ──
echo "Tournaments..."
post "tournaments" '[
  {"dates":"Gen 12–26","name":"Australian Open","surface":"Hard · Melbourne · Grand Slam","pts":"+720","status":"SF","status_type":"gray","section":"played","sort_order":1},
  {"dates":"Mar 5–16","name":"Indian Wells (BNP Paribas Open)","surface":"Hard · California · Masters 1000","pts":"+1000","status":"🏆 Vinto","status_type":"green","section":"played","sort_order":2},
  {"dates":"Mar 17–30","name":"Miami Open","surface":"Hard · Florida · Masters 1000","pts":"+1000","status":"🏆 Vinto","status_type":"green","section":"played","sort_order":3},
  {"dates":"Apr 5–12","name":"Monte Carlo Masters","surface":"Terra · Monaco · Masters 1000","pts":"fino 1000","status":"🔴 In corso","status_type":"orange","section":"clay","sort_order":4},
  {"dates":"Apr 28–Mag 4","name":"Mutua Madrid Open","surface":"Terra · Spagna · Masters 1000","pts":"fino 1000","status":"Upcoming","status_type":"gray","section":"clay","sort_order":5},
  {"dates":"Mag 7–18","name":"Internazionali BNL d\u2019Italia 🇮🇹","surface":"Terra · Roma · Masters 1000","pts":"fino 1000","status":"Upcoming","status_type":"gray","section":"clay","sort_order":6},
  {"dates":"Mag 25–Giu 8","name":"Roland Garros","surface":"Terra · Parigi · Grand Slam","pts":"fino 2000","status":"Upcoming","status_type":"gray","section":"clay","sort_order":7},
  {"dates":"Giu 23–Lug 6","name":"Wimbledon","surface":"Erba · Londra · Grand Slam","pts":"fino 2000","status":"Upcoming","status_type":"gray","section":"second_half","sort_order":8},
  {"dates":"Ago 18–Set 7","name":"US Open","surface":"Hard · New York · Grand Slam","pts":"fino 2000","status":"Upcoming","status_type":"gray","section":"second_half","sort_order":9},
  {"dates":"Nov 2–9","name":"Rolex Paris Masters","surface":"Hard · Parigi · M1000 · Vinto nel 2025 🏆","pts":"–1000","status":"Da difendere","status_type":"red","section":"second_half","sort_order":10},
  {"dates":"Nov 9–16","name":"Nitto ATP Finals 🇮🇹","surface":"Hard · Torino · ATP Finals","pts":"fino 1500","status":"Upcoming","status_type":"gray","section":"second_half","sort_order":11}
]'

# ── News ──
echo "News..."
post "news" '[
  {"type":"orange","icon":"🎾","tag":"Live","tag_date":"5–6 Apr","headline":"Monte Carlo al via — Sinner pesca Humbert al R2, possibile finale con Alcaraz","description":"Sorteggio completato. Sinner [2] debutta martedì vs Humbert (H2H 3-0). Percorso: Cerundolo (R3), Auger-Aliassime (QF), Zverev (SF). Alcaraz [1] dall\u2019altra parte.","source":"ATP Tour · Puntodebreak · Sky Sport","source_date":"5–6 Apr","url":"https://www.atptour.com/en/scores/current/monte-carlo/410/daily-schedule","sort_order":1},
  {"type":"green","icon":"🏆","tag":"Chiuso","tag_date":"30 Mar","headline":"Sunshine Double completato — 6-4 6-4 su Lehecka, storia scritta","description":"Primo uomo a vincere Indian Wells e Miami nella stessa stagione senza perdere un set. 34 set consecutivi ai M1000.","source":"Sky Sport · Olympics.com · Il Fatto Quotidiano","source_date":"30 Mar","url":"https://sport.sky.it/tennis","sort_order":2},
  {"type":"orange","icon":"🎯","tag":"In corso","tag_date":"5–12 Apr","headline":"Monte Carlo: gap virtuale a inizio torneo solo 190 pts — N.1 a portata","description":"Alcaraz difende 1.000 pts, Sinner zero. Se Sinner vince: sale a 13.400 pts. Vittoria = ritorno automatico al N.1.","source":"Eurosport · Sport&Finanza · OASport","source_date":"30 Mar","url":"https://www.eurosport.it/tennis/","sort_order":3},
  {"type":"gray","icon":"🤫","tag":"Dichiarazioni","tag_date":"30 Mar","headline":"Sinner: \"Montecarlo sarà di preparazione\" — ma gli analisti non ci credono","description":"Ma secondo Ambesi (Eurosport) \"Sinner non lascerà nulla di intentato per tornare N.1.\" Si è iscritto anche al doppio con Zizou Bergs.","source":"SportMediaset · OASport · Sport&Finanza","source_date":"30–31 Mar","url":"https://www.oasport.it/tennis/","sort_order":4},
  {"type":"green","icon":"📊","tag":"Stagione 2026","tag_date":"","headline":"17-1, 2 titoli M1000, 34 set di fila: il marzo più dominante della storia recente","description":"12 partite, 12 vittorie, 0 set persi. 7 Masters 1000 in carriera, tutti su cemento.","source":"Olympics.com · Il Fatto Quotidiano","source_date":"30 Mar","url":"https://olympics.com/it/notizie/tennis","sort_order":5},
  {"type":"gray","icon":"📅","tag":"Clay Swing","tag_date":"","headline":"Il programma: Monte Carlo → Madrid → Roma → Roland Garros","description":"Alcaraz difende punti pesanti ovunque. Sinner nel 2025 era assente e non difende nulla fino a Parigi.","source":"OASport · Eurosport","source_date":"30–31 Mar","url":"https://www.oasport.it/tennis/","sort_order":6},
  {"type":"red","icon":"😅","tag":"Contrasto del mese","tag_date":"","headline":"Alcaraz a padel, Sinner nella storia — gap ora 1.190 pts","description":"Alcaraz eliminato al R3 da Korda, poi a giocare a padel. Sinner: 12 vittorie, 0 set persi, Sunshine Double.","source":"Sky Sport · Equipe","source_date":"22–30 Mar","url":"https://sport.sky.it/tennis","sort_order":7}
]'

# ── Scenarios ──
echo "Scenarios..."
post "scenarios" '[
  {"type":"best","tag":"Scenario ottimista","target_date":"Fine aprile","description":"Sinner vince Monte Carlo. Sale a 13.400 — Alcaraz non può raggiungerlo neppure in finale (max 13.240). N.1 automatico.","probability":"~40%","sort_order":1},
  {"type":"mid","tag":"Scenario probabile","target_date":"Giugno 2026","description":"Sinner vince Madrid o Roma. Sorpasso alla vigilia di Roland Garros.","probability":"~45%","sort_order":2},
  {"type":"worst","tag":"Scenario prudente","target_date":"Estate–Autunno","description":"Alcaraz domina la terra battuta. Sinner punta a sorpassarlo a US Open o alle ATP Finals di Torino.","probability":"~15%","sort_order":3}
]'

# ── Predictions ──
echo "Predictions..."
post "predictions" '[
  {"tournament":"Miami","sinner_max":"+1000","alcaraz_defends":"0","bar_width":"100%","bar_color":"#FF7A00","is_done":true,"sort_order":1},
  {"tournament":"Monte Carlo","sinner_max":"+1000","alcaraz_defends":"–1000","bar_width":"80%","bar_color":"#FF7A00","is_done":false,"sort_order":2},
  {"tournament":"Madrid","sinner_max":"+1000","alcaraz_defends":"–600","bar_width":"70%","bar_color":"#FF7A00","is_done":false,"sort_order":3},
  {"tournament":"Roma 🇮🇹","sinner_max":"+1000","alcaraz_defends":"~0","bar_width":"55%","bar_color":"#FF7A00","is_done":false,"sort_order":4},
  {"tournament":"Roland Garros","sinner_max":"+2000","alcaraz_defends":"–2000","bar_width":"35%","bar_color":"#C9A227","is_done":false,"sort_order":5}
]'

# ── Odds ──
echo "Odds..."
post "odds" '[
  {"market":"Sinner vince Monte Carlo 2026","sub":"Masters 1000 · Clay · Monaco","val1":"1.90","lbl1":"Sinner","val2":"2.20","lbl2":"Alcaraz","tag":"Favorito","tag_type":"green","sort_order":1},
  {"market":"Sinner N.1 ATP entro Roland Garros","sub":"Entro 8 giugno 2026","val1":"1.60","lbl1":"Sì","val2":"2.30","lbl2":"No","tag":"Caldo","tag_type":"orange","sort_order":2},
  {"market":"Sinner vince Roland Garros 2026","sub":"Grand Slam · Clay · Parigi","val1":"4.50","lbl1":"Sinner","val2":"2.20","lbl2":"Alcaraz","tag":"Da seguire","tag_type":"orange","sort_order":3},
  {"market":"Sinner vince Wimbledon 2026","sub":"Grand Slam · Erba · Londra","val1":"3.00","lbl1":"Sinner","val2":"2.80","lbl2":"Alcaraz","tag":"Equilibrato","tag_type":"orange","sort_order":4},
  {"market":"Sinner vince US Open 2026","sub":"Grand Slam · Hard · New York","val1":"2.50","lbl1":"Sinner","val2":"3.20","lbl2":"Alcaraz","tag":"Favorito","tag_type":"green","sort_order":5},
  {"market":"Sinner chiude 2026 come N.1 ATP","sub":"Race di fine anno","val1":"1.85","lbl1":"Sinner","val2":"1.95","lbl2":"Alcaraz","tag":"50–50","tag_type":"orange","sort_order":6}
]'

echo ""
echo "═══ Seed completato ═══"
