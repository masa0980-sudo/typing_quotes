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
    quotes.ts     # 名言データ(43件)。ここだけ足せば問題を増やせる
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

### 名言を追加するとき

`src/lib/quotes.ts` に1件足す。**`kana` はひらがな・`ー`・`、`・`。` のみで書くこと。**
漢字やカタカナが残っているとローマ字に展開できず、その問題が打てなくなる。

追加後は下のスクリプトで全件を検証できる（`kana` に想定外の文字がないか、
代表表記を打ち切れば必ず完了するか、英文がASCIIのみかを確認する）。

```bash
node --experimental-strip-types -e '
import("./src/lib/quotes.ts").then(async ({QUOTES}) => {
  const {buildSegments, fullRomaji, createTypingState, inputChar, isComplete} = await import("./src/lib/romaji.ts");
  let bad = 0;
  for (const q of QUOTES) {
    if (!/^[ぁ-んゔー、。・！？　 ]+$/.test(q.kana)) { console.log("kana異常", q.id); bad++; }
    let st = createTypingState(q.kana);
    for (const ch of fullRomaji(buildSegments(q.kana))) {
      const r = inputChar(st, ch);
      if (!r.ok) { console.log("打鍵不能", q.id); bad++; break; }
      st = r.state;
    }
  }
  console.log(bad === 0 ? "全件OK" : `問題 ${bad} 件`);
});'
```

出典が確認できない名言（例:「狂気とは同じことを繰り返し…」＝アインシュタインの言葉ではない）は
入れないこと。

## 注意点

- **乱数は必ずユーザー操作の中で回す**。`output: "export"` でビルド時にプリレンダリング
  されるため、初期stateで出題をシャッフルするとハイドレーション不一致になる。
  出題選択は `START` アクション、ハイスコア読み込みは `useEffect` の中で行っている。
- `basePath` は GitHub Actions のビルド時（`GITHUB_PAGES=true`）だけ付く。
  `public/` の画像を参照するときは `process.env.NEXT_PUBLIC_BASE_PATH` を前置する。
- Tailwind CSS v4 のため `tailwind.config.js` は使わない。
