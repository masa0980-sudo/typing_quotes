import { rankFor } from "@/lib/constants";
import type { Summary } from "@/lib/reducer";
import type { Mode, Quote } from "@/lib/types";

interface Props {
  summary: Summary;
  mode: Mode;
  quotes: Quote[];
  best: number;
  isNewBest: boolean;
  onRetry: () => void;
  onTitle: () => void;
}

export function ResultScreen({
  summary,
  mode,
  quotes,
  best,
  isNewBest,
  onRetry,
  onTitle,
}: Props) {
  const { rank, note } = rankFor(summary.score);

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-10 gap-6">
      <div className="w-full max-w-md flex flex-col items-center gap-5">
        <div className="flex flex-col items-center">
          <span className="text-[11px] text-white/40 font-mono tracking-widest">RANK</span>
          <span
            className="text-7xl font-black leading-none"
            style={{
              background: "linear-gradient(135deg, #fde68a, #f0abfc)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {rank}
          </span>
          <span className="text-sm text-white/60 mt-1">{note}</span>
        </div>

        <div className="flex flex-col items-center">
          <span className="text-[11px] text-white/40 font-mono tracking-widest">SCORE</span>
          <span className="text-5xl font-bold font-mono tabular-nums text-white">
            {summary.score.toLocaleString()}
          </span>
          {isNewBest ? (
            <span className="mt-1 text-sm font-bold text-yellow-300">🎉 自己ベスト更新！</span>
          ) : (
            <span className="mt-1 text-xs text-white/40">
              ベスト {best.toLocaleString()}
            </span>
          )}
        </div>

        {/* 明細 */}
        <div
          className="w-full grid grid-cols-2 gap-px rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.12)" }}
        >
          <Cell
            label="正確率"
            value={`${(summary.accuracy * 100).toFixed(1)}%`}
            tone={summary.accuracy >= 0.95 ? "good" : summary.accuracy >= 0.85 ? "mid" : "bad"}
          />
          <Cell label="速度" value={`${Math.round(summary.kpm)} キー/分`} />
          <Cell
            label={mode === "en" ? "WPM（英単語/分）" : "WPM 換算"}
            value={summary.wpm.toFixed(1)}
          />
          <Cell label="タイム" value={`${summary.elapsedSec.toFixed(1)} 秒`} />
          <Cell label="正しい打鍵" value={`${summary.correct} 回`} />
          <Cell
            label="ミスタイプ"
            value={`${summary.miss} 回`}
            tone={summary.miss === 0 ? "good" : "bad"}
          />
        </div>

        {/* 出題された名言のふりかえり */}
        <div className="w-full">
          <p className="text-[11px] text-white/40 font-mono tracking-widest mb-2">
            今回の名言
          </p>
          <ul className="flex flex-col gap-2">
            {quotes.map((q) => (
              <li
                key={q.id}
                className="px-3 py-2 rounded-lg text-xs leading-relaxed"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <span className="text-white/80">{mode === "ja" ? q.ja : q.en}</span>
                <span className="block mt-1 text-white/40">
                  — {mode === "ja" ? q.author : q.authorEn}（{q.role}）
                </span>
                <span className="block mt-1 text-sky-200/70">出典: {q.source}</span>
                <span className="block mt-1 text-white/55 leading-relaxed">{q.note}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="w-full flex flex-col gap-3 mt-1">
          <button
            onClick={onRetry}
            className="w-full px-8 py-3.5 rounded-2xl text-lg font-bold text-white transition-all duration-200 active:scale-95 hover:scale-[1.02]"
            style={{
              background: "linear-gradient(135deg, #2563eb, #7c3aed)",
              boxShadow: "0 0 30px rgba(37,99,235,0.45)",
            }}
          >
            もう一度
          </button>
          <button
            onClick={onTitle}
            className="w-full px-8 py-3 rounded-2xl text-sm font-bold text-white/80 transition-all duration-200 active:scale-95"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.14)",
            }}
          >
            タイトルへ
          </button>
        </div>
      </div>
    </div>
  );
}

function Cell({
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
    <div className="flex flex-col gap-0.5 px-4 py-3" style={{ background: "#0b0b16" }}>
      <span className="text-[10px] text-white/40 tracking-wide">{label}</span>
      <span className={`text-base font-bold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
