#!/bin/sh

set -eu

ROOT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
cd "$ROOT_DIR"

echo "[1/4] Rendering templates"
python3 renderHTML.py

echo "[2/4] JavaScript syntax checks"
docker compose run --rm wpd node --check javascript/main.js
docker compose run --rm wpd node --check tests/minimal_app_tests.js

echo "[3/4] JavaScript unit tests (Karma/QUnit)"
if docker compose run --rm wpd sh -lc 'which google-chrome >/dev/null 2>&1 || which chromium >/dev/null 2>&1 || which chromium-browser >/dev/null 2>&1'; then
  docker compose run --rm wpd npm run test
else
  echo "Skipping npm run test inside container: no Chrome/Chromium binary found."
  echo "To run full JS tests, execute on a host with npm + Chrome/Chromium, or install a browser in the image."
fi

echo "[4/4] Optional Rails preview smoke test"
if curl -fsS http://localhost:3001/digitizer >/tmp/wpd_preview_smoke.html 2>/dev/null; then
  grep -q 'data-wpd-points-count' /tmp/wpd_preview_smoke.html
  grep -q 'data-wpd-submit' /tmp/wpd_preview_smoke.html
  echo "Rails preview smoke test: OK"
else
  echo "Rails preview smoke test skipped: http://localhost:3001/digitizer is not available"
fi

echo "Minimal suite finished."