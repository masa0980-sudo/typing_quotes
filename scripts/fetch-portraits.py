#!/usr/bin/env python3
"""
発言者の肖像を Wikimedia Commons から取得し、
public/portraits/*.webp と src/lib/portraits.ts を生成する。

    python3 scripts/fetch-portraits.py

★このスクリプトはネットワークのある環境で実行すること。
  Claude Code のサンドボックスからは wikimedia.org へ到達できない
  (ネットワークポリシーが CONNECT を403で拒否する)。初回の生成は
  外部サンドボックス上で実行し、成果物だけをリポジトリへ入れてある。

人物を足すときは WIKI に「authorEn: 英語版Wikipediaの記事タイトル」を1行足す。
日本の人物は姓名の順が逆(Yukichi Fukuzawa → Fukuzawa Yukichi)など表記ゆれが多いので、
自動変換せず明示的に書く。

代表画像が肖像でない場合(群像・書影・文字だけの画像など)は OVERRIDE で
Commons のファイル名を直接指定する。判断はコンタクトシートを目視して行う。

ライセンスは取得したものをそのまま portraits.ts に書き出す。
クレジット表示が要るものは CreditsScreen に自動で出るので、
ここで人手を介さないこと(書き漏らしがライセンス違反になるため)。
"""
import json, os, re, subprocess, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "portraits")
CACHE = os.path.join(ROOT, ".portrait-cache")
UA = {
    "User-Agent": "typing-quotes-portraits/1.0 "
    "(https://github.com/masa0980-sudo/typing_quotes; masa0980@gmail.com) python-urllib"
}

# authorEn -> 英語版 Wikipedia の記事タイトル
WIKI = {
    "Abraham Lincoln": "Abraham Lincoln", "Albert Einstein": "Albert Einstein",
    "Anne Frank": "Anne Frank", "Aristotle": "Aristotle",
    "Benjamin Franklin": "Benjamin Franklin", "Buddha": "Gautama Buddha",
    "Charles Darwin": "Charles Darwin", "Confucius": "Confucius",
    "Dalai Lama XIV": "14th Dalai Lama", "Eiichi Shibusawa": "Shibusawa Eiichi",
    "Eleanor Roosevelt": "Eleanor Roosevelt", "Epictetus": "Epictetus",
    "Florence Nightingale": "Florence Nightingale",
    "Franklin D. Roosevelt": "Franklin D. Roosevelt",
    "Friedrich Nietzsche": "Friedrich Nietzsche", "Galileo Galilei": "Galileo Galilei",
    "Helen Keller": "Helen Keller", "Henry Ford": "Henry Ford",
    "Hideyo Noguchi": "Noguchi Hideyo", "Hideyoshi Toyotomi": "Toyotomi Hideyoshi",
    "Ieyasu Tokugawa": "Tokugawa Ieyasu", "Immanuel Kant": "Immanuel Kant",
    "Isaac Newton": "Isaac Newton",
    "Johann Wolfgang von Goethe": "Johann Wolfgang von Goethe",
    "John F. Kennedy": "John F. Kennedy", "Julius Caesar": "Julius Caesar",
    "Katsushika Hokusai": "Hokusai", "Konosuke Matsushita": "Matsushita Konosuke",
    "Lao Tzu": "Laozi", "Leo Tolstoy": "Leo Tolstoy",
    "Leonardo da Vinci": "Leonardo da Vinci", "Louis Pasteur": "Louis Pasteur",
    "Ludwig van Beethoven": "Ludwig van Beethoven", "Mahatma Gandhi": "Mahatma Gandhi",
    "Marcus Aurelius": "Marcus Aurelius", "Marie Curie": "Marie Curie",
    "Mark Twain": "Mark Twain", "Martin Luther King Jr.": "Martin Luther King Jr.",
    "Matsuo Basho": "Matsuo Basho", "Michelangelo": "Michelangelo",
    "Mother Teresa": "Mother Teresa", "Murasaki Shikibu": "Murasaki Shikibu",
    "Nelson Mandela": "Nelson Mandela", "Nikola Tesla": "Nikola Tesla",
    "Nobunaga Oda": "Oda Nobunaga", "Orville Wright": "Orville Wright",
    "Oscar Wilde": "Oscar Wilde", "Pablo Picasso": "Pablo Picasso",
    "Peter Drucker": "Peter Drucker", "Plato": "Plato",
    "Ralph Waldo Emerson": "Ralph Waldo Emerson", "Rene Descartes": "Rene Descartes",
    "Ryoma Sakamoto": "Sakamoto Ryoma", "Sen no Rikyu": "Sen no Rikyu",
    "Seneca": "Seneca the Younger", "Shoin Yoshida": "Yoshida Shoin",
    "Socrates": "Socrates", "Stephen Hawking": "Stephen Hawking",
    "Steve Jobs": "Steve Jobs", "Takamori Saigo": "Saigo Takamori",
    "Takuboku Ishikawa": "Ishikawa Takuboku", "Thomas Edison": "Thomas Edison",
    "Umeko Tsuda": "Tsuda Umeko", "Victor Hugo": "Victor Hugo",
    "Vincent van Gogh": "Vincent van Gogh", "William Shakespeare": "William Shakespeare",
    "Winston Churchill": "Winston Churchill",
    "Wolfgang Amadeus Mozart": "Wolfgang Amadeus Mozart",
    "Yozan Uesugi": "Uesugi Yozan", "Yukichi Fukuzawa": "Yukichi Fukuzawa",
}

# 記事の代表画像が肖像として使えなかったものの差し替え
OVERRIDE = {
    # 代表画像が家族の群像だったため、単独の肖像画に差し替え
    "Wolfgang Amadeus Mozart": "Barbara Krafft - Porträt Wolfgang Amadeus Mozart (1819).jpg",
    # 代表画像が書物の扉絵だったため、肖像の版画に差し替え
    "Epictetus": "Epictetus.png",
}

# 肖像を載せない人物。存命で、使えるライセンスの画像が無い
# (肖像権・パブリシティ権の面でも実写は使わない)。頭文字のモノグラムで表示される
NO_PORTRAIT = ["Hikaru"]


def api(url, tries=6):
    for a in range(tries):
        try:
            return json.load(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30))
        except Exception as e:
            if "429" in str(e) or "timed out" in str(e).lower():
                time.sleep(3 * (a + 1)); continue
            raise
    raise RuntimeError("giveup " + url)


def fetch_bytes(url, tries=7):
    """画像本体。upload.wikimedia.org は連続アクセスに厳しく429を返すので粘る。
    ここにリトライが無いと大半が落ちる(実際に1度目は22/70しか取れなかった)。"""
    for a in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=60).read()
        except Exception as e:
            if "429" in str(e) or "timed out" in str(e).lower():
                time.sleep(4 * (a + 1)); continue
            raise
    raise RuntimeError("rate limited: " + url)


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-")


def main():
    os.makedirs(OUT, exist_ok=True)
    os.makedirs(CACHE, exist_ok=True)

    # 1) 記事の代表画像名
    pageimage = {}
    names = [n for n in WIKI if n not in OVERRIDE]
    for i in range(0, len(names), 20):   # 1件ずつ叩くと429で落ちるのでまとめて
        b = names[i:i + 20]
        d = api("https://en.wikipedia.org/w/api.php?action=query&format=json&redirects=1"
                "&prop=pageimages&pithumbsize=400&titles="
                + urllib.parse.quote("|".join(WIKI[n] for n in b)))
        back = {}
        for r in d["query"].get("redirects", []): back[r["to"]] = r["from"]
        for r in d["query"].get("normalized", []): back.setdefault(r["to"], r["from"])
        got = {back.get(p["title"], p["title"]): p.get("pageimage") for p in d["query"]["pages"].values()}
        for n in b:
            pageimage[n] = got.get(WIKI[n])
        time.sleep(1.5)
    pageimage.update(OVERRIDE)

    # 2) ライセンス・作者・出典
    meta = {}
    want = sorted({v for v in pageimage.values() if v})
    for i in range(0, len(want), 20):
        b = want[i:i + 20]
        d = api("https://commons.wikimedia.org/w/api.php?action=query&format=json"
                "&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=400&titles="
                + urllib.parse.quote("|".join("File:" + f for f in b)))
        for p in d["query"]["pages"].values():
            ii = p.get("imageinfo")
            if not ii:
                continue
            em = ii[0]["extmetadata"]
            artist = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", em.get("Artist", {}).get("value", ""))).strip()
            # Commons が返すタイトルは空白区切り。pageimage 側はアンダースコアなので揃える
            meta[p["title"].replace("File:", "").replace("_", " ")] = {
                "thumb": ii[0]["thumburl"],
                "license": em.get("LicenseShortName", {}).get("value", "?"),
                "credit": (artist or "不明")[:90],
                "sourceUrl": ii[0]["descriptionurl"],
            }
        time.sleep(1.5)

    # 3) 取得 → 128x128 WebP
    manifest = {}
    for n in sorted(WIKI):
        f = pageimage.get(n)
        m = meta.get(f.replace("_", " ")) if f else None
        if not m:
            print(f"MISS {n} ({f})"); continue
        s = slug(n)
        raw = os.path.join(CACHE, s + ".bin")
        try:
            if not os.path.exists(raw) or os.path.getsize(raw) == 0:
                with open(raw, "wb") as fh:
                    fh.write(fetch_bytes(m["thumb"]))
                time.sleep(1.2)   # robot policy に配慮した間隔
            # -gravity north: 肖像は顔が上寄りなので、上を基準に正方形へ切る
            subprocess.run(["convert", raw, "-resize", "128x128^", "-gravity", "north",
                            "-extent", "128x128", "-quality", "78",
                            os.path.join(OUT, s + ".webp")], check=True)
            manifest[n] = {"file": s + ".webp", "credit": m["credit"],
                           "license": m["license"], "sourceUrl": m["sourceUrl"]}
            print(f"OK   {n}  [{m['license']}]")
        except Exception as e:
            print(f"FAIL {n}: {str(e)[:70]}")

    write_ts(manifest)
    missing = [n for n in WIKI if n not in manifest]
    print(f"\n{len(manifest)}件を書き出した。肖像なし: {NO_PORTRAIT + missing}")


def write_ts(manifest):
    body = "\n".join(
        f'  {json.dumps(k, ensure_ascii=False)}: {{\n'
        f'    file: {json.dumps(v["file"])},\n'
        f'    credit: {json.dumps(v["credit"], ensure_ascii=False)},\n'
        f'    license: {json.dumps(v["license"])},\n'
        f'    sourceUrl: {json.dumps(v["sourceUrl"])},\n'
        f'  }},'
        for k, v in sorted(manifest.items())
    )
    path = os.path.join(ROOT, "src", "lib", "portraits.ts")
    head = open(path, encoding="utf-8").read().split("export const PORTRAITS")[0]
    tail = '''export const PORTRAITS: Record<string, Portrait> = {
%s
};

/** クレジット表示が要るライセンスか(パブリックドメインとCC0は不要) */
export function needsCredit(license: string): boolean {
  const free = ["public domain", "cc0", "pd-"];
  const l = license.toLowerCase();
  return !free.some((f) => l.startsWith(f));
}
''' % body
    open(path, "w", encoding="utf-8").write(head + tail)


if __name__ == "__main__":
    main()
