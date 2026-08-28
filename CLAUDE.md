# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

偉人の名言をお題にしたタイピングゲーム。日本語（ローマ字入力）と英語の2モードがある。
Next.js の静的エクスポートで GitHub Pages に公開している。

公開URL: https://masa0980-sudo.github.io/typing-quotes/

## Commands

```bash
npm install
npm run dev                      # http://localhost:3000
npm run build                    # 静的エクスポート → out/
GITHUB_PAGES=true npm run build  # 本番と同じ basePath 付きでビルド
npx tsc --noEmit                 # 型チェックのみ
```

デプロイは `main` への push で GitHub Actions が自動実行する（`.github/workflows/deploy-pages.yml`）。
別途デプロイコマンドはない。

## Architecture

```
src/
  app/
    page.tsx      # GameScreen を置くだけ
    layout.tsx    # フォント・メタデータ
    globals.css   # Tailwind v4 + 画面演出のkeyframes
  lib/
    quotes/       # 名言データ(105件)。分野ごとに分割。index.ts がまとめる
      index.ts science.ts philosophy.ts society.ts arts.ts japan.ts short.ts
    romaji.ts     # ★ローマ字入力エンジン(このリポジトリの心臓部)
    types.ts      # 型定義
    constants.ts  # 出題数・ランクしきい値
    reducer.ts    # ゲーム状態機械 + 結果集計
    storage.ts    # ハイスコア(localStorage、モード別)
    sound.ts      # Web Audio APIで合成する効果音
  components/
    GameScreen.tsx   # 画面の出し分け・キー入力・タイマー・音
    TitleScreen.tsx  # モード選択
    PlayScreen.tsx   # お題と打鍵ラインの表示
    RevealScreen.tsx # 1問クリア後に出典と背景を見せる
    ResultScreen.tsx # 結果
```

### romaji.ts —— 触るときの注意

日本語タイピングは「同じかなに複数の打ち方がある」のが本質的な難しさ。
かな列を**セグメント**に分解し、各セグメントに受け付けるローマ字候補を持たせている。
候補配列の**先頭が代表表記**で、画面のお手本表示に使われる。

文脈依存が2つあり、`buildSegments()` の後半でまとめて補正している。

- **促音「っ」**: 次のかなの子音を重ねる打ち方（`きっと` → `ki` + `t` + `to`）を候補の先頭に入れる。
- **撥音「ん」**: 次が母音・な行・や行のときは `n` 単独だと後続と区別できないので `nn`/`xn` のみ許可。

`inputChar()` の判定順序が重要で、
**「今のセグメントを伸ばせるならまず伸ばす。伸ばせないが今の buffer が候補と完全一致
しているなら、そこで確定して次のセグメントに持ち越して再挑戦」** としている。
これにより `んと` を `nnto` とも `nto` とも打てる。ここを単純な「一致したら即確定」に
変えると `nnto` が打てなくなるので注意。

英語モードも同じエンジンに乗っており、`buildPlainSegments()` で1文字1セグメントにしているだけ。
そのため判定・進捗表示・スコア計算はモードによらず共通。

### 画面遷移

```
title → countdown → playing → reveal → playing → … → reveal → result
                                 ↑ 1問打ち切るごとに出典と背景を見せる
```

`reveal` を挟むのは意図的。打ち終わった直後に解説を読ませることでゲームが学びにつながる。
スコアは各問の打鍵時間の合計で計算しているので、`reveal` に何秒とどまっても成績には影響しない。

### 名言を追加するとき

分野に合うファイル(`quotes/science.ts` など)に1件足す。`index.ts` が自動でまとめる。
**`kana` はひらがな・`ー`・`、`・`。` のみで書くこと。**
漢字やカタカナが残っているとローマ字に展開できず、その問題が打てなくなる。

追加したら必ず検証を通すこと。

```bash
npm run validate
```

kana に打てない文字が残っていないか、お手本どおり打って完了するか、英文がASCIIか、
`source`/`note` が空でないか、id が重複していないかを一括で確認する
(`scripts/validate-quotes.ts`)。

> このスクリプトは Node から直接 `.ts` を読むため、import に拡張子まで書いてある。
> Next.js や tsc は拡張子を補完するがNodeのESMは補完しないので、
> アプリ側のコードと書き方が違う点に注意。

`source`(出典)と`note`(意味と背景)は必須。`source` は書名や演説名が特定できるものはそれを書き、
特定できないものは「〜の言葉として広く伝わる」のように**断定を避ける**。
もっともらしい出典をでっち上げないこと。

出典が確認できず、かつ別人の言葉だと分かっているものは入れない。実際に次のものは
調査の結果まちがった帰属だったため、本人の別の言葉に差し替えてある。

| よくある帰属 | 実際 |
|---|---|
| 「狂気とは同じことを繰り返し…」＝アインシュタイン | 出典なし |
| 「最も強い種が生き残るのではなく…」＝ダーウィン | 経営学者メギンソンによる要約(1963) |
| 「我々は繰り返す行いそのものである」＝アリストテレス | ウィル・デュラントによる要約(1926) |
| 「成功は終わりではなく…」＝チャーチル | チャーチル協会が否定 |
| 「聞いたことは忘れる、見たことは覚える…」＝フランクリン | 中国由来の格言 |

## 注意点

- **乱数は必ずユーザー操作の中で回す**。`output: "export"` でビルド時にプリレンダリング
  されるため、初期stateで出題をシャッフルするとハイドレーション不一致になる。
  出題選択は `START` アクション、ハイスコア読み込みは `useEffect` の中で行っている。
- `basePath` は GitHub Actions のビルド時（`GITHUB_PAGES=true`）だけ付く。
  `public/` の画像を参照するときは `process.env.NEXT_PUBLIC_BASE_PATH` を前置する。
- Tailwind CSS v4 のため `tailwind.config.js` は使わない。
