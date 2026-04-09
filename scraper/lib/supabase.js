// ═══════════════════════════════════════════════════════
// Supabase client — usa service_role key (full access)
// ═══════════════════════════════════════════════════════

const SUPABASE_URL = process.env.SUPABASE_URL || "https://czcszeoylcelgtduijqc.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY env var is required (no hardcoded fallback for security)");
}

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

  // Update by filter (PATCH) — updates only matching rows, never creates new
  async updateByFilter(table, filter, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${filter}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase updateByFilter ${table}: ${res.status} ${err}`);
    }
    return true;
  },

  // Plain insert (no upsert) — always creates a new row
  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers,
      body: JSON.stringify(Array.isArray(data) ? data : [data]),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase insert ${table}: ${res.status} ${err}`);
    }
    return true;
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
