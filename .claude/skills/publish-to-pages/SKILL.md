---
name: publish-to-pages
description: このリポジトリをGitHub Pagesへ公開する手順と、実際に踏んだ失敗の回避策。「公開して」「デプロイして」「Actionsが落ちている」と言われたとき、および新しくリポジトリを作って初めて公開するときに使う。
---

# GitHub Pages への公開

`main` へ push すると `.github/workflows/deploy-pages.yml` が走り、
静的エクスポート(`out/`)を Pages へ配信する。**別途デプロイコマンドはない。**

## 通常の流れ

1. `.claude/scripts/check.sh` を通す（検証 → 型 → 本番と同じビルド）
2. コミットして `git push -u origin main`
3. `mcp__github__actions_list`(`list_workflow_jobs`) で結果を見る
4. 失敗していたら `mcp__github__get_job_logs`(`failed_only: true`) でログを取る

## 初めて公開するとき（ここで必ず1回詰まる）

### リポジトリはユーザーに作ってもらう
`mcp__github__create_repository` は権限がなく `403 Resource not accessible by integration`
になる。**自分では作れない。** ユーザーに作成を依頼する。

### Pages の Source をユーザーに設定してもらう
`actions/configure-pages` の `enablement: true` は、この権限では効かない。
初回は必ずこう落ちる。

```
##[error]Create Pages site failed. Error: Resource not accessible by integration
```

これは**コードの問題ではない**。修正を試みても直らないので、ユーザーに次を依頼する。

> Settings → Pages → Build and deployment → Source を **「GitHub Actions」** に変更してください

設定後に `mcp__github__actions_run_trigger`(`method: "rerun_workflow_run"`) で
失敗したrunを再実行すれば通る。

### リポジトリ名を config と一致させる
`next.config.ts` の `repoName` は**実際のリポジトリ名と1文字も違ってはいけない**。
このリポジトリは `typing_quotes`（アンダースコア）。`typing-quotes`（ハイフン）と
書いていたせいで、ローカルでは動くのに公開すると全アセットが404になる状態を作った。

`repoName` を変えたら、`README.md` / `CLAUDE.md` / `package.json` の `name` も揃える。

## 確認するときの注意

- **Actions API のジョブ状態は数分単位で古いまま返ってくることがある。**
  実際に「Checkout で15分停止している」ように見えたが、実際は最初の1分で終わっていた。
  進んでいないように見えても**すぐに cancel / rerun しない**。数分待って再取得する。
  最終判断は `get_job_logs` の実ログ（`Evaluated environment url: ...` が出ていれば成功）。
- **サンドボックスからは `*.github.io` に到達できない**（`curl` が `000` を返す）。
  公開URLを開いての確認はできないので、
  **「Actionsは成功したが公開URLでの実表示は未確認」と正直に報告する。**
