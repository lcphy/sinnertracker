// ═══════════════════════════════════════════════════════
// SinnerTracker — Load Test
// 50 virtual users per 1 minuto sul sito statico.
// Verifica p95 < 2000ms ed errors < 5%.
// ═══════════════════════════════════════════════════════

import http from "k6/http";
import { check } from "k6";

const SITE_URL = __ENV.BASE_URL || "https://sinnertracker.com";

export const options = {
  stages: [
    { duration: "10s", target: 10 },  // ramp up
    { duration: "30s", target: 50 },  // steady state
    { duration: "10s", target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ["p(95)<2000"],
    http_req_failed: ["rate<0.05"],
  },
};

export default function () {
  // Frontend pages
  const home = http.get(SITE_URL, { tags: { name: "home" } });
  check(home, {
    "home: 200": (r) => r.status === 200,
    "home: has html": (r) => r.body.includes("<title>"),
  });

  // Critical assets
  const css = http.get(`${SITE_URL}/style.css`, { tags: { name: "css" } });
  check(css, { "css: 200": (r) => r.status === 200 });

  const js = http.get(`${SITE_URL}/app.js`, { tags: { name: "js" } });
  check(js, { "js: 200": (r) => r.status === 200 });

  const data = http.get(`${SITE_URL}/data.js`, { tags: { name: "data" } });
  check(data, { "data: 200": (r) => r.status === 200 });
}
