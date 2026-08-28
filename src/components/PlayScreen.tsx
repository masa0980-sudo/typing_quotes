import { remainingRomaji } from "@/lib/romaji";
import type { Mode, Quote, TypingState } from "@/lib/types";

interface Props {
  quote: Quote;
  typing: TypingState;
  mode: Mode;
  index: number;
  total: number;
  correct: number;
  miss: number;
  elapsedSec: number;
  lastMiss: boolean;
}

export function PlayScreen({
  quote,
  typing,
  mode,
  index,
  total,
  correct,
  miss,
  elapsedSec,
  lastMiss,
}: Props) {
  const typed = typing.typed + typing.buffer;
  const rest = remainingRomaji(typing);
  const accuracy = correct + miss > 0 ? correct / (correct + miss) : 1;
  const kpm = elapsedSec > 0 ? (correct / elapsedSec) * 60 : 0;

  return (
    <div className="relative min-h-screen bg-gray-950 flex flex-col items-center px-4 py-6 sm:py-10">
      {/* ミスタイプ時のフラッシュ。key を変えて毎回アニメーションを鳴らし直す */}
      {lastMiss && (
        <div
          key={`${correct}-${miss}`}
          className="absolute inset-0 pointer-events-none animate-miss-flash"
          aria-hidden="true"
        />
      )}

      {/* 上部ステータス */}
      <div className="relative w-full max-w-3xl flex items-center justify-between gap-3 text-xs font-mono">
        <span className="text-white/50">
          第 <span className="text-white font-bold text-base">{index + 1}</span> / {total} 問
        </span>
        <div className="flex gap-4 sm:gap-6">
          <Stat label="TIME" value={`${elapsedSec.toFixed(1)}s`} />
          <Stat label="KPM" value={Math.round(kpm).toString()} />
          <Stat
            label="正確率"
            value={`${Math.round(accuracy * 100)}%`}
            tone={accuracy >= 0.95 ? "good" : accuracy >= 0.85 ? "mid" : "bad"}
          />
          <Stat label="ミス" value={miss.toString()} tone={miss > 0 ? "bad" : "good"} />
        </div>
      </div>

      {/* 進捗バー */}
      <div className="relative w-full max-w-3xl h-1 mt-3 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{
            width: `${(typed.length / Math.max(typed.length + rest.length, 1)) * 100}%`,
            background: "linear-gradient(90deg, #7dd3fc, #a78bfa)",
          }}
        />
      </div>

      <div
        key={quote.id}
        className="relative w-full max-w-3xl flex-1 flex flex-col justify-center gap-6 animate-quote-in"
      >
        {/* お題の名言。
            日本語モードは「漢字かな交じり文を読んで、下のローマ字を打つ」ので両方出す。
            英語モードは打鍵ラインがそのまま原文なので、上には訳だけを出して重複を避ける。 */}
        <div className="text-center">
          {mode === "ja" && (
            <p className="font-bold leading-relaxed text-xl sm:text-3xl">{quote.ja}</p>
          )}
          <p
            className={`text-white/45 leading-relaxed ${
              mode === "ja" ? "mt-3 text-xs sm:text-sm" : "text-sm sm:text-base"
            }`}
          >
            {mode === "ja" ? quote.en : quote.ja}
          </p>
          <p className="mt-4 text-sm text-white/70">
            — {mode === "ja" ? quote.author : quote.authorEn}
            <span className="ml-2 text-[11px] text-white/40">{quote.role}</span>
          </p>
        </div>

        {/* 打鍵ライン */}
        <div
          className="px-4 sm:px-6 py-5 rounded-2xl break-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <p
            className={`font-mono leading-relaxed tracking-wide ${
              mode === "ja" ? "text-lg sm:text-2xl" : "text-xl sm:text-3xl"
            }`}
          >
            <span className="text-sky-300">{typed}</span>
            <span className="animate-caret text-white">|</span>
            <span className="text-white/35">{rest}</span>
          </p>
        </div>
      </div>

      <p className="relative text-[11px] text-white/30 font-mono">Esc でタイトルへ戻る</p>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "normal",
}: {
  label: string;
  value: string;
  tone?: "normal" | "good" | "mid" | "bad";
}) {
  const color =
    tone === "good"
      ? "text-emerald-300"
      : tone === "mid"
        ? "text-yellow-300"
        : tone === "bad"
          ? "text-red-300"
          : "text-white";
  return (
    <span className="flex flex-col items-end leading-tight">
      <span className="text-[10px] text-white/40 tracking-widest">{label}</span>
      <span className={`text-sm font-bold tabular-nums ${color}`}>{value}</span>
    </span>
  );
}
