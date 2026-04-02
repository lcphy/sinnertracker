# SinnerTracker — PRD v2: Design & Usability Improvements

**Version:** 2.0
**Data:** 2 Aprile 2026
**Autore:** Luca (Product Owner)
**Basato su:** Design critique del prototipo v4 live
**Stato:** Ready for engineering

---

## Problem Statement

Il prototipo v4 di SinnerTracker ha un design visivo forte ma presenta **problemi critici di accessibilita, consistenza dati e usabilita** che impediscono il lancio pubblico. Lo screen reader non riesce a navigare la pagina (zero headings, zero ARIA), i contrasti di colore falliscono WCAG AA su testi chiave, e i dati tra le tab sono incoerenti (la tab Ranking mostra dati pre-QF Miami mentre la Overview mostra dati post-Miami). La tab Quote mostra mercati di un evento gia concluso. Questi problemi distruggono la fiducia dell'utente e rendono il prodotto inaccessibile al ~15% degli utenti con disabilita visive.

---

## Goals

| # | Goal | KPI | Target |
|---|------|-----|--------|
| G1 | Raggiungere conformita WCAG 2.1 AA su tutti i testi | Contrast ratio minimo | >= 4.5:1 su tutti i testi, >= 3:1 su testi large (18px+) |
| G2 | Rendere la pagina navigabile da screen reader e tastiera | Lighthouse Accessibility score | >= 90 |
| G3 | Eliminare ogni dato incoerente tra tab | Zero discrepanze tra sezioni | 100% dati sincronizzati |
| G4 | Riflettere lo stato corrente del circuito (non dati stale) | Timestamp aggiornamento visibile | Ogni sezione mostra "Aggiornato alle HH:MM" |
| G5 | Migliorare l'esperienza mobile (target >65% del traffico) | Lighthouse Mobile Performance | >= 85, touch target >= 44px |

## Non-Goals

| # | Non-Goal | Motivazione |
|---|----------|-------------|
| NG1 | Backend/API — nessuna integrazione con dati live | Coperto dal PRD v1 (Fase 1). Questo PRD riguarda solo il frontend statico |
| NG2 | Redesign completo del layout | Il layout v4 funziona. Si interviene su accessibilita, consistenza e polish |
| NG3 | Dark mode | Prematura. Il light theme e' validato. Dark mode e' un'iterazione futura |
| NG4 | Internazionalizzazione (EN) | Il target MVP sono i fan italiani. Inglese e' un'iterazione post-lancio |
| NG5 | PWA / service worker | Aggiunge complessita senza valore per il lancio statico |

---

## Feature 1: Semantic HTML & ARIA Tab Pattern

### Problem
La pagina non ha nessun heading semantico (`<h1>`-`<h6>`) e il sistema di tab non ha attributi ARIA. Uno screen reader legge la pagina come un blocco di testo continuo senza struttura. La navigazione da tastiera tra le tab non funziona.

### User Stories

**US-1.1** Come utente che naviga con screen reader, voglio che la pagina abbia una gerarchia di headings corretta, in modo da poter saltare tra le sezioni usando i comandi del reader.

**US-1.2** Come utente che naviga con la tastiera, voglio poter usare Tab per raggiungere la barra di navigazione e le frecce sinistra/destra per spostarmi tra le tab, in modo da non aver bisogno del mouse.

**US-1.3** Come utente che naviga con screen reader, voglio che la tab attiva sia annunciata come "selezionata" e che il pannello associato sia identificato, in modo da capire dove mi trovo.

### Requirements — Must Have (P0)

**R-1.1 Heading hierarchy**
- `<h1>` per "SinnerTracker" nell'header
- `<h2>` per il titolo di ogni tab panel (es. "Overview", "Notizie", "Ranking"...)
- `<h3>` per ogni card title all'interno dei panel

Acceptance criteria:
- [ ] `document.querySelectorAll('h1')` ritorna esattamente 1 elemento
- [ ] Ogni `.pane` contiene almeno un `<h2>` come primo heading
- [ ] Ogni `.card-title` e' un `<h3>` (non un `<div>`)
- [ ] Nessun heading level viene saltato (no h1 -> h3 senza h2)
- [ ] Lighthouse Accessibility non segnala "Heading elements are not in sequentially-descending order"

**R-1.2 ARIA tab pattern**
Implementare il pattern WAI-ARIA Tabs:

```
<div role="tablist" aria-label="Sezioni SinnerTracker">
  <button role="tab" aria-selected="true" aria-controls="pane-live" id="tab-live">Overview</button>
  <button role="tab" aria-selected="false" aria-controls="pane-news" id="tab-news" tabindex="-1">Notizie</button>
  ...
</div>
<div role="tabpanel" id="pane-live" aria-labelledby="tab-live">...</div>
```

Acceptance criteria:
- [ ] Il container delle tab ha `role="tablist"` e `aria-label`
- [ ] Ogni tab button ha `role="tab"`, `aria-selected`, `aria-controls`
- [ ] Ogni panel ha `role="tabpanel"` e `aria-labelledby`
- [ ] Solo la tab attiva ha `tabindex="0"`, le altre `tabindex="-1"`
- [ ] `aria-selected` si aggiorna quando si cambia tab

**R-1.3 Keyboard navigation**

Acceptance criteria:
- [ ] `Tab` key porta il focus sulla tab attiva nella tablist
- [ ] Freccia destra/sinistra sposta il focus tra le tab
- [ ] `Enter` o `Space` attiva la tab focused
- [ ] La tab focused ha un visible focus ring (outline 2px `#FF7A00`, offset 2px)
- [ ] `Tab` key dalla tablist porta al primo elemento interattivo nel panel attivo
- [ ] I panel nascosti hanno `tabindex="-1"` o `hidden` per impedire il focus su elementi non visibili

**R-1.4 Skip-to-content link**

Acceptance criteria:
- [ ] Un link "Vai al contenuto" e' il primo elemento focusable della pagina
- [ ] E' visualmente nascosto fino al focus (`:focus` lo rende visibile)
- [ ] Clicking/activating il link porta il focus al `<main>` content

### Requirements — Nice to Have (P1)

**R-1.5 Landmark regions**
- `<header>` (gia presente), `<nav>`, `<main>` (gia presente), `<footer>` (da aggiungere)
- `aria-label` su `<nav>` ("Navigazione principale")

---

## Feature 2: Color Contrast Fix

### Problem
Diversi elementi di testo falliscono il requisito WCAG AA di contrast ratio minimo 4.5:1 per testo normale e 3:1 per testo large (>= 18px bold o >= 24px). Questo rende il testo illeggibile per utenti con deficit visivi e in condizioni di luce forte (uso outdoor su mobile).

### Elementi che falliscono (misurati)

| Elemento | Colore attuale | Background | Ratio attuale | Ratio richiesto | Fix proposto |
|----------|---------------|------------|---------------|-----------------|--------------|
| `.card-title` | `#999` | `#fff` | 2.85:1 | 4.5:1 | `#717171` |
| `.news-source` | `#bbb` | `#fff` | 1.93:1 | 4.5:1 | `#717171` |
| `.br-sub` | `#aaa` | `#fff` | 2.32:1 | 4.5:1 | `#717171` |
| `.mstat-lbl` | `#777` | `#1A1A1A` | 4.0:1 | 4.5:1 | `#909090` |
| `.b-gap-lbl` | `#888` | `#fff` | 3.54:1 | 4.5:1 | `#717171` |
| `.stat-lbl` | `#888` | `#fff` | 3.54:1 | 4.5:1 | `#717171` |
| `.match-when` | `#888` | `#1A1A1A` | 3.54:1 | 4.5:1 | `#999` (at 12px) |
| `.cal-date` | `#999` | `#fff` | 2.85:1 | 4.5:1 | `#717171` |
| `.odds-lbl` | `#aaa` | `#fff` | 2.32:1 | 4.5:1 | `#717171` |

### Requirements — Must Have (P0)

**R-2.1 Fix all failing contrast ratios**

Nuova scala di grigi con ruoli definiti:

| Token | Hex | Ratio su `#fff` | Uso |
|-------|-----|-----------------|-----|
| `--text-primary` | `#1A1A1A` | 16.6:1 | Titoli, testo principale |
| `--text-secondary` | `#555555` | 7.46:1 | Sottotitoli, descrizioni importanti |
| `--text-muted` | `#717171` | 4.56:1 | Label, caption, timestamp, fonti — WCAG AA pass |
| `--text-disabled` | `#999999` | 2.85:1 | SOLO per testi decorativi non informativi (NON usare per label) |

Per lo sfondo scuro (`#1A1A1A`):

| Token | Hex | Ratio su `#1A1A1A` | Uso |
|-------|-----|---------------------|-----|
| `--text-on-dark` | `#FFFFFF` | 16.6:1 | Testo principale su card scura |
| `--text-on-dark-muted` | `#AAAAAA` | 5.72:1 | Label su card scura — WCAG AA pass |

Acceptance criteria:
- [ ] Nessun testo informativo ha un contrast ratio < 4.5:1
- [ ] Nessun testo large (>= 18px bold) ha un contrast ratio < 3:1
- [ ] I colori sono definiti come CSS custom properties in `:root`
- [ ] Lighthouse Accessibility non segnala contrast issues
- [ ] I colori accent (`#FF7A00`, `#2E9E5C`, `#FF3B30`) non sono usati come testo su sfondo bianco sotto i 18px (il loro ratio e' < 4.5:1)

**R-2.2 Verificare colori accent come testo**

I colori del brand usati come testo:
| Colore | Ratio su `#fff` | Status |
|--------|-----------------|--------|
| `#FF7A00` (arancione) | 3.07:1 | FAIL per testo < 18px bold |
| `#2E9E5C` (verde) | 3.87:1 | FAIL per testo < 18px bold |
| `#FF3B30` (rosso) | 3.86:1 | FAIL per testo < 18px bold |
| `#C9A227` (oro) | 3.58:1 | FAIL per testo < 18px bold |

Acceptance criteria:
- [ ] Orange/green/red/gold usati come testo SOLO quando il font-size >= 18px bold o >= 24px regular
- [ ] Per label e testo piccolo, usare le varianti su sfondo colorato (es. pill: `#2E9E5C` su `#E8F7EF` = 3.4:1 — OK per large text in pill)
- [ ] Il `.player-name.orange` (22px, 800 weight) = PASS (large text)
- [ ] Le `.news-tag` (10px) con colori accent = FAIL — servono versioni scure: `#C25E00` (arancione scuro), `#1E7A45` (verde scuro), `#CC2F26` (rosso scuro)

---

## Feature 3: Data Consistency & Stale State Handling

### Problem
Le tab mostrano dati da momenti diversi della sessione di lavoro. La tab Ranking mostra Sinner a 11.450 pts (pre-QF), la Overview a 12.400 (post-finale). La tab Quote mostra quote di una finale gia giocata. La tab Calendario segna Miami come "In corso". Questo crea confusione e distrugge la credibilita.

### User Stories

**US-3.1** Come fan che apre SinnerTracker, voglio che i dati siano coerenti su tutte le tab, in modo da fidarmi delle informazioni che leggo.

**US-3.2** Come fan che consulta le quote, voglio vedere i mercati attuali (Monte Carlo), non quelli di un torneo finito, in modo da avere informazioni utili.

**US-3.3** Come fan, voglio vedere quando i dati sono stati aggiornati l'ultima volta, in modo da sapere quanto sono recenti.

### Requirements — Must Have (P0)

**R-3.1 Sincronizzare tutti i dati al post-Miami (1 Aprile 2026)**

| Dato | Valore corretto | Tab coinvolte |
|------|----------------|---------------|
| Sinner punti | 12.400 | Overview, Ranking, Previsione |
| W/L 2026 | 17-1 | Overview, Ranking |
| Set consecutivi M1000 | 34 | Overview, Ranking |
| Big Titles carriera | 13 | Ranking |
| M1000 carriera | 7 | Overview, Ranking |
| Miami stato | Completato, 🏆 Vinto, +1000 | Calendario |
| Alcaraz punti | 13.590 | Ranking |
| Gap | -1.190 | Overview, Ranking |

Acceptance criteria:
- [ ] Sinner mostra 12.400 pts ovunque appaia il dato
- [ ] W/L mostra 17-1 in Overview e Ranking
- [ ] Set record mostra 34 in Overview e Ranking
- [ ] Big Titles mostra 13 (non 12) in Ranking
- [ ] Ranking tab: Sinner status aggiornato (non "In gara QF domani vs Tiafoe")
- [ ] Ranking tab: Zverev status aggiornato a "SF Miami" (non "QF vs Cerundolo")

**R-3.2 Aggiornare tab Calendario**

Acceptance criteria:
- [ ] Miami appare nella sezione "Gia giocati" con punteggio `+1000` e pill `🏆 Vinto`
- [ ] La sezione "In corso" e' vuota o rimossa (nessun torneo attivo il 2 aprile)
- [ ] Monte Carlo appare come "Prossimo" con data corretta 5-13 Apr
- [ ] Le date di Monte Carlo sono corrette: 5-13 Apr (non 6-13)

**R-3.3 Aggiornare tab Quote a Monte Carlo**

Acceptance criteria:
- [ ] "Partita di domani" rimosso — sostituito con "Prossimo torneo: Monte Carlo"
- [ ] Quote Miami rimosse (torneo concluso)
- [ ] Quote Monte Carlo inserite: Sinner vincitore ~1.90, Alcaraz ~2.20
- [ ] Tutti i mercati speciali aggiornati con le quote correnti
- [ ] Ogni mercato mostra "Ultimo aggiornamento: [data]"

**R-3.4 Rinominare tab "Miami Live" in "Overview"**

Acceptance criteria:
- [ ] La prima tab si chiama "Overview" (non "Miami Live")
- [ ] Il contenuto della tab riflette lo stato corrente: Monte Carlo come prossimo torneo, Miami come recap storico
- [ ] La funzione `go()` funziona con il nuovo id

### Requirements — Nice to Have (P1)

**R-3.5 Centralizzare i dati in un oggetto JS**

Creare un oggetto `DATA` globale da cui tutte le tab leggono, in preparazione per la futura migrazione alle API.

```javascript
const DATA = {
  sinner: { points: 12400, rank: 2, wl: "17-1", ... },
  alcaraz: { points: 13590, rank: 1, ... },
  gap: -1190,
  virtualGap: -190,
  currentTournament: null,
  nextTournament: { name: "Monte Carlo", dates: "5-13 Apr", ... },
  lastUpdated: "2026-04-01T23:00:00Z"
};
```

Acceptance criteria:
- [ ] Tutti i valori numerici nella pagina sono renderizzati da `DATA`, non hardcoded nell'HTML
- [ ] Modificare un valore in `DATA` aggiorna tutte le tab che lo mostrano
- [ ] `DATA.lastUpdated` e' visibile nel footer

---

## Feature 4: Footer & Metadata

### Problem
La pagina non ha footer, nessun disclaimer legale, nessuna attribuzione delle fonti, nessun timestamp di aggiornamento. La fine della pagina e' uno spazio vuoto. Per un sito che mostra quote di scommesse, il disclaimer e' obbligatorio per legge (AAMS/ADM in Italia).

### User Stories

**US-4.1** Come fan, voglio vedere quando i dati sono stati aggiornati, in modo da sapere se sono attuali.

**US-4.2** Come utente, voglio un chiaro disclaimer che i dati non sono ufficiali, in modo da non prendere decisioni basate su informazioni potenzialmente errate.

### Requirements — Must Have (P0)

**R-4.1 Footer globale**

Contenuto:
- Timestamp: "Dati aggiornati al [DATA.lastUpdated]"
- Disclaimer: "I dati provengono da fonti pubbliche e potrebbero non essere aggiornati in tempo reale. SinnerTracker non e' affiliato con ATP Tour, Jannik Sinner o i suoi rappresentanti."
- Disclaimer quote: "Le quote riportate sono indicative. Il gioco d'azzardo e' vietato ai minori di 18 anni e puo causare dipendenza. Gioca responsabilmente."
- Link: "Numero Verde: 800 558 822"

Acceptance criteria:
- [ ] Il `<footer>` e' presente come ultimo elemento del `<body>`
- [ ] Il footer e' visibile su tutte le tab
- [ ] Il footer usa il tag semantico `<footer>`
- [ ] Font size >= 11px, contrast ratio >= 4.5:1
- [ ] Il disclaimer quote e' presente anche nella tab Quote (gia c'e') E nel footer globale

**R-4.2 Meta tag Open Graph**

```html
<meta property="og:title" content="SinnerTracker — Tutto su Jannik Sinner in tempo reale">
<meta property="og:description" content="Ranking ATP, partite live, corsa al N.1 e quote. La dashboard per i fan italiani di Sinner.">
<meta property="og:type" content="website">
<meta property="og:locale" content="it_IT">
<meta name="description" content="Ranking ATP, partite live, calendario tornei, corsa al N.1 e quote. Tutto su Jannik Sinner in una pagina.">
<meta name="twitter:card" content="summary_large_image">
```

Acceptance criteria:
- [ ] Tutti i meta tag OG sono presenti nell'`<head>`
- [ ] `og:title` e `og:description` sono compilati
- [ ] `<title>` contiene "SinnerTracker"
- [ ] `<meta name="description">` e' presente e < 160 caratteri

---

## Feature 5: Mobile Responsiveness Polish

### Problem
L'app ha un breakpoint a 600px che trasforma la griglia stat da 4 a 2 colonne, ma la hero card con i 4 stat (PTS DA DIFENDERE, ALCARAZ IN SCADENZA, etc.) non ha breakpoint e diventa illeggibile sotto i 400px. Le tab bar non ha indicatore visivo di scroll orizzontale. I form dots sono 32x32px, sotto i 44px minimi per touch target su mobile.

### Requirements — Must Have (P0)

**R-5.1 Hero card stat grid responsive**

Acceptance criteria:
- [ ] Su viewport < 500px, la griglia `.match-stats` passa da 4 colonne a 2x2
- [ ] Su viewport < 500px, `.match-players` passa a layout verticale (stack)
- [ ] I numeri rimangono leggibili (min 18px) su mobile
- [ ] Le label rimangono su una riga (no wrapping che rompe il layout)

**R-5.2 Tab bar scroll affordance**

Acceptance criteria:
- [ ] Su viewport dove le tab eccedono la larghezza, un fade gradient (bianco->trasparente) appare sul lato destro per indicare che ci sono piu tab
- [ ] Il fade scompare quando l'utente ha scrollato fino alla fine
- [ ] Le tab hanno `scroll-snap-type: x mandatory` per snap behavior

**R-5.3 Touch target sizes**

Acceptance criteria:
- [ ] Su viewport < 768px, i form dots (`.fd`) sono 44x44px (non 32x32)
- [ ] Le tab hanno un'area cliccabile di almeno 44px di altezza
- [ ] Tutti i bottoni e elementi interattivi hanno min 44x44px touch target su mobile

### Requirements — Nice to Have (P1)

**R-5.4 Scenario cards responsive**
- [ ] Su viewport < 650px, la griglia `.sc-grid` e' gia 1 colonna (OK, gia implementato)
- [ ] Su viewport 650-900px, le 3 card scenario sono leggibili con testo non troncato

---

## Feature 6: Interactive Elements & Links

### Problem
La pagina ha zero tag `<a>`. Le news mostrano la fonte ma non linkano all'articolo originale. I nomi dei tornei non linkano alle pagine ATP. Questo riduce l'utilita come "hub" e penalizza la SEO (zero outbound links).

### User Stories

**US-6.1** Come fan che legge una notizia, voglio poter cliccare sulla fonte per leggere l'articolo completo, in modo da approfondire.

**US-6.2** Come fan, voglio poter cliccare sul nome di un torneo per vedere il tabellone ufficiale su ATP Tour, in modo da avere i dettagli completi.

### Requirements — Must Have (P0)

**R-6.1 News source links**

Acceptance criteria:
- [ ] Ogni news item ha almeno un link cliccabile alla fonte
- [ ] I link si aprono in `target="_blank"` con `rel="noopener noreferrer"`
- [ ] I link hanno stile visivo distinguibile (underline o colore diverso dal testo)
- [ ] I link hanno `:hover` e `:focus` states

**R-6.2 Logo link**

Acceptance criteria:
- [ ] Il logo "SinnerTracker" nell'header e' un `<a href="/">` che riporta alla home / Overview
- [ ] Il link ha `aria-label="SinnerTracker - Torna alla home"`

### Requirements — Nice to Have (P1)

**R-6.3 Tournament name links**
- [ ] I nomi dei tornei nel Calendario linkano alla pagina ufficiale ATP del torneo
- [ ] Il link e' discreto (no stile aggressivo, solo underline on hover)

---

## Feature 7: Visual Consistency Polish

### Problem
Diversi elementi usano wording, colori e formattazione incoerenti tra le tab per lo stesso dato.

### Requirements — Must Have (P0)

**R-7.1 Unificare label del gap**

Acceptance criteria:
- [ ] Il gap usa lo stesso wording ovunque: "punti di distacco" (non alternare "punti dietro" / "di distacco")

**R-7.2 Unificare colori stat box**

Standard:
| Stat | Border-top color |
|------|-----------------|
| W/L | `#C9A227` (gold) |
| Set record M1000 | `#2E9E5C` (green) |
| Titoli stagione | `#FF7A00` (orange) |
| Stat carriera | `#ccc` (gray) |

Acceptance criteria:
- [ ] Overview e Ranking usano gli stessi colori per le stesse stat box
- [ ] Il mapping colore->tipo stat e' consistente su tutte le tab

**R-7.3 Unificare formato date**

Standard: `DD Mon` per date brevi, `DD Mon YYYY` per date con anno.

Acceptance criteria:
- [ ] Tutte le date nella UI seguono lo stesso formato
- [ ] I mesi sono abbreviati in italiano a 3 lettere: Gen, Feb, Mar, Apr, Mag, Giu, Lug, Ago, Set, Ott, Nov, Dic

### Requirements — Nice to Have (P1)

**R-7.4 Empty state per sezioni senza dati**
- [ ] Se non c'e' un torneo in corso, la sezione "In corso" nel Calendario mostra un messaggio "Nessun torneo in corso" invece di scomparire

---

## Prioritization Summary

### Sprint 1 — Blockers per il lancio (P0)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| R-3.1 | Sync dati post-Miami su tutte le tab | S | Critico — dati sbagliati = zero credibilita |
| R-3.2 | Aggiornare Calendario | S | Critico — mostra stato errato |
| R-3.3 | Aggiornare Quote a Monte Carlo | M | Critico — quote di evento concluso |
| R-3.4 | Rinominare tab "Miami Live" -> "Overview" | XS | Critico — naming stale |
| R-2.1 | Fix contrast ratios (scala grigi) | M | Critico — WCAG fail |
| R-2.2 | Fix colori accent come testo piccolo | S | Critico — WCAG fail |
| R-4.1 | Footer globale con disclaimer | S | Critico — obbligatorio per legge (quote) |
| R-4.2 | Meta tag OG | XS | Importante — condivisione social |

### Sprint 2 — Accessibilita (P0)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| R-1.1 | Heading hierarchy | S | Critico — screen reader |
| R-1.2 | ARIA tab pattern | M | Critico — screen reader |
| R-1.3 | Keyboard navigation | M | Critico — accessibility |
| R-1.4 | Skip-to-content link | XS | Moderato — best practice |
| R-5.1 | Hero card responsive | S | Importante — mobile |
| R-5.3 | Touch target 44px | S | Importante — mobile |

### Sprint 3 — Polish (P1)

| # | Feature | Effort | Impact |
|---|---------|--------|--------|
| R-3.5 | Centralizzare dati in oggetto JS | M | Alto — prepara per API |
| R-5.2 | Tab bar scroll affordance | S | Moderato — UX mobile |
| R-6.1 | News source links | S | Moderato — utilita + SEO |
| R-6.2 | Logo link | XS | Minor — standard web |
| R-7.1-7.4 | Consistency polish | S | Moderato — qualita percepita |
| R-1.5 | Landmark regions | XS | Minor — best practice |

**Size legend:** XS = < 30 min | S = 30 min - 2h | M = 2h - 4h | L = 4h+

---

## Open Questions

| # | Domanda | Chi risponde | Blocking? |
|---|---------|-------------|-----------|
| Q1 | Le quote Monte Carlo sono gia disponibili dai bookmaker? Servono dati reali prima di aggiornare la tab Quote | Product Owner | Si — blocca R-3.3 |
| Q2 | Il dominio sinnertracker.it e' gia stato registrato? Serve per i meta tag `og:url` | Product Owner | No — si puo usare il dominio Vercel temporaneo |
| Q3 | Serve un font fallback per Inter? Se Google Fonts CDN e' lento, il FOUT (Flash of Unstyled Text) e' accettabile? | Engineering | No |
| Q4 | Per R-3.5 (data object): usare un approccio reattivo (tipo Alpine.js) o puro vanilla JS con render functions? | Engineering | No — decisione implementativa |

---

## Success Metrics

### Leading (1 settimana post-lancio)
| Metrica | Target | Stretch | Come si misura |
|---------|--------|---------|----------------|
| Lighthouse Accessibility | >= 90 | >= 95 | Lighthouse CI su ogni deploy |
| Lighthouse Mobile Performance | >= 85 | >= 90 | Lighthouse CI |
| Zero contrast WCAG failures | 0 errori | 0 errori | axe-core audit |
| Bounce rate mobile | < 60% | < 50% | Plausible Analytics |

### Lagging (30 giorni post-lancio)
| Metrica | Target | Come si misura |
|---------|--------|----------------|
| Return visitors | > 30% | Plausible |
| Avg session duration | > 90 sec | Plausible |
| Tab piu visitata dopo Overview | Identificata | Plausible (custom events per tab switch) |

---

*SinnerTracker PRD v2 — Design & Usability Improvements — 2 Aprile 2026*
