/** 1ゲームで出題する名言の数 */
export const QUESTIONS_PER_GAME = 5;

/** カウントダウンの秒数 */
export const COUNTDOWN_SEC = 3;

/** ハイスコアの保存キー(モードごとに分ける) */
export const HIGH_SCORE_KEY = {
  ja: "typing-quotes:best:ja",
  en: "typing-quotes:best:en",
} as const;

/** 評価ランクのしきい値(スコアの下限, ランク, ひとこと) */
export const RANKS: { min: number; rank: string; note: string }[] = [
  { min: 4500, rank: "S", note: "達人の域です" },
  { min: 3200, rank: "A", note: "とても速く正確です" },
  { min: 2200, rank: "B", note: "安定してきました" },
  { min: 1300, rank: "C", note: "この調子で続けましょう" },
  { min: 0, rank: "D", note: "まずは正確さから" },
];

export function rankFor(score: number) {
  return RANKS.find((r) => score >= r.min) ?? RANKS[RANKS.length - 1];
}
