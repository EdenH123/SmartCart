#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "$CLAUDE_PROJECT_DIR"

echo "Installing npm dependencies..."
npm install --legacy-peer-deps

echo "Generating Prisma client..."
npx prisma generate

echo "Session start hook complete."
