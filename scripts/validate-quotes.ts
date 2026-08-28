/**
 * 名言データの健全性チェック。`npm run validate` で実行する。
 *
 * 見ているのは次の5点。
 *  1. kana がひらがな等だけで書かれているか(漢字やカタカナが残っていないか)
 *  2. その kana が実際に最後まで打ち切れるか(ローマ字に展開できるか)
 *  3. 英文が ASCII だけか(英語モードで打てるか)
 *  4. source / note / author / role が空でないか
 *  5. id が重複していないか
 *
 * Node の ESM は拡張子を補完しないので、import は必ず `.ts` まで書くこと。
 * (Next.js や tsc は補完してくれるため、アプリ側のコードとは書き方が異なる)
 */
import { SCIENCE } from "../src/lib/quotes/science.ts";
import { PHILOSOPHY } from "../src/lib/quotes/philosophy.ts";
import { SOCIETY } from "../src/lib/quotes/society.ts";
import { ARTS } from "../src/lib/quotes/arts.ts";
import { JAPAN } from "../src/lib/quotes/japan.ts";
import { SHORT } from "../src/lib/quotes/short.ts";
import {
  buildSegments,
  fullRomaji,
  createTypingState,
  inputChar,
  isComplete,
} from "../src/lib/romaji.ts";

const GROUPS = {
  science: SCIENCE,
  philosophy: PHILOSOPHY,
  society: SOCIETY,
  arts: ARTS,
  japan: JAPAN,
  short: SHORT,
};
const QUOTES = Object.values(GROUPS).flat();

const KANA_OK = /^[ぁ-んゔー、。・！？　 ]+$/;
const ASCII_OK = /^[\x20-\x7E]+$/;
/** 日本語欄に紛れ込みがちな他言語(キリル文字・ハングル)を弾く */
const FOREIGN = /[Ѐ-ӿ가-힯]/;

let bad = 0;
const fail = (msg: string) => {
  console.log(`  ✗ ${msg}`);
  bad++;
};

for (const q of QUOTES) {
  if (!KANA_OK.test(q.kana)) {
    const off = [...new Set([...q.kana].filter((c) => !/[ぁ-んゔー、。・！？　 ]/.test(c)))];
    fail(`${q.id}: kana に打てない文字 ${off.join(" ")}`);
  }

  let st = createTypingState(q.kana);
  let typable = true;
  for (const ch of fullRomaji(buildSegments(q.kana))) {
    const r = inputChar(st, ch);
    if (!r.ok) {
      typable = false;
      break;
    }
    st = r.state;
  }
  if (!typable || !isComplete(st)) fail(`${q.id}: お手本どおり打っても完了しない`);

  if (!ASCII_OK.test(q.en)) {
    const off = [...new Set([...q.en].filter((c) => !/[\x20-\x7E]/.test(c)))];
    fail(`${q.id}: en に非ASCII文字 ${off.join(" ")}`);
  }

  for (const f of ["source", "note", "author", "role", "ja", "en"] as const) {
    if (!q[f] || q[f].trim() === "") fail(`${q.id}: ${f} が空`);
  }

  if (FOREIGN.test(q.ja + q.note + q.source)) fail(`${q.id}: 日本語欄に他言語が混入`);
}

const ids = QUOTES.map((q) => q.id);
const dup = [...new Set(ids.filter((v, i) => ids.indexOf(v) !== i))];
if (dup.length) fail(`id が重複: ${dup.join(", ")}`);

const kana = QUOTES.map((q) => q.kana.length);
const avg = (a: number[]) => (a.reduce((x, y) => x + y, 0) / a.length).toFixed(1);

console.log("分野別の件数:");
for (const [k, v] of Object.entries(GROUPS)) console.log(`  ${k.padEnd(11)} ${v.length}件`);
console.log(`\n合計 ${QUOTES.length}件 / ${new Set(QUOTES.map((q) => q.author)).size}人`);
console.log(`かな長 最小${Math.min(...kana)} 最大${Math.max(...kana)} 平均${avg(kana)}`);
console.log(`短い問題(かな22字以下) ${kana.filter((n) => n <= 22).length}件`);
console.log(bad === 0 ? "\n✓ 全件OK" : `\n✗ 問題 ${bad} 件`);

process.exit(bad === 0 ? 0 : 1);
