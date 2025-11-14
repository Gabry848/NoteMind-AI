#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE="${RAILPACK_SERVICE:-${SERVICE:-backend}}"
PYTHON_BIN="${PYTHON_BIN:-}"

# Ensure mise-installed tools (used by Railpack) are discoverable
if [ -d /mise/shims ]; then
  export PATH="/mise/shims:${PATH}"
fi

if [ -z "${PYTHON_BIN}" ]; then
  if command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python3"
  elif command -v python >/dev/null 2>&1; then
    PYTHON_BIN="python"
  else
    echo "[start.sh] Unable to find python interpreter" >&2
    exit 1
  fi
fi

log() {
  echo "[start.sh] $*"
}

run_backend() {
  cd "${ROOT_DIR}/backend"

  log "Installing backend dependencies"
  "${PYTHON_BIN}" -m pip install --upgrade pip
  "${PYTHON_BIN}" -m pip install --no-cache-dir -r requirements.txt

  log "Starting FastAPI backend"
  exec "${PYTHON_BIN}" main.py
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
