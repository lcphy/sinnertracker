// ═══════════════════════════════════════════════════════
// SinnerTracker — Rate Limit Test
// Sparare 100 richieste in 10 secondi alla anon API Supabase.
// Verifica che ci sia QUALCHE forma di rate limiting (429 o slowdown).
// ═══════════════════════════════════════════════════════

import http from "k6/http";
import { check } from "k6";
import { Counter } from "k6/metrics";

const SUPABASE_URL = "https://czcszeoylcelgtduijqc.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3N6ZW95bGNlbGd0ZHVpanFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTM4MzAsImV4cCI6MjA5MTA2OTgzMH0.x2Y33E2Vi2bWsjMYdO1f_a1trbOzvF6QJQrF0PyP-A0";

const rate429 = new Counter("rate_limited_429");
const rate200 = new Counter("requests_200");

export const options = {
  vus: 10,
  iterations: 100,
  thresholds: {
    // Non vogliamo che TUTTE le 100 passino con 200 — qualche limit dovrebbe esserci
    "requests_200": ["count<100"], // segnala se ZERO rate limiting
  },
};

const headers = {
  "apikey": ANON_KEY,
  "Authorization": `Bearer ${ANON_KEY}`,
};

export default function () {
  const res = http.get(`${SUPABASE_URL}/rest/v1/sinner_profile?select=*`, { headers });
  if (res.status === 429) rate429.add(1);
  if (res.status === 200) rate200.add(1);
}

export function handleSummary(data) {
  const r200 = data.metrics.requests_200?.values?.count || 0;
  const r429 = data.metrics.rate_limited_429?.values?.count || 0;
  console.log(`\n=== Rate Limit Summary ===`);
  console.log(`200 OK responses: ${r200}/100`);
  console.log(`429 rate-limited: ${r429}/100`);
  if (r429 === 0) {
    console.log(`⚠️ NO RATE LIMITING detected — attacker can flood the API`);
  } else {
    console.log(`✅ Rate limiting active`);
  }
  return { stdout: JSON.stringify(data, null, 2) };
}
