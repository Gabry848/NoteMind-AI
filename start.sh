#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE="${RAILPACK_SERVICE:-${SERVICE:-backend}}"

log() {
  echo "[start.sh] $*"
}

run_backend() {
  cd "${ROOT_DIR}/backend"

  log "Installing backend dependencies"
  python3 -m pip install --upgrade pip
  python3 -m pip install --no-cache-dir -r requirements.txt

  log "Starting FastAPI backend"
  exec python3 main.py
}

run_frontend() {
  cd "${ROOT_DIR}/web"

  log "Installing frontend dependencies"
  npm ci

  if [ -f package.json ]; then
    log "Building frontend"
    npm run build
  fi

  log "Starting Next.js frontend"
  exec npm run start
}

case "${SERVICE}" in
  backend)
    run_backend
    ;;
  frontend)
    run_frontend
    ;;
  *)
    echo "[start.sh] Unknown service \"${SERVICE}\". Use backend or frontend." >&2
    exit 1
    ;;
esac
