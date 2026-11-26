#!/usr/bin/env bash
# Deploy or update R-Note on this server. Safe to run again any time.
#
#   cd /var/www/ScriptEngine/Python-Application/rnote
#   git pull --ff-only origin master && bash deploy/deploy.sh
#
# It only touches:
#   - this folder
#   - the systemd services rnote-backend and rnote-frontend
#   - the nginx site /etc/nginx/sites-available/rnote.travomapping.com
# Other apps, services and nginx sites are left alone. Before changing
# anything it checks that the ports, service names and domain are not
# already used by something else, and stops if they are.
set -euo pipefail

DOMAIN="rnote.travomapping.com"
SITE_URL="https://$DOMAIN"
BACKEND_PORT=8035     # must match deploy/nginx.conf
FRONTEND_PORT=3035    # must match deploy/nginx.conf

APP_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$APP_DIR/backend/.env"
SITE="/etc/nginx/sites-available/$DOMAIN"
RUN_USER="$(id -un)"

die() { echo; echo "STOPPED: $*" >&2; exit 1; }
step() { echo; echo "==> $*"; }

[ "$(id -u)" -ne 0 ] || die "run as your normal user, without sudo (the script uses sudo itself)"
NODE_BIN="$(command -v node)" || die "node not found"
command -v npm >/dev/null || die "npm not found"

# ── 1. Safety checks ─────────────────────────────────────────────────────────
step "Checking ports, service names and domain"

check_port() { # port service
  if ss -ltnH "sport = :$1" | grep -q .; then
    systemctl is-active --quiet "$2" \
      || die "port $1 is already used by another program (see: sudo ss -ltnp | grep :$1)"
  fi
}
check_port "$BACKEND_PORT" rnote-backend
check_port "$FRONTEND_PORT" rnote-frontend

for svc in rnote-backend rnote-frontend; do
  unit="/etc/systemd/system/$svc.service"
  if [ -e "$unit" ] && ! grep -q "$APP_DIR" "$unit"; then
    die "$unit already exists for a different app"
  fi
done

other_sites="$(grep -RlsF -- "$DOMAIN" /etc/nginx/sites-enabled /etc/nginx/conf.d | grep -v "/$DOMAIN\$" || true)"
[ -z "$other_sites" ] || die "$DOMAIN is already used in another nginx config: $other_sites"
echo "OK"

# ── 2. backend/.env ──────────────────────────────────────────────────────────
step "backend/.env"

set_env() { # key value  (value must not contain '|')
  if grep -q "^$1=" "$ENV_FILE"; then
    sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"
  else
    echo "$1=$2" >> "$ENV_FILE"
  fi
}

if [ ! -f "$ENV_FILE" ]; then
  echo "No backend/.env yet. Enter the database details (same as your local backend/.env):"
  read -rp  "  DB_HOST (host:port): " db_host
  read -rp  "  DB_USER: " db_user
  read -rsp "  DB_PASSWORD: " db_password; echo
  read -rp  "  DB_NAME [rnote]: " db_name
  db_name="${db_name:-rnote}"
  jwt_secret="$(python3 -c 'import secrets;print(secrets.token_urlsafe(48))')"
  cat > "$ENV_FILE" <<EOF
DB_HOST=$db_host
DB_USER=$db_user
DB_PASSWORD='$db_password'
DB_NAME=$db_name
DB_SSL=true
DB_SSL_CA=

HOST=127.0.0.1
PORT=$BACKEND_PORT
PUBLIC_URL=$SITE_URL
CORS_ORIGINS=$SITE_URL

JWT_SECRET=$jwt_secret
ACCESS_TOKEN_EXPIRE_DAYS=30
EOF
  echo "Created backend/.env (edit later with: nano $ENV_FILE)"
else
  # Keep the backend private (only nginx reaches it) and point it at the domain
  set_env HOST 127.0.0.1
  set_env PORT "$BACKEND_PORT"
  set_env PUBLIC_URL "$SITE_URL"
  set_env CORS_ORIGINS "$SITE_URL"
  if grep -qE '^JWT_SECRET=(change-me)?$' "$ENV_FILE"; then
    set_env JWT_SECRET "$(python3 -c 'import secrets;print(secrets.token_urlsafe(48))')"
  fi
  echo "OK"
fi
chmod 600 "$ENV_FILE"

# ── 3. Backend dependencies ──────────────────────────────────────────────────
step "Backend: Python packages"
cd "$APP_DIR/backend"
[ -x .venv/bin/python ] || python3 -m venv .venv
nice -n 10 .venv/bin/pip install -q --upgrade pip
nice -n 10 .venv/bin/pip install -q -r requirements.txt

# ── 4. Frontend build ────────────────────────────────────────────────────────
# nice = lower CPU priority, so the other apps on this server stay responsive
step "Frontend: npm install + build"
cd "$APP_DIR/r-note-app"
nice -n 10 npm ci --no-audit --no-fund
NEXT_PUBLIC_API_URL="$SITE_URL" nice -n 10 npm run build

# ── 5. systemd services ──────────────────────────────────────────────────────
step "systemd: rnote-backend, rnote-frontend"

sudo tee /etc/systemd/system/rnote-backend.service >/dev/null <<EOF
[Unit]
Description=R-Note backend (FastAPI on 127.0.0.1:$BACKEND_PORT)
After=network-online.target
Wants=network-online.target

[Service]
User=$RUN_USER
WorkingDirectory=$APP_DIR/backend
ExecStart=$APP_DIR/backend/.venv/bin/python run.py
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo tee /etc/systemd/system/rnote-frontend.service >/dev/null <<EOF
[Unit]
Description=R-Note frontend (Next.js on 127.0.0.1:$FRONTEND_PORT)
After=network-online.target rnote-backend.service
Wants=network-online.target

[Service]
User=$RUN_USER
WorkingDirectory=$APP_DIR/r-note-app
Environment=NODE_ENV=production
ExecStart=$NODE_BIN $APP_DIR/r-note-app/node_modules/next/dist/bin/next start -H 127.0.0.1 -p $FRONTEND_PORT
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --quiet rnote-backend rnote-frontend
sudo systemctl restart rnote-backend rnote-frontend

wait_for() { # name url service
  for _ in $(seq 1 30); do
    curl -fsS -o /dev/null "$2" 2>/dev/null && { echo "$1 is up ($2)"; return 0; }
    sleep 1
  done
  sudo journalctl -u "$3" -n 30 --no-pager
  die "$1 did not start. Logs above (more: journalctl -u $3 -f)"
}
wait_for backend  "http://127.0.0.1:$BACKEND_PORT/"  rnote-backend
wait_for frontend "http://127.0.0.1:$FRONTEND_PORT/" rnote-frontend

# ── 6. nginx site (first run only) ───────────────────────────────────────────
# Added once and never overwritten afterwards, because certbot adds its HTTPS
# settings to this file. "reload" is graceful: running sites are not dropped.
if [ ! -e "$SITE" ]; then
  step "nginx: adding site $DOMAIN"
  sudo cp "$APP_DIR/deploy/nginx.conf" "$SITE"
  sudo ln -sfn "$SITE" "/etc/nginx/sites-enabled/$DOMAIN"
  if ! sudo nginx -t; then
    sudo rm -f "/etc/nginx/sites-enabled/$DOMAIN" "$SITE"
    die "nginx config test failed. The rnote site was removed again and nginx was not reloaded."
  fi
  sudo systemctl reload nginx
fi

# ── 7. HTTPS (until a certificate exists) ────────────────────────────────────
if ! sudo test -d "/etc/letsencrypt/live/$DOMAIN"; then
  step "HTTPS certificate"
  if command -v certbot >/dev/null; then
    sudo certbot --nginx -d "$DOMAIN" --redirect \
      || echo "certbot failed. Check that the DNS A record for $DOMAIN points to this server, then run: sudo certbot --nginx -d $DOMAIN"
  else
    echo "certbot is not installed. Install it with: sudo apt install certbot python3-certbot-nginx"
    echo "then run: sudo certbot --nginx -d $DOMAIN"
  fi
fi

step "Done: $SITE_URL"
