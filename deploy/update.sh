#!/usr/bin/env bash
# Pull the latest code, install dependencies, build, and restart.
# Run from the repo folder (without sudo):  bash deploy/update.sh
set -euo pipefail

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SITE_URL="https://rnote.travomapping.com"

cd "$APP_DIR"
git pull --ff-only origin master

echo "== backend =="
cd "$APP_DIR/backend"
[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt

echo "== frontend =="
cd "$APP_DIR/r-note-app"
npm ci
NEXT_PUBLIC_API_URL="$SITE_URL" npm run build

echo "== restart =="
sudo systemctl restart rnote-backend rnote-frontend
sleep 2
systemctl --no-pager --lines=0 status rnote-backend rnote-frontend
