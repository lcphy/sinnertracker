// ═══════════════════════════════════════════════════════
// Tennis API Scraper — SportScore via RapidAPI
// Source: sportscore1.p.rapidapi.com
// Budget: 500 req/month — every request counts
// ═══════════════════════════════════════════════════════

import { supabase, updateMeta } from "../lib/supabase.js";

const API_HOST = "sportscore1.p.rapidapi.com";
const API_KEY = process.env.RAPIDAPI_KEY;
const SINNER_ID = 12820;

if (!API_KEY) {
  throw new Error("RAPIDAPI_KEY env var is required (no hardcoded fallback for security)");
}

// ── Main entry point ──
export async function scrapeViaAPI() {
  const results = {};

  // 1. Check if Sinner has a live match right now (1 request)
  const liveMatch = await getSinnerLiveMatch();
  if (liveMatch) {
    console.log(`  🔴 LIVE: ${liveMatch.name} — ${liveMatch.status_more}`);
    results.live = await updateLiveMatch(liveMatch);
    return results;
  }

  // 2. No live match — check today's results (1 request, reuses date events)
  const todayResults = await getSinnerTodayResults();
  if (todayResults.length > 0) {
    console.log(`  ✅ Result found: ${todayResults[0].name}`);
    results.result = await updateMatchResult(todayResults[0]);
  }

  // 3. Find next scheduled match (1 request)
  const nextMatch = await getSinnerNextMatch();
  if (nextMatch) {
    console.log(`  📅 Next: ${nextMatch.name} — ${nextMatch.start_at}`);
    results.next = await updateNextMatch(nextMatch);
  }

  return results;
}

// ── API call helper (counts toward 500/month budget) ──
let requestCount = 0;
async function api(path) {
  requestCount++;
  console.log(`    [API ${requestCount}] GET ${path}`);

  const res = await fetch(`https://${API_HOST}${path}`, {
    headers: {
      "x-rapidapi-host": API_HOST,
      "x-rapidapi-key": API_KEY,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text.substring(0, 100)}`);
  }

  const json = await res.json();
  return json.data;
}

// ── Get Sinner's live match ──
async function getSinnerLiveMatch() {
  const events = await api("/sports/2/events/live");
  return events.find(e =>
    e.home_team?.id === SINNER_ID || e.away_team?.id === SINNER_ID
  ) || null;
}

// ── Get Sinner's results today (with full score from detail endpoint) ──
async function getSinnerTodayResults() {
  const today = new Date().toISOString().split("T")[0];
  const events = await api(`/sports/2/events/date/${today}`);
  const sinnerMatches = events.filter(e =>
    (e.home_team?.id === SINNER_ID || e.away_team?.id === SINNER_ID) &&
    e.status === "finished"
  );
  // Get full details for each match (1 extra request per match — worth it for score)
  const detailed = [];
  for (const match of sinnerMatches) {
    const full = await api(`/events/${match.id}`);
    detailed.push(full);
  }
  return detailed;
}

// ── Get Sinner's next scheduled match ──
async function getSinnerNextMatch() {
  // Check tomorrow and next few days
  for (let i = 1; i <= 3; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().split("T")[0];

    try {
      const events = await api(`/sports/2/events/date/${dateStr}`);
      const sinnerMatch = events.find(e =>
        (e.home_team?.id === SINNER_ID || e.away_team?.id === SINNER_ID) &&
        e.status === "notstarted"
      );
      if (sinnerMatch) return sinnerMatch;
    } catch {
      // Date might have no events
    }
  }
  return null;
}

// ── Update Supabase with live match data ──
async function updateLiveMatch(match) {
  const isSinnerHome = match.home_team?.id === SINNER_ID;
  const sinnerScore = isSinnerHome ? match.home_score : match.away_score;
  const oppScore = isSinnerHome ? match.away_score : match.home_score;
  const opponent = isSinnerHome ? match.away_team : match.home_team;

  const sets = [];
  for (const p of ["period_1", "period_2", "period_3", "period_4", "period_5"]) {
    if (sinnerScore?.[p] !== undefined) {
      sets.push(`${sinnerScore[p]}–${oppScore[p]}`);
    }
  }

  await supabase.upsert("current_tournament", {
    id: 1,
    next_round: getRoundName(match.round_info),
    next_opponent: `${opponent.name}`,
    next_scheduled: "LIVE NOW",
    next_h2h: `Score: ${sets.join(" ")} (${match.status_more || ""})`,
    updated_at: new Date().toISOString(),
  });

  await updateMeta("last_updated", new Date().toISOString());
  return { status: "live_updated", score: sets.join(" ") };
}

// ── Update Supabase with finished match ──
async function updateMatchResult(match) {
  const isSinnerHome = match.home_team?.id === SINNER_ID;
  const sinnerSetsWon = isSinnerHome
    ? match.home_score?.display
    : match.away_score?.display;
  const oppSetsWon = isSinnerHome
    ? match.away_score?.display
    : match.home_score?.display;
  const won = parseInt(sinnerSetsWon) > parseInt(oppSetsWon);
  const opponent = isSinnerHome ? match.away_team : match.home_team;

  // Build score string
  const sinnerScore = isSinnerHome ? match.home_score : match.away_score;
  const oppScore = isSinnerHome ? match.away_score : match.home_score;
  const sets = [];
  for (const p of ["period_1", "period_2", "period_3", "period_4", "period_5"]) {
    if (sinnerScore?.[p] !== undefined && oppScore?.[p] !== undefined) {
      sets.push(`${sinnerScore[p]}–${oppScore[p]}`);
    }
  }
  const scoreStr = sets.join(" ");
  const roundName = getRoundName(match.round_info);

  // Update draw_path: PATCH the existing row for this round (no duplicates)
  await supabase.updateByFilter("draw_path", `round=eq.${encodeURIComponent(roundName)}`, {
    result: won ? "W" : "L",
    score: scoreStr,
    updated_at: new Date().toISOString(),
  });

  // Update sinner_profile W/L
  const profile = (await supabase.select("sinner_profile"))[0];
  if (profile) {
    const [w, l] = profile.wl.split("–").map(Number);
    const newWL = won ? `${w + 1}–${l}` : `${w}–${l + 1}`;
    await supabase.upsert("sinner_profile", {
      id: 1,
      wl: newWL,
      sets_m1000: won ? profile.sets_m1000 + sets.length : profile.sets_m1000,
      updated_at: new Date().toISOString(),
    });
  }

  // Add to recent_form (skip if this exact match is already at the top)
  const forms = await supabase.select("recent_form", "order=sort_order");
  const newDetail = `${roundName} MC ${opponent.name} ${scoreStr}`;
  const alreadyTop = forms[0]?.detail === newDetail;
  if (!alreadyTop) {
    const newForm = forms.slice(0, 7).map((f, i) => ({
      result: f.result,
      detail: f.detail,
      sort_order: i + 2,
    }));
    newForm.unshift({
      result: won ? "W" : "L",
      detail: newDetail,
      sort_order: 1,
    });
    await supabase.replaceAll("recent_form", newForm);
  }

  // Add news (only if no news for this opponent already exists)
  const newsHeadline = won
    ? `Sinner batte ${opponent.name} ${scoreStr} — avanza a Monte Carlo`
    : `Sinner eliminato da ${opponent.name} ${scoreStr}`;
  const oppLastName = opponent.name.split(" ")[0];
  const existingNews = await supabase.select("news", `headline=ilike.*${encodeURIComponent(oppLastName)}*`);
  if (existingNews.length === 0) {
    await supabase.insert("news", {
      type: won ? "green" : "red",
      icon: won ? "🎾" : "😔",
      tag: "Risultato",
      tag_date: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
      headline: newsHeadline,
      description: `${roundName} Monte Carlo Masters 2026.`,
      source: "SportScore API",
      source_date: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
      url: "https://sinnertracker.com",
      sort_order: 0,
      updated_at: new Date().toISOString(),
    });
  }

  await updateMeta("last_updated", new Date().toISOString());
  return { status: "result_updated", won, score: scoreStr };
}

// ── Update next match info ──
async function updateNextMatch(match) {
  const isSinnerHome = match.home_team?.id === SINNER_ID;
  const opponent = isSinnerHome ? match.away_team : match.home_team;
  const startDate = new Date(match.start_at * 1000);
  const dayNames = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  const scheduled = `${dayNames[startDate.getDay()]} ${startDate.getDate()} Apr, ${startDate.getHours()}:${String(startDate.getMinutes()).padStart(2, "0")}`;

  await supabase.upsert("current_tournament", {
    id: 1,
    next_round: getRoundName(match.round_info),
    next_opponent: opponent.name,
    next_opponent_rank: null,
    next_scheduled: scheduled,
    next_h2h: "",
    updated_at: new Date().toISOString(),
  });

  await updateMeta("last_updated", new Date().toISOString());
  return { status: "next_match_updated", opponent: opponent.name, scheduled };
}

// ── Round name mapper ──
// SportScore API returns roundInfo.name like "Round of 32", "Quarterfinals", etc.
// We map by name (most reliable) — Monte Carlo 56-draw uses R2/R3/QF/SF/F
function getRoundName(roundInfo) {
  if (!roundInfo) return "R?";
  const name = (roundInfo.name || "").toLowerCase();
  if (name.includes("final") && !name.includes("semi") && !name.includes("quarter")) return "F";
  if (name.includes("semifinal")) return "SF";
  if (name.includes("quarterfinal")) return "QF";
  if (name.includes("round of 16")) return "R3"; // R16 = R3 in 56-draw
  if (name.includes("round of 32")) return "R2";
  if (name.includes("round of 64")) return "R1";
  if (name.includes("round of 128")) return "R1";
  // Fallback: return the raw name
  return roundInfo.name || "R?";
}
