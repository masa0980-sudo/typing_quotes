"use client";

import { PORTRAITS, needsCredit } from "@/lib/portraits";
import { QUOTES } from "@/lib/quotes";

interface Props {
  onClose: () => void;
}

/** authorEn -> 日本語表記。表示を日本語名に揃えるために名言データから引く */
const JA_NAME: Record<string, string> = Object.fromEntries(
  QUOTES.map((q) => [q.authorEn, q.author]),
);

/**
 * 肖像画像のクレジット一覧。
 *
 * CC BY-SA の画像は「作者の表示」と「改変物を同じライセンスで提供すること」が
 * 義務なので、この画面は飾りではなく**ライセンス上の必須要件**。
 * 出し忘れると違反になるため、内容は PORTRAITS から自動生成していて手書きしない。
 */
export function CreditsScreen({ onClose }: Props) {
  const entries = Object.entries(PORTRAITS).sort(([a], [b]) => a.localeCompare(b));
  const cc = entries.filter(([, p]) => needsCredit(p.license));
  const free = entries.filter(([, p]) => !needsCredit(p.license));

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-gray-950/95 px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-label="画像クレジット"
    >
      <div className="mx-auto w-full max-w-2xl flex flex-col gap-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold">画像クレジット</h2>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white/80 transition-colors hover:text-white"
            style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            閉じる
          </button>
        </div>

        <p className="text-xs text-white/55 leading-relaxed">
          肖像画像は Wikimedia Commons から取得し、表示用に 128×128 へ切り抜き・
          縮小しています（改変にあたります）。
          {cc.length > 0 && (
            <>
              {" "}
              下記「クレジット表示が必要な画像」は、元画像と
              <strong className="text-white/80">同じライセンスで提供</strong>します。
            </>
          )}
        </p>

        {cc.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] font-mono tracking-widest text-amber-200/80">
              クレジット表示が必要な画像
            </h3>
            <ul className="flex flex-col gap-2.5">
              {cc.map(([authorEn, p]) => (
                <li
                  key={authorEn}
                  className="px-3.5 py-2.5 rounded-xl text-xs leading-relaxed"
                  style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <div className="text-white/85 font-bold">
                    {JA_NAME[authorEn] ?? authorEn}
                  </div>
                  <div className="text-white/55 mt-0.5">
                    作者: {p.credit} ／ ライセンス:{" "}
                    <span className="text-amber-200/90">{p.license}</span>
                  </div>
                  <a
                    href={p.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sky-300/90 underline break-all"
                  >
                    出典（Wikimedia Commons）
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {free.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] font-mono tracking-widest text-white/40">
              パブリックドメイン / CC0（表示義務なし）
            </h3>
            <p className="text-[11px] text-white/45 leading-relaxed">
              次の{free.length}名の肖像は、著作権保護期間が満了しているか、権利が放棄されています。
              義務ではありませんが、いずれも Wikimedia Commons のファイルページから辿れます。
            </p>
            <p className="text-[11px] text-white/60 leading-relaxed">
              {free.map(([a]) => JA_NAME[a] ?? a).join("、")}
            </p>
          </section>
        )}

        <p className="text-[11px] text-white/30 font-mono text-center pt-2">
          Esc でも閉じられます
        </p>
      </div>
    </div>
  );
}
