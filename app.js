// ═══════════════════════════════════════════════════════
// SinnerTracker — App Logic
// Renderizza tutte le tab da DATA e gestisce navigazione
// ═══════════════════════════════════════════════════════

document.addEventListener("DOMContentLoaded", () => {
  renderAll();
  initTabs();
  initTabScrollIndicator();
});

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
  const NT = DATA.nextTournament;
  const M = DATA.miamiRecap;
  const barPct = Math.round((S.points / A.points) * 100);

  el.innerHTML = `
    <h2 class="visually-hidden">Overview</h2>

    <div class="match-hero">
      <div class="match-hero-label">
        <span>Prossimo torneo &mdash; ${NT.name}</span>
        <span class="match-when">${NT.dates} &middot; ${NT.surface} &middot; ${NT.location}</span>
      </div>
      <div class="match-players">
        <div>
          <div class="player-name orange">${S.name}</div>
          <div class="player-flag">${S.flag} N.${S.rank} ATP &middot; ${fmtPts(S.points)} pts</div>
        </div>
        <div class="vs-block">
          <div class="vs">VS</div>
          <div class="round-label" style="font-size:20px;color:var(--gold);">&#x1F3AF;</div>
        </div>
        <div class="player-right">
          <div class="player-name">N.1 ATP</div>
          <div class="player-flag">Sorteggio ${NT.drawDate}</div>
        </div>
      </div>
      <div class="match-stats">
        <div class="mstat"><div class="mstat-val">${NT.sinnerDefends}</div><div class="mstat-lbl">Pts da difendere</div></div>
        <div class="mstat"><div class="mstat-val" style="color:var(--red);">&minus;${fmtPts(NT.alcarazDefends)}</div><div class="mstat-lbl">Alcaraz in scadenza</div></div>
        <div class="mstat"><div class="mstat-val" style="color:var(--gold);">${Math.abs(DATA.virtualGap)}</div><div class="mstat-lbl">Gap virtuale a inizio MC</div></div>
        <div class="mstat"><div class="mstat-val" style="color:var(--green);">N.1</div><div class="mstat-lbl">Se vince il torneo &#x1F3C6;</div></div>
      </div>
    </div>

    <div class="card">
      <h3 class="card-title">${M.title} &mdash; Risultati Finali &#x1F3C6;</h3>
      ${M.matches.map(m => `
        <div class="bracket-row${m.isFinal ? ' final-row' : ''}">
          <div class="br-round">${m.isFinal ? 'FINALE &#x1F3C6;' : m.round}</div>
          <div><div class="br-opp">${m.opponent}</div>${m.note ? `<div class="br-sub">${m.note}</div>` : ''}</div>
          <div class="br-score">${m.score}</div>
          <div><span class="pill pill-green">${m.isFinal ? '&#x1F3C6; WON' : 'W'}</span></div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <h3 class="card-title">Gap vs Alcaraz &mdash; Aggiornato post-Miami</h3>
      <div class="battle">
        <div class="b-player">
          <div class="b-name" style="color:var(--orange);">Sinner</div>
          <div class="b-pts">${fmtPts(S.points)} punti</div>
          <div class="b-rank rank-2">#${S.rank}</div>
        </div>
        <div class="b-gap">
          <div class="b-gap-val">${fmtPts(DATA.gap)}</div>
          <div class="b-gap-lbl">punti di distacco</div>
        </div>
        <div class="b-player right">
          <div class="b-name" style="color:var(--gold);">Alcaraz</div>
          <div class="b-pts">${fmtPts(A.points)} punti</div>
          <div class="b-rank rank-1">#${A.rank}</div>
        </div>
      </div>
      <div class="bar"><div class="bar-inner" style="width:${barPct}%"></div></div>
      <div class="note-box">
        &#x1F3AF; All'inizio di Monte Carlo il gap &egrave; gi&agrave; virtualmente <strong>${Math.abs(DATA.virtualGap)} pts</strong> (Alcaraz perde ${fmtPts(NT.alcarazDefends)} in scadenza). Una vittoria di Sinner = ${fmtPts(S.points + 1000)} pts &mdash; Alcaraz non pu&ograve; raggiungerlo neppure arrivando in finale. <strong>N.1 automatico.</strong>
      </div>
    </div>

    <div class="stat-row">
      <div class="stat-box gold-top"><div class="stat-num" style="color:var(--gold);">${S.wl}</div><div class="stat-lbl">Win/Loss 2026</div></div>
      <div class="stat-box green-top"><div class="stat-num">${S.setsM1000}</div><div class="stat-lbl">Set vinti di fila ai M1000 &mdash; Record ATP</div></div>
      <div class="stat-box"><div class="stat-num" style="color:var(--gold);">${S.titles2026}</div><div class="stat-lbl">Titoli 2026 &mdash; IW &#x1F3C6; + Miami &#x1F3C6;</div></div>
      <div class="stat-box gray-top"><div class="stat-num">${S.m1000Career}</div><div class="stat-lbl">Masters 1000 in carriera &mdash; tutti su cemento</div></div>
    </div>

    <div class="card">
      <h3 class="card-title">Ultimi 8 risultati</h3>
      <div class="form-row">
        ${DATA.recentForm.map(f => `<div class="fd ${f.result.toLowerCase()}" title="${f.detail}">${f.result}</div>`).join('')}
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:10px;">&larr; pi&ugrave; recente &nbsp;|&nbsp; passa il mouse per i dettagli</div>
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
        <div class="news-icon">${n.icon}</div>
        <div>
          <div class="news-tag ${tagMap[n.type]}">${n.tag}${n.tagDate ? ' &middot; ' + n.tagDate : ''}</div>
          <div class="news-headline">${n.headline}</div>
          <div class="news-desc">${n.desc}</div>
          <div class="news-source"><a href="${n.url}" target="_blank" rel="noopener noreferrer">${n.source}</a> &middot; ${n.sourceDate}</div>
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
          <div class="top5-pos ${r.rank === 1 ? 'pos-gold' : r.rank === 2 ? 'pos-orange' : 'pos-gray'}">${r.rank}</div>
          <div>
            <div class="top5-name">${r.name} ${r.flag}</div>
            <div class="top5-status"${r.highlight ? ' style="color:var(--orange);"' : ''}>${r.status}</div>
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
      <div class="stat-box gold-top"><div class="stat-num" style="color:var(--gold);">${S.wl}</div><div class="stat-lbl">Win/Loss 2026</div></div>
      <div class="stat-box green-top"><div class="stat-num">${S.setsM1000}</div><div class="stat-lbl">Set M1000 di fila &mdash; Record</div></div>
      <div class="stat-box"><div class="stat-num">${S.bigTitles}</div><div class="stat-lbl">Big Titles in carriera</div></div>
      <div class="stat-box gray-top"><div class="stat-num">${S.prizeMoney}</div><div class="stat-lbl">Prize money carriera</div></div>
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
          <div class="cal-date">${t.dates}</div>
          <div><div class="cal-name">${t.name}</div><div class="cal-surface">${t.surface}</div></div>
          <div class="cal-pts ${ptsClass}">${t.pts}</div>
          <div><span class="pill ${pillClass}">${t.status}</span></div>
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
          <div class="sc-tag">${s.tag}</div>
          <div class="sc-date">${s.date}</div>
          <div class="sc-desc">${s.desc}</div>
          <div class="sc-prob">Probabilit&agrave;: ${s.prob}</div>
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
        return `
        <div class="pred-row">
          <div class="pred-name">${p.torneo}${p.done ? ' &#x2705;' : ''}</div>
          <div class="pred-bar"><div class="pred-bar-inner" style="width:${p.barWidth};background:${p.barColor};"></div></div>
          <div class="pred-val pos">${p.sinnerMax}</div>
          <div class="pred-val ${negClass}">${p.alcarazDifende}</div>
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
          <div><div class="odds-match">${q.market}</div><div class="odds-sub">${q.sub}</div></div>
          <div class="odds-block"><div class="odds-val">${q.val1}</div><div class="odds-lbl">${q.lbl1}</div></div>
          <div class="odds-block"><div class="odds-val secondary">${q.val2}</div><div class="odds-lbl">${q.lbl2}</div></div>
          <div><span class="odds-tag ${q.tagType === 'green' ? 'ot-green' : 'ot-orange'}">${q.tag}</span></div>
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
