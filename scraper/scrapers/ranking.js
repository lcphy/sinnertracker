// ═══════════════════════════════════════════════════════
// Ranking Scraper — Top 5 ATP + Sinner profile
// Source: ATP Tour live rankings page
// ═══════════════════════════════════════════════════════

import * as cheerio from "cheerio";
import { fetchPage } from "../lib/fetch.js";
import { supabase, updateMeta } from "../lib/supabase.js";

const ATP_RANKINGS_URL = "https://www.atptour.com/en/rankings/singles";

const FLAG_MAP = {
  "ESP": "🇪🇸", "ITA": "🇮🇹", "GER": "🇩🇪", "USA": "🇺🇸",
  "RUS": "🇷🇺", "GBR": "🇬🇧", "FRA": "🇫🇷", "NOR": "🇳🇴",
  "SRB": "🇷🇸", "GRE": "🇬🇷", "CAN": "🇨🇦", "AUS": "🇦🇺",
  "ARG": "🇦🇷", "BUL": "🇧🇬", "CHI": "🇨🇱", "DEN": "🇩🇰",
  "POL": "🇵🇱", "CZE": "🇨🇿", "BRA": "🇧🇷", "JPN": "🇯🇵",
};

export async function scrapeRanking() {
  let players;

  try {
    const html = await fetchPage(ATP_RANKINGS_URL);
    players = parseATPRankings(html);
  } catch (err) {
    console.warn(`  ⚠️ ATP Tour non raggiungibile (${err.message}), provo fallback...`);
    // Fallback: usa i dati correnti in Supabase (non aggiornare)
    return { count: 0, status: "skipped — ATP unreachable" };
  }

  if (!players || players.length === 0) {
    console.warn("  ⚠️ Nessun giocatore trovato nel parsing");
    return { count: 0, status: "skipped — no players parsed" };
  }

  // Top 5
  const top5 = players.slice(0, 5);

  // Update rankings table
  const rankingRows = top5.map(p => ({
    rank: p.rank,
    name: p.name,
    flag: p.flag,
    points: p.points,
    status: p.status || "",
    is_sinner: p.name.toLowerCase().includes("sinner"),
    updated_at: new Date().toISOString(),
  }));

  await supabase.replaceAll("rankings", rankingRows);

  // Update Sinner profile
  const sinner = players.find(p => p.name.toLowerCase().includes("sinner"));
  if (sinner) {
    await supabase.upsert("sinner_profile", {
      id: 1,
      rank: sinner.rank,
      points: sinner.points,
      updated_at: new Date().toISOString(),
    });

    // Update gap
    const alcaraz = players.find(p => p.name.toLowerCase().includes("alcaraz"));
    if (alcaraz) {
      const gap = sinner.points - alcaraz.points;
      await updateMeta("gap", String(gap));
      await updateMeta("alcaraz_points", String(alcaraz.points));
      await updateMeta("alcaraz_rank", String(alcaraz.rank));
    }
  }

  return { count: top5.length, status: "updated" };
}

function parseATPRankings(html) {
  const $ = cheerio.load(html);
  const players = [];

  // ATP Tour ranking table rows
  $("table.mega-table tbody tr, .ranking-row, [class*='ranking'] tr").each((i, el) => {
    if (i >= 10) return false; // Top 10 is enough

    const $row = $(el);
    const rank = parseInt($row.find("td:first-child, .rank, [class*='rank']").first().text().trim());
    const name = $row.find(".player-name, .name, td:nth-child(4), td:nth-child(3) a").first().text().trim();
    const points = parseInt($row.find(".points, td:nth-child(6), td:last-child").first().text().trim().replace(/,/g, ""));
    const country = $row.find(".country, .nationality, img[alt]").first().attr("alt")?.toUpperCase()?.trim();

    if (rank && name && points) {
      players.push({
        rank,
        name: formatName(name),
        flag: FLAG_MAP[country] || "🏳️",
        points,
        country,
        status: "",
      });
    }
  });

  // If table parsing failed, try JSON-LD or embedded data
  if (players.length === 0) {
    const scriptTags = $("script");
    scriptTags.each((i, el) => {
      const content = $(el).html();
      if (content && content.includes("rankings") && content.includes("points")) {
        try {
          // Try to find embedded JSON data
          const match = content.match(/(?:rankings|players)\s*[=:]\s*(\[[\s\S]*?\]);/);
          if (match) {
            const data = JSON.parse(match[1]);
            data.slice(0, 10).forEach((p, idx) => {
              players.push({
                rank: p.rank || idx + 1,
                name: formatName(p.name || p.playerName || ""),
                flag: FLAG_MAP[p.country || p.nationality] || "🏳️",
                points: parseInt(p.points || p.ranking_points) || 0,
                status: "",
              });
            });
          }
        } catch {}
      }
    });
  }

  return players;
}

function formatName(name) {
  // "Jannik Sinner" -> "J. Sinner"
  // "Carlos Alcaraz" -> "C. Alcaraz"
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}. ${parts.slice(1).join(" ")}`;
  }
  return name;
}
