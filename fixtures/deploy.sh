#!/usr/bin/env bash
# Build and ship the studio site.
set -euo pipefail

readonly APP_DIR="${HOME}/apps/atelier"
TARGET=${1:-production}

log() {
  printf '\033[2m[%s]\033[0m %s\n' "$(date +%H:%M:%S)" "$*"
}

if [[ ! -d "$APP_DIR" ]]; then
  log "Missing $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"
git pull --ff-only origin main
pnpm install --frozen-lockfile && pnpm build

for region in eu-west us-east; do
  log "Deploying to ${region} (${TARGET})"
  docker compose -f compose.prod.yml up -d --build web
done
