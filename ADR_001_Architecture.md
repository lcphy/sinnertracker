# ADR-001: Architettura SinnerTracker

**Status:** Accepted
**Data:** 2 Aprile 2026
**Deciders:** Luca (Product Owner)

---

## Contesto

SinnerTracker e' un prototipo HTML statico con dati hardcoded. L'obiettivo e':
1. Deployarlo come sito pubblico
2. Farlo rankare bene su Google
3. Renderlo veloce e auto-aggiornante

Ci sono 3 decisioni architetturali da prendere.

---

## Decisione 1: Struttura del Frontend

### Scelta: Progetto strutturato con file separati (HTML + CSS + JS)

**Cosa cambia:** Separiamo il file monolitico `sinnertracker.html` (38KB tutto insieme) in file dedicati: `index.html`, `style.css`, `app.js`, `data.js`.

**Perche:**
- Google indicizza meglio pagine con CSS/JS esterni (cacheable separatamente)
- Il browser puo caricare CSS e JS in parallelo — pagina piu veloce
- Qualsiasi sviluppatore futuro trovera il codice organizzato

**Alternativa scartata — Framework (React/Vue/Next.js):**
- Pro: piu potente, componenti riutilizzabili
- Contro: richiede un build step, aumenta la complessita, piu lento da caricare per un sito cosi semplice, e Google deve eseguire JavaScript per indicizzare il contenuto (pessimo per SEO)
- Verdetto: overkill per 6 tab di contenuto statico

**Alternativa scartata — Astro/11ty (static site generator):**
- Pro: ottimo per SEO, genera HTML puro
- Contro: Luca dovrebbe imparare un nuovo tool, e il sito e' una singola pagina — non servono template
- Verdetto: buona opzione futura se il sito cresce, ma ora aggiunge complessita senza valore

---

## Decisione 2: Hosting

### Scelta: Vercel

**Cosa cambia:** Il sito va su Vercel (gratuito) con deploy automatico da GitHub.

**Perche:**
- Free tier copre fino a 100GB di banda/mese (ampiamente sufficiente)
- CDN globale: il sito viene servito dal server piu vicino all'utente
- Deploy automatico: ogni push su GitHub aggiorna il sito in 30 secondi
- HTTPS automatico (Google premia i siti HTTPS nel ranking)
- Vercel Serverless Functions: quando servira il backend, possiamo aggiungerlo nello stesso progetto

**Alternativa — Netlify:**
- Quasi identico a Vercel. La differenza: Vercel ha serverless functions migliori (ci serviranno per il backend). Netlify ha un form handling migliore (non ci serve).

**Alternativa — GitHub Pages:**
- Pro: ancora piu semplice
- Contro: niente serverless functions, niente redirect rules, niente analytics integrati
- Verdetto: troppo limitato per il futuro

---

## Decisione 3: Backend (Fase successiva)

### Scelta: Vercel Serverless Functions + Supabase (PostgreSQL)

**Cosa cambia:** Invece di un server Node.js sempre acceso, usiamo funzioni serverless — pezzi di codice che si attivano solo quando servono (quando qualcuno visita il sito o quando lo scheduler aggiorna i dati).

**Perche:**
- Costo zero finche non superiamo 100K invocazioni/mese
- Non devi gestire un server (niente crash, niente restart, niente aggiornamenti OS)
- Si scala automaticamente se arrivano 10.000 utenti durante una finale Slam
- Supabase da un database PostgreSQL gratuito con REST API automatica

**Alternativa — Server dedicato (Railway/Fly.io):**
- Pro: piu flessibile, puo fare web scraping pesante
- Contro: costa ~$5/mese anche senza traffico, devi gestire uptime
- Verdetto: lo consideriamo se le serverless functions non bastano

**Come funzionera il flusso:**
```
[Scheduler] --> chiama API esterne (ATP, FlashScore)
     |
     v
[Serverless Function] --> processa i dati --> salva su Supabase
     |
     v
[Frontend] --> chiede dati a Supabase via REST API --> mostra all'utente
```

---

## Decisione 4: SEO Strategy

### Scelta: HTML statico server-rendered + structured data

**Cosa cambia:** Il contenuto e' gia nell'HTML quando Google lo scarica (non generato da JavaScript). Aggiungiamo Schema.org markup per dire a Google esattamente cosa rappresenta ogni dato.

**Perche:**
- Google indicizza contenuto HTML istantaneamente. Contenuto generato da JS richiede rendering aggiuntivo e spesso viene ignorato
- Schema.org `SportsEvent` e `Person` possono generare rich snippets nei risultati di ricerca
- Il titolo "SinnerTracker — Tutto su Jannik Sinner in tempo reale" matcha keyword ad alto volume in italiano

**Azioni concrete:**
1. Meta tag OG e Twitter Card per condivisione social
2. `<title>` e `<meta description>` ottimizzati per le keyword target
3. Schema.org JSON-LD per eventi sportivi
4. Sitemap.xml e robots.txt
5. URL pulito (sinnertracker.it, no hash fragment)

---

## Piano di Implementazione

### Fase 0 — Oggi (questo sprint)
1. Ristrutturare i file (HTML/CSS/JS separati)
2. Applicare tutti i fix del PRD v2 Sprint 1 (dati, contrasti, footer, meta)
3. Applicare i fix del PRD v2 Sprint 2 (accessibility, ARIA, mobile)
4. Creare repo GitHub
5. Deploy su Vercel

### Fase 1 — Settimana prossima
6. Aggiungere serverless functions per scraping dati
7. Collegare Supabase per caching
8. Il frontend legge da API invece che da dati hardcoded

### Fase 2 — Settimana 2-3
9. Scheduler auto-aggiornante (IDLE/TOURNAMENT/LIVE/POST)
10. RSS news aggregator
11. Analytics (Plausible)

---

## Conseguenze

**Cosa diventa piu facile:**
- Deploy: un push su GitHub aggiorna il sito
- Performance: CDN globale, file cacheable
- SEO: HTML statico, meta tag, structured data
- Manutenzione: ogni file ha un ruolo chiaro

**Cosa diventa piu difficile:**
- Aggiornare i dati richiede un push (fino a Fase 1)
- Nessun preview locale senza un server (risolto con `python3 -m http.server`)

**Cosa dovremo rivalutare:**
- Se il traffico supera 100K visite/mese, valutare piano Vercel Pro ($20/mese)
- Se lo scraping viene bloccato, valutare API a pagamento (SportsData.io)
