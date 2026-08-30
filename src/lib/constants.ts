/** 1ゲームで出題する名言の数(クイズ形式) */
export const QUESTIONS_PER_GAME = 5;

/** タイムアタックの制限時間(秒) */
export const TIME_ATTACK_SEC = 60;

/**
 * タイムアタックであらかじめ引いておく問題数。
 * 60秒で打ち切れる数(速い人でも10文程度)より十分多くとって、途中で尽きないようにする。
 */
export const TIME_ATTACK_POOL = 40;

/** カウントダウンの秒数 */
export const COUNTDOWN_SEC = 3;

/**
 * ハイスコアの保存キー。
 * 形式が違うとスコアの意味も変わるので、モード×形式で別々に持つ。
 * quiz 側のキーは、以前のバージョンで保存された記録を引き継ぐためそのまま残してある。
 */
export const HIGH_SCORE_KEY = {
  quiz: {
    ja: "typing-quotes:best:ja",
    en: "typing-quotes:best:en",
  },
  timeattack: {
    ja: "typing-quotes:best:ja:ta",
    en: "typing-quotes:best:en:ta",
  },
} as const;

/** アプリ内キーボードを出すかどうかの保存キー */
export const KEYBOARD_PREF_KEY = "typing-quotes:onscreen-keyboard";

/** 画面キーボードで次に打つキーを色付けするかどうかの保存キー */
export const HIGHLIGHT_KEY_PREF_KEY = "typing-quotes:onscreen-keyboard-highlight";

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
