// ═══════════════════════════════════════════════════════
// SinnerTracker — Data Layer
// Legge i dati da Supabase (live) con fallback hardcoded.
// Lo scraper aggiorna Supabase → il frontend li legge.
// ═══════════════════════════════════════════════════════

const SUPABASE_URL = "https://czcszeoylcelgtduijqc.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3N6ZW95bGNlbGd0ZHVpanFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTM4MzAsImV4cCI6MjA5MTA2OTgzMH0.x2Y33E2Vi2bWsjMYdO1f_a1trbOzvF6QJQrF0PyP-A0";

let DATA = null;

async function loadData() {
  try {
    const results = await Promise.all([
      sb("sinner_profile?select=*"),
      sb("rankings?select=*&order=rank"),
      sb("current_tournament?select=*"),
      sb("draw_path?select=*&order=sort_order"),
      sb("matches?select=*&order=sort_order"),
      sb("recent_form?select=*&order=sort_order"),
      sb("tournaments?select=*&order=sort_order"),
      sb("news?select=*&order=sort_order"),
      sb("scenarios?select=*&order=sort_order"),
      sb("predictions?select=*&order=sort_order"),
      sb("odds?select=*&order=sort_order"),
      sb("meta?select=*"),
    ]);

    const [sinnerArr, rankings, tournamentArr, drawPath, matches, recentForm,
           tournaments, news, scenarios, predictions, odds, metaArr] = results;

    const S = sinnerArr[0];
    const T = tournamentArr[0];
    const meta = Object.fromEntries(metaArr.map(m => [m.key, m.value]));

    DATA = {
      lastUpdated: meta.last_updated || new Date().toISOString(),

      sinner: {
        name: "J. Sinner",
        flag: "\u{1F1EE}\u{1F1F9}",
        rank: S.rank,
        points: S.points,
        wl: S.wl,
        titles2026: S.titles_2026,
        setsM1000: S.sets_m1000,
        m1000Career: S.m1000_career,
        bigTitles: S.big_titles,
        winPctM1000: S.win_pct_m1000,
        prizeMoney: S.prize_money,
      },

      alcaraz: {
        name: "C. Alcaraz",
        flag: meta.alcaraz_flag || "\u{1F1EA}\u{1F1F8}",
        rank: parseInt(meta.alcaraz_rank) || 1,
        points: parseInt(meta.alcaraz_points) || 13590,
      },

      gap: parseInt(meta.gap) || -1190,
      virtualGap: parseInt(meta.virtual_gap) || -190,

      ranking: rankings.map(r => ({
        rank: r.rank,
        name: r.name,
        flag: r.flag,
        points: r.points,
        status: r.status,
        highlight: r.is_sinner,
      })),

      currentTournament: T && T.is_active ? {
        name: T.name,
        dates: T.dates,
        surface: T.surface,
        location: T.location,
        category: T.category,
        sinnerSeed: T.sinner_seed,
        alcarazSeed: T.alcaraz_seed,
        sinnerDefends: T.sinner_defends,
        alcarazDefends: T.alcaraz_defends,
        sinnerNextMatch: T.next_opponent ? {
          round: T.next_round,
          opponent: T.next_opponent,
          opponentRank: T.next_opponent_rank,
          scheduled: T.next_scheduled,
          h2h: T.next_h2h,
        } : null,
        sinnerPath: drawPath.map(d => ({
          round: d.round,
          opponent: d.opponent,
          seed: d.seed,
          result: d.result,
          score: d.score,
        })),
        r1Results: [],
      } : null,

      nextTournament: T && !T.is_active ? {
        name: T.name,
        dates: T.dates,
        surface: T.surface,
        location: T.location,
        category: T.category,
        sinnerDefends: T.sinner_defends,
        alcarazDefends: T.alcaraz_defends,
        drawDate: T.next_scheduled,
      } : null,

      miamiRecap: {
        title: "Miami Open 2026",
        matches: matches
          .filter(m => m.tournament === "Miami Open 2026")
          .map(m => ({
            round: m.round,
            opponent: m.opponent,
            seed: m.seed,
            score: m.score,
            note: m.note,
            won: m.won,
            isFinal: m.is_final,
          })),
      },

      recentForm: recentForm.map(f => ({
        result: f.result,
        detail: f.detail,
      })),

      news: news.map(n => ({
        type: n.type,
        icon: n.icon,
        tag: n.tag,
        tagDate: n.tag_date,
        headline: n.headline,
        desc: n.description,
        source: n.source,
        sourceDate: n.source_date,
        url: n.url,
      })),

      calendario: {
        giocati: tournaments.filter(t => t.section === "played").map(mapTournament),
        claySwinG: tournaments.filter(t => t.section === "clay").map(mapTournament),
        secondoSemestre: tournaments.filter(t => t.section === "second_half").map(mapTournament),
      },

      scenari: scenarios.map(s => ({
        type: s.type,
        tag: s.tag,
        date: s.target_date,
        desc: s.description,
        prob: s.probability,
      })),

      previsione: predictions.map(p => ({
        torneo: p.tournament,
        sinnerMax: p.sinner_max,
        alcarazDifende: p.alcaraz_defends,
        barWidth: p.bar_width,
        barColor: p.bar_color,
        done: p.is_done,
      })),

      quote: {
        nextMatch: null,
        speciali: odds.map(o => ({
          market: o.market,
          sub: o.sub,
          val1: o.val1,
          lbl1: o.lbl1,
          val2: o.val2,
          lbl2: o.lbl2,
          tag: o.tag,
          tagType: o.tag_type,
        })),
      },
    };

    console.log("[SinnerTracker] Dati caricati da Supabase:", new Date(DATA.lastUpdated).toLocaleString("it-IT"));
    return DATA;

  } catch (err) {
    console.warn("[SinnerTracker] Supabase non raggiungibile, uso dati di fallback:", err.message);
    DATA = getFallbackData();
    return DATA;
  }
}

// ── Supabase fetch helper ──
async function sb(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      "apikey": SUPABASE_KEY,
      "Authorization": `Bearer ${SUPABASE_KEY}`,
    },
  });
  if (!res.ok) throw new Error(`Supabase ${path}: ${res.status}`);
  return res.json();
}

// ── Tournament mapper ──
function mapTournament(t) {
  return {
    dates: t.dates,
    name: t.name,
    surface: t.surface,
    pts: t.pts,
    status: t.status,
    statusType: t.status_type,
  };
}

// ── Fallback data (ultimo snapshot hardcoded) ──
function getFallbackData() {
  return {
    lastUpdated: "2026-04-06T12:00:00Z",
    sinner: { name: "J. Sinner", flag: "\u{1F1EE}\u{1F1F9}", rank: 2, points: 12400, wl: "17\u20131", titles2026: 2, setsM1000: 34, m1000Career: 7, bigTitles: 13, winPctM1000: "77.9%", prizeMoney: "$51.2M" },
    alcaraz: { name: "C. Alcaraz", flag: "\u{1F1EA}\u{1F1F8}", rank: 1, points: 13590 },
    gap: -1190,
    virtualGap: -190,
    ranking: [
      { rank: 1, name: "C. Alcaraz", flag: "\u{1F1EA}\u{1F1F8}", points: 13590, status: "Campione MC 2025", highlight: false },
      { rank: 2, name: "J. Sinner", flag: "\u{1F1EE}\u{1F1F9}", points: 12400, status: "\u{1F3C6} Campione Miami 2026", highlight: true },
      { rank: 3, name: "A. Zverev", flag: "\u{1F1E9}\u{1F1EA}", points: 8015, status: "SF Miami", highlight: false },
      { rank: 4, name: "T. Fritz", flag: "\u{1F1FA}\u{1F1F8}", points: 5890, status: "OUT Miami R4", highlight: false },
      { rank: 5, name: "D. Medvedev", flag: "\u{1F1F7}\u{1F1FA}", points: 5700, status: "OUT Miami R3", highlight: false },
    ],
    currentTournament: { name: "Monte Carlo Masters 2026", dates: "5\u201312 Apr 2026", surface: "Clay", location: "Roquebrune-Cap-Martin", category: "Masters 1000", sinnerSeed: 2, alcarazSeed: 1, sinnerDefends: 0, alcarazDefends: 1000, sinnerNextMatch: { round: "R2", opponent: "\u{1F1EB}\u{1F1F7} U. Humbert", opponentRank: 18, scheduled: "Mar 7 Apr", h2h: "Sinner conduce 3\u20130" }, sinnerPath: [{ round: "R2", opponent: "U. Humbert \u{1F1EB}\u{1F1F7}", seed: "14" }, { round: "R3", opponent: "F. Cerundolo \u{1F1E6}\u{1F1F7}", seed: "" }, { round: "QF", opponent: "F. Auger-Aliassime \u{1F1E8}\u{1F1E6}", seed: "8" }, { round: "SF", opponent: "A. Zverev \u{1F1E9}\u{1F1EA}", seed: "3" }, { round: "F", opponent: "C. Alcaraz \u{1F1EA}\u{1F1F8}", seed: "1" }], r1Results: [] },
    nextTournament: null,
    miamiRecap: { title: "Miami Open 2026", matches: [{ round: "R2", opponent: "\u{1F1E7}\u{1F1E6} D. D\u017Eumhur", score: "6\u20133  6\u20133", note: "", won: true, isFinal: false }, { round: "FINALE", opponent: "\u{1F1E8}\u{1F1FF} J. Lehecka", score: "6\u20134  6\u20134", note: "34\u00B0 set di fila", won: true, isFinal: true }] },
    recentForm: [{ result: "W", detail: "Finale Lehecka 6-4 6-4 \u{1F3C6}" }, { result: "W", detail: "SF Zverev 6-3 7-6(4)" }, { result: "L", detail: "AO SF Alcaraz" }],
    news: [{ type: "orange", icon: "\u{1F3BE}", tag: "Live", tagDate: "5\u20136 Apr", headline: "Monte Carlo al via", desc: "Sinner pesca Humbert al R2.", source: "ATP Tour", sourceDate: "6 Apr", url: "#" }],
    calendario: { giocati: [], claySwinG: [], secondoSemestre: [] },
    scenari: [{ type: "best", tag: "Scenario ottimista", date: "Fine aprile", desc: "Sinner vince MC = N.1 automatico", prob: "~40%" }],
    previsione: [],
    quote: { nextMatch: null, speciali: [] },
  };
}
