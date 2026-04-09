// ═══════════════════════════════════════════════════════
// SinnerTracker — Payload Injection Test
// Invia payload malformati e malicious agli endpoint Supabase.
// Verifica che ritornino 4xx senza 500 e senza leakare info interne.
// ═══════════════════════════════════════════════════════

import http from "k6/http";
import { check, group } from "k6";

const SUPABASE_URL = "https://czcszeoylcelgtduijqc.supabase.co";
const ANON_KEY = __ENV.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3N6ZW95bGNlbGd0ZHVpanFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0OTM4MzAsImV4cCI6MjA5MTA2OTgzMH0.x2Y33E2Vi2bWsjMYdO1f_a1trbOzvF6QJQrF0PyP-A0";

const headers = {
  "apikey": ANON_KEY,
  "Authorization": `Bearer ${ANON_KEY}`,
};

const PAYLOADS = [
  { name: "SQL injection in select", url: `${SUPABASE_URL}/rest/v1/news?select=*'OR'1'='1` },
  { name: "SQL injection in filter", url: `${SUPABASE_URL}/rest/v1/news?id=eq.1';DROP TABLE news;--` },
  { name: "Path traversal", url: `${SUPABASE_URL}/rest/v1/../etc/passwd` },
  { name: "XSS in select", url: `${SUPABASE_URL}/rest/v1/news?select=<script>alert(1)</script>` },
  { name: "Null byte injection", url: `${SUPABASE_URL}/rest/v1/news%00.json` },
  { name: "Huge select", url: `${SUPABASE_URL}/rest/v1/news?select=*&limit=99999999` },
  { name: "Invalid table name", url: `${SUPABASE_URL}/rest/v1/__system_users` },
];

export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ["rate==1.0"],
    "http_req_failed{type:5xx}": ["rate==0"],
  },
};

export default function () {
  for (const p of PAYLOADS) {
    group(p.name, () => {
      const res = http.get(p.url, { headers, tags: { type: res_type(p.name) } });

      check(res, {
        [`${p.name}: no 500`]: (r) => r.status < 500,
        [`${p.name}: no stack trace leak`]: (r) =>
          !r.body.toLowerCase().includes("traceback") &&
          !r.body.toLowerCase().includes("postgres") &&
          !r.body.toLowerCase().includes("at ") &&
          !r.body.toLowerCase().includes("file:///"),
        [`${p.name}: no env leak`]: (r) =>
          !r.body.includes("SUPABASE_") &&
          !r.body.includes("postgres://") &&
          !r.body.includes("eyJ"), // No JWT in error
      });
    });
  }
}

function res_type(name) {
  return name.toLowerCase().replace(/\s/g, "_");
}
