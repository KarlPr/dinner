#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

echo "==> Building Docker image..."
docker compose build

echo "==> Starting container..."
docker compose up -d

echo "==> Dinner is running at http://localhost:8081"
