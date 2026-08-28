import type { RomajiSegment, TypingState } from "./types";

/**
 * ローマ字入力エンジン。
 *
 * 日本語のタイピングでは同じかなに複数の打ち方がある(し = shi / si、
 * ん = n / nn / xn、つ = tsu / tu など)。ここではかな列を「セグメント」に分解し、
 * 各セグメントが受け付けるローマ字表記の候補を持たせることで、
 * どの打ち方でも正解と判定できるようにしている。
 *
 * 候補配列の先頭は「代表表記」で、画面にお手本として表示するのに使う。
 */

/** 単独のかな → ローマ字候補 */
const SINGLE: Record<string, string[]> = {
  あ: ["a"], い: ["i", "yi"], う: ["u", "wu", "whu"], え: ["e"], お: ["o"],
  か: ["ka", "ca"], き: ["ki"], く: ["ku", "cu", "qu"], け: ["ke"], こ: ["ko", "co"],
  が: ["ga"], ぎ: ["gi"], ぐ: ["gu"], げ: ["ge"], ご: ["go"],
  さ: ["sa"], し: ["si", "shi", "ci"], す: ["su"], せ: ["se", "ce"], そ: ["so"],
  ざ: ["za"], じ: ["ji", "zi"], ず: ["zu"], ぜ: ["ze"], ぞ: ["zo"],
  た: ["ta"], ち: ["ti", "chi"], つ: ["tu", "tsu"], て: ["te"], と: ["to"],
  だ: ["da"], ぢ: ["di"], づ: ["du"], で: ["de"], ど: ["do"],
  な: ["na"], に: ["ni"], ぬ: ["nu"], ね: ["ne"], の: ["no"],
  は: ["ha"], ひ: ["hi"], ふ: ["fu", "hu"], へ: ["he"], ほ: ["ho"],
  ば: ["ba"], び: ["bi"], ぶ: ["bu"], べ: ["be"], ぼ: ["bo"],
  ぱ: ["pa"], ぴ: ["pi"], ぷ: ["pu"], ぺ: ["pe"], ぽ: ["po"],
  ま: ["ma"], み: ["mi"], む: ["mu"], め: ["me"], も: ["mo"],
  や: ["ya"], ゆ: ["yu"], よ: ["yo"],
  ら: ["ra"], り: ["ri"], る: ["ru"], れ: ["re"], ろ: ["ro"],
  わ: ["wa"], ゐ: ["wi"], ゑ: ["we"], を: ["wo"],
  ゔ: ["vu"],
  ぁ: ["xa", "la"], ぃ: ["xi", "li"], ぅ: ["xu", "lu"], ぇ: ["xe", "le"], ぉ: ["xo", "lo"],
  ゃ: ["xya", "lya"], ゅ: ["xyu", "lyu"], ょ: ["xyo", "lyo"],
  ゎ: ["xwa", "lwa"],
  // 記号類。日本語入力ではこのキーで打つのが一般的
  "ー": ["-"], "、": [","], "。": ["."], "・": ["/"],
  "！": ["!"], "？": ["?"], "　": [" "], " ": [" "],
};

/** 拗音など、かな2文字でひとまとまりになるもの */
const DIGRAPH: Record<string, string[]> = {
  きゃ: ["kya"], きぃ: ["kyi"], きゅ: ["kyu"], きぇ: ["kye"], きょ: ["kyo"],
  ぎゃ: ["gya"], ぎぃ: ["gyi"], ぎゅ: ["gyu"], ぎぇ: ["gye"], ぎょ: ["gyo"],
  しゃ: ["sya", "sha"], しぃ: ["syi"], しゅ: ["syu", "shu"], しぇ: ["sye", "she"], しょ: ["syo", "sho"],
  じゃ: ["ja", "zya", "jya"], じぃ: ["zyi", "jyi"], じゅ: ["ju", "zyu", "jyu"],
  じぇ: ["je", "zye", "jye"], じょ: ["jo", "zyo", "jyo"],
  ちゃ: ["tya", "cha", "cya"], ちぃ: ["tyi", "cyi"], ちゅ: ["tyu", "chu", "cyu"],
  ちぇ: ["tye", "che", "cye"], ちょ: ["tyo", "cho", "cyo"],
  ぢゃ: ["dya"], ぢゅ: ["dyu"], ぢょ: ["dyo"],
  にゃ: ["nya"], にぃ: ["nyi"], にゅ: ["nyu"], にぇ: ["nye"], にょ: ["nyo"],
  ひゃ: ["hya"], ひぃ: ["hyi"], ひゅ: ["hyu"], ひぇ: ["hye"], ひょ: ["hyo"],
  びゃ: ["bya"], びゅ: ["byu"], びょ: ["byo"],
  ぴゃ: ["pya"], ぴゅ: ["pyu"], ぴょ: ["pyo"],
  みゃ: ["mya"], みゅ: ["myu"], みょ: ["myo"],
  りゃ: ["rya"], りぃ: ["ryi"], りゅ: ["ryu"], りぇ: ["rye"], りょ: ["ryo"],
  ふぁ: ["fa"], ふぃ: ["fi"], ふぇ: ["fe"], ふぉ: ["fo"],
  ふゅ: ["fyu"],
  てぃ: ["thi"], でぃ: ["dhi"], とぅ: ["twu"], どぅ: ["dwu"],
  うぁ: ["wha"], うぃ: ["wi", "whi"], うぇ: ["we", "whe"], うぉ: ["who"],
  ゔぁ: ["va"], ゔぃ: ["vi"], ゔぇ: ["ve"], ゔぉ: ["vo"],
  くぁ: ["qa"], くぃ: ["qi"], くぇ: ["qe"], くぉ: ["qo"],
};

/** 促音「っ」単体の打ち方(次のかなの子音を重ねる以外の書き方) */
const SOKUON_ALONE = ["xtu", "ltu", "xtsu", "ltsu"];

/** カタカナをひらがなに寄せる。名言データはひらがなで持つが、念のため吸収する */
function toHiragana(s: string): string {
  return s.replace(/[ァ-ヶ]/g, (c) =>
    String.fromCharCode(c.charCodeAt(0) - 0x60)
  );
}

/**
 * かな列をローマ字セグメントに分解する。
 * 「っ」と「ん」は次に来るかなによって打ち方が変わるため、ここで文脈を織り込む。
 */
export function buildSegments(kanaInput: string): RomajiSegment[] {
  const kana = toHiragana(kanaInput);
  const segs: RomajiSegment[] = [];
  let i = 0;

  while (i < kana.length) {
    const two = kana.slice(i, i + 2);
    if (DIGRAPH[two]) {
      segs.push({ kana: two, candidates: DIGRAPH[two] });
      i += 2;
      continue;
    }
    const ch = kana[i];
    if (ch === "っ") {
      segs.push({ kana: ch, candidates: [...SOKUON_ALONE] });
      i += 1;
      continue;
    }
    if (ch === "ん") {
      segs.push({ kana: ch, candidates: ["nn", "n", "xn"] });
      i += 1;
      continue;
    }
    const cands = SINGLE[ch];
    if (cands) {
      segs.push({ kana: ch, candidates: [...cands] });
    } else {
      // 英数字や未知の記号はそのまま1文字打つ
      segs.push({ kana: ch, candidates: [ch] });
    }
    i += 1;
  }

  // 文脈による補正
  for (let s = 0; s < segs.length; s++) {
    const seg = segs[s];
    const next = segs[s + 1];

    if (seg.kana === "っ") {
      // 次のかなの子音を重ねる打ち方(きっと = ki + t + to)を先頭候補にする
      const head = next?.candidates[0]?.[0];
      if (head && !"aiueon".includes(head)) {
        seg.candidates = [head, ...SOKUON_ALONE];
      }
    }

    if (seg.kana === "ん") {
      // 次が母音・な行・や行のときは「n」1文字だと後続と区別できないので許可しない
      const nextHead = next?.candidates[0]?.[0];
      const ambiguous =
        next !== undefined && (nextHead === undefined || "aiueony".includes(nextHead));
      seg.candidates = ambiguous ? ["nn", "xn"] : ["nn", "n", "xn"];
    }
  }

  return segs;
}

export function createTypingState(kana: string): TypingState {
  return { segments: buildSegments(kana), segIndex: 0, buffer: "", typed: "" };
}

/**
 * 英語モード用。1文字=1セグメントにするだけで、判定は日本語モードと同じ仕組みに乗る。
 * 大文字はShiftなしでも打てるように小文字も候補に入れておく。
 */
export function buildPlainSegments(text: string): RomajiSegment[] {
  return [...text].map((ch) => {
    const lower = ch.toLowerCase();
    return {
      kana: ch,
      candidates: lower !== ch ? [ch, lower] : [ch],
    };
  });
}

export function createPlainState(text: string): TypingState {
  return { segments: buildPlainSegments(text), segIndex: 0, buffer: "", typed: "" };
}

/** 画面に出すお手本のローマ字(代表表記をつないだもの) */
export function fullRomaji(segments: RomajiSegment[]): string {
  return segments.map((s) => s.candidates[0]).join("");
}

/**
 * 打ち終わったか。
 * 末尾の「ん」を "n" 1文字で終えた場合など、セグメントが確定していなくても
 * 候補と完全一致していれば完了とみなす。
 */
export function isComplete(state: TypingState): boolean {
  if (state.segIndex >= state.segments.length) return true;
  if (state.segIndex === state.segments.length - 1) {
    const seg = state.segments[state.segIndex];
    return state.buffer.length > 0 && seg.candidates.includes(state.buffer);
  }
  return false;
}

export interface InputResult {
  state: TypingState;
  /** その打鍵が正しかったか */
  ok: boolean;
  /** その打鍵で問題を打ち終えたか */
  completed: boolean;
}

/**
 * 1文字入力する。
 *
 * 「今のセグメントを伸ばせるならまず伸ばす。伸ばせないが今のbufferが候補と
 * 完全一致しているなら、そこで確定して次のセグメントに持ち越す」という順で判定する。
 * これにより「んと」を "nnto" とも "nto" とも打てる。
 */
export function inputChar(state: TypingState, rawChar: string): InputResult {
  if (state.segIndex >= state.segments.length) {
    return { state, ok: false, completed: true };
  }
  const ch = rawChar;
  const seg = state.segments[state.segIndex];
  const next = state.buffer + ch;
  const viable = seg.candidates.filter((c) => c.startsWith(next));

  if (viable.length > 0) {
    const exact = viable.includes(next);
    const hasLonger = viable.some((c) => c.length > next.length);
    let nextState: TypingState;
    if (exact && !hasLonger) {
      // このセグメントは確定
      nextState = {
        ...state,
        segIndex: state.segIndex + 1,
        buffer: "",
        typed: state.typed + next,
      };
    } else {
      nextState = { ...state, buffer: next };
    }
    return { state: nextState, ok: true, completed: isComplete(nextState) };
  }

  // 現セグメントでは伸ばせない。bufferが完成形なら確定して次セグメントで再挑戦する
  if (state.buffer.length > 0 && seg.candidates.includes(state.buffer)) {
    const advanced: TypingState = {
      ...state,
      segIndex: state.segIndex + 1,
      buffer: "",
      typed: state.typed + state.buffer,
    };
    if (advanced.segIndex >= advanced.segments.length) {
      return { state: advanced, ok: false, completed: true };
    }
    return inputChar(advanced, ch);
  }

  return { state, ok: false, completed: false };
}

/** まだ打っていない部分のローマ字(お手本の残り) */
export function remainingRomaji(state: TypingState): string {
  const seg = state.segments[state.segIndex];
  if (!seg) return "";
  // 現在のbufferと矛盾しない候補を優先して残りを見せる
  const cand =
    seg.candidates.find((c) => c.startsWith(state.buffer)) ?? seg.candidates[0];
  const rest = cand.slice(state.buffer.length);
  const after = state.segments
    .slice(state.segIndex + 1)
    .map((s) => s.candidates[0])
    .join("");
  return rest + after;
}
