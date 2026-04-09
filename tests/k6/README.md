# SinnerTracker — k6 Security Tests

Suite di test di sicurezza eseguibili con [k6](https://k6.io).

## Setup

```bash
brew install k6
```

## Test disponibili

| File | Cosa testa | Costo |
|------|-----------|-------|
| `rls-write-block.js` | Le RLS Supabase bloccano scritture con anon key | €0 |
| `security-headers.js` | Headers di sicurezza presenti su sinnertracker.com | €0 |
| `payload-injection.js` | SQL injection, XSS, path traversal su Supabase REST | €0 |
| `exposed-files.js` | File sensibili NON serviti pubblicamente | €0 |
| `rate-limit.js` | Rate limiting attivo su anon key Supabase | €0 |
| `load.js` | Stress test 50 VU su sinnertracker.com (1 min) | €0 |

## Esecuzione

```bash
# Singolo test
k6 run tests/k6/rls-write-block.js

# Tutti i test
for f in tests/k6/*.js; do echo "=== $f ==="; k6 run "$f"; done

# Override URL (es. localhost)
BASE_URL=http://localhost:8090 k6 run tests/k6/security-headers.js
```

## Variabili ambiente

| Variabile | Default | Note |
|-----------|---------|------|
| `BASE_URL` | `https://sinnertracker.com` | URL del frontend |
| `SUPABASE_ANON_KEY` | hardcoded | Anon key (pubblica per design) |

## Soglie

- `checks: rate==1.0` — tutti i check devono passare
- `http_req_duration p95 < 2000ms` — performance frontend
- `http_req_failed < 5%` — affidabilita frontend

Se un test fallisce, NON disabilitarlo: c'e una vulnerabilita o un bug da fixare.
