// ═══════════════════════════════════════════════════════
// News Scraper — RSS feeds da OASport, Sky Sport, Eurosport
// ═══════════════════════════════════════════════════════

import * as cheerio from "cheerio";
import { fetchRSS } from "../lib/fetch.js";
import { supabase } from "../lib/supabase.js";
import { updateMeta } from "../lib/supabase.js";

const RSS_FEEDS = [
  { url: "https://www.oasport.it/category/tennis/feed/", source: "OASport", icon: "🎾" },
  { url: "https://sport.sky.it/rss/sport/tennis.xml", source: "Sky Sport", icon: "📺" },
];

const SINNER_KEYWORDS = [
  "sinner", "jannik", "n.1", "numero 1", "numero uno",
  "alcaraz", "ranking atp", "monte carlo", "masters 1000",
];

export async function scrapeNews() {
  const allArticles = [];

  for (const feed of RSS_FEEDS) {
    try {
      const xml = await fetchRSS(feed.url);
      const articles = parseRSS(xml, feed);
      allArticles.push(...articles);
    } catch (err) {
      console.warn(`  ⚠️ RSS ${feed.source} non raggiungibile: ${err.message}`);
    }
  }

  // Filter: only Sinner-related articles
  const sinnerNews = allArticles
    .filter(a => {
      const text = `${a.headline} ${a.description}`.toLowerCase();
      return SINNER_KEYWORDS.some(kw => text.includes(kw));
    })
    .slice(0, 8);  // Max 8 news

  if (sinnerNews.length === 0) {
    return { count: 0, status: "no Sinner news found" };
  }

  // Detect schedule changes from news headlines/descriptions
  // Look for patterns like "ore 15", "alle 15:00", "spostata alle", "rinviata"
  await detectScheduleChanges(sinnerNews);

  // Categorize
  const categorized = sinnerNews.map((n, i) => ({
    type: categorizeType(n.headline),
    icon: n.icon,
    tag: categorizeTag(n.headline),
    tag_date: formatDate(n.pubDate),
    headline: n.headline,
    description: truncate(n.description, 200),
    source: n.source,
    source_date: formatDate(n.pubDate),
    url: n.url,
    sort_order: i + 1,
    updated_at: new Date().toISOString(),
  }));

  await supabase.replaceAll("news", categorized);
  return { count: categorized.length, status: "updated" };
}

function parseRSS(xml, feed) {
  const $ = cheerio.load(xml, { xmlMode: true });
  const articles = [];

  $("item").each((i, el) => {
    if (i >= 20) return false; // Max 20 per feed
    const $item = $(el);
    articles.push({
      headline: $item.find("title").text().trim(),
      description: stripHTML($item.find("description").text().trim()),
      url: $item.find("link").text().trim(),
      pubDate: $item.find("pubDate").text().trim(),
      source: feed.source,
      icon: feed.icon,
    });
  });

  return articles;
}

function stripHTML(html) {
  return html.replace(/<[^>]*>/g, "").replace(/&[a-z]+;/g, " ").trim();
}

function truncate(text, max) {
  if (text.length <= max) return text;
  return text.substring(0, max).replace(/\s+\S*$/, "") + "...";
}

// ── Detect schedule changes from news text ──
// Italian sports news often report time changes before the API updates.
// Patterns: "ore 15", "alle 15:00", "spostata alle 14", "rinviata", "posticipata"
async function detectScheduleChanges(articles) {
  try {
    const current = (await supabase.select("current_tournament"))[0];
    if (!current || !current.is_active || !current.next_scheduled) return;

    // Extract current scheduled time from DB
    const currentTimeMatch = current.next_scheduled.match(/(\d{1,2}):(\d{2})/);
    if (!currentTimeMatch) return;
    const currentHour = parseInt(currentTimeMatch[1]);

    // Scan recent articles for time mentions
    for (const article of articles) {
      const text = `${article.headline} ${article.description}`.toLowerCase();

      // Only check articles that mention sinner AND time-related keywords
      if (!text.includes("sinner")) continue;
      if (!text.match(/ore\s|alle\s|orario|spost|posticip|anticip|rinvia/)) continue;

      // Extract time: "ore 15", "alle 15:00", "ore 14:30", "dalle 15"
      const timeMatch = text.match(/(?:ore|alle|dalle)\s+(\d{1,2})(?::(\d{2}))?/);
      if (!timeMatch) continue;

      const newHour = parseInt(timeMatch[1]);
      const newMin = timeMatch[2] ? parseInt(timeMatch[2]) : 0;

      // Only update if the hour is different and plausible (between 9-21)
      if (newHour !== currentHour && newHour >= 9 && newHour <= 21) {
        const newTime = `${String(newHour).padStart(2, "0")}:${String(newMin).padStart(2, "0")}`;
        // Replace the time part in the scheduled string
        const newScheduled = current.next_scheduled.replace(/\d{2}:\d{2}/, newTime);

        console.log(`  🕐 Schedule change detected: ${current.next_scheduled} → ${newScheduled}`);
        console.log(`     Source: "${article.headline.substring(0, 80)}"`);

        await supabase.updateByFilter("current_tournament", "id=eq.1", {
          next_scheduled: newScheduled,
          updated_at: new Date().toISOString(),
        });

        await updateMeta("last_updated", new Date().toISOString());
        return; // Only apply first detected change
      }
    }
  } catch (err) {
    console.warn(`  ⚠️ Schedule change detection failed: ${err.message}`);
  }
}

function categorizeType(headline) {
  const h = headline.toLowerCase();
  if (h.includes("vince") || h.includes("trionf") || h.includes("vittoria") || h.includes("campione")) return "green";
  if (h.includes("live") || h.includes("partita") || h.includes("match") || h.includes("vs")) return "orange";
  if (h.includes("infortun") || h.includes("sconfitt") || h.includes("eliminat") || h.includes("perde")) return "red";
  return "gray";
}

function categorizeTag(headline) {
  const h = headline.toLowerCase();
  if (h.includes("live") || h.includes("diretta")) return "Live";
  if (h.includes("vince") || h.includes("campione")) return "Risultato";
  if (h.includes("ranking") || h.includes("classifica") || h.includes("n.1")) return "Ranking";
  if (h.includes("dice") || h.includes("dichiara") || h.includes("parla")) return "Dichiarazioni";
  return "News";
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    const day = d.getDate();
    const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
    return `${day} ${months[d.getMonth()]}`;
  } catch {
    return "";
  }
}
