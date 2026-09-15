/**
 * プレイ回数の記録(Firestore REST APIを直接叩く。SDK不使用)。
 *
 * `Rhythm_game`(masa0980-sudo/rhythm_game)で最初に実装した仕組みをそのまま移植したもの。
 * プロジェクト(`rythm-game-mo`)とAPIキーは、この作者の複数の公開ゲームで**意図的に共有**している
 * 共通カウンタ置き場。ゲームごとに `playCounts/{gameId}` を1ドキュメント持つ。
 *
 * fire-and-forget: ゲーム開始をブロックしてはいけない(await禁止)し、失敗しても画面には出さない。
 * セキュリティルールは `count` の +1 更新のみを許可し、新規ドキュメントの作成も
 * `{count: 1}` ちょうどのときだけ許可している(更新・削除は不可)。そのため通常運用は
 * atomic increment 1回で済むが、そのgameIdの初回プレイだけはドキュメントが存在せず
 * incrementが失敗するので、`{count: 1}` での新規作成にフォールバックする。
 * これにより新しいgameIdでも手動セットアップ不要で自己登録できる。
 */

const PROJECT_ID = "rythm-game-mo";
const API_KEY = "AIzaSyBBo4f_LqJ2lfdKu8Q11oeiiYq_O-15LSc";
const ROOT = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

/** このゲームのplayCountsドキュメントID。リポジトリ名に合わせる */
const GAME_ID = "typing_quotes";

/**
 * 新しいゲームが始まるたびに1回呼ぶ。呼び出し側は結果を待つ必要はない
 * (エラーはconsole.warnに流すだけで、ゲームの進行には一切影響させない)。
 */
export function increment(): void {
  const commitUrl = `${ROOT}:commit?key=${API_KEY}`;
  const docPath = `projects/${PROJECT_ID}/databases/(default)/documents/playCounts/${encodeURIComponent(GAME_ID)}`;

  const incrementBody = {
    writes: [
      {
        transform: {
          document: docPath,
          fieldTransforms: [{ fieldPath: "count", increment: { integerValue: "1" } }],
        },
      },
    ],
  };
  const createBody = {
    writes: [
      {
        update: { name: docPath, fields: { count: { integerValue: "1" } } },
        currentDocument: { exists: false },
      },
    ],
  };

  fetch(commitUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(incrementBody),
  })
    .then((res) => {
      // ドキュメントが無い(=このgameId初のプレイ)場合はincrementが失敗するので作成にフォールバック
      if (res.ok) return;
      return fetch(commitUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createBody),
      });
    })
    .catch((e) => {
      console.warn("playCount increment failed:", e);
    });
}

/**
 * 表示用に現在のプレイ回数を取得する。ドキュメントがまだ無い(誰もこのgameIdを
 * プレイしたことがない)場合や、何らかのエラー時は null を返す
 * ―― 呼び出し側はその場合、何も表示しなければよい。
 *
 * ドキュメント1件だけの読み取りなので、SDK無しの素の GET で済ませている
 * (batchGetやqueryは不要)。ローディング表示はせず、取得できたときだけ
 * 数字を差し込む前提(non-blocking)。
 */
export function fetchCount(): Promise<number | null> {
  const url = `${ROOT}/playCounts/${encodeURIComponent(GAME_ID)}?key=${API_KEY}`;

  return fetch(url)
    .then((res) => {
      if (!res.ok) return null;
      return res.json();
    })
    .then((doc) => {
      if (!doc || !doc.fields || !doc.fields.count) return null;
      return parseInt(doc.fields.count.integerValue, 10);
    })
    .catch((e) => {
      console.warn("playCount fetch failed:", e);
      return null;
    });
}
