#!/usr/bin/env bash
# Expo Go over a Cloudflare quick tunnel. Use this instead of `expo start --tunnel`,
# whose built-in ngrok fails with "Cannot read properties of undefined (reading 'body')".
# Needs cloudflared: https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/
set -euo pipefail

PORT="${PORT:-8081}"
if ! command -v cloudflared >/dev/null; then
  echo "cloudflared isn't installed. See the link at the top of scripts/tunnel.sh." >&2
  exit 1
fi

LOG="$(mktemp)"
cloudflared tunnel --no-autoupdate --url "http://localhost:$PORT" >"$LOG" 2>&1 &
CF_PID=$!
trap 'kill "$CF_PID" 2>/dev/null; rm -f "$LOG"' EXIT

echo "Starting Cloudflare tunnel..."
URL=""
for _ in $(seq 1 30); do
  URL="$(grep -o 'https://[a-z0-9-]*\.trycloudflare\.com' "$LOG" | head -1 || true)"
  [ -n "$URL" ] && break
  sleep 1
done
if [ -z "$URL" ]; then
  echo "The tunnel didn't start. cloudflared said:" >&2
  cat "$LOG" >&2
  exit 1
fi
echo "Tunnel: $URL"

EXPO_PACKAGER_PROXY_URL="$URL" npx expo start --go --port "$PORT" "$@"
