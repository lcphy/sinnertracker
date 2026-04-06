// ═══════════════════════════════════════════════════════
// SinnerTracker — Scraper
// Legge dati ATP, news RSS, e aggiorna Supabase.
// Deployato come Cloud Run Job, triggerato da scheduler.
// ═══════════════════════════════════════════════════════

import { scrapeRanking } from "./scrapers/ranking.js";
import { scrapeNews } from "./scrapers/news.js";
import { scrapeTournament } from "./scrapers/tournament.js";
import { supabase, updateMeta } from "./lib/supabase.js";

const ONLY = process.argv.find(a => a.startsWith("--only="))?.split("=")[1];

async function main() {
  console.log("═══ SinnerTracker Scraper ═══");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Mode: ${ONLY || "full"}`);
  console.log("");

  const results = {};

  try {
    if (!ONLY || ONLY === "ranking") {
      console.log("▸ Scraping ranking...");
      results.ranking = await scrapeRanking();
      console.log(`  ✅ Ranking: ${results.ranking.count} players updated`);
    }

    if (!ONLY || ONLY === "news") {
      console.log("▸ Scraping news...");
      results.news = await scrapeNews();
      console.log(`  ✅ News: ${results.news.count} articles`);
    }

    if (!ONLY || ONLY === "tournament") {
      console.log("▸ Scraping tournament...");
      results.tournament = await scrapeTournament();
      console.log(`  ✅ Tournament: ${results.tournament.status}`);
    }

    // Update last_updated timestamp
    await updateMeta("last_updated", new Date().toISOString());

    console.log("");
    console.log("═══ Scrape completato ═══");
    console.log(JSON.stringify(results, null, 2));

  } catch (err) {
    console.error("❌ Scraper error:", err.message);
    process.exit(1);
  }
}

main();
