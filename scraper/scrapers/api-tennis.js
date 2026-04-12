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

// ── Get Sinner's recent results (today AND yesterday — catches matches missed by daily check) ──
async function getSinnerTodayResults() {
  const results = [];
  // Check today AND yesterday (if scraper runs at 8am, yesterday's match might not have been caught)
  for (let i = 0; i <= 1; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];

    const events = await api(`/sports/2/events/date/${dateStr}`);
    const sinnerMatches = events.filter(e =>
      (e.home_team?.id === SINNER_ID || e.away_team?.id === SINNER_ID) &&
      e.status === "finished"
    );

    for (const match of sinnerMatches) {
      const full = await api(`/events/${match.id}`);
      results.push(full);
    }
  }
  return results;
}

// ── Get Sinner's next scheduled match (including LATER TODAY) ──
async function getSinnerNextMatch() {
  // Start from TODAY (i=0), not tomorrow — catches matches scheduled for later today
  for (let i = 0; i <= 3; i++) {
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
// IMPORTANT: only updates fields the API can reliably provide (round, scheduled).
// Does NOT overwrite opponent name/rank/H2H if they've been manually enriched,
// unless the opponent has changed.
async function updateNextMatch(match) {
  const isSinnerHome = match.home_team?.id === SINNER_ID;
  const opponent = isSinnerHome ? match.away_team : match.home_team;
  const scheduled = formatMatchDateTime(match.start_at);
  const roundName = getRoundName(match.round_info);
  const rawOpponentName = opponent.name; // e.g. "Auger-Aliassime F."

  // Read current state to decide whether to overwrite enriched fields
  const current = (await supabase.select("current_tournament"))[0] || {};
  const opponentChanged = !current.next_opponent ||
    !current.next_opponent.toLowerCase().includes(
      (rawOpponentName.split(" ")[0] || "").toLowerCase()
    );

  const patch = {
    id: 1,
    next_round: roundName,
    next_scheduled: scheduled,
    updated_at: new Date().toISOString(),
  };
  // Only overwrite opponent name if it's a different player (manual enrichment preserved)
  if (opponentChanged) {
    patch.next_opponent = rawOpponentName;
    patch.next_opponent_rank = null;
    patch.next_h2h = "";
  }

  await supabase.upsert("current_tournament", patch);

  // Auto-generate news for the scheduled match (only if not already present)
  const existing = await supabase.select("news", `headline=ilike.*${encodeURIComponent(opponent.name.split(" ")[0])}*`);
  if (existing.length === 0) {
    const roundLabel = {
      R1: "primo turno", R2: "secondo turno", R3: "terzo turno",
      QF: "quarti di finale", SF: "semifinale", F: "finale"
    }[roundName] || roundName;
    await supabase.insert("news", {
      type: "orange",
      icon: "\u{1F3AF}",
      tag: "Prossimo match",
      tag_date: scheduled,
      headline: `${roundLabel.charAt(0).toUpperCase() + roundLabel.slice(1)}: Sinner vs ${opponent.name} — ${scheduled}`,
      description: `Sinner affronta ${opponent.name} nel ${roundLabel} di Monte Carlo. Match programmato: ${scheduled}.`,
      source: "SportScore API",
      source_date: new Date().toLocaleDateString("it-IT", { day: "numeric", month: "short" }),
      url: "https://sinnertracker.com",
      sort_order: 1,
      updated_at: new Date().toISOString(),
    });
  }

  await updateMeta("last_updated", new Date().toISOString());
  return { status: "next_match_updated", opponent: opponent.name, scheduled };
}

// ── Format match datetime in Italian: "Ven 10 Apr · 09:00" ──
// SportScore API returns start_at as local time at the venue (Europe/Monaco for MC),
// NOT UTC. We parse the raw values directly without timezone conversion.
function formatMatchDateTime(startAt) {
  if (!startAt) return "TBD";

  // Handle both string "2026-04-10 09:00:00" and unix timestamp
  let year, month, day, hour, minute;
  if (typeof startAt === "number") {
    const d = new Date(startAt * 1000);
    year = d.getUTCFullYear();
    month = d.getUTCMonth() + 1;
    day = d.getUTCDate();
    hour = d.getUTCHours();
    minute = d.getUTCMinutes();
  } else {
    const m = String(startAt).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (!m) return "TBD";
    [, year, month, day, hour, minute] = m.map(Number);
  }

  const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
  const days = ["Dom", "Lun", "Mar", "Mer", "Gio", "Ven", "Sab"];
  // Compute day of week from date components (using UTC to avoid TZ issues)
  const wday = days[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];

  const mm = String(month).padStart(2, "0");
  const hh = String(hour).padStart(2, "0");
  const min = String(minute).padStart(2, "0");
  return `${wday} ${day} ${months[month - 1]} \u00B7 ${hh}:${min}`;
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
