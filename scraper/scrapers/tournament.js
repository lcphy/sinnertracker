// ═══════════════════════════════════════════════════════
// Tournament Scraper — risultati torneo in corso
// Source: FlashScore (via unofficial API) + ATP Tour
// ═══════════════════════════════════════════════════════

import * as cheerio from "cheerio";
import { fetchPage, fetchJSON } from "../lib/fetch.js";
import { supabase, updateMeta } from "../lib/supabase.js";

// FlashScore API (non ufficiale ma stabile)
const FLASHSCORE_BASE = "https://www.flashscore.it";

export async function scrapeTournament() {
  // Check if there's an active tournament
  const tournaments = await supabase.select("current_tournament");
  const current = tournaments[0];

  if (!current || !current.is_active) {
    return { status: "no active tournament" };
  }

  // Try to scrape live scores / recent results for Sinner
  try {
    const results = await scrapeSinnerResults();
    if (results && results.length > 0) {
      // Update draw_path with actual results
      for (const result of results) {
        await updateDrawPath(result);
      }

      // Update next match
      const nextMatch = findNextMatch(results);
      if (nextMatch) {
        await supabase.upsert("current_tournament", {
          id: 1,
          next_round: nextMatch.round,
          next_opponent: nextMatch.opponent,
          next_opponent_rank: nextMatch.opponentRank,
          next_scheduled: nextMatch.scheduled,
          next_h2h: nextMatch.h2h,
          updated_at: new Date().toISOString(),
        });
      }

      // Update W/L and recent form if there's a new result
      const latestResult = results[results.length - 1];
      if (latestResult.isNew) {
        await updateRecentForm(latestResult);
        await updateSinnerWL(latestResult);
      }

      return { status: `updated — ${results.length} matches found` };
    }
  } catch (err) {
    console.warn(`  ⚠️ Tournament scrape failed: ${err.message}`);
  }

  return { status: "checked — no new results" };
}

async function scrapeSinnerResults() {
  // Try ATP Tour results page
  try {
    const html = await fetchPage("https://www.atptour.com/en/players/jannik-sinner/s0ag/overview");
    const $ = cheerio.load(html);

    const results = [];
    $(".activity-tournament-table tr, .recent-results tr").each((i, el) => {
      const $row = $(el);
      const round = $row.find("td:first-child").text().trim();
      const opponent = $row.find(".opponent, td:nth-child(2)").text().trim();
      const score = $row.find(".score, td:nth-child(3)").text().trim();
      const won = $row.find(".win, .result").text().toLowerCase().includes("w");

      if (round && opponent && score) {
        results.push({ round, opponent, score, won, isNew: false });
      }
    });

    return results;
  } catch (err) {
    console.warn(`  ⚠️ ATP player page failed: ${err.message}`);
    return [];
  }
}

async function updateDrawPath(result) {
  // Find the matching round in draw_path and update result/score
  const drawPath = await supabase.select("draw_path", `round=eq.${result.round}`);
  if (drawPath.length > 0) {
    const row = drawPath[0];
    if (!row.result) {  // Only update if not already filled
      await supabase.upsert("draw_path", {
        id: row.id,
        result: result.won ? "W" : "L",
        score: result.score,
        updated_at: new Date().toISOString(),
      });
    }
  }
}

function findNextMatch(completedResults) {
  const completedRounds = new Set(completedResults.map(r => r.round));
  const roundOrder = ["R1", "R2", "R3", "QF", "SF", "F"];
  for (const round of roundOrder) {
    if (!completedRounds.has(round)) {
      return { round, opponent: "TBD", opponentRank: null, scheduled: "TBD", h2h: "" };
    }
  }
  return null; // Tournament over
}

async function updateRecentForm(result) {
  const form = await supabase.select("recent_form", "order=sort_order");
  if (form.length >= 8) {
    // Remove oldest
    const oldest = form[form.length - 1];
    await fetch(`${process.env.SUPABASE_URL || "https://czcszeoylcelgtduijqc.supabase.co"}/rest/v1/recent_form?id=eq.${oldest.id}`, {
      method: "DELETE",
      headers: {
        "apikey": process.env.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });
  }

  // Shift all sort_orders up by 1
  for (const f of form.slice(0, 7)) {
    await supabase.upsert("recent_form", { id: f.id, sort_order: f.sort_order + 1 });
  }

  // Insert new result at position 1
  await supabase.upsert("recent_form", {
    result: result.won ? "W" : "L",
    detail: `${result.round} ${result.opponent} ${result.score}`,
    sort_order: 1,
  });
}

async function updateSinnerWL(result) {
  const profile = (await supabase.select("sinner_profile"))[0];
  if (!profile) return;

  const [wins, losses] = profile.wl.split("–").map(Number);
  const newWL = result.won
    ? `${wins + 1}–${losses}`
    : `${wins}–${losses + 1}`;

  await supabase.upsert("sinner_profile", {
    id: 1,
    wl: newWL,
    updated_at: new Date().toISOString(),
  });
}
