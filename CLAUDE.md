# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

偉人の名言をお題にしたタイピングゲーム。日本語（ローマ字入力）と英語の2モードがある。
Next.js の静的エクスポートで GitHub Pages に公開している。

公開URL: https://masa0980-sudo.github.io/typing_quotes/

## Commands

```bash
npm install
npm run dev                      # http://localhost:3000
npm run build                    # 静的エクスポート → out/
GITHUB_PAGES=true npm run build  # 本番と同じ basePath 付きでビルド
npx tsc --noEmit                 # 型チェックのみ
npm run validate                 # 名言データの検証

.claude/scripts/dev.sh 3111      # 開発サーバー(ポート固定)
.claude/scripts/check.sh         # push前の3点セット: 検証 → 型 → 本番と同じビルド
```

デプロイは `main` への push で GitHub Actions が自動実行する（`.github/workflows/deploy-pages.yml`）。
別途デプロイコマンドはない。**公開まわりの手順とハマりどころは `publish-to-pages` スキルにまとめてある。**

## Architecture

```
src/
  app/
    page.tsx      # GameScreen を置くだけ
    layout.tsx    # フォント・メタデータ
    globals.css   # Tailwind v4 + 画面演出のkeyframes
  lib/
    quotes/       # 名言データ(115件)。分野ごとに分割。index.ts がまとめる
      index.ts science.ts philosophy.ts society.ts
      arts.ts japan.ts short.ts modern.ts
    romaji.ts     # ★ローマ字入力エンジン(このリポジトリの心臓部)
    types.ts      # 型定義
    constants.ts  # 出題数・ランクしきい値
    reducer.ts    # ゲーム状態機械 + 結果集計
    portraits.ts  # 発言者の肖像とクレジット(scripts/fetch-portraits.py が生成)
    storage.ts    # ハイスコア(localStorage、モード別)
    sound.ts      # Web Audio APIで合成する効果音
  components/
    GameScreen.tsx   # 画面の出し分け・キー入力・タイマー・音
    TitleScreen.tsx  # モード選択
    PlayScreen.tsx   # お題と打鍵ラインの表示
    RevealScreen.tsx # 1問クリア後に出典と背景を見せる
    AuthorAvatar.tsx # 発言者の円形の肖像(無ければ頭文字のモノグラム)
    CreditsScreen.tsx# 画像クレジット(CCライセンスの表示義務を果たす画面)
    GalleryScreen.tsx# 収録人物の一覧。人物を選ぶとその人の名言を読める
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

### タイトルから開く2つのオーバーレイ

`CreditsScreen`(画像クレジット)と `GalleryScreen`(偉人・有名人一覧)は、
**`Phase` に足さず `GameScreen` の `useState` で出し入れしている**。
表示するだけの画面なので、状態機械に足すと全分岐に影響が出るわりに得るものが無い。

**Esc の扱いに注意。** 既定の Esc は `TO_TITLE` を投げるので、オーバーレイが
開いているときは先に閉じる分岐が要る。人物一覧は中で人物を選べる(2段ある)ため、
`GameScreen` は `showGallery` のとき Esc を素通しし、`GalleryScreen` 側で
「人物を開いていれば一覧へ、一覧なら閉じる」と1段ずつ戻している。

一覧の分野分けは**名言ファイルの初出**で決まる。`short.ts` は他分野の人物の
短い名言を集めたファイルなので最後に見る(先に見るとニュートンが「科学」ではなく
そちらに入ってしまう)。`short.ts` にしか名言が無い人物は全員「その他」に落ちるので、
`REASSIGN` で肩書きに合う分野へ手で寄せている(書き漏らしても「その他」に出るだけ)。

### 画面遷移

```
title → countdown → playing → reveal → playing → … → reveal → result
                                 ↑ 1問打ち切るごとに出典と背景を見せる
```

`reveal` を挟むのは意図的。打ち終わった直後に解説を読ませることでゲームが学びにつながる。
スコアは各問の打鍵時間の合計で計算しているので、`reveal` に何秒とどまっても成績には影響しない。

### 名言を追加するとき

> 手順の詳細は `add-quotes` スキルにある。帰属の裏取りは `quote-verifier` エージェントに投げる。
> ここに書くのは、忘れると壊れる要点だけ。

分野に合うファイル(`quotes/science.ts` など)に1件足す。`index.ts` が自動でまとめる。
**`kana` はひらがな・`ー`・`、`・`。` のみで書くこと。**
漢字やカタカナが残っているとローマ字に展開できず、その問題が打てなくなる。

追加したら必ず検証を通すこと。

```bash
npm run validate
```

kana に打てない文字が残っていないか、お手本どおり打って完了するか、英文がASCIIか、
`source`/`note` が空でないか、id が重複していないか、**日本語欄に他言語が混入していないか**を
一括で確認する (`scripts/validate-quotes.ts`)。

最後の1つは実際に3回起きた事故への対策。`データ`→`데이터`(ハングル)、`分野別`→`分野별`、
`創る`→`создать`(キリル文字)のように、日本語を書いているつもりで別の文字体系が紛れ込むことがある。
目視では気づきにくいので `FOREIGN = /[Ѐ-ӿ가-힯]/` で機械的に弾いている。

> このスクリプトは Node から直接 `.ts` を読むため、import に拡張子まで書いてある。
> Next.js や tsc は拡張子を補完するがNodeのESMは補完しないので、
> アプリ側のコードと書き方が違う点に注意。

`source`(出典)と`note`(意味と背景)は必須。`source` は書名や演説名が特定できるものはそれを書き、
特定できないものは「〜の言葉として広く伝わる」のように**断定を避ける**。
もっともらしい出典をでっち上げないこと。

`modern.ts` は現代の実業家・クリエイターの言葉で、書物ではなく動画が出典になる。
対談動画から採るときは**発言者が誰か**に注意すること(ゲストの発言が混ざっていることがある)。

出典が確認できず、かつ別人の言葉だと分かっているものは入れない。実際に次のものは
調査の結果まちがった帰属だったため、本人の別の言葉に差し替えてある。

| よくある帰属 | 実際 |
|---|---|
| 「狂気とは同じことを繰り返し…」＝アインシュタイン | 出典なし |
| 「最も強い種が生き残るのではなく…」＝ダーウィン | 経営学者メギンソンによる要約(1963) |
| 「我々は繰り返す行いそのものである」＝アリストテレス | ウィル・デュラントによる要約(1926) |
| 「成功は終わりではなく…」＝チャーチル | チャーチル協会が否定 |
| 「聞いたことは忘れる、見たことは覚える…」＝フランクリン | 中国由来の格言 |

### 肖像画像

発言者の顔を `reveal` 画面に出している。画像は `public/portraits/*.webp`(128px)、
クレジットは `src/lib/portraits.ts`。**どちらも `scripts/fetch-portraits.py` の生成物なので
手で書き換えない。**

キーは `Quote.authorEn`。肖像は「名言の属性」ではなく「人物の属性」なので、
名言データ115件と `Quote` 型からは完全に切り離してある。

#### 取得はGitHub Actionsで行う

**このサンドボックスからは wikimedia.org に到達できない**（ネットワークポリシーが
CONNECT を403で拒否）。そのため取得は `.github/workflows/fetch-portraits.yml` を
手動実行して行い、結果をコミットさせる。**通常のビルドは外部ネットワークに依存しない。**

Wikimedia は共有IPからの連続アクセスに厳しく、GitHub のランナーからだと詰まる。
そのため次の設計にしてある。

- **取得済み（画像が実在する人物）は飛ばす**。何度か実行して埋めていく
- 既存の `portraits.ts` を読んでマージするので、途中で止まっても前回ぶんが消えない
- 1回の実行に時間の上限（`PORTRAIT_BUDGET`）があり、超えたら取れたぶんだけ書き出す

#### 差し替えるときは必ず目視する

代表画像が肖像とは限らない。実際にこうなっていた。

| 人物 | 何が起きたか |
|---|---|
| 老子 | 代表画像が「老子」という**漢字だけのSVG**で人物ですらなかった |
| レオナルド・ダ・ヴィンチ | 赤チョークの素描で、上端を切ると肌色のぼやけた面だけになった |
| 紫式部 | 横長の絵巻で、上端を切ると風景しか写らなかった |
| モーツァルト | 家族の**群像**だった |
| エピクテトス | 書物の**扉絵**だった |

**全員を1枚に並べたコンタクトシートを作って `Read` で目視する**こと。
差し替えは `OVERRIDE`(ファイル名)と `GRAVITY`(切り出し位置)で行う。
既定の `north` は写真の肖像向けで、掛軸や横長の絵画は `center` / `south` が要る。
候補は**実際に128pxへ切ってから見比べて決める**（名前だけで選ぶと外す）。

差し替えたい人物の `.webp` を消してから再実行すると、その人だけ取り直される。

#### ライセンス

71人ぶんを収録。**クレジット表示が必要なのは11人**で、残る60人は
パブリックドメインか CC0（表示義務なし）。

**SNSやYouTubeから画像を持ってこないこと。** 著作権（撮影者にある）と
肖像権・パブリシティ権の両方の許諾が要る。Commons を先に探せば、
存命の人物でもCCライセンスの写真が見つかることがある（ヒカル氏がその例で、
本人が撮影者の CC BY 3.0 を採用している）。

**存命の人物は著作権とは別に肖像権がかかる。** 掲載中止の求めがあれば、
`NO_PORTRAIT` に名前を足して画像を消せばモノグラム表示に戻る。

**CC BY-SA は「作者の表示」と「改変物を同じライセンスで提供」が義務**。
`CreditsScreen` がその画面で、内容は `PORTRAITS` から自動生成している。
**手書きしないこと**（書き漏らしがそのままライセンス違反になる）。
`npm run validate` が、クレジットの要る画像に作者と出典があるかを機械的に見ている。

## 公開（GitHub Pages）

`main` へ push すれば自動で公開される。詳細な手順は `publish-to-pages` スキル。
CLAUDE.md に残しておくのは、**一度やらかして時間を溶かした3点**だけ。

- **リポジトリ名は `typing_quotes`（アンダースコア）**。`next.config.ts` の `repoName` が
  1文字でも実物と違うと、ローカルでは動くのに公開先で全アセットが404になる。
  変えるときは `README.md` / `package.json` の `name` も揃える。
- **初回公開は、ユーザーが Settings → Pages → Source を「GitHub Actions」にしないと必ず失敗する。**
  `Create Pages site failed. Error: Resource not accessible by integration` が出たらこれ。
  コードをいじっても直らないので、ユーザーに設定を依頼して run を再実行する。
  リポジトリの新規作成も同じ理由で自分ではできない（403）。
- **Actions API のジョブ状態は数分古いまま返ることがある。** 進んでいないように見えても
  すぐに cancel / rerun せず、数分待って取り直す。最終判断は `get_job_logs` の実ログ。

## 注意点

- **乱数は必ずユーザー操作の中で回す**。`output: "export"` でビルド時にプリレンダリング
  されるため、初期stateで出題をシャッフルするとハイドレーション不一致になる。
  出題選択は `START` アクション、ハイスコア読み込みは `useEffect` の中で行っている。
- `basePath` は GitHub Actions のビルド時（`GITHUB_PAGES=true`）だけ付く。
  `public/` の画像を参照するときは `process.env.NEXT_PUBLIC_BASE_PATH` を前置する。
- Tailwind CSS v4 のため `tailwind.config.js` は使わない。
- **このサンドボックスからは `*.github.io` と多くの外部サイトに到達できない。**
  公開URLを開いての表示確認も、名言サイトや Wikiquote を直接読んでの裏取りもできない
  （`curl` が `000` を返す）。到達できなかったことを確認できたことにせず、
  **報告時に「未確認」と明示する**こと。
- `scripts/` は tsconfig の `exclude` に入れてある。ここを外すと
  `next build` が TS5097（`.ts` 拡張子付きimportは不可）で落ちる。

## `.claude` の中身

| 場所 | 用途 |
|---|---|
| `skills/add-quotes/` | 名言を追加・修正するときの手順（帰属の裏取り、kanaの制約、検証） |
| `skills/verify-in-browser/` | ローカル起動〜Playwrightでの動作確認 |
| `skills/publish-to-pages/` | GitHub Pages 公開の手順と初回のハマりどころ |
| `agents/quote-verifier.md` | 名言の帰属と出典を裏取りする調査エージェント |
| `scripts/dev.sh` | 開発サーバー（ポート固定） |
| `scripts/check.sh` | push前の3点セット（検証 → 型 → 本番と同じビルド） |
| `settings.json` | 定型コマンドの許可設定 |
