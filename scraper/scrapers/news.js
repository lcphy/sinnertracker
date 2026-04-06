// ═══════════════════════════════════════════════════════
// News Scraper — RSS feeds da OASport, Sky Sport, Eurosport
// ═══════════════════════════════════════════════════════

import * as cheerio from "cheerio";
import { fetchRSS } from "../lib/fetch.js";
import { supabase } from "../lib/supabase.js";

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
