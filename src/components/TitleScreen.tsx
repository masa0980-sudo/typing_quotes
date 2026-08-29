import type { Mode } from "@/lib/types";
import { QUOTES } from "@/lib/quotes";
import { QUESTIONS_PER_GAME } from "@/lib/constants";

interface Props {
  mode: Mode;
  best: number;
  onSelectMode: (mode: Mode) => void;
  onStart: () => void;
  onShowCredits: () => void;
  onShowGallery: () => void;
}

/** 背景に流す文字。名言の一部を静かに降らせる */
const FALLING = [
  { text: "Genius", left: "6%", size: 22, dur: "17s", delay: "-2s" },
  { text: "努力", left: "17%", size: 26, dur: "21s", delay: "-9s" },
  { text: "Imagination", left: "29%", size: 18, dur: "19s", delay: "-14s" },
  { text: "知識", left: "41%", size: 24, dur: "23s", delay: "-5s" },
  { text: "Courage", left: "52%", size: 20, dur: "16s", delay: "-11s" },
  { text: "志", left: "63%", size: 30, dur: "25s", delay: "-3s" },
  { text: "Wisdom", left: "74%", size: 19, dur: "18s", delay: "-16s" },
  { text: "情熱", left: "85%", size: 25, dur: "20s", delay: "-7s" },
  { text: "Dream", left: "94%", size: 21, dur: "22s", delay: "-13s" },
];

export function TitleScreen({
  mode,
  best,
  onSelectMode,
  onStart,
  onShowCredits,
  onShowGallery,
}: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gray-950 flex flex-col items-center justify-center gap-7 p-8">
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="title-grid" />
        {FALLING.map((f, i) => (
          <div
            key={i}
            className="title-char text-white/25"
            style={{
              left: f.left,
              fontSize: f.size,
              animationDuration: f.dur,
              animationDelay: f.delay,
            }}
          >
            {f.text}
          </div>
        ))}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 45%, rgba(5,5,16,0.25), rgba(5,5,16,0.95) 72%)",
          }}
        />
      </div>

      <div className="relative flex flex-col items-center gap-2">
        <div
          className="text-5xl sm:text-6xl font-black tracking-tight drop-shadow-[0_0_40px_rgba(120,180,255,0.4)]"
          style={{
            background: "linear-gradient(135deg, #7dd3fc, #a78bfa, #f0abfc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          名言タイピング
        </div>
        <div className="text-sm text-white/45 font-mono tracking-widest mt-1">
          QUOTE TYPING
        </div>
        <p className="text-xs sm:text-sm text-white/55 mt-3 text-center leading-relaxed">
          偉人と一流の名言をお題に、正確さと速さを競います。
          <br />
          全{QUESTIONS_PER_GAME}問・収録{QUOTES.length}名言。
        </p>
      </div>

      {/* モード選択 */}
      <div className="relative flex flex-col items-center gap-2 w-full max-w-sm">
        <span className="text-[11px] text-white/40 font-mono tracking-widest">MODE</span>
        <div className="flex gap-3 w-full">
          <ModeButton
            active={mode === "ja"}
            onClick={() => onSelectMode("ja")}
            title="日本語"
            sub="ローマ字で入力"
          />
          <ModeButton
            active={mode === "en"}
            onClick={() => onSelectMode("en")}
            title="English"
            sub="英語の原文を入力"
          />
        </div>
      </div>

      {best > 0 && (
        <div
          className="relative flex flex-col items-center px-8 py-3 rounded-2xl"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
          }}
        >
          <span className="text-[11px] text-white/40 font-mono tracking-widest">
            BEST SCORE（{mode === "ja" ? "日本語" : "English"}）
          </span>
          <span className="text-3xl font-bold font-mono text-yellow-300 tabular-nums">
            {best.toLocaleString()}
          </span>
        </div>
      )}

      <button
        onClick={onStart}
        className="relative px-12 py-4 rounded-2xl text-xl font-bold text-white transition-all duration-200 active:scale-95 hover:scale-105"
        style={{
          background: "linear-gradient(135deg, #2563eb, #7c3aed)",
          boxShadow: "0 0 30px rgba(37,99,235,0.5)",
        }}
      >
        START
      </button>

      <div
        className="relative flex flex-col items-center gap-1.5 px-6 py-3 rounded-xl text-xs font-mono text-white/80"
        style={{
          background: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.14)",
        }}
      >
        <p>
          <span className="font-bold text-white">キーボード</span> で入力　／
          <span className="font-bold text-white">Esc</span> タイトルへ
        </p>
        <p className="text-white/55">
          {mode === "ja"
            ? "し=shi/si、ん=n/nn など複数の打ち方に対応"
            : "大文字はShiftなしでも入力できます"}
        </p>
      </div>

      {/* 打たずに中身を読みたい人向けの導線。収録人物とその名言を一覧できる */}
      <button
        onClick={onShowGallery}
        className="relative px-6 py-2.5 rounded-xl text-sm font-bold text-white/85 transition-all duration-150 active:scale-95 hover:text-white"
        style={{
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.16)",
        }}
      >
        偉人・有名人一覧を見る
      </button>

      <button
        onClick={onShowCredits}
        className="relative text-[11px] text-white/40 underline underline-offset-4 transition-colors hover:text-white/70"
      >
        画像クレジット
      </button>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  title,
  sub,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  sub: string;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 flex flex-col items-center gap-0.5 px-4 py-3 rounded-xl transition-all duration-150"
      style={{
        background: active ? "rgba(124,58,237,0.28)" : "rgba(255,255,255,0.05)",
        border: active
          ? "1px solid rgba(167,139,250,0.9)"
          : "1px solid rgba(255,255,255,0.12)",
        boxShadow: active ? "0 0 20px rgba(124,58,237,0.35)" : "none",
      }}
    >
      <span className={`text-base font-bold ${active ? "text-white" : "text-white/70"}`}>
        {title}
      </span>
      <span className="text-[10px] text-white/50">{sub}</span>
    </button>
  );
}
