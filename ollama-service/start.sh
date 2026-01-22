#!/usr/bin/env sh
set -eu

# Railway routes public traffic to $PORT (usually 8080)
PORT_TO_USE="${PORT:-8080}"
export OLLAMA_HOST="${OLLAMA_HOST:-http://0.0.0.0:${PORT_TO_USE}}"

# Bootstrap a default model so /api/generate works after deploy/restart.
# Note: without a persistent volume, models will be re-downloaded after each restart.
BOOTSTRAP_MODEL="${OLLAMA_BOOTSTRAP_MODEL:-tinyllama:latest}"

echo "[start.sh] OLLAMA_HOST=${OLLAMA_HOST}"
echo "[start.sh] BOOTSTRAP_MODEL=${BOOTSTRAP_MODEL}"

# Start server in background
ollama serve &
SERVER_PID="$!"

# Give the server a moment to come up
sleep 2

# If model isn't installed, pull it (best-effort)
if ! ollama list 2>/dev/null | awk '{print $1}' | grep -Fxq "${BOOTSTRAP_MODEL}"; then
  # allow users to specify "tinyllama" and still match "tinyllama:latest"
  if ! ollama list 2>/dev/null | awk '{print $1}' | grep -Fxq "${BOOTSTRAP_MODEL%%:*}:latest"; then
    echo "[start.sh] Model not found locally. Pulling ${BOOTSTRAP_MODEL}..."
    ollama pull "${BOOTSTRAP_MODEL}" || ollama pull "${BOOTSTRAP_MODEL%%:*}:latest" || true
  fi
fi

# Keep container alive
wait "${SERVER_PID}"


