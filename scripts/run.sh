#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PUBLISH_DIR="build/publish"

if [ ! -f "$PUBLISH_DIR/Dinner-Server.dll" ]; then
  echo "Build output not found. Run scripts/build.sh first."
  exit 1
fi

export ASPNETCORE_URLS="${ASPNETCORE_URLS:-http://+:8080}"
export ConnectionStrings__DefaultConnection="${ConnectionStrings__DefaultConnection:-Data Source=mealplanner.db}"

exec dotnet "$PUBLISH_DIR/Dinner-Server.dll"
