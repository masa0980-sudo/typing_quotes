/** 出題する名言。origin はもともと何語で語られたかを表す */
export interface Quote {
  id: string;
  origin: "en" | "ja";
  /** 英語(欧米の偉人は原文、日本の偉人は英訳) */
  en: string;
  /** 日本語(日本の偉人は原文、欧米の偉人は訳) */
  ja: string;
  /** ja のひらがな読み。ローマ字判定に使う */
  kana: string;
  author: string;
  authorEn: string;
  role: string;
}

/** 遊ぶモード。日本語はローマ字入力、英語は原文をそのまま打つ */
export type Mode = "ja" | "en";

/** ローマ字入力の1単位。かな1〜2文字に対して複数の打ち方を許容する */
export interface RomajiSegment {
  kana: string;
  /** 受け付けるローマ字表記。先頭が代表表記(画面に表示するもの) */
  candidates: string[];
}

/** 1問ぶんの打鍵状態 */
export interface TypingState {
  segments: RomajiSegment[];
  /** 確定済みセグメント数 */
  segIndex: number;
  /** 現在セグメントに対して入力済みの文字 */
  buffer: string;
  /** 確定した打鍵の累計(表示用) */
  typed: string;
}

export type Phase = "title" | "countdown" | "playing" | "result";

/** 1問ぶんの成績 */
export interface QuestionResult {
  quoteId: string;
  /** 打鍵数(正解のみ) */
  correct: number;
  /** ミスタイプ数 */
  miss: number;
  /** 所要ミリ秒 */
  elapsedMs: number;
}
