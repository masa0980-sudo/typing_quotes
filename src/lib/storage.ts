import { HIGH_SCORE_KEY } from "./constants";
import type { Mode } from "./types";

export function loadHighScore(mode: Mode): number {
  if (typeof window === "undefined") return 0;
  try {
    return parseInt(localStorage.getItem(HIGH_SCORE_KEY[mode]) ?? "0", 10) || 0;
  } catch {
    return 0;
  }
}

export function saveHighScore(mode: Mode, score: number): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(HIGH_SCORE_KEY[mode], String(score));
  } catch {
    // プライベートブラウジング等で書けなくてもゲームは続行できる
  }
}
