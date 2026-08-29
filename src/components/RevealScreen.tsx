import type { Mode, Quote } from "@/lib/types";
import { AuthorAvatar } from "./AuthorAvatar";

interface Props {
  quote: Quote;
  mode: Mode;
  index: number;
  total: number;
  /** この問題での打鍵数とミス数 */
  correct: number;
  miss: number;
  elapsedMs: number;
  onNext: () => void;
}

/**
 * 1問打ち終わったあとに出す画面。
 * 打った名言の出典と、その言葉が何を言っているのか・どんな背景で生まれたのかを見せる。
 */
export function RevealScreen({
  quote,
  mode,
  index,
  total,
  correct,
  miss,
  elapsedMs,
  onNext,
}: Props) {
  const sec = elapsedMs / 1000;
  const kpm = sec > 0 ? Math.round((correct / sec) * 60) : 0;
  const isLast = index + 1 >= total;

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl flex flex-col gap-5 animate-quote-in">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-emerald-300 font-bold">✓ CLEAR</span>
          <span className="text-white/40">
            {index + 1} / {total} 問
          </span>
        </div>

        {/* 打ち終わった名言 */}
        <div
          className="px-5 py-5 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <p className="text-lg sm:text-xl font-bold leading-relaxed">
            {mode === "ja" ? quote.ja : quote.en}
          </p>
          <p className="mt-2 text-xs sm:text-sm text-white/45 leading-relaxed">
            {mode === "ja" ? quote.en : quote.ja}
          </p>
          {/* 誰の言葉かが一目で分かるよう、著者行に肖像を添える */}
          <div className="mt-4 flex items-center gap-3">
            <AuthorAvatar authorEn={quote.authorEn} author={quote.author} size={56} />
            <div className="flex flex-col min-w-0">
              <span className="text-sm text-white/85 truncate">
                {mode === "ja" ? quote.author : quote.authorEn}
              </span>
              <span className="text-[11px] text-white/40 truncate">{quote.role}</span>
            </div>
          </div>
        </div>

        {/* 出典 */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-white/40 font-mono tracking-widest">出典</span>
          <p className="text-sm text-sky-200/90 leading-relaxed">{quote.source}</p>
        </div>

        {/* 意味と背景 */}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] text-white/40 font-mono tracking-widest">
            この言葉について
          </span>
          <p className="text-sm text-white/80 leading-relaxed">{quote.note}</p>
        </div>

        {/* この問題の成績 */}
        <div className="flex gap-5 text-xs font-mono pt-1">
          <span className="text-white/50">
            タイム <span className="text-white font-bold">{sec.toFixed(1)}s</span>
          </span>
          <span className="text-white/50">
            速度 <span className="text-white font-bold">{kpm}</span> キー/分
          </span>
          <span className="text-white/50">
            ミス{" "}
            <span className={miss === 0 ? "text-emerald-300 font-bold" : "text-red-300 font-bold"}>
              {miss}
            </span>
          </span>
        </div>

        <button
          onClick={onNext}
          className="w-full mt-1 px-8 py-3.5 rounded-2xl text-base font-bold text-white transition-all duration-200 active:scale-95 hover:scale-[1.02]"
          style={{
            background: "linear-gradient(135deg, #2563eb, #7c3aed)",
            boxShadow: "0 0 30px rgba(37,99,235,0.45)",
          }}
        >
          {isLast ? "結果を見る" : "次の名言へ"}
        </button>
        <p className="text-center text-[11px] text-white/30 font-mono">
          Enter / Space でも進めます
        </p>
      </div>
    </div>
  );
}
