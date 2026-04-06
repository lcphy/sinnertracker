# ============================================================
# SinnerTracker — Dockerfile
# Fase 1: Static site via Caddy (same pattern as ai-agency)
# Fase 2: Decommenta Node.js per backend + scraper
# ============================================================

FROM caddy:2-alpine

RUN adduser -D -u 1001 appuser

COPY --chown=appuser:appuser ./public /srv
COPY --chown=appuser:appuser ./Caddyfile /etc/caddy/Caddyfile

EXPOSE 8080
USER appuser
