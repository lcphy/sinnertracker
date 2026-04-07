// ═══════════════════════════════════════════════════════
// SinnerTracker — Scraper
// Priorita: API SportScore (live data) → RSS (news) → fallback
// Budget: 500 API calls/month — be surgical
// ═══════════════════════════════════════════════════════

import { scrapeViaAPI } from "./scrapers/api-tennis.js";
import { scrapeNews } from "./scrapers/news.js";
import { updateMeta } from "./lib/supabase.js";

const ONLY = process.argv.find(a => a.startsWith("--only="))?.split("=")[1];

async function main() {
  console.log("═══ SinnerTracker Scraper ═══");
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Mode: ${ONLY || "full"}`);
  console.log("");

  const results = {};

  try {
    // Primary: API for match data (live scores, results, next match)
    if (!ONLY || ONLY === "api" || ONLY === "match") {
      console.log("▸ Checking match data via API...");
      results.api = await scrapeViaAPI();
      console.log(`  ✅ API: ${JSON.stringify(results.api)}`);
    }

    // Secondary: RSS for news (free, unlimited)
    if (!ONLY || ONLY === "news") {
      console.log("▸ Scraping news via RSS...");
      results.news = await scrapeNews();
      console.log(`  ✅ News: ${results.news.count} articles`);
    }

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
