// ═══════════════════════════════════════════════════════
// SinnerTracker — Security Headers Test
// Verifica che il sito esponga gli header di sicurezza standard.
// ═══════════════════════════════════════════════════════

import http from "k6/http";
import { check } from "k6";

const SITE_URL = __ENV.BASE_URL || "https://sinnertracker.com";

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ["rate>=0.5"], // Almeno 50% degli header presenti
  },
};

export default function () {
  const res = http.get(SITE_URL);

  check(res, {
    "Site returns 200": (r) => r.status === 200,
    "HSTS present": (r) => !!r.headers["Strict-Transport-Security"],
    "CSP present": (r) => !!r.headers["Content-Security-Policy"],
    "X-Frame-Options present": (r) =>
      !!r.headers["X-Frame-Options"] || !!r.headers["x-frame-options"],
    "X-Content-Type-Options present": (r) =>
      !!r.headers["X-Content-Type-Options"] || !!r.headers["x-content-type-options"],
    "Referrer-Policy present": (r) =>
      !!r.headers["Referrer-Policy"] || !!r.headers["referrer-policy"],
    "Permissions-Policy present": (r) =>
      !!r.headers["Permissions-Policy"] || !!r.headers["permissions-policy"],
    "No Server header leak": (r) => !r.headers["Server"] || r.headers["Server"] === "",
    "No X-Powered-By leak": (r) => !r.headers["X-Powered-By"],
  });

  console.log("\n=== Headers ricevuti ===");
  for (const key of Object.keys(res.headers)) {
    console.log(`  ${key}: ${res.headers[key]}`);
  }
}
