import type { Quote } from "../types";
import { SCIENCE } from "./science";
import { PHILOSOPHY } from "./philosophy";
import { SOCIETY } from "./society";
import { ARTS } from "./arts";
import { JAPAN } from "./japan";
import { SHORT } from "./short";
import { MODERN } from "./modern";

/**
 * 名言の全リスト。分野ごとのファイルをここでまとめている。
 * 名言を足すときは分野のファイルに1件足すだけでよい。
 *
 * `kana` はひらがな・`ー`・`、`・`。` だけで書くこと。
 * 漢字やカタカナが残っているとローマ字に展開できず、その問題が打てなくなる。
 */
export const QUOTES: Quote[] = [
  ...SCIENCE,
  ...PHILOSOPHY,
  ...SOCIETY,
  ...ARTS,
  ...JAPAN,
  ...SHORT,
  ...MODERN,
];

export { SCIENCE, PHILOSOPHY, SOCIETY, ARTS, JAPAN, SHORT, MODERN };
