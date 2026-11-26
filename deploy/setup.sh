#!/usr/bin/env bash
# One-time server setup: installs the systemd services and the nginx site.
# Run from the repo folder:
#   sudo NODE_BIN="$(which node)" bash deploy/setup.sh
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Run with sudo"; exit 1; }

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
RUN_USER="${SUDO_USER:-$(stat -c %U "$APP_DIR")}"
NODE_BIN="${NODE_BIN:-$(command -v node || true)}"
[ -x "$NODE_BIN" ] || { echo "node not found. Run: sudo NODE_BIN=\"\$(which node)\" bash deploy/setup.sh"; exit 1; }

echo "App dir : $APP_DIR"
echo "User    : $RUN_USER"
echo "Node    : $NODE_BIN"

for svc in rnote-backend rnote-frontend; do
  sed -e "s|__APP_DIR__|$APP_DIR|g" \
      -e "s|__USER__|$RUN_USER|g" \
      -e "s|__NODE__|$NODE_BIN|g" \
      "$APP_DIR/deploy/$svc.service" > "/etc/systemd/system/$svc.service"
done
systemctl daemon-reload
systemctl enable rnote-backend rnote-frontend

SITE=/etc/nginx/sites-available/rnote.travomapping.com
# Don't overwrite an existing site: certbot adds its HTTPS settings to it.
if [ ! -e "$SITE" ]; then
  cp "$APP_DIR/deploy/nginx.conf" "$SITE"
fi
ln -sf "$SITE" /etc/nginx/sites-enabled/rnote.travomapping.com
nginx -t
systemctl reload nginx

echo "Done. Now run (without sudo): bash deploy/update.sh"
