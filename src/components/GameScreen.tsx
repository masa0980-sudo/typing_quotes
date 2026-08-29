"use client";

import {
  useReducer,
  useEffect,
  useState,
  useRef,
  useCallback,
  useSyncExternalStore,
} from "react";
import { reducer, createInitialState, summarize } from "@/lib/reducer";
import {
  loadHighScore,
  saveHighScore,
  subscribeKeyboardPref,
  getKeyboardPref,
  getKeyboardPrefServer,
  setKeyboardPref,
} from "@/lib/storage";
import { TIME_ATTACK_SEC } from "@/lib/constants";
import { remainingRomaji } from "@/lib/romaji";
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
import { RevealScreen } from "./RevealScreen";
import { ResultScreen } from "./ResultScreen";
import { CreditsScreen } from "./CreditsScreen";
import { GalleryScreen } from "./GalleryScreen";
import { OnScreenKeyboard } from "./OnScreenKeyboard";

export function GameScreen() {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  // 時計は1つだけ持ち、経過時間・残り時間はそこから計算する
  const [now, setNow] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);
  // クレジットと人物一覧は表示するだけの画面なので、状態機械(Phase)には足さずローカルで持つ
  const [showCredits, setShowCredits] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  // アプリ内キーボードの設定は localStorage(Reactの外)にあるので外部ストアとして読む
  const keyboardOn = useSyncExternalStore(
    subscribeKeyboardPref,
    getKeyboardPref,
    getKeyboardPrefServer,
  );

  // ハイスコアは localStorage なのでマウント後に読む(SSRとの不一致を避ける)
  useEffect(() => {
    dispatch({ type: "SET_BEST", best: loadHighScore(state.mode, state.variant) });
  }, [state.mode, state.variant]);

  // カウントダウン
  useEffect(() => {
    if (state.phase !== "countdown") return;
    playCount(state.countdown === 1);
    const id = setTimeout(() => dispatch({ type: "COUNTDOWN", now: Date.now() }), 800);
    return () => clearTimeout(id);
  }, [state.phase, state.countdown]);

  // 打っている間だけ時計を進める。タイムアタックは制限時間を過ぎたら結果へ
  useEffect(() => {
    if (state.phase !== "playing") return;
    const id = setInterval(() => {
      const t = Date.now();
      setNow(t);
      if (
        state.variant === "timeattack" &&
        t - state.startedAt >= TIME_ATTACK_SEC * 1000
      ) {
        dispatch({ type: "TIMEUP" });
      }
    }, 100);
    return () => clearInterval(id);
  }, [state.phase, state.variant, state.startedAt]);

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
    const prev = loadHighScore(state.mode, state.variant);
    if (summary.score > prev) {
      saveHighScore(state.mode, state.variant, summary.score);
      setIsNewBest(true);
      dispatch({ type: "SET_BEST", best: summary.score });
    } else {
      setIsNewBest(false);
    }
  }, [state.phase, state]);

  const playing = state.phase === "playing";
  const elapsedSec = playing ? Math.max(0, now - state.questionStartedAt) / 1000 : 0;
  const remainingSec = playing
    ? Math.max(0, TIME_ATTACK_SEC - Math.max(0, now - state.startedAt) / 1000)
    : TIME_ATTACK_SEC;

  /**
   * 打鍵1文字ぶんの処理。物理キーボードとアプリ内キーボードで共通に使う。
   * 同じアクションで「先読み」して鳴らす音を決め、そのまま dispatch する。
   */
  const pressKey = useCallback(
    (char: string) => {
      if (state.phase !== "playing") return;
      const action = { type: "KEY", char, now: Date.now() } as const;
      const res = reducer(state, action);
      if (res === state) return;

      if (res.lastMiss) playMiss();
      else if (res.phase === "result" || res.index !== state.index) playClear();
      else playKey();

      dispatch(action);
    },
    [state],
  );

  // キーボード入力
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        // オーバーレイが開いているときは、まずそれを閉じる(タイトルへは戻さない)。
        // 人物一覧は中で人物を選べるので、Escの扱いは GalleryScreen 側に任せる
        if (showGallery) return;
        if (showCredits) {
          setShowCredits(false);
          return;
        }
        dispatch({ type: "TO_TITLE" });
        return;
      }
      // オーバーレイを読んでいる間は打鍵として拾わない
      if (showCredits || showGallery) return;
      // 解説を読んでいる間は Enter / Space で次へ進む
      if (state.phase === "reveal") {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          dispatch({ type: "NEXT", now: Date.now() });
        }
        return;
      }
      if (state.phase !== "playing") return;
      // ショートカット類は拾わない
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      // 印字される1文字だけを打鍵として扱う
      if (e.key.length !== 1) return;
      e.preventDefault();
      pressKey(e.key);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [state.phase, showCredits, showGallery, pressKey]);

  if (state.phase === "title") {
    return (
      <>
        <TitleScreen
          mode={state.mode}
          variant={state.variant}
          best={state.best}
          keyboardOn={keyboardOn}
          onSelectMode={(mode) => dispatch({ type: "SET_MODE", mode })}
          onSelectVariant={(variant) => dispatch({ type: "SET_VARIANT", variant })}
          onToggleKeyboard={setKeyboardPref}
          onStart={() => {
            unlockAudio();
            setIsNewBest(false);
            dispatch({ type: "START", now: Date.now() });
          }}
          onShowCredits={() => setShowCredits(true)}
          onShowGallery={() => setShowGallery(true)}
        />
        {showCredits && <CreditsScreen onClose={() => setShowCredits(false)} />}
        {showGallery && <GalleryScreen onClose={() => setShowGallery(false)} />}
      </>
    );
  }

  if (state.phase === "countdown") {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-white/50 font-mono tracking-widest">
          {state.mode === "ja" ? "日本語（ローマ字）" : "ENGLISH"}
          {state.variant === "timeattack" && ` / ${TIME_ATTACK_SEC}秒`}
        </p>
        <div
          key={state.countdown}
          className="animate-count-pop text-8xl font-black text-white"
        >
          {state.countdown > 0 ? state.countdown : "GO"}
        </div>
        <p className="text-xs text-white/40">
          {keyboardOn ? "画面のキーボードで打てます…" : "指をホームポジションに置いて…"}
        </p>
      </div>
    );
  }

  if (state.phase === "reveal") {
    const last = state.results[state.results.length - 1];
    return (
      <RevealScreen
        quote={state.quotes[state.index]}
        mode={state.mode}
        index={state.index}
        total={state.quotes.length}
        correct={last?.correct ?? 0}
        miss={last?.miss ?? 0}
        elapsedMs={last?.elapsedMs ?? 0}
        onNext={() => dispatch({ type: "NEXT", now: Date.now() })}
      />
    );
  }

  if (state.phase === "result") {
    return (
      <ResultScreen
        summary={summarize(state)}
        mode={state.mode}
        variant={state.variant}
        quotes={state.variant === "timeattack" ? state.cleared : state.quotes}
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

  // 次に打つキー。英語モードは大文字が来ることがあるので小文字に寄せる
  const nextKey = remainingRomaji(state.typing).slice(0, 1).toLowerCase();

  return (
    <PlayScreen
      quote={state.quotes[state.index]}
      typing={state.typing}
      mode={state.mode}
      variant={state.variant}
      index={state.index}
      total={state.quotes.length}
      correct={state.correct}
      miss={state.miss}
      elapsedSec={elapsedSec}
      remainingSec={remainingSec}
      clearedCount={state.cleared.length}
      lastMiss={state.lastMiss}
      keyboard={
        keyboardOn ? <OnScreenKeyboard nextKey={nextKey} onKey={pressKey} /> : null
      }
    />
  );
}
