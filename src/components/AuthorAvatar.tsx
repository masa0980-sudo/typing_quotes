"use client";

import { useState } from "react";
import { PORTRAITS } from "@/lib/portraits";

interface Props {
  /** Quote.authorEn。PORTRAITS のキー */
  authorEn: string;
  /** 表示名(モノグラムの頭文字を作るのに使う) */
  author: string;
  size?: number;
}

/** 肖像が無い/読めないときに出す頭文字。"Steve Jobs" -> "SJ" */
function initials(authorEn: string): string {
  const parts = authorEn.split(/\s+/).filter((w) => !/^(no|van|von|de|da|jr\.?|xiv)$/i.test(w));
  const head = parts.length ? parts : authorEn.split(/\s+/);
  return head.slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

/**
 * 発言者の円形の肖像。
 *
 * 肖像が無い人物(存命で使える画像が無い等)と、画像の読み込みに失敗したときは
 * 頭文字のモノグラムを出す。**画像が無くても画面が壊れないこと**を優先している。
 */
export function AuthorAvatar({ authorEn, author, size = 56 }: Props) {
  const [failed, setFailed] = useState(false);
  const portrait = PORTRAITS[authorEn];
  // basePath は GitHub Pages のビルド時だけ付く。前置しないと本番だけ404になる
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

  const ring = {
    width: size,
    height: size,
    borderRadius: "9999px",
    border: "1px solid rgba(255,255,255,0.22)",
    boxShadow: "0 0 0 3px rgba(255,255,255,0.04)",
    flexShrink: 0,
  } as const;

  if (!portrait || failed) {
    return (
      <div
        style={{
          ...ring,
          background: "linear-gradient(135deg, rgba(37,99,235,0.45), rgba(124,58,237,0.45))",
        }}
        className="flex items-center justify-center"
        aria-label={author}
        title={author}
      >
        <span
          className="font-bold text-white/85 tracking-tight"
          style={{ fontSize: Math.round(size * 0.34) }}
        >
          {initials(authorEn)}
        </span>
      </div>
    );
  }

  return (
    // next/image は使わない。output:"export" かつ images.unoptimized なので最適化は効かず、
    // 128x128 の固定サイズ画像に対しては素の <img> の方が素直で軽い。
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`${base}/portraits/${portrait.file}`}
      alt={author}
      title={author}
      width={size}
      height={size}
      loading="lazy"
      decoding="async"
      onError={() => setFailed(true)}
      style={{ ...ring, objectFit: "cover" }}
    />
  );
}
