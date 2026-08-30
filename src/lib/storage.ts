import { HIGH_SCORE_KEY, KEYBOARD_PREF_KEY, HIGHLIGHT_KEY_PREF_KEY } from "./constants";
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
 * localStorage の真偽値を useSyncExternalStore で読み書きするための一式を作る。
 *
 * localStorage は React の外にある状態なので、useSyncExternalStore で読ませる。
 * useEffect で読んで setState すると、サーバ描画との食い違いを避けるための
 * 二度描きが必要になるため。
 */
function createBoolPref(key: string, defaultValue: () => boolean) {
  type Listener = () => void;
  const listeners = new Set<Listener>();
  let cache: boolean | null = null;

  function readStored(): boolean | null {
    try {
      const v = localStorage.getItem(key);
      return v === null ? null : v === "1";
    } catch {
      return null;
    }
  }

  return {
    subscribe(cb: Listener): () => void {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    get(): boolean {
      if (cache === null) cache = readStored() ?? defaultValue();
      return cache;
    },
    /** サーバ描画時の値。実際の設定はマウント後に反映される */
    getServer(): boolean {
      return false;
    },
    set(on: boolean): void {
      cache = on;
      try {
        localStorage.setItem(key, on ? "1" : "0");
      } catch {
        // 保存できなくても、そのセッション中は設定が効く
      }
      listeners.forEach((cb) => cb());
    },
  };
}

/** アプリ内キーボードを出すかどうか。未設定ならタッチ端末で出す(物理キーボードが無いため) */
const keyboardPref = createBoolPref(
  KEYBOARD_PREF_KEY,
  () => window.matchMedia?.("(pointer: coarse)").matches === true,
);
export const subscribeKeyboardPref = keyboardPref.subscribe;
export const getKeyboardPref = keyboardPref.get;
export const getKeyboardPrefServer = keyboardPref.getServer;
export const setKeyboardPref = keyboardPref.set;

/** 画面キーボードで次に打つキーを色付けするか。未設定なら初心者向けに色付けする */
const highlightKeyPref = createBoolPref(HIGHLIGHT_KEY_PREF_KEY, () => true);
export const subscribeHighlightKeyPref = highlightKeyPref.subscribe;
export const getHighlightKeyPref = highlightKeyPref.get;
export const getHighlightKeyPrefServer = highlightKeyPref.getServer;
export const setHighlightKeyPref = highlightKeyPref.set;
