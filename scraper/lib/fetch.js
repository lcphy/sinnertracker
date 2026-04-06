// ═══════════════════════════════════════════════════════
// HTTP fetch con retry, timeout, e user-agent realistico
// ═══════════════════════════════════════════════════════

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

export async function fetchPage(url, { retries = 2, timeout = 15000 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(url, {
        headers: {
          "User-Agent": UA,
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "it-IT,it;q=0.9,en;q=0.8",
        },
        signal: controller.signal,
      });
      clearTimeout(timer);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();

    } catch (err) {
      if (attempt === retries) throw err;
      // Wait before retry: 2s, 4s
      await new Promise(r => setTimeout(r, (attempt + 1) * 2000));
    }
  }
}

export async function fetchJSON(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, "Accept": "application/json" },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  return res.json();
}

export async function fetchRSS(url) {
  return fetchPage(url, { timeout: 10000 });
}
