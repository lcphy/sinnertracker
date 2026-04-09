// ═══════════════════════════════════════════════════════
// SinnerTracker — Exposed Files Test
// Verifica che file sensibili NON siano serviti pubblicamente.
// ═══════════════════════════════════════════════════════

import http from "k6/http";
import { check } from "k6";

const SITE_URL = __ENV.BASE_URL || "https://sinnertracker.com";

const SHOULD_NOT_EXIST = [
  "firebase.json",
  ".firebaserc",
  ".env",
  ".env.local",
  ".git/config",
  ".gitignore",
  "package.json",
  "package-lock.json",
  "serve.py",
  "scraper/lib/supabase.js",
  "scraper/scrapers/api-tennis.js",
  "supabase/seed.sh",
  "supabase/schema.sql",
  "ADR_001_Architecture.md",
  "PRD_v2_Design_Improvements.md",
  ".DS_Store",
];

const SHOULD_EXIST = [
  "index.html",
  "style.css",
  "app.js",
  "data.js",
  "robots.txt",
  "sitemap.xml",
];

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ["rate==1.0"],
  },
};

export default function () {
  for (const f of SHOULD_NOT_EXIST) {
    const res = http.get(`${SITE_URL}/${f}`);
    check(res, {
      [`${f}: NOT exposed (404)`]: (r) => r.status === 404,
    });
  }
  for (const f of SHOULD_EXIST) {
    const res = http.get(`${SITE_URL}/${f}`);
    check(res, {
      [`${f}: served (200)`]: (r) => r.status === 200,
    });
  }
}
