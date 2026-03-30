#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

echo "==> Building frontend..."
(cd frontend && npm ci && npm run build)

echo "==> Building backend..."
(cd backend && dotnet publish Dinner-Server/Dinner-Server.csproj -c Release -o ../build/publish)

echo "==> Copying frontend into wwwroot..."
rm -rf build/publish/wwwroot
cp -r frontend/dist build/publish/wwwroot

echo "==> Build complete. Output in build/publish/"
