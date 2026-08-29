/**
 * 発言者の肖像。1問打ち終わったあとの画面(RevealScreen)で出す。
 *
 * ★このファイルは scripts/fetch-portraits.py が生成する。手で書き換えないこと。
 *   人物を足したら fetch-portraits.py の WIKI に1行足して再実行する。
 *
 * キーは Quote.authorEn。肖像は「名言の属性」ではなく「人物の属性」なので、
 * ここを Quote 型と切り離しておくと、名言データ側に一切手を入れずに済む
 * (同じ人物の複数の名言で自然に共有される)。
 *
 * 画像は Wikimedia Commons から取得し、128x128 にトリミングした改変物。
 * license が Public domain / CC0 以外のものは表示義務があるので、
 * CreditsScreen に必ず出す(検証は scripts/validate-quotes.ts が行う)。
 */
export interface Portrait {
  /** public/portraits/ 配下のファイル名 */
  file: string;
  /** 作者・撮影者 */
  credit: string;
  /** "Public domain" / "CC BY-SA 3.0" など */
  license: string;
  /** Commons のファイルページ */
  sourceUrl: string;
}

export const PORTRAITS: Record<string, Portrait> = {};

/** クレジット表示が要るライセンスか(パブリックドメインとCC0は不要) */
export function needsCredit(license: string): boolean {
  const free = ["public domain", "cc0", "pd-"];
  const l = license.toLowerCase();
  return !free.some((f) => l.startsWith(f));
}
