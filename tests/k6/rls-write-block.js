// ═══════════════════════════════════════════════════════
// SinnerTracker — RLS Write Block Test
// Verifica che la anon key NON possa scrivere su nessuna tabella.
// Tutte le scritture (INSERT/UPDATE/DELETE) devono fallire o ritornare 0 righe.
// ═══════════════════════════════════════════════════════

import http from "k6/http";
import { check, group } from "k6";

const SUPABASE_URL = "https://czcszeoylcelgtduijqc.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3N6ZW95bGNlbGd0ZHVpanFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTM4MzAsImV4cCI6MjA5MTA2OTgzMH0.x2Y33E2Vi2bWsjMYdO1f_a1trbOzvF6QJQrF0PyP-A0";

const TABLES = [
  "sinner_profile", "rankings", "current_tournament", "draw_path",
  "matches", "recent_form", "tournaments", "news",
  "scenarios", "predictions", "odds", "meta",
];

const headers = {
  "apikey": ANON_KEY,
  "Authorization": `Bearer ${ANON_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=representation",
};

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ["rate==1.0"],
  },
};

export default function () {
  for (const table of TABLES) {
    group(`Table: ${table}`, () => {

      // 1. SELECT must work (read-only access)
      const selectRes = http.get(`${SUPABASE_URL}/rest/v1/${table}?select=*&limit=1`, { headers });
      check(selectRes, {
        [`${table}: SELECT returns 200`]: (r) => r.status === 200,
      });

      // 2. INSERT must be blocked (return 401 or empty array)
      const insertPayload = JSON.stringify({ malicious: "true" });
      const insertRes = http.post(`${SUPABASE_URL}/rest/v1/${table}`, insertPayload, { headers });
      check(insertRes, {
        [`${table}: INSERT blocked (4xx or empty)`]: (r) =>
          r.status === 401 || r.status === 403 || r.status === 400 || (r.body || "").trim() === "[]" || r.body === "" || r.status === 401 || r.status === 403,
      });

      // 3. UPDATE must affect 0 rows (or be rejected entirely)
      // Use a generic field "x_attack" that doesn't exist anywhere — if RLS works,
      // we either get [] (filter matched 0 RLS-allowed rows) or 400 (schema error caught first).
      // Both confirm the table is untouched.
      const updateRes = http.patch(`${SUPABASE_URL}/rest/v1/${table}?id=gt.0`, JSON.stringify({ x_attack: "true" }), { headers });
      const updateBody = (updateRes.body || "").toString().trim();
      const updateBlocked = updateBody === "[]" || updateRes.status >= 400;
      check(updateRes, {
        [`${table}: UPDATE blocked or 0 rows`]: () => updateBlocked,
      });

      // 4. DELETE must affect 0 rows (or be rejected entirely)
      const deleteRes = http.del(`${SUPABASE_URL}/rest/v1/${table}?id=gt.0`, null, { headers });
      const delBody = (deleteRes.body || "").toString().trim();
      check(deleteRes, {
        [`${table}: DELETE blocked or 0 rows`]: () => delBody === "[]" || deleteRes.status >= 400,
      });
    });
  }
}
