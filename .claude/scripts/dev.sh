#!/usr/bin/env bash
# 開発サーバーを立てるだけのヘルパー。
# ポートを固定しているのは、Playwrightで動作確認するときにURLを毎回探さずに済ませるため。
#
# 使い方: .claude/scripts/dev.sh [port]   (デフォルト 3111)
# バックグラウンドで起動し、ログを見て "Ready" を待ってから開くこと。
set -euo pipefail

PORT="${1:-3111}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cd "$ROOT"
exec npx next dev --webpack --port "$PORT"
