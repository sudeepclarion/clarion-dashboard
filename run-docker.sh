#!/usr/bin/env bash
# Build and run the Clarion dashboard container (nginx + static SPA).
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "→ creating .env from .env.example"
  cp .env.example .env
  echo "   Set VITE_CLARION_API_URL and VITE_CLARION_API_SECRET in .env"
fi

set -a
source .env
set +a

docker compose up -d --build

cat <<'MSG'

  Clarion dashboard is starting.

    UI      http://localhost:5173

  Logs:   docker compose logs -f dashboard
  Stop:   docker compose down

MSG
