// ═══════════════════════════════════════════════════════
// SinnerTracker — App Logic
// Renderizza tutte le tab da DATA e gestisce navigazione
// ═══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", async () => {
  await loadData();
  renderAll();
  initTabs();
  initTabScrollIndicator();
});

// ── XSS PROTECTION ──────────────────────────────────────
// HTML escape per prevenire injection da campi user-generated.
// Tutti i campi che vengono da Supabase (news, headlines, opponents, ecc.)
// devono passare da esc() prima di essere interpolati in innerHTML.
function esc(s) {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// URL whitelist: solo http(s) sono ammessi (nessun javascript:)
function safeUrl(u) {
  if (!u) return "#";
  const s = String(u).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return "#";
}

// ── RENDER ──────────────────────────────────────────────

function renderAll() {
  renderOverview();
  renderNews();
  renderRanking();
  renderCalendario();
  renderPrevisione();
  renderQuote();
  renderFooter();
}

function renderOverview() {
  const el = document.getElementById("pane-overview");
  const S = DATA.sinner;
  const A = DATA.alcaraz;
  const T = DATA.currentTournament || DATA.nextTournament;
  const M = DATA.miamiRecap;
  const barPct = Math.round((S.points / A.points) * 100);
  const isLive = !!DATA.currentTournament;
  const nm = isLive && T ? T.sinnerNextMatch : null;

  // Bracket: played matches sorted most recent first
  const playedMatches = (T?.sinnerPath || []).filter(p => p.result).reverse();
  const upcomingMatches = (T?.sinnerPath || []).filter(p => !p.result);

  el.innerHTML = `
    <h2 class="visually-hidden">Overview</h2>

    <!-- ═══ NEXT MATCH — always on top, most prominent ═══ -->
    <div class="match-hero">
      ${T ? `
      <div class="tournament-label">
        ${isLive ? '\u{1F534}' : '\u{1F3AF}'} ${esc(T.name)}
        <span class="tournament-meta">${esc(T.surface)} &middot; ${esc(T.location)}</span>
      </div>
      ` : ''}

      ${nm ? `
      <div class="next-match-banner">
        <div class="next-match-label">${esc(nm.round)} &middot; Prossimo match</div>
        <div class="next-match-when">${esc(nm.scheduled)}</div>
      </div>
      <div class="match-matchup">
        <div class="matchup-player">
          <div class="matchup-name orange">${esc(S.name)}</div>
          <div class="matchup-info">${S.flag} N.${S.rank} &middot; [${T.sinnerSeed}]</div>
        </div>
        <div class="matchup-vs">VS</div>
        <div class="matchup-player right">
          <div class="matchup-name">${esc(nm.opponent)}</div>
          <div class="matchup-info">${nm.opponentRank ? `N.${esc(nm.opponentRank)}` : ''}${nm.h2h ? ` &middot; ${esc(nm.h2h)}` : ''}</div>
        </div>
      </div>
      ` : `
      <div style="text-align:center;padding:16px 0;color:var(--text-on-dark-muted);font-size:14px;">
        Nessun match programmato
      </div>
      `}
    </div>

    <!-- ═══ GAP TO N.1 — one clear line ═══ -->
    <div class="gap-strip">
      <div class="gap-strip-left">
        <span class="gap-strip-number" style="color:var(--orange);">${fmtPts(Math.abs(DATA.gap))}</span>
        <span class="gap-strip-label">pts dal N.1</span>
      </div>
      <div class="gap-strip-right">
        ${Math.abs(DATA.virtualGap) < Math.abs(DATA.gap) ?
          `<span class="gap-strip-virtual">${fmtPts(Math.abs(DATA.virtualGap))} virtuali</span>` : ''}
        ${T?.alcarazDefends > 0 ?
          `<span class="gap-strip-note">Se vince ${esc(T.name?.split(' 2026')[0] || 'il torneo')} = <strong>N.1</strong></span>` : ''}
      </div>
    </div>

    <!-- ═══ TORNEO CORRENTE — played matches (most recent first) + upcoming ═══ -->
    ${(playedMatches.length > 0 || upcomingMatches.length > 0) ? `
    <div class="card">
      <h3 class="card-title">${esc(T.name?.split(' 2026')[0] || 'Torneo')} &mdash; Percorso</h3>

      ${playedMatches.map(p => {
        const won = p.result === "W";
        return `
        <div class="bracket-row">
          <div class="br-round">${esc(p.round)}</div>
          <div><div class="br-opp">${esc(p.opponent)}</div></div>
          <div class="br-score" style="color:${won ? 'var(--green)' : 'var(--red)'}">${esc(p.score || '')}</div>
          <div><span class="pill ${won ? 'pill-green' : 'pill-red'}">${esc(p.result)}</span></div>
        </div>`;
      }).join('')}

      ${upcomingMatches.length > 0 && playedMatches.length > 0 ? '<div style="border-top:1px solid var(--border-light);margin:8px 0;"></div>' : ''}

      ${upcomingMatches.map(p => {
        const isNext = p.round === nm?.round;
        return `
        <div class="bracket-row${isNext ? ' final-row' : ''}">
          <div class="br-round" ${isNext ? 'style="color:var(--orange);"' : ''}>${esc(p.round)}</div>
          <div><div class="br-opp" ${isNext ? 'style="color:var(--orange);font-weight:700;"' : ''}>${esc(p.opponent)}</div>${p.seed ? `<div class="br-sub">Seed ${esc(p.seed)}</div>` : ''}</div>
          <div class="br-score"></div>
          <div><span class="pill ${isNext ? 'pill-orange' : 'pill-gray'}">${isNext ? 'Prossimo' : 'TBD'}</span></div>
        </div>`;
      }).join('')}
    </div>
    ` : ''}

    <!-- ═══ STATS — compact row ═══ -->
    <div class="stat-row">
      <div class="stat-box gold-top"><div class="stat-num" style="color:var(--gold);">${esc(S.wl)}</div><div class="stat-lbl">W/L 2026</div></div>
      <div class="stat-box green-top"><div class="stat-num">${esc(S.titles2026)}</div><div class="stat-lbl">Titoli 2026</div></div>
      <div class="stat-box"><div class="stat-num">${esc(S.m1000Career)}</div><div class="stat-lbl">M1000 carriera</div></div>
      <div class="stat-box gray-top"><div class="stat-num">${esc(S.prizeMoney)}</div><div class="stat-lbl">Prize money</div></div>
    </div>

    <!-- ═══ FORM DOTS ═══ -->
    <div class="card">
      <h3 class="card-title">Ultimi risultati</h3>
      <div class="form-row">
        ${DATA.recentForm.map(f => `<div class="fd ${f.result === 'W' ? 'w' : 'l'}" title="${esc(f.detail)}">${esc(f.result)}</div>`).join('')}
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:8px;">&larr; pi&ugrave; recente</div>
    </div>
  `;
}

function renderNews() {
  const el = document.getElementById("pane-news");
  const typeMap = { green: "green", orange: "orange", red: "red", gray: "" };
  const tagMap = { green: "tag-g", orange: "tag-o", red: "tag-r", gray: "tag-gray" };

  el.innerHTML = `
    <h2 class="visually-hidden">Notizie</h2>
    <div class="section-label">Post-Miami &middot; Verso Monte Carlo &mdash; 1 Apr 2026</div>
    ${DATA.news.map(n => `
      <article class="news-item ${typeMap[n.type] || ''}">
        <div class="news-icon">${esc(n.icon)}</div>
        <div>
          <div class="news-tag ${tagMap[n.type]}">${esc(n.tag)}${n.tagDate ? ' &middot; ' + esc(n.tagDate) : ''}</div>
          <div class="news-headline">${esc(n.headline)}</div>
          <div class="news-desc">${esc(n.desc)}</div>
          <div class="news-source"><a href="${esc(safeUrl(n.url))}" target="_blank" rel="noopener noreferrer">${esc(n.source)}</a> &middot; ${esc(n.sourceDate)}</div>
        </div>
      </article>
    `).join('')}
  `;
}

function renderRanking() {
  const el = document.getElementById("pane-ranking");
  const S = DATA.sinner;
  const A = DATA.alcaraz;
  const barPct = Math.round((S.points / A.points) * 100);

  el.innerHTML = `
    <h2 class="visually-hidden">Ranking ATP</h2>
    <div class="card">
      <h3 class="card-title">Top 5 ATP &mdash; Post-Miami 2026</h3>
      ${DATA.ranking.map(r => `
        <div class="top5-row ${r.highlight ? 'highlight' : 'plain'}">
          <div class="top5-pos ${r.rank === 1 ? 'pos-gold' : r.rank === 2 ? 'pos-orange' : 'pos-gray'}">${esc(r.rank)}</div>
          <div>
            <div class="top5-name">${esc(r.name)} ${esc(r.flag)}</div>
            <div class="top5-status"${r.highlight ? ' style="color:var(--orange);"' : ''}>${esc(r.status)}</div>
          </div>
          <div class="top5-pts" ${r.rank === 1 ? 'style="color:var(--gold);"' : r.rank === 2 ? 'style="color:var(--orange);"' : ''}>${fmtPts(r.points)}</div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <h3 class="card-title">Battaglia per il N.1</h3>
      <div class="battle">
        <div class="b-player">
          <div class="b-name" style="color:var(--orange);">Sinner</div>
          <div class="b-pts">${fmtPts(S.points)} pts</div>
          <div class="b-rank rank-2">#${S.rank}</div>
        </div>
        <div class="b-gap">
          <div class="b-gap-val">${fmtPts(DATA.gap)}</div>
          <div class="b-gap-lbl">punti di distacco</div>
        </div>
        <div class="b-player right">
          <div class="b-name" style="color:var(--gold);">Alcaraz</div>
          <div class="b-pts">${fmtPts(A.points)} pts</div>
          <div class="b-rank rank-1">#${A.rank}</div>
        </div>
      </div>
      <div class="bar"><div class="bar-inner" style="width:${barPct}%"></div></div>
      <div class="note-box" style="margin-top:12px;">
        Con la vittoria di Miami (+1.000 pts) e Alcaraz fuori a Monte Carlo (&minus;1.000 in scadenza): gap &rarr; ~${Math.abs(DATA.virtualGap)} pts. Una vittoria a Monte Carlo = <strong>ritorno al N.1 automatico</strong>.
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-box gold-top"><div class="stat-num" style="color:var(--gold);">${esc(S.wl)}</div><div class="stat-lbl">Win/Loss 2026</div></div>
      <div class="stat-box green-top"><div class="stat-num">${esc(S.setsM1000)}</div><div class="stat-lbl">Set M1000 di fila &mdash; Record</div></div>
      <div class="stat-box"><div class="stat-num">${esc(S.bigTitles)}</div><div class="stat-lbl">Big Titles in carriera</div></div>
      <div class="stat-box gray-top"><div class="stat-num">${esc(S.prizeMoney)}</div><div class="stat-lbl">Prize money carriera</div></div>
    </div>
  `;
}

function renderCalendario() {
  const el = document.getElementById("pane-calendario");
  const C = DATA.calendario;

  function calRows(items) {
    return items.map(t => {
      const ptsClass = t.pts.startsWith('+') ? 'pos' : t.pts.startsWith('\u2013') || t.pts.startsWith('-') ? 'neg' : 'neutral';
      const pillClass = { green: 'pill-green', orange: 'pill-orange', red: 'pill-red', gray: 'pill-gray' }[t.statusType];
      return `
        <div class="cal-row">
          <div class="cal-date">${esc(t.dates)}</div>
          <div><div class="cal-name">${esc(t.name)}</div><div class="cal-surface">${esc(t.surface)}</div></div>
          <div class="cal-pts ${ptsClass}">${esc(t.pts)}</div>
          <div><span class="pill ${pillClass}">${esc(t.status)}</span></div>
        </div>`;
    }).join('');
  }

  el.innerHTML = `
    <h2 class="visually-hidden">Calendario Tornei 2026</h2>
    <div class="card">
      <h3 class="card-title">Gi&agrave; giocati</h3>
      ${calRows(C.giocati)}
    </div>
    <div class="card">
      <h3 class="card-title">Clay Swing &mdash; Prossimi</h3>
      ${calRows(C.claySwinG)}
    </div>
    <div class="card">
      <h3 class="card-title">Grass &amp; Hard &mdash; Secondo semestre</h3>
      ${calRows(C.secondoSemestre)}
    </div>
  `;
}

function renderPrevisione() {
  const el = document.getElementById("pane-previsione");

  el.innerHTML = `
    <h2 class="visually-hidden">Previsione N.1</h2>
    <div class="sc-grid">
      ${DATA.scenari.map(s => `
        <div class="scenario ${s.type === 'best' ? 'best' : s.type === 'mid' ? 'mid' : 'worst'}">
          <div class="sc-tag">${esc(s.tag)}</div>
          <div class="sc-date">${esc(s.date)}</div>
          <div class="sc-desc">${esc(s.desc)}</div>
          <div class="sc-prob">Probabilit&agrave;: ${esc(s.prob)}</div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <h3 class="card-title">Punti guadagnabili vs punti che Alcaraz difende</h3>
      <div class="pred-header">
        <span>Torneo</span><span></span><span style="text-align:right;">Sinner max</span><span style="text-align:right;">Alcaraz difende</span>
      </div>
      ${DATA.previsione.map(p => {
        const negClass = p.alcarazDifende.startsWith('\u2013') || p.alcarazDifende.startsWith('-') ? 'neg' : 'neutral';
        // barWidth and barColor are interpolated into a style attribute — sanitize strictly
        const safeWidth = /^\d{1,3}%$/.test(p.barWidth) ? p.barWidth : '50%';
        const safeColor = /^#[0-9A-Fa-f]{3,8}$/.test(p.barColor) ? p.barColor : '#FF7A00';
        return `
        <div class="pred-row">
          <div class="pred-name">${esc(p.torneo)}${p.done ? ' &#x2705;' : ''}</div>
          <div class="pred-bar"><div class="pred-bar-inner" style="width:${safeWidth};background:${safeColor};"></div></div>
          <div class="pred-val pos">${esc(p.sinnerMax)}</div>
          <div class="pred-val ${negClass}">${esc(p.alcarazDifende)}</div>
        </div>`;
      }).join('')}
    </div>
  `;
}

function renderQuote() {
  const el = document.getElementById("pane-quote");
  const Q = DATA.quote;

  el.innerHTML = `
    <h2 class="visually-hidden">Quote</h2>
    <div class="card">
      <h3 class="card-title">Prossimo torneo &mdash; Monte Carlo Masters</h3>
      <p style="font-size:13px;color:var(--text-secondary);padding:12px 0;">Sorteggio venerd&igrave; 3 aprile. Le quote per i singoli match saranno disponibili dopo il sorteggio.</p>
    </div>

    <div class="card">
      <h3 class="card-title">Quote speciali &mdash; Tornei e ranking</h3>
      ${Q.speciali.map(q => `
        <div class="odds-row">
          <div><div class="odds-match">${esc(q.market)}</div><div class="odds-sub">${esc(q.sub)}</div></div>
          <div class="odds-block"><div class="odds-val">${esc(q.val1)}</div><div class="odds-lbl">${esc(q.lbl1)}</div></div>
          <div class="odds-block"><div class="odds-val secondary">${esc(q.val2)}</div><div class="odds-lbl">${esc(q.lbl2)}</div></div>
          <div><span class="odds-tag ${q.tagType === 'green' ? 'ot-green' : 'ot-orange'}">${esc(q.tag)}</span></div>
        </div>
      `).join('')}
    </div>

    <div class="disclaimer">
      &#x26A0;&#xFE0F; Le quote sono indicative e a scopo informativo &mdash; non costituiscono invito al gioco.
      Il gioco &egrave; vietato ai minori di 18 anni e pu&ograve; causare dipendenza. Gioca responsabilmente.
      Numero Verde: <strong>800 558 822</strong>
    </div>
  `;
}

function renderFooter() {
  const el = document.getElementById("site-footer");
  const date = new Date(DATA.lastUpdated);
  const formatted = date.toLocaleDateString("it-IT", { day: "numeric", month: "long", year: "numeric" });

  el.innerHTML = `
    <div class="footer-inner">
      <p class="footer-updated">Dati aggiornati al ${formatted}</p>
      <p>I dati provengono da fonti pubbliche e potrebbero non essere aggiornati in tempo reale. SinnerTracker non &egrave; affiliato con ATP Tour, Jannik Sinner o i suoi rappresentanti.</p>
      <p class="footer-legal">Le quote riportate sono indicative. Il gioco d'azzardo &egrave; vietato ai minori di 18 anni e pu&ograve; causare dipendenza. Gioca responsabilmente. Numero Verde: <strong>800 558 822</strong></p>
    </div>
  `;
}

// ── TABS ─────────────────────────────────────────────────

function initTabs() {
  const tabs = document.querySelectorAll('[role="tab"]');
  const tabList = document.querySelector('[role="tablist"]');

  tabs.forEach(tab => {
    tab.addEventListener("click", () => activateTab(tab));
    tab.addEventListener("keydown", (e) => {
      const tabsArr = Array.from(tabs);
      const idx = tabsArr.indexOf(tab);
      let newIdx;

      if (e.key === "ArrowRight") {
        newIdx = (idx + 1) % tabsArr.length;
      } else if (e.key === "ArrowLeft") {
        newIdx = (idx - 1 + tabsArr.length) % tabsArr.length;
      } else if (e.key === "Home") {
        newIdx = 0;
      } else if (e.key === "End") {
        newIdx = tabsArr.length - 1;
      } else {
        return;
      }

      e.preventDefault();
      tabsArr[newIdx].focus();
      activateTab(tabsArr[newIdx]);
    });
  });
}

function activateTab(tab) {
  const tabs = document.querySelectorAll('[role="tab"]');
  const panels = document.querySelectorAll('[role="tabpanel"]');

  tabs.forEach(t => {
    t.setAttribute("aria-selected", "false");
    t.setAttribute("tabindex", "-1");
    t.classList.remove("active");
  });
  panels.forEach(p => {
    p.classList.remove("active");
    p.setAttribute("hidden", "");
  });

  tab.setAttribute("aria-selected", "true");
  tab.setAttribute("tabindex", "0");
  tab.classList.add("active");

  const panel = document.getElementById(tab.getAttribute("aria-controls"));
  panel.classList.add("active");
  panel.removeAttribute("hidden");

  // Scroll panel to top
  window.scrollTo({ top: 0 });
}

// ── TAB SCROLL INDICATOR ────────────────────────────────

function initTabScrollIndicator() {
  const tabBar = document.querySelector(".tab-bar");
  if (!tabBar) return;

  function checkScroll() {
    const hasScroll = tabBar.scrollWidth > tabBar.clientWidth;
    const atEnd = tabBar.scrollLeft + tabBar.clientWidth >= tabBar.scrollWidth - 5;
    tabBar.classList.toggle("has-scroll", hasScroll && !atEnd);
    tabBar.classList.toggle("scrolled-end", atEnd);
  }

  tabBar.addEventListener("scroll", checkScroll);
  window.addEventListener("resize", checkScroll);
  checkScroll();
}

// ── UTILITIES ───────────────────────────────────────────

function fmtPts(n) {
  if (typeof n === "string") return n;
  return new Intl.NumberFormat("it-IT").format(n);
}
