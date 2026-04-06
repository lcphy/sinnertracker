// ═══════════════════════════════════════════════════════
// Supabase client — usa service_role key (full access)
// ═══════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || "https://czcszeoylcelgtduijqc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6Y3N6ZW95bGNlbGd0ZHVpanFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTQ5MzgzMCwiZXhwIjoyMDkxMDY5ODMwfQ.fRKT2Lu_gh8ziBiycmDAM5j38AaC5mP3VWJ8fgixHM0";

const headers = {
  "apikey": SUPABASE_KEY,
  "Authorization": `Bearer ${SUPABASE_KEY}`,
  "Content-Type": "application/json",
  "Prefer": "return=minimal",
};

export const supabase = {
  // Upsert: inserisci o aggiorna
  async upsert(table, data, onConflict = "id") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { ...headers, "Prefer": "return=minimal,resolution=merge-duplicates" },
      body: JSON.stringify(Array.isArray(data) ? data : [data]),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase upsert ${table}: ${res.status} ${err}`);
    }
    return true;
  },

  // Replace all: cancella tutto e reinserisci (per tabelle che si rigenerano)
  async replaceAll(table, data) {
    // Delete all
    const delRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=gt.0`, {
      method: "DELETE",
      headers,
    });
    if (!delRes.ok && delRes.status !== 404) {
      const err = await delRes.text();
      throw new Error(`Supabase delete ${table}: ${delRes.status} ${err}`);
    }
    // Insert new
    if (data.length > 0) {
      const insRes = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
        method: "POST",
        headers,
        body: JSON.stringify(data),
      });
      if (!insRes.ok) {
        const err = await insRes.text();
        throw new Error(`Supabase insert ${table}: ${insRes.status} ${err}`);
      }
    }
    return true;
  },

  // Read
  async select(table, query = "") {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=*${query ? "&" + query : ""}`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) throw new Error(`Supabase select ${table}: ${res.status}`);
    return res.json();
  },
};

export async function updateMeta(key, value) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/meta`, {
    method: "POST",
    headers: { ...headers, "Prefer": "return=minimal,resolution=merge-duplicates" },
    body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase updateMeta: ${res.status} ${err}`);
  }
}
