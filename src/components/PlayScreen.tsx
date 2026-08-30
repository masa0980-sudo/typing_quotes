import type { ReactNode } from "react";
import { remainingRomaji } from "@/lib/romaji";
import { TIME_ATTACK_SEC } from "@/lib/constants";
import type { GameVariant, Mode, Quote, TypingState } from "@/lib/types";
import { AuthorAvatar } from "./AuthorAvatar";

interface Props {
  quote: Quote;
  typing: TypingState;
  mode: Mode;
  variant: GameVariant;
  index: number;
  total: number;
  correct: number;
  miss: number;
  elapsedSec: number;
  /** タイムアタックの残り秒。クイズ形式では使わない */
  remainingSec: number;
  /** タイムアタックで打ち切った文の数 */
  clearedCount: number;
  lastMiss: boolean;
  /** アプリ内キーボード。出さないときは null */
  keyboard?: ReactNode;
}

export function PlayScreen({
  quote,
  typing,
  mode,
  variant,
  index,
  total,
  correct,
  miss,
  elapsedSec,
  remainingSec,
  clearedCount,
  lastMiss,
  keyboard,
}: Props) {
  const typed = typing.typed + typing.buffer;
  const rest = remainingRomaji(typing);
  const accuracy = correct + miss > 0 ? correct / (correct + miss) : 1;
  const kpm = elapsedSec > 0 ? (correct / elapsedSec) * 60 : 0;
  const isTimeAttack = variant === "timeattack";
  const urgent = isTimeAttack && remainingSec <= 10;

  return (
    // 100vh だとモバイルのアドレスバーのぶん足りず、キーボードが画面外に出る
    <div className="relative h-[100dvh] bg-gray-950 flex flex-col items-center px-4 py-4 sm:py-8">
      {/* ミスタイプ時のフラッシュ。key を変えて毎回アニメーションを鳴らし直す */}
      {lastMiss && (
        <div
          key={`${correct}-${miss}`}
          className="absolute inset-0 pointer-events-none animate-miss-flash"
          aria-hidden="true"
        />
      )}

      {/* 上部ステータス。タイムアタックは「あと何秒か」が最重要なので大きく出す */}
      <div className="relative w-full max-w-3xl flex items-center justify-between gap-3 text-xs font-mono shrink-0">
        {isTimeAttack ? (
          <span className="flex items-baseline gap-1.5">
            <span
              className={`text-3xl font-black tabular-nums leading-none ${
                urgent ? "text-red-300 animate-pulse" : "text-white"
              }`}
            >
              {Math.max(0, Math.ceil(remainingSec))}
            </span>
            <span className="text-white/40">秒</span>
          </span>
        ) : (
          <span className="text-white/50">
            第 <span className="text-white font-bold text-base">{index + 1}</span> / {total} 問
          </span>
        )}
        <div className="flex gap-4 sm:gap-6">
          {isTimeAttack ? (
            <Stat label="打ち切り" value={`${clearedCount} 文`} />
          ) : (
            <Stat label="TIME" value={`${elapsedSec.toFixed(1)}s`} />
          )}
          <Stat label="KPM" value={Math.round(kpm).toString()} />
          <Stat
            label="正確率"
            value={`${Math.round(accuracy * 100)}%`}
            tone={accuracy >= 0.95 ? "good" : accuracy >= 0.85 ? "mid" : "bad"}
          />
          <Stat label="ミス" value={miss.toString()} tone={miss > 0 ? "bad" : "good"} />
        </div>
      </div>

      {/* 進捗バー。タイムアタックでは残り時間、クイズでは今の1問の進み具合を表す */}
      <div className="relative w-full max-w-3xl h-1 mt-3 rounded-full bg-white/10 overflow-hidden shrink-0">
        <div
          className="h-full rounded-full transition-all duration-150"
          style={{
            width: isTimeAttack
              ? `${Math.max(0, Math.min(100, (remainingSec / TIME_ATTACK_SEC) * 100))}%`
              : `${(typed.length / Math.max(typed.length + rest.length, 1)) * 100}%`,
            background: urgent
              ? "linear-gradient(90deg, #fca5a5, #f87171)"
              : "linear-gradient(90deg, #7dd3fc, #a78bfa)",
          }}
        />
      </div>

      <div
        key={quote.id}
        className="relative w-full max-w-3xl flex-1 min-h-0 overflow-y-auto flex flex-col justify-center gap-4 sm:gap-6 py-4 animate-quote-in"
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
          <div className="mt-4 flex flex-col items-center gap-2">
            {/* じっくり5問は1問ごとの reveal 画面で肖像が出るのでここでは出さない。
                タイムアタックは reveal を挟まないので、誰の言葉か画面内で分かるようにする */}
            {isTimeAttack && (
              <AuthorAvatar authorEn={quote.authorEn} author={quote.author} size={56} />
            )}
            <p className="text-sm text-white/70">
              — {mode === "ja" ? quote.author : quote.authorEn}
              <span className="ml-2 text-[11px] text-white/40">{quote.role}</span>
            </p>
          </div>
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

      {keyboard && (
        <div className="relative w-full max-w-3xl shrink-0 mb-2">{keyboard}</div>
      )}

      <p className="relative text-[11px] text-white/30 font-mono shrink-0">
        Esc でタイトルへ戻る
      </p>
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
