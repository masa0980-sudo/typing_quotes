import { QUOTES } from "./quotes";
import { createTypingState, createPlainState, inputChar, isComplete } from "./romaji";
import { QUESTIONS_PER_GAME, COUNTDOWN_SEC } from "./constants";
import type { Mode, Phase, Quote, QuestionResult, TypingState } from "./types";

export interface GameState {
  phase: Phase;
  mode: Mode;
  /** この回で出題する名言(シャッフル済み) */
  quotes: Quote[];
  index: number;
  typing: TypingState;
  results: QuestionResult[];
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
  | { type: "SET_BEST"; best: number }
  | { type: "START"; now: number }
  | { type: "COUNTDOWN"; now: number }
  | { type: "KEY"; char: string; now: number }
  | { type: "TO_TITLE" };

const EMPTY_TYPING: TypingState = { segments: [], segIndex: 0, buffer: "", typed: "" };

export function createInitialState(): GameState {
  return {
    phase: "title",
    mode: "ja",
    quotes: [],
    index: 0,
    typing: EMPTY_TYPING,
    results: [],
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

/** 出題する名言をランダムに選ぶ。ユーザー操作の中でだけ呼ぶ(SSRとの不一致を避けるため) */
function pickQuotes(count: number): Quote[] {
  const pool = [...QUOTES];
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, Math.min(count, pool.length));
}

/** モードに応じて、その名言用の打鍵状態を作る */
function typingFor(quote: Quote, mode: Mode): TypingState {
  return mode === "ja" ? createTypingState(quote.kana) : createPlainState(quote.en);
}

export function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "SET_MODE":
      return { ...state, mode: action.mode };

    case "SET_BEST":
      return { ...state, best: action.best };

    case "START": {
      const quotes = pickQuotes(QUESTIONS_PER_GAME);
      return {
        ...createInitialState(),
        mode: state.mode,
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

      // 1問打ち終わった
      const result: QuestionResult = {
        quoteId: state.quotes[state.index].id,
        correct,
        miss: state.miss,
        elapsedMs: action.now - state.questionStartedAt,
      };
      const results = [...state.results, result];
      const nextIndex = state.index + 1;

      if (nextIndex >= state.quotes.length) {
        return {
          ...state,
          phase: "result",
          typing: res.state,
          correct,
          totalCorrect,
          results,
          lastMiss: false,
        };
      }

      return {
        ...state,
        index: nextIndex,
        typing: typingFor(state.quotes[nextIndex], state.mode),
        results,
        correct: 0,
        miss: 0,
        totalCorrect,
        questionStartedAt: action.now,
        lastMiss: false,
      };
    }

    case "TO_TITLE":
      return { ...createInitialState(), mode: state.mode, best: state.best };

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
  score: number;
}

/** 結果画面用の集計。速度と正確さを掛け合わせてスコアにする */
export function summarize(state: GameState): Summary {
  const elapsedMs = state.results.reduce((a, r) => a + r.elapsedMs, 0);
  const elapsedSec = elapsedMs / 1000;
  const correct = state.totalCorrect;
  const miss = state.totalMiss;
  const kpm = elapsedSec > 0 ? (correct / elapsedSec) * 60 : 0;
  const wpm = kpm / 5;
  const accuracy = correct + miss > 0 ? correct / (correct + miss) : 0;
  // 正確さは2乗で効かせて、速いだけ・正確なだけでは伸びないようにする
  const score = Math.round(kpm * accuracy * accuracy * 10);
  return { correct, miss, kpm, wpm, accuracy, elapsedSec, score };
}

export { isComplete };
