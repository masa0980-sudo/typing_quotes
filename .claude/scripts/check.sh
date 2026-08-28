#!/usr/bin/env bash
# push前に通す3点セット。どれか1つでも落ちたらそこで止まる。
#
#   1. 名言データの検証   … kanaが打てるか・出典/解説が空でないか等
#   2. 型チェック         … scripts/ は tsconfig の exclude に入っているので対象外
#   3. 本番と同じビルド   … GITHUB_PAGES=true で basePath 付き。壊れていれば公開前に分かる
#
# 使い方: .claude/scripts/check.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT"

echo "▶ 名言データの検証"
npm run validate

echo
echo "▶ 型チェック"
npx tsc --noEmit

echo
echo "▶ 本番と同じ条件でビルド (GITHUB_PAGES=true)"
GITHUB_PAGES=true npm run build

echo
echo "✓ すべて通った"
