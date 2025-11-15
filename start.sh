#!/usr/bin/env bash
set -Eeuo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVICE="${RAILPACK_SERVICE:-${SERVICE:-backend}}"
PYTHON_BIN="${PYTHON_BIN:-}"

# Ensure mise-installed tools (used by Railpack) are discoverable
if [ -d /mise/shims ]; then
  export PATH="/mise/shims:${PATH}"
fi
if [ -d /mise/installs ]; then
  export PATH="/mise/installs/python/bin:${PATH}"
fi

find_python() {
  local candidate
  for candidate in \
    "${PYTHON_BIN}" \
    python3 \
    python \
    python3.12 \
    python3.11 \
    /mise/shims/python3 \
    /mise/shims/python \
    /mise/installs/python/*/bin/python3 \
    /mise/installs/python/*/bin/python \
    /usr/local/bin/python3 \
    /usr/bin/python3; do
    if [ -n "${candidate}" ] && command -v "${candidate}" >/dev/null 2>&1; then
      PYTHON_BIN="$(command -v "${candidate}")"
      return 0
    fi
    if [ -x "${candidate}" ]; then
      PYTHON_BIN="${candidate}"
      return 0
    fi
  done
  return 1
}

if ! find_python; then
  echo "[start.sh] Unable to find python interpreter" >&2
  exit 1
fi

log() {
  echo "[start.sh] $*"
}

find_node() {
  local candidate
  # Try to load NVM if available
  if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1090
    . "$HOME/.nvm/nvm.sh"
    nvm use 22.20.0 2>/dev/null || nvm install 22.20.0
    return 0
  fi

  # Fallback: check for nodejs in PATH
  for candidate in node nodejs; do
    if command -v "${candidate}" >/dev/null 2>&1; then
      return 0
    fi
  done

  return 1
}

run_backend() {
  cd "${ROOT_DIR}/backend"

  VENV_DIR="${VENV_DIR:-${PWD}/.venv}"
  if [ ! -d "${VENV_DIR}" ]; then
    log "Creating backend virtualenv at ${VENV_DIR}"
    "${PYTHON_BIN}" -m venv "${VENV_DIR}"
  fi

  # shellcheck disable=SC1090
  . "${VENV_DIR}/bin/activate"
  VENV_PYTHON="${VENV_DIR}/bin/python"

  log "Installing backend dependencies"
  "${VENV_PYTHON}" -m pip install --upgrade pip
  "${VENV_PYTHON}" -m pip install --no-cache-dir -r requirements.txt

  log "Starting FastAPI backend via Uvicorn"
  exec "${VENV_PYTHON}" -m uvicorn main:app --host 0.0.0.0 --port "${PORT:-8000}"
}

run_frontend() {
  cd "${ROOT_DIR}/web"

  if ! find_node; then
    echo "[start.sh] Unable to find Node.js interpreter" >&2
    exit 1
  fi

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
