"use client";

import { useEffect, useMemo, useState } from "react";
import type { Quote } from "@/lib/types";
import { SCIENCE, PHILOSOPHY, SOCIETY, ARTS, JAPAN, SHORT, MODERN } from "@/lib/quotes";
import { AuthorAvatar } from "./AuthorAvatar";

interface Props {
  onClose: () => void;
}

/**
 * 分野。**この順に見ていって、最初に出てきたところがその人物の分野**になる。
 * short は他分野の人物の短い名言を集めたファイルなので最後に置く
 * (ここを上にすると、ニュートンが「科学」ではなく「短い名言」に入ってしまう)。
 */
const CATEGORIES = [
  { key: "science", label: "科学・発明", quotes: SCIENCE },
  { key: "philosophy", label: "哲学・思想", quotes: PHILOSOPHY },
  { key: "society", label: "政治・社会", quotes: SOCIETY },
  { key: "arts", label: "芸術・文学", quotes: ARTS },
  { key: "japan", label: "日本の偉人", quotes: JAPAN },
  { key: "modern", label: "現代", quotes: MODERN },
  { key: "short", label: "その他", quotes: SHORT },
] as const;

/**
 * `short.ts` にしか名言が無い人物の行き先。
 *
 * 分野は「初出のファイル」で決めているので、短い名言しか無い人物は
 * 全員「その他」に落ちてしまう。プラトンが哲学の棚に無いのは不自然なので、
 * 肩書きに合う分野へ手で寄せている。
 *
 * ここに書き漏らした人物は「その他」に出るだけで、壊れはしない。
 */
const REASSIGN: Record<string, string> = {
  "Plato": "哲学・思想",           // 哲学者
  "Ralph Waldo Emerson": "哲学・思想", // 思想家・詩人
  "Dalai Lama XIV": "哲学・思想",   // チベット仏教の指導者
  "Julius Caesar": "政治・社会",    // 古代ローマの政治家
  "Anne Frank": "政治・社会",       // 『アンネの日記』の著者
  "Takuboku Ishikawa": "日本の偉人", // 歌人
  "Steve Jobs": "現代",             // 実業家
  "Peter Drucker": "現代",          // 経営学者
};

interface Person {
  authorEn: string;
  author: string;
  role: string;
  quotes: Quote[];
}

/** 分野ごとに人物をまとめる。1人が複数の分野に出てきたら初出の分野に入れる */
function buildPeople() {
  const seen = new Map<string, Person>();
  const groups = new Map<string, Person[]>();
  const add = (label: string, p: Person) => {
    const list = groups.get(label);
    if (list) list.push(p);
    else groups.set(label, [p]);
  };

  for (const cat of CATEGORIES) {
    for (const q of cat.quotes) {
      const found = seen.get(q.authorEn);
      if (found) {
        found.quotes.push(q); // 別分野で既出。名言だけ足す
        continue;
      }
      const p: Person = { authorEn: q.authorEn, author: q.author, role: q.role, quotes: [q] };
      seen.set(q.authorEn, p);
      add(REASSIGN[q.authorEn] ?? cat.label, p);
    }
  }

  // 見出しは CATEGORIES の順に出す(中身が無くなった分野は出さない)
  const byCategory = CATEGORIES.map((c) => ({ label: c.label, people: groups.get(c.label) ?? [] }))
    .filter((g) => g.people.length > 0);
  return { byCategory, total: seen.size };
}

/**
 * 収録している人物の一覧。タイトル画面から開く。
 *
 * 一覧 → 人物を選ぶ → その人の名言(出典と解説つき)、の2段構成。
 * 打たなくても中身を読めるので、ゲームというより読み物として使える。
 */
export function GalleryScreen({ onClose }: Props) {
  const { byCategory, total } = useMemo(() => buildPeople(), []);
  const [selected, setSelected] = useState<Person | null>(null);

  // Esc は1段ずつ戻す。人物を開いていれば一覧へ、一覧なら画面を閉じる。
  // GameScreen 側は showGallery のとき Esc を素通しするので、ここが唯一の処理役
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      if (selected) setSelected(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, onClose]);

  const quoteCount = useMemo(
    () => byCategory.reduce((n, g) => n + g.people.reduce((m, p) => m + p.quotes.length, 0), 0),
    [byCategory],
  );

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-gray-950 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label={selected ? selected.author : "偉人・有名人一覧"}
    >
      <div className="mx-auto w-full max-w-3xl flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">
            {selected ? selected.author : "偉人・有名人一覧"}
          </h2>
          <button
            onClick={selected ? () => setSelected(null) : onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white/80 transition-colors hover:text-white shrink-0"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            {selected ? "一覧へ戻る" : "閉じる"}
          </button>
        </div>

        {selected ? (
          <PersonDetail person={selected} />
        ) : (
          <>
            <p className="text-xs text-white/50">
              {total}人・{quoteCount}の名言を収録しています。人物を選ぶと、その人の名言と解説が読めます。
            </p>

            {byCategory.map((group) => (
              <section key={group.label} className="flex flex-col gap-3">
                <h3 className="text-[11px] font-mono tracking-widest text-sky-200/70">
                  {group.label}（{group.people.length}人）
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {group.people.map((p) => (
                    <button
                      key={p.authorEn}
                      onClick={() => {
                        setSelected(p);
                        window.scrollTo({ top: 0 });
                      }}
                      className="flex flex-col items-center gap-2 px-2 py-3 rounded-2xl text-center transition-all duration-150 hover:scale-[1.03]"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.1)",
                      }}
                    >
                      <AuthorAvatar authorEn={p.authorEn} author={p.author} size={72} />
                      <span className="text-xs text-white/85 leading-tight">{p.author}</span>
                      <span className="text-[10px] text-white/40 leading-tight -mt-1">
                        {p.role}
                      </span>
                      <span className="text-[10px] font-mono text-white/30">
                        {p.quotes.length}
                        {" 名言"}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        <p className="text-center text-[11px] text-white/30 font-mono pt-2">
          Esc でも{selected ? "一覧へ戻れます" : "閉じられます"}
        </p>
      </div>
    </div>
  );
}

function PersonDetail({ person }: { person: Person }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <AuthorAvatar authorEn={person.authorEn} author={person.author} size={96} />
        <div className="flex flex-col min-w-0">
          <span className="text-base text-white/90">{person.author}</span>
          <span className="text-xs text-white/45">{person.role}</span>
          <span className="text-[11px] text-white/30 font-mono mt-1">{person.authorEn}</span>
        </div>
      </div>

      {person.quotes.map((q) => (
        <div
          key={q.id}
          className="px-5 py-4 rounded-2xl flex flex-col gap-3"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <p className="text-base sm:text-lg font-bold leading-relaxed">{q.ja}</p>
          <p className="text-xs text-white/45 leading-relaxed">{q.en}</p>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/40 font-mono tracking-widest">出典</span>
            <p className="text-xs text-sky-200/90 leading-relaxed">{q.source}</p>
          </div>

          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] text-white/40 font-mono tracking-widest">
              この言葉について
            </span>
            <p className="text-xs text-white/75 leading-relaxed">{q.note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
