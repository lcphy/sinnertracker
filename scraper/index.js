// ═══════════════════════════════════════════════════════
// SinnerTracker — Scraper (Dynamic Scheduler)
//
// Modes:
//   daily    → 8am check: Sinner plays today? If yes, create live trigger
//   live     → Every 30 min during match: update scores
//   news     → RSS scrape only (free, unlimited)
//
// Budget: 500 API calls/month — ~90 used with dynamic scheduling
// ═══════════════════════════════════════════════════════

import { scrapeViaAPI } from "./scrapers/api-tennis.js";
import { scrapeNews } from "./scrapers/news.js";
import { updateMeta } from "./lib/supabase.js";
import { createLiveTrigger, deleteLiveTrigger, liveTriggerExists } from "./lib/scheduler.js";

const MODE = process.argv.find(a => a.startsWith("--mode="))?.split("=")[1] || "daily";

async function main() {
  console.log("═══ SinnerTracker Scraper ═══");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Mode: ${MODE}`);
  console.log("");

  try {
    if (MODE === "daily") {
      await runDaily();
    } else if (MODE === "live") {
      await runLive();
    } else if (MODE === "news") {
      await runNews();
    } else {
      // Default: full run (API + news)
      await scrapeViaAPI();
      await scrapeNews();
    }

    await updateMeta("last_updated", new Date().toISOString());
    console.log("\n═══ Completato ═══");

  } catch (err) {
    console.error("❌ Scraper error:", err.message);
    process.exit(1);
  }
}

// ── DAILY: morning check at 8am ──
async function runDaily() {
  console.log("▸ Daily check: Sinner gioca oggi?");

  const apiResult = await scrapeViaAPI();

  // If there's a live match or a finished match today, we're in tournament mode
  if (apiResult.live) {
    console.log("  🔴 Match LIVE — creating trigger if not exists");
    await ensureLiveTrigger();
  } else if (apiResult.result) {
    console.log("  ✅ Match finished today — result updated");
    // Match already done, remove trigger if exists
    await removeLiveTriggerIfExists();
  } else {
    console.log("  📅 No match today");
    // Remove trigger if exists from yesterday
    await removeLiveTriggerIfExists();
  }

  // Always update news
  console.log("▸ Updating news...");
  const news = await scrapeNews();
  console.log(`  ✅ News: ${news.count} articles`);
}

// ── LIVE: every 30 min during match day ──
async function runLive() {
  console.log("▸ Live mode: checking match status...");

  const apiResult = await scrapeViaAPI();

  if (apiResult.live) {
    console.log("  🔴 Match still in progress — score updated");
  } else if (apiResult.result) {
    console.log("  ✅ Match finished — removing live trigger");
    await removeLiveTriggerIfExists();
  } else {
    // No match found — might be between matches or tournament over
    console.log("  ⏸️ No active match — checking if trigger should stay");
    // Keep trigger if there might be another match today
    // Remove if it's late evening (after 22:00 local time)
    const hour = new Date().toLocaleString("en-US", { timeZone: "Europe/Rome", hour: "numeric", hour12: false });
    if (parseInt(hour) >= 22) {
      console.log("  🌙 Late evening — removing trigger");
      await removeLiveTriggerIfExists();
    }
  }
}

// ── NEWS: RSS only ──
async function runNews() {
  console.log("▸ Scraping news via RSS...");
  const news = await scrapeNews();
  console.log(`  ✅ News: ${news.count} articles`);
}

// ── Trigger helpers ──
async function ensureLiveTrigger() {
  const exists = await liveTriggerExists();
  if (!exists) {
    console.log("  📡 Creating live trigger (every 30 min)...");
    await createLiveTrigger();
    console.log("  ✅ Live trigger created");
  } else {
    console.log("  📡 Live trigger already exists");
  }
}

async function removeLiveTriggerIfExists() {
  const exists = await liveTriggerExists();
  if (exists) {
    console.log("  🗑️ Removing live trigger...");
    await deleteLiveTrigger();
    console.log("  ✅ Live trigger removed");
  }
}

main();
