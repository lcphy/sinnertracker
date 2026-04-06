-- ═══════════════════════════════════════════════════════
-- SinnerTracker — Database Schema
-- Supabase project: czcszeoylcelgtduijqc
-- ═══════════════════════════════════════════════════════

-- ── SINNER PROFILE (1 riga, aggiornata dallo scraper) ──
CREATE TABLE IF NOT EXISTS sinner_profile (
  id          INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  rank        INTEGER NOT NULL DEFAULT 2,
  points      INTEGER NOT NULL DEFAULT 12400,
  wl          TEXT NOT NULL DEFAULT '17–1',
  titles_2026 INTEGER NOT NULL DEFAULT 2,
  sets_m1000  INTEGER NOT NULL DEFAULT 34,
  m1000_career INTEGER NOT NULL DEFAULT 7,
  big_titles  INTEGER NOT NULL DEFAULT 13,
  win_pct_m1000 TEXT NOT NULL DEFAULT '77.9%',
  prize_money TEXT NOT NULL DEFAULT '$51.2M',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RANKINGS (Top 5 ATP) ──
CREATE TABLE IF NOT EXISTS rankings (
  id          SERIAL PRIMARY KEY,
  rank        INTEGER NOT NULL,
  name        TEXT NOT NULL,
  flag        TEXT NOT NULL,
  country     TEXT,
  points      INTEGER NOT NULL,
  status      TEXT,
  is_sinner   BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── CURRENT TOURNAMENT ──
CREATE TABLE IF NOT EXISTS current_tournament (
  id              INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  name            TEXT,
  dates           TEXT,
  surface         TEXT,
  location        TEXT,
  category        TEXT,
  sinner_seed     INTEGER,
  alcaraz_seed    INTEGER,
  sinner_defends  INTEGER DEFAULT 0,
  alcaraz_defends INTEGER DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT FALSE,
  -- Next match info
  next_round      TEXT,
  next_opponent   TEXT,
  next_opponent_rank INTEGER,
  next_scheduled  TEXT,
  next_h2h        TEXT,
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── DRAW PATH (percorso potenziale di Sinner nel torneo) ──
CREATE TABLE IF NOT EXISTS draw_path (
  id          SERIAL PRIMARY KEY,
  round       TEXT NOT NULL,
  opponent    TEXT NOT NULL,
  seed        TEXT,
  result      TEXT,         -- NULL = non giocato, 'W' = vinto, 'L' = perso
  score       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── MATCHES (risultati partite — sia recap che live) ──
CREATE TABLE IF NOT EXISTS matches (
  id          SERIAL PRIMARY KEY,
  tournament  TEXT NOT NULL,
  round       TEXT NOT NULL,
  opponent    TEXT NOT NULL,
  seed        TEXT,
  score       TEXT,
  note        TEXT,
  won         BOOLEAN NOT NULL DEFAULT TRUE,
  is_final    BOOLEAN NOT NULL DEFAULT FALSE,
  match_date  DATE,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── RECENT FORM (ultimi 8 risultati) ──
CREATE TABLE IF NOT EXISTS recent_form (
  id          SERIAL PRIMARY KEY,
  result      CHAR(1) NOT NULL CHECK (result IN ('W', 'L')),
  detail      TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ── TOURNAMENTS (calendario) ──
CREATE TABLE IF NOT EXISTS tournaments (
  id          SERIAL PRIMARY KEY,
  dates       TEXT NOT NULL,
  name        TEXT NOT NULL,
  surface     TEXT NOT NULL,
  pts         TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'Upcoming',
  status_type TEXT NOT NULL DEFAULT 'gray',
  section     TEXT NOT NULL DEFAULT 'upcoming',  -- 'played', 'clay', 'second_half'
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── NEWS ──
CREATE TABLE IF NOT EXISTS news (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL DEFAULT 'gray',  -- green, orange, red, gray
  icon        TEXT NOT NULL DEFAULT '📰',
  tag         TEXT NOT NULL,
  tag_date    TEXT,
  headline    TEXT NOT NULL,
  description TEXT NOT NULL,
  source      TEXT NOT NULL,
  source_date TEXT,
  url         TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── SCENARIOS (previsione N.1) ──
CREATE TABLE IF NOT EXISTS scenarios (
  id          SERIAL PRIMARY KEY,
  type        TEXT NOT NULL,  -- 'best', 'mid', 'worst'
  tag         TEXT NOT NULL,
  target_date TEXT NOT NULL,
  description TEXT NOT NULL,
  probability TEXT NOT NULL,
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- ── PREDICTION TABLE (punti guadagnabili vs difendibili) ──
CREATE TABLE IF NOT EXISTS predictions (
  id              SERIAL PRIMARY KEY,
  tournament      TEXT NOT NULL,
  sinner_max      TEXT NOT NULL,
  alcaraz_defends TEXT NOT NULL,
  bar_width       TEXT NOT NULL DEFAULT '50%',
  bar_color       TEXT NOT NULL DEFAULT '#FF7A00',
  is_done         BOOLEAN NOT NULL DEFAULT FALSE,
  sort_order      INTEGER NOT NULL DEFAULT 0
);

-- ── ODDS (quote) ──
CREATE TABLE IF NOT EXISTS odds (
  id          SERIAL PRIMARY KEY,
  market      TEXT NOT NULL,
  sub         TEXT,
  val1        TEXT NOT NULL,
  lbl1        TEXT NOT NULL,
  val2        TEXT NOT NULL,
  lbl2        TEXT NOT NULL,
  tag         TEXT NOT NULL,
  tag_type    TEXT NOT NULL DEFAULT 'orange',
  sort_order  INTEGER NOT NULL DEFAULT 0,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── META (gap, virtual gap, etc.) ──
CREATE TABLE IF NOT EXISTS meta (
  key         TEXT PRIMARY KEY,
  value       TEXT NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Enable Row Level Security (read-only for anon) ──
ALTER TABLE sinner_profile ENABLE ROW LEVEL SECURITY;
ALTER TABLE rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE current_tournament ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_path ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE recent_form ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE news ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE odds ENABLE ROW LEVEL SECURITY;
ALTER TABLE meta ENABLE ROW LEVEL SECURITY;

-- Anon users can only read
CREATE POLICY "anon_read" ON sinner_profile FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON rankings FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON current_tournament FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON draw_path FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON matches FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON recent_form FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON tournaments FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON news FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON scenarios FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON predictions FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON odds FOR SELECT TO anon USING (true);
CREATE POLICY "anon_read" ON meta FOR SELECT TO anon USING (true);

-- Service role can do everything (scraper uses this)
CREATE POLICY "service_all" ON sinner_profile FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON rankings FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON current_tournament FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON draw_path FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON matches FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON recent_form FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON tournaments FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON news FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON scenarios FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON predictions FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON odds FOR ALL TO service_role USING (true);
CREATE POLICY "service_all" ON meta FOR ALL TO service_role USING (true);
