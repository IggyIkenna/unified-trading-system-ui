#!/bin/bash
set -e

echo "🧹 Cleaning dependencies..."
rm -rf node_modules package-lock.json .next .vite

echo "📦 Fresh install..."
npm ci

echo "🔍 Type checking..."
npm run type-check || npx tsc --noEmit

echo "🔨 Building..."
npm run build

echo "✅ Running tests..."
npm test -- --run

echo ""
echo "✨ All QA gates passed. Ready for PR/deploy."
