// ミニゲーム・メドレー(mini-medley)から ?mini=1&sec=N&mute=0|1 で呼ばれたときの約束。
// 仕様の正本は mini-medley/CLAUDE.md。mini=1 が無いときは何もしない(従来どおり)。
export const GAME_ID = "typing_quotes";

export interface MiniConfig {
  sec: number;
  mute: boolean;
}

export function readMini(): MiniConfig | null {
  if (typeof window === 'undefined') return null;
  const q = new URLSearchParams(window.location.search);
  if (q.get('mini') !== '1') return null;
  const sec = Number(q.get('sec'));
  return { sec: sec > 0 ? sec : 30, mute: q.get('mute') === '1' };
}

export function postToHub(msg: Record<string, unknown>): void {
  try {
    window.parent.postMessage({ ...msg, game: GAME_ID }, '*');
  } catch {
    /* 親が無いときは何もしない */
  }
}

// 100点の目安: 打鍵（正しく打てたキー − ミス×2）が120。30秒で 4打鍵/秒＝かなり速い人
export const MINI_KEYS_FOR_100 = 120;

export function scoreToPoints(correct: number, miss: number): number {
  const net = Math.max(0, correct - miss * 2);
  return Math.max(0, Math.min(100, Math.round((net / MINI_KEYS_FOR_100) * 100)));
}
