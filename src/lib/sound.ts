let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    try {
      ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
    } catch {
      return null;
    }
  }
  return ctx;
}

function tone(
  freq: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.2,
  startOffset = 0,
  freqEnd?: number
) {
  const ac = getCtx();
  if (!ac) return;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.type = type;
  const t = ac.currentTime + startOffset;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd !== undefined) {
    osc.frequency.exponentialRampToValueAtTime(freqEnd, t + duration);
  }
  gain.gain.setValueAtTime(volume, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
  osc.start(t);
  osc.stop(t + duration);
}

/** 正しい打鍵。連打されるので短く小さく */
export function playKey() {
  tone(880, 0.025, "square", 0.05);
}

/** ミスタイプ */
export function playMiss() {
  tone(180, 0.09, "sawtooth", 0.16, 0, 110);
}

/** 1問打ち終わった */
export function playClear() {
  tone(659.3, 0.09, "sine", 0.2, 0);
  tone(880, 0.13, "sine", 0.2, 0.07);
}

/** カウントダウンの1つ */
export function playCount(last: boolean) {
  tone(last ? 1200 : 760, 0.09, "square", 0.16);
}

/** 全問終了 */
export function playFinish() {
  [523.3, 659.3, 784, 1046.5].forEach((f, i) =>
    tone(f, 0.18, "sine", 0.22, i * 0.1)
  );
}

/** ユーザー操作の中で呼び、自動再生制限を解除する */
export function unlockAudio() {
  const ac = getCtx();
  if (ac && ac.state === "suspended") ac.resume();
}
