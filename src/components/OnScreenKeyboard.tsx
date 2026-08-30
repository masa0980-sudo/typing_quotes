"use client";

/**
 * 画面内に描くキーボード。
 *
 * 端末のソフトキーボードは使わない。日本語入力に切り替わっているとローマ字が打てず、
 * 変換候補が割り込むなど、結果が端末設定に左右されてしまうため。
 * 必要なのは a〜z と記号10個だけなので、自前で描いたほうが確実に打てる。
 *
 * このコンポーネントは「押された1文字を渡す」だけで、判定には関与しない。
 * 受け取った側が物理キーボードと同じ KEY アクションに流すので、
 * romaji.ts / reducer.ts は入力手段が増えても変更しなくてよい。
 */

const ROWS: string[][] = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
  ["-", ":", "?", "!", " "],
];

interface Props {
  /** 次に打つべきキー(小文字)。ハイライトに使う。無ければ空文字 */
  nextKey: string;
  /** false ならハイライトしない。キー配置を覚えた上級者向け */
  highlightNext: boolean;
  onKey: (char: string) => void;
}

export function OnScreenKeyboard({ nextKey, highlightNext, onKey }: Props) {
  return (
    <div
      className="w-full select-none flex flex-col gap-1.5"
      style={{ touchAction: "manipulation" }}
      aria-label="画面キーボード"
    >
      {ROWS.map((row, i) => (
        <div key={i} className="flex gap-1.5 justify-center">
          {row.map((k) => (
            <Key
              key={k}
              char={k}
              active={highlightNext && k === nextKey}
              onKey={onKey}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function Key({
  char,
  active,
  onKey,
}: {
  char: string;
  active: boolean;
  onKey: (char: string) => void;
}) {
  const isSpace = char === " ";
  return (
    <button
      type="button"
      // click ではなく pointerdown で反応させる。タッチだと click は約300ms遅れることがあり、
      // 打鍵のたびに引っかかって速度が測れなくなる
      onPointerDown={(e) => {
        e.preventDefault();
        onKey(char);
      }}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={isSpace ? "スペース" : char}
      className={`min-h-[44px] rounded-lg font-mono text-base transition-colors duration-75 ${
        isSpace ? "flex-[5]" : "flex-1"
      } ${active ? "font-bold text-gray-950" : "text-white/85"}`}
      style={{
        background: active ? "#7dd3fc" : "rgba(255,255,255,0.08)",
        border: active
          ? "1px solid rgba(125,211,252,0.9)"
          : "1px solid rgba(255,255,255,0.14)",
        boxShadow: active ? "0 0 16px rgba(125,211,252,0.5)" : "none",
        minWidth: 0,
      }}
    >
      {isSpace ? "space" : char}
    </button>
  );
}
