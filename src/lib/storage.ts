import { HIGH_SCORE_KEY, KEYBOARD_PREF_KEY } from "./constants";
import type { GameVariant, Mode } from "./types";

export function loadHighScore(mode: Mode, variant: GameVariant): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY[variant][mode]) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(mode: Mode, variant: GameVariant, score: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HIGH_SCORE_KEY[variant][mode], String(score));
  } catch {
    // プライベートブラウジング等で書けなくてもゲームは続行できる
  }
}

/**
 * アプリ内キーボードを出すかどうか。
 *
 * localStorage は React の外にある状態なので、useSyncExternalStore で読ませる。
 * useEffect で読んで setState すると、サーバ描画との食い違いを避けるための
 * 二度描きが必要になるため。
 */

type Listener = () => void;
const listeners = new Set<Listener>();
let cache: boolean | null = null;

function readPref(): boolean | null {
  try {
    const v = localStorage.getItem(KEYBOARD_PREF_KEY);
    return v === null ? null : v === "1";
  } catch {
    return null;
  }
}

/** 未設定のときの初期値。タッチ端末には物理キーボードが無いので出す */
function defaultPref(): boolean {
  return window.matchMedia?.("(pointer: coarse)").matches === true;
}

export function subscribeKeyboardPref(cb: Listener): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function getKeyboardPref(): boolean {
  if (cache === null) cache = readPref() ?? defaultPref();
  return cache;
}

/** サーバ描画時の値。実際の設定はマウント後に反映される */
export function getKeyboardPrefServer(): boolean {
  return false;
}

export function setKeyboardPref(on: boolean): void {
  cache = on;
  try {
    localStorage.setItem(KEYBOARD_PREF_KEY, on ? "1" : "0");
  } catch {
    // 保存できなくても、そのセッション中は設定が効く
  }
  listeners.forEach((cb) => cb());
}
