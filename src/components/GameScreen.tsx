"use client";

import { useReducer, useEffect, useState, useRef } from "react";
import { reducer, createInitialState, summarize } from "@/lib/reducer";
import { loadHighScore, saveHighScore } from "@/lib/storage";
import {
  playKey,
  playMiss,
  playClear,
  playCount,
  playFinish,
  unlockAudio,
} from "@/lib/sound";
import { TitleScreen } from "./TitleScreen";
import { PlayScreen } from "./PlayScreen";
import { ResultScreen } from "./ResultScreen";

export function GameScreen() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  // ハイスコアは localStorage なのでマウント後に読む(SSRとの不一致を避ける)
  useEffect(() => {
    dispatch({ type: "SET_BEST", best: loadHighScore(state.mode) });
  }, [state.mode]);

  // カウントダウン
  useEffect(() => {
    if (state.phase !== "countdown") return;
    playCount(state.countdown === 1);
    const id = setTimeout(() => dispatch({ type: "COUNTDOWN", now: Date.now() }), 800);
    return () => clearTimeout(id);
  }, [state.phase, state.countdown]);

  // 経過時間の表示更新
  useEffect(() => {
    if (state.phase !== "playing") {
      setElapsedSec(0);
      return;
    }
    const id = setInterval(() => {
      setElapsedSec((Date.now() - state.questionStartedAt) / 1000);
    }, 100);
    return () => clearInterval(id);
  }, [state.phase, state.questionStartedAt]);

  // 結果に入ったらハイスコアを保存
  const savedForRef = useRef<number>(-1);
  useEffect(() => {
    if (state.phase !== "result") {
      savedForRef.current = -1;
      return;
    }
    const summary = summarize(state);
    if (savedForRef.current === summary.score) return;
    savedForRef.current = summary.score;
    playFinish();
    const prev = loadHighScore(state.mode);
    if (summary.score > prev) {
      saveHighScore(state.mode, summary.score);
      setIsNewBest(true);
      dispatch({ type: "SET_BEST", best: summary.score });
    } else {
      setIsNewBest(false);
    }
  }, [state.phase, state]);

  // キーボード入力
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dispatch({ type: "TO_TITLE" });
        return;
      }
      if (state.phase !== "playing") return;
      // ショートカット類は拾わない
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // 印字される1文字だけを打鍵として扱う
      if (e.key.length !== 1) return;
      e.preventDefault();

      // 同じアクションで「先読み」して鳴らす音を決め、そのまま dispatch する
      const action = { type: "KEY", char: e.key, now: Date.now() } as const;
      const res = reducer(state, action);
      if (res === state) return;

      if (res.lastMiss) playMiss();
      else if (res.phase === "result" || res.index !== state.index) playClear();
      else playKey();

      dispatch(action);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state]);

  if (state.phase === "title") {
    return (
      <TitleScreen
        mode={state.mode}
        best={state.best}
        onSelectMode={(mode) => dispatch({ type: "SET_MODE", mode })}
        onStart={() => {
          unlockAudio();
          setIsNewBest(false);
          dispatch({ type: "START", now: Date.now() });
        }}
      />
    );
  }

  if (state.phase === "countdown") {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-white/50 font-mono tracking-widest">
          {state.mode === "ja" ? "日本語（ローマ字）" : "ENGLISH"}
        </p>
        <div
          key={state.countdown}
          className="animate-count-pop text-8xl font-black text-white"
        >
          {state.countdown > 0 ? state.countdown : "GO"}
        </div>
        <p className="text-xs text-white/40">指をホームポジションに置いて…</p>
      </div>
    );
  }

  if (state.phase === "result") {
    return (
      <ResultScreen
        summary={summarize(state)}
        mode={state.mode}
        quotes={state.quotes}
        best={state.best}
        isNewBest={isNewBest}
        onRetry={() => {
          unlockAudio();
          setIsNewBest(false);
          dispatch({ type: "START", now: Date.now() });
        }}
        onTitle={() => dispatch({ type: "TO_TITLE" })}
      />
    );
  }

  return (
    <PlayScreen
      quote={state.quotes[state.index]}
      typing={state.typing}
      mode={state.mode}
      index={state.index}
      total={state.quotes.length}
      correct={state.correct}
      miss={state.miss}
      elapsedSec={elapsedSec}
      lastMiss={state.lastMiss}
    />
  );
}
