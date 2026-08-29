import { QUOTES } from "./quotes";
import { createTypingState, createPlainState, inputChar, isComplete } from "./romaji";
import {
  QUESTIONS_PER_GAME,
  COUNTDOWN_SEC,
  TIME_ATTACK_SEC,
  TIME_ATTACK_POOL,
} from "./constants";
import type {
  GameVariant,
  Mode,
  Phase,
  Quote,
  QuestionResult,
  TypingState,
} from "./types";

export interface GameState {
  phase: Phase;
  mode: Mode;
  variant: GameVariant;
  /** この回で出題する名言(シャッフル済み) */
  quotes: Quote[];
  index: number;
  typing: TypingState;
  results: QuestionResult[];
  /** 打ち切った名言。タイムアタックは解説を挟まないので、結果画面でまとめて読ませる */
  cleared: Quote[];
  /** 現在の問題での打鍵 */
  correct: number;
  miss: number;
  /** ゲーム全体の累計 */
  totalCorrect: number;
  totalMiss: number;
  startedAt: number;
  questionStartedAt: number;
  countdown: number;
  /** 直前の打鍵がミスだったか(画面を赤く光らせる用) */
  lastMiss: boolean;
  best: number;
}

export type Action =
  | { type: "SET_MODE"; mode: Mode }
  | { type: "SET_VARIANT"; variant: GameVariant }
  | { type: "SET_BEST"; best: number }
  | { type: "START"; now: number }
  | { type: "COUNTDOWN"; now: number }
  | { type: "KEY"; char: string; now: number }
  | { type: "NEXT"; now: number }
  | { type: "TIMEUP" }
  | { type: "TO_TITLE" };

const EMPTY_TYPING: TypingState = { segments: [], segIndex: 0, buffer: "", typed: "" };

export function createInitialState(): GameState {
  return {
    phase: "title",
    mode: "ja",
    variant: "quiz",
    quotes: [],
    index: 0,
    typing: EMPTY_TYPING,
    results: [],
    cleared: [],
    correct: 0,
    miss: 0,
    totalCorrect: 0,
    totalMiss: 0,
    startedAt: 0,
    questionStartedAt: 0,
    countdown: COUNTDOWN_SEC,
    lastMiss: false,
    best: 0,
  };
}

/**
 * 出題の重み。長い名言ほど出にくくする。
 * 名言は1件も削っていない(長文をじっくり打ちたい人のために残す)が、
 * 短いものが続けて出るようにして「1回が長すぎる」のを避ける。
 *
 * しきい値は収録115件の実際の分布に合わせてある(おおよそ 2割 / 6割 / 9割 の位置)。
 * ja はかな、en は原文の文字数で測る。同じ名言でも言語で長さが違うため。
 */
const LENGTH_WEIGHTS: Record<Mode, { max: number; weight: number }[]> = {
  ja: [
    { max: 22, weight: 3.0 },
    { max: 32, weight: 2.0 },
    { max: 39, weight: 1.2 },
    { max: Infinity, weight: 0.5 },
  ],
  en: [
    { max: 45, weight: 3.0 },
    { max: 62, weight: 2.0 },
    { max: 78, weight: 1.2 },
    { max: Infinity, weight: 0.5 },
  ],
};

/** そのモードで実際に打つ文字列の長さ */
function typingLength(quote: Quote, mode: Mode): number {
  return mode === "ja" ? quote.kana.length : quote.en.length;
}

function weightOf(quote: Quote, mode: Mode): number {
  const len = typingLength(quote, mode);
  return LENGTH_WEIGHTS[mode].find((b) => len <= b.max)!.weight;
}

/**
 * 出題する名言を重み付きで選ぶ(同じ名言は1回まで)。
 * ユーザー操作の中でだけ呼ぶ(SSRとの不一致を避けるため)。
 */
function pickQuotes(count: number, mode: Mode): Quote[] {
  const pool = [...QUOTES];
  const weights = pool.map((q) => weightOf(q, mode));
  const picked: Quote[] = [];
  const n = Math.min(count, pool.length);

  for (let k = 0; k < n; k++) {
    const total = weights.reduce((a, w) => a + w, 0);
    let r = Math.random() * total;
    let i = 0;
    // 浮動小数の誤差で末尾を超えることがあるので、最後の要素で必ず止める
    for (; i < pool.length - 1; i++) {
      r -= weights[i];
      if (r <= 0) break;
    }
    picked.push(pool[i]);
    // 選んだものは取り除く(末尾と入れ替えて pop、順序は使っていない)
    pool[i] = pool[pool.length - 1];
    weights[i] = weights[weights.length - 1];
    pool.pop();
    weights.pop();
  }
  return picked;
}

/** モードに応じて、その名言用の打鍵状態を作る */
function typingFor(quote: Quote, mode: Mode): TypingState {
  return mode === "ja" ? createTypingState(quote.kana) : createPlainState(quote.en);
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "SET_VARIANT":
      return { ...state, variant: action.variant };

    case "SET_BEST":
      return { ...state, best: action.best };

    case "START": {
      const count =
        state.variant === "timeattack" ? TIME_ATTACK_POOL : QUESTIONS_PER_GAME;
      const quotes = pickQuotes(count, state.mode);
      return {
        ...createInitialState(),
        mode: state.mode,
        variant: state.variant,
        best: state.best,
        phase: "countdown",
        countdown: COUNTDOWN_SEC,
        quotes,
        typing: typingFor(quotes[0], state.mode),
      };
    }

    case "COUNTDOWN": {
      if (state.phase !== "countdown") return state;
      const next = state.countdown - 1;
      if (next > 0) return { ...state, countdown: next };
      return {
        ...state,
        phase: "playing",
        countdown: 0,
        startedAt: action.now,
        questionStartedAt: action.now,
      };
    }

    case "KEY": {
      if (state.phase !== "playing") return state;
      // 日本語モードはローマ字なので大文字でも打てるように寄せる
      const ch = state.mode === "ja" ? action.char.toLowerCase() : action.char;
      const res = inputChar(state.typing, ch);

      if (!res.ok) {
        return { ...state, miss: state.miss + 1, totalMiss: state.totalMiss + 1, lastMiss: true };
      }

      const correct = state.correct + 1;
      const totalCorrect = state.totalCorrect + 1;

      if (!res.completed) {
        return { ...state, typing: res.state, correct, totalCorrect, lastMiss: false };
      }

      const quote = state.quotes[state.index];
      const result: QuestionResult = {
        quoteId: quote.id,
        correct,
        miss: state.miss,
        elapsedMs: action.now - state.questionStartedAt,
      };
      const common = {
        ...state,
        correct,
        totalCorrect,
        results: [...state.results, result],
        cleared: [...state.cleared, quote],
        lastMiss: false,
      };

      // タイムアタックは解説を挟まず、そのまま次の名言へ。テンポを止めないため
      if (state.variant === "timeattack") {
        const nextIndex = state.index + 1;
        if (nextIndex >= state.quotes.length) {
          return { ...common, phase: "result", typing: res.state };
        }
        return {
          ...common,
          index: nextIndex,
          typing: typingFor(state.quotes[nextIndex], state.mode),
          correct: 0,
          miss: 0,
          questionStartedAt: action.now,
        };
      }

      // クイズ形式は、すぐ次へは進まず、その名言の出典と背景を見せる
      return { ...common, phase: "reveal", typing: res.state };
    }

    case "NEXT": {
      if (state.phase !== "reveal") return state;
      const nextIndex = state.index + 1;
      if (nextIndex >= state.quotes.length) {
        return { ...state, phase: "result" };
      }
      return {
        ...state,
        phase: "playing",
        index: nextIndex,
        typing: typingFor(state.quotes[nextIndex], state.mode),
        correct: 0,
        miss: 0,
        questionStartedAt: action.now,
        lastMiss: false,
      };
    }

    case "TIMEUP": {
      if (state.phase !== "playing") return state;
      return { ...state, phase: "result", lastMiss: false };
    }

    case "TO_TITLE":
      return {
        ...createInitialState(),
        mode: state.mode,
        variant: state.variant,
        best: state.best,
      };

    default:
      return state;
  }
}

export interface Summary {
  /** 正しく打てたキーの数 */
  correct: number;
  miss: number;
  /** 打鍵数/分 */
  kpm: number;
  /** 英単語換算の速度(5打鍵=1語) */
  wpm: number;
  /** 0〜1 */
  accuracy: number;
  elapsedSec: number;
  /** 打ち切った名言の数 */
  clearedCount: number;
  score: number;
}

/** 結果画面用の集計。速度と正確さを掛け合わせてスコアにする */
export function summarize(state: GameState): Summary {
  // タイムアタックは制限時間ぶんを丸ごと使ったものとして数える。
  // 各問の打鍵時間を足すと、時間切れで打ちかけの問題のぶんが抜けて速度が不当に高く出る
  const elapsedSec =
    state.variant === "timeattack"
      ? TIME_ATTACK_SEC
      : state.results.reduce((a, r) => a + r.elapsedMs, 0) / 1000;
  const correct = state.totalCorrect;
  const miss = state.totalMiss;
  const kpm = elapsedSec > 0 ? (correct / elapsedSec) * 60 : 0;
  const wpm = kpm / 5;
  const accuracy = correct + miss > 0 ? correct / (correct + miss) : 0;
  // 正確さは2乗で効かせて、速いだけ・正確なだけでは伸びないようにする
  const score = Math.round(kpm * accuracy * accuracy * 10);
  return {
    correct,
    miss,
    kpm,
    wpm,
    accuracy,
    elapsedSec,
    clearedCount: state.cleared.length,
    score,
  };
}

export { isComplete };
