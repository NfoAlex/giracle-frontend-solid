# TESTING.md — テスト環境構築 + テストコード生成ガイド

Giracle フロントエンド（SolidJS）テスト導入用 全コンテキスト。
このファイル1枚で 環境構築 も テストコード生成 も可能。前提知識 = [AGENTS.md](AGENTS.md)。

> 文体メモ: §1〜§4・§7・§8 は圧縮表記。§5 コード と §6 プロンプト は**通常文のまま**。
> 理由: AI へ渡す指示文 = 助詞省略で誤読リスク → 圧縮しない。

---

## 0. 現状

- テスト 0 件。ランナー未導入。
- 唯一 安全網 = `npx tsc --noEmit --skipLibCheck`。ただし src 配下 既存型エラー 約20件 → 「0件」基準 不可。
- → リファクタ時 回帰検出手段 実質ゼロ。テスト導入 優先度 高。

---

## 1. ツール選定

- **ランナー: Vitest** — Vite製プロジェクト → vite.config の plugins / alias / define 流用可。Jest 不要
- **DOM: jsdom** — happy-dom より遅いが互換性 高。本プロジェクトは `document.cookie` `document.hasFocus()` `visibilitychange` `location.pathname` 直叩き → 互換性 優先
- **Solid変換: vite-plugin-solid** — 導入済。テスト側 config でも同プラグイン通す
- **コンポーネント: @solidjs/testing-library** — Solid 公式版 Testing Library。`render` / `screen` / 自動 cleanup
- **マッチャ: @testing-library/jest-dom** — `toBeInTheDocument` `toHaveClass` 等
- **ユーザー操作: @testing-library/user-event** — 実ブラウザ挙動に近い発火
- **カバレッジ: @vitest/coverage-v8** — V8ネイティブ。追加設定 最小

### 不採用 と 理由

- **MSW** — `FETCH_CLIENT` = `fetch` 1回呼ぶだけの薄い層 → `vi.stubGlobal("fetch", vi.fn())` で「どのURLに どのmethodとbodyで呼んだか」直接検証の方が速く 意図も明確。統合テスト書く段階で再検討
- **Playwright / Cypress** — 今回スコープ外。バックエンド別リポジトリ → E2E 起動コスト高。まず単体・結合を固める
- **jest-dom の globals 自動注入** — せず setup ファイルで明示 import

### バージョン注意

`package.json` = vite `^8.2.0` / typescript `^7.0.2` と かなり新しい。
Vitest は Vite メジャーに peer 依存 → `pnpm add -D vitest@latest` 後、peer warning 出たら Vitest 側 対応 Vite バージョン確認。
Vite 8 対応 = Vitest 4.1 以降。3系混入時（lockfile 都合等）は peer エラー → `vitest@^4.1` 明示指定。
**このファイルにバージョン固定値を書かない理由 = この不整合回避。**

vite-plugin-solid 側 既知バグあり: 一部バージョンで `config.resolve.conditions is not iterable` 落ち（spread 元 undefined チェック漏れ）。
§2-8 手順1 実行時 いきなり落ちたら vite-plugin-solid バージョン疑う。

---

## 2. 環境構築手順

### 2-1. 依存追加

```sh
pnpm add -D vitest @vitest/coverage-v8 jsdom \
  @solidjs/testing-library @testing-library/jest-dom @testing-library/user-event
```

`@testing-library/dom` は peer → 警告出たら明示追加:

```sh
pnpm add -D @testing-library/dom
```

### 2-2. `vitest.config.ts`（新規・ルート直下）

vite.config.ts に `test` を生やさず **別ファイル**。
理由: `VitePWA` がテスト実行時に走る → `dev-dist/` 生成 で 無駄・不安定。テスト側は solid プラグインのみ。

```ts
/// <reference types="vitest/config" />
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import pkg from "./package.json" with { type: "json" };

export default defineConfig({
  plugins: [solidPlugin()],
  define: {
    // 本体コードが参照するグローバル定数。無いと ReferenceError
    __VERSION__: `"${pkg.version}"`,
  },
  resolve: {
    alias: {
      "~/": fileURLToPath(new URL("./src/", import.meta.url)),
    },
    // vite-plugin-solid をテストで動かすのに必須
    conditions: ["development", "browser"],
  },
  // Vitest 既定 = node 環境でモジュール解決 → jsdom 環境下でも実際に効くのは ssr.resolve.conditions 側。
  // ここが無いと vite-plugin-solid が SSR ビルドを解決 → リアクティビティ壊れる（resolve.conditions だけでは不十分）
  ssr: {
    resolve: {
      conditions: ["browser"],
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**", "**/dev-dist/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/components/ui/**", // solid-ui 生成物。テスト対象外
        "src/sw.ts", // Service Worker。jsdom では動かない
        "src/types/**", // 型定義のみ
        "src/test/**",
        "src/**/*.test.{ts,tsx}",
      ],
    },
  },
});
```

重要ポイント:

- `resolve.conditions: ["development", "browser"]` — **無いと Solid のリアクティビティがテスト内で壊れる**。vite-plugin-solid 必須設定
- `ssr.resolve.conditions: ["browser"]` — **これも必須。片方だけだと同じ症状で壊れる**。Vitest 既定は node 環境扱い → jsdom 指定時も内部的に ssr 解決パス通る。vite-plugin-solid アップデートで options.ssr 時に browser 条件を注入しなくなった経緯あり → 両方書かないと再発
- `alias` キー = `~/`（末尾スラッシュ付き）。本体 vite.config と同形。値は絶対パス（`"/src/"` でも動くが Vitest 側 root 解決依存 → 絶対パスが確実）
- `globals: true` — `@solidjs/testing-library` が afterEach で自動 cleanup を登録するための条件。ただし §2-3 の setup.ts で `cleanup()` を明示的に呼んでいるため保険（cleanup は冪等なので二重呼び出しでも安全）。`describe`/`it`/`expect` は **明示 import する方針**（Biome organizeImports と相性良、出所が読んで分かる）→ globals はテスト記述側では使わない
- `define.__VERSION__` — 忘れると `__VERSION__` 参照コンポーネントのテスト 落ちる

### 2-3. `src/test/setup.ts`（新規）

```ts
import { cleanup } from "@solidjs/testing-library";
import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

afterEach(() => {
  // レンダーした DOM を破棄
  cleanup();
  // spyOn / stubGlobal の後始末（テスト間の汚染防止）
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
```

### 2-4. `tsconfig.json` types 追記

```jsonc
{
  "compilerOptions": {
    // ...既存そのまま...
    "types": ["vite/client", "vitest/globals", "@testing-library/jest-dom"]
  }
}
```

`vitest/globals` = `describe` / `it` / `expect` のグローバル型。
`@testing-library/jest-dom` = 拡張マッチャの型。

### 2-5. `package.json` scripts 追加

AGENTS.md 流儀 = 「npm script 未定義 → npx 直叩き」。だがテストは頻度高 → script 定義 推奨。

```jsonc
{
  "scripts": {
    // ...既存そのまま...
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

### 2-6. `biome.json` — 変更不要

`files.includes` = `["**/*.ts", "!src/components/ui"]` → `*.test.ts` / `vitest.config.ts` は自動対象。
`*.test.tsx` は `.tsx` が元々対象外 → Biome 触らない（既存の非対称仕様に追随）。

### 2-7. `.gitignore` 追記

```
coverage/
```

### 2-8. 導入 動作確認手順

1. `src/utils/ConvertSizeToHumanSize.test.ts` を1本だけ作る（サンプル §5-1）
2. `pnpm test:run` → 緑
3. コンポーネントテスト（§5-5）も1本追加 → 緑 = Solid JSX変換 と `resolve.conditions` が効いた証拠
4. `npx tsc --noEmit --skipLibCheck` → **既存エラー 約20件のまま 増えていない**確認（0件は基準外）
5. `npx biome check .` → 違反 0
6. `pnpm build` → 通る（vitest.config.ts がビルドに影響していない確認）

---

## 3. プロジェクト固有 落とし穴（テスト書く前 必読）

### 3-1. ストア = モジュールシングルトン

`src/stores/*.ts` = トップレベルで `createStore()` 呼び。
→ **同一テストファイル内 test 間で状態 残留**。

- ファイル間 汚染なし（Vitest デフォルト `isolate: true` → ファイル毎 別モジュールグラフ）
- 同一ファイル内 → 必ず `beforeEach` でリセット

**最重要**: `setStoreXxx({})` は**全消しにならない**。
Solid store の setter にオブジェクトを渡す = トップレベルの**マージ**。既存キーは残る。
→ 全消しには `reconcile` を使う。

```ts
import { reconcile } from "solid-js/store";
import { beforeEach } from "vitest";
import { setStoreHistory } from "~/stores/History.ts";

beforeEach(() => {
  // ❌ setStoreHistory({})        → マージなので既存キーが残る
  // ✅ reconcile で丸ごと置換
  setStoreHistory(reconcile({}));
});
```

配列ストアも同様 → `setStoreXxx(reconcile([]))`。
（`setStoreXxx([])` はインデックス単位のマージ → 元より短い配列を渡すと余剰要素が残る）

パス指定 setter（`setStoreMyUserinfo("id", "me")` 等）は素直に上書きなのでそのまま使える。
リセット関数が本体に無いストアも多い → **リセットはテストファイル側に書く**（本体にテスト専用 API を生やさない）。

### 3-2. `History.insertHistory` は `setTimeout(..., 0)` 経由

[src/stores/History.ts:95](src/stores/History.ts#L95) — `setTimeout(() => setStoreHistory(currentHistory), 0)`。
呼んだ直後にアサート → **ストアはまだ空**。

```ts
vi.useFakeTimers();
insertHistory([msg]);
expect(storeHistory.ch1).toBeUndefined(); // まだ
vi.runAllTimers();
expect(storeHistory.ch1.history).toHaveLength(1); // 反映
vi.useRealTimers();
```

fake timer 不使用なら `await new Promise((r) => setTimeout(r, 0))` で 1 tick 待ち。

### 3-3. Solid リアクティビティ

- ストア getter / setter を素で叩くだけ → `createRoot` 不要
- `createEffect` / `createMemo` 検証 → **`createRoot(dispose => {...})` で包む**。包まないと「computations created outside a createRoot」警告 + dispose 漏れ
- effect 反映は非同期 → `await Promise.resolve()` で 1 tick 待ち

```ts
import { createRoot, createEffect } from "solid-js";

await createRoot(async (dispose) => {
  const seen: string[] = [];
  createEffect(() => seen.push(storeMyUserinfo.name));
  setStoreMyUserinfo("name", "新しい名前");
  await Promise.resolve();
  expect(seen).toEqual(["ユーザー", "新しい名前"]);
  dispose();
});
```

### 3-4. `fetch` = 素のグローバル

`FETCH_CLIENT` は `fetch` 直呼び → `vi.stubGlobal("fetch", vi.fn())` で完全掌握。
`Response` は Node 18+ グローバル → Vitest jsdom 環境でもそのまま使用可。

```ts
const fetchMock = vi.fn(
  async () =>
    new Response(JSON.stringify({ message: "ok" }), { status: 200 }),
);
vi.stubGlobal("fetch", fetchMock);
```

### 3-5. WebSocket は jsdom 不可

`new WebSocket("/ws")` — 相対URL → jsdom 例外。必ずモック。
加えて [src/WS/WScontroller.ts:33](src/WS/WScontroller.ts#L33) の `export let ws` = モジュールスコープ変数 → テストから直接差し替え不可。
→ WScontroller テストの形: グローバル `WebSocket` をモッククラスに差し替え → `initWS()` 実行 → 保持インスタンスの `onmessage` を手動発火 → 各ハンドラ呼び出しを `vi.mock` で検証（§5-8）。

### 3-6. jsdom に無い API（使う側 必ずスタブ）

- `Notification` — [src/utils/Notify.ts](src/utils/Notify.ts) 使用 → `vi.stubGlobal("Notification", class { static permission = "granted" ... })`
- `navigator.serviceWorker` — [src/utils/PushSubscription.ts](src/utils/PushSubscription.ts) 使用
- `document.hasFocus()` — jsdom にあるが常に一定 → `vi.spyOn(document, "hasFocus").mockReturnValue(false)`
- `location.pathname` — 直接代入も一応通るが jsdom がナビゲーション未実装エラーを吐く場合あり → `window.history.pushState({}, "", "/app/channel/ch1")` を使う
- `IntersectionObserver` / `ResizeObserver` — 無限スクロール系で必要 → `vi.stubGlobal` でダミークラス

### 3-7. import は `.ts` / `.tsx` 拡張子付き

`allowImportingTsExtensions: true` → テストコードの import も **必ず拡張子**。

```ts
import GetCookie from "~/utils/GetCookie.ts";        // ✅
import GetCookie from "~/utils/GetCookie";           // ❌ 既存流儀違反
```

### 3-8. solid-ui コンポーネントは直接テストしない

`src/components/ui/` = shadcn/solid-ui 生成物。Biome も除外中。
テスト対象 = それを組み合わせた `unique/` `Channel/` 側の振る舞い。

### 3-9. テストファイル 配置規約

**co-location**（対象の隣）採用:

```
src/utils/GetCookie.ts
src/utils/GetCookie.test.ts        ← 隣
src/api/FETCH_CLIENT.ts
src/api/FETCH_CLIENT.test.ts
src/components/unique/Foo.tsx
src/components/unique/Foo.test.tsx
```

共通ヘルパー・fixture のみ `src/test/`（`setup.ts`, `fixtures/message.ts` 等）。

### 3-10. 命名・言語

- `describe` / `it` 説明文 = **日本語**（コメント・UI文言 日本語 という既存規約に合わせる）
- 型接頭辞規約（`I` / `T` / `E`）はテスト用の型にも適用

---

## 4. テスト対象 優先順位

上から着手。上ほど「壊れやすく・影響大・書きやすい」。

### 優先度 A — 純粋ロジック（依存ゼロ、即書ける）

- [src/utils/ConvertSizeToHumanSize.ts](src/utils/ConvertSizeToHumanSize.ts) — 単位繰り上げ境界、上限クランプ
- [src/utils/GetCookie.ts](src/utils/GetCookie.ts) — 値内部 `=`、前後空白、前方一致 誤マッチ（`abc=` と `abcd=`）、未存在 → `undefined`
- [src/lib/utils.ts](src/lib/utils.ts) — `cn()` の Tailwind 競合クラス解決

### 優先度 A — API層（バックエンド仕様 転記ミス = 回帰の主因）

- [src/api/FETCH_CLIENT.ts](src/api/FETCH_CLIENT.ts) — クエリ組み立て（`undefined` 除外・全部 undefined なら `?` 無し）、FormData 判定で Content-Type 付けない、`!res.ok` → 本文を message にした Error、fetch reject → `label :: fetch failed` + `cause`
- [src/api/domains/*.ts](src/api/domains/) — 各メソッドが **正しい URL・HTTP method・body キー名** で `FETCH_CLIENT` を呼ぶか。数は多いが機械的 かつ 価値 高

### 優先度 B — ストア ロジック

- [src/stores/History.ts](src/stores/History.ts) — `insertHistory` の挿入方向判定・重複行トリム（`slice(0,-1)` / `slice(1)`）・120件超 間引き と `atTop`/`atEnd` の落ち方、`addMessage` の 未初期化チャンネル無視 / `atEnd === false` 無視 / ひな形マージ
- [src/stores/MyUserinfo.ts](src/stores/MyUserinfo.ts) — `getRolePower` の HOST特権・複数ロール OR判定・権限なし
- [src/stores/Notification.ts](src/stores/Notification.ts) — `isChannelMuted`
- [src/stores/MessageFetchCache.ts](src/stores/MessageFetchCache.ts) — キャッシュ投入・取得・`clearCache`

### 優先度 B — 非同期ユーティリティ

- [src/utils/FormatMessageContent.ts](src/utils/FormatMessageContent.ts) — メンション `@<id>` / チャンネル `#<id>` / 改行 の混在順序、ユーザー取得失敗 → `@不明なユーザー`、チャンネル未読込 → `#不明なチャンネル`。**依存する `asyncGetterUserinfo` / `directGetterChannelInfo` を `vi.mock`**
- [src/utils/FethchHistory.ts](src/utils/FethchHistory.ts) — API呼び出し引数 と ストア反映

### 優先度 C — WSハンドラ

- [src/WS/Message/SendMessage.ts](src/WS/Message/SendMessage.ts) — 「別チャンネル or 非フォーカス」かつ「自分以外」→ 新着フラグ + 通知、「atEnd or 自分の発言」→ 既読時間更新、常に `addMessage`
- [src/WS/WScontroller.ts](src/WS/WScontroller.ts) — signal → ハンドラ 振り分け表、`ERROR` + `token not valid` → `storeAppStatus.loggedIn = false`、JSONパース失敗の握り潰し

### 優先度 C — コンポーネント

- `src/components/unique/` 表示・入力系
- `src/components/Channel/` メッセージ表示・入力ロジック
- `src/components/ui/` は **対象外**

---

## 5. サンプルテストコード

生成するテストはこの形に揃える。

### 5-1. 純粋関数

`src/utils/ConvertSizeToHumanSize.test.ts`

```ts
import { describe, expect, it } from "vitest";
import ConvertSizeToHumanSize from "~/utils/ConvertSizeToHumanSize.ts";

describe("ConvertSizeToHumanSize", () => {
  it("1024未満はそのままB表記", () => {
    expect(ConvertSizeToHumanSize(0)).toBe("0.00 B");
    expect(ConvertSizeToHumanSize(1023)).toBe("1023.00 B");
  });

  it("1024ちょうどでKBに繰り上がる", () => {
    expect(ConvertSizeToHumanSize(1024)).toBe("1.00 KB");
  });

  it("単位を跨いで繰り上がる", () => {
    expect(ConvertSizeToHumanSize(1024 ** 2)).toBe("1.00 MB");
    expect(ConvertSizeToHumanSize(1024 ** 3)).toBe("1.00 GB");
    expect(ConvertSizeToHumanSize(1024 ** 4)).toBe("1.00 TB");
  });

  it("TBを超えても単位配列の末尾で止まる", () => {
    expect(ConvertSizeToHumanSize(1024 ** 5)).toBe("1024.00 TB");
  });
});
```

### 5-2. Cookie（jsdom の document 使用）

`src/utils/GetCookie.test.ts`

```ts
import { beforeEach, describe, expect, it } from "vitest";
import GetCookie from "~/utils/GetCookie.ts";

describe("GetCookie", () => {
  beforeEach(() => {
    // jsdom の cookie は個別に期限切れさせて消す
    for (const c of document.cookie.split(";")) {
      const name = c.split("=")[0].trim();
      if (name) document.cookie = `${name}=; max-age=0`;
    }
  });

  it("該当Cookieの値を返す", () => {
    document.cookie = "token=abc123";
    expect(GetCookie("token")).toBe("abc123");
  });

  it("値の内部に = があっても切らない", () => {
    document.cookie = "jwt=aaa=bbb=ccc";
    expect(GetCookie("jwt")).toBe("aaa=bbb=ccc");
  });

  it("前方一致だけの別名にマッチしない", () => {
    document.cookie = "tokenExtra=zzz";
    expect(GetCookie("token")).toBeUndefined();
  });

  it("存在しなければ undefined", () => {
    expect(GetCookie("nothing")).toBeUndefined();
  });
});
```

### 5-3. `FETCH_CLIENT`（fetch スタブ）

`src/api/FETCH_CLIENT.test.ts`

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FETCH_CLIENT } from "~/api/FETCH_CLIENT.ts";

const okResponse = () =>
  new Response(JSON.stringify({ message: "ok" }), { status: 200 });

describe("FETCH_CLIENT", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);
  });

  it("query の undefined 値を除外してクエリ文字列を作る", async () => {
    await FETCH_CLIENT({
      url: "/api/x",
      method: "GET",
      query: { a: "1", b: undefined, c: 2 },
      label: "X",
    });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/x?a=1&c=2");
  });

  it("query が全て undefined なら ? を付けない", async () => {
    await FETCH_CLIENT({
      url: "/api/x",
      method: "GET",
      query: { a: undefined },
      label: "X",
    });
    expect(fetchMock.mock.calls[0][0]).toBe("/api/x");
  });

  it("JSON body は文字列化され Content-Type が付く", async () => {
    await FETCH_CLIENT({
      url: "/api/x",
      method: "POST",
      body: { foo: "bar" },
      label: "X",
    });
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers).toEqual({ "Content-Type": "application/json" });
    expect(init.body).toBe('{"foo":"bar"}');
  });

  it("FormData body には Content-Type を付けず そのまま渡す", async () => {
    const fd = new FormData();
    fd.append("file", new Blob(["x"]), "x.txt");
    await FETCH_CLIENT({
      url: "/api/x",
      method: "POST",
      body: fd,
      label: "X",
    });
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers).toBeUndefined();
    expect(init.body).toBe(fd);
  });

  it("body 無しなら headers も body も undefined", async () => {
    await FETCH_CLIENT({ url: "/api/x", method: "GET", label: "X" });
    const init = fetchMock.mock.calls[0][1];
    expect(init.headers).toBeUndefined();
    expect(init.body).toBeUndefined();
  });

  it("!res.ok ならレスポンス本文を message にした Error を投げる", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("Channel not found", { status: 404 }),
    );
    await expect(
      FETCH_CLIENT({ url: "/api/x", method: "GET", label: "X" }),
    ).rejects.toThrow("Channel not found");
  });

  it("fetch が reject したら label 付き Error に cause を包む", async () => {
    const netErr = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValueOnce(netErr);
    await expect(
      FETCH_CLIENT({ url: "/api/x", method: "GET", label: "MY_LABEL" }),
    ).rejects.toMatchObject({
      message: "MY_LABEL :: fetch failed",
      cause: netErr,
    });
  });
});
```

### 5-4. APIドメイン（URL・method・body 転記検証）

`src/api/domains/channel.test.ts`

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { channel } from "~/api/domains/channel.ts";

const okResponse = () =>
  new Response(JSON.stringify({ message: "ok" }), { status: 200 });

/** fetch 呼び出しを { url, method, body } に整形して取り出す */
const lastCall = (mock: ReturnType<typeof vi.fn>) => {
  const [url, init] = mock.mock.calls.at(-1) as [string, RequestInit];
  return {
    url,
    method: init.method,
    body: typeof init.body === "string" ? JSON.parse(init.body) : init.body,
  };
};

describe("api.channel", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn(async () => okResponse());
    vi.stubGlobal("fetch", fetchMock);
  });

  it("create は PUT /api/channel/create", async () => {
    await channel.create({ channelName: "雑談", description: "説明" });
    expect(lastCall(fetchMock)).toEqual({
      url: "/api/channel/create",
      method: "PUT",
      body: { channelName: "雑談", description: "説明" },
    });
  });

  it("delete は DELETE /api/channel/delete", async () => {
    await channel.delete({ channelId: "ch1" });
    expect(lastCall(fetchMock)).toEqual({
      url: "/api/channel/delete",
      method: "DELETE",
      body: { channelId: "ch1" },
    });
  });

  it("getInfo は GET でチャンネルIdをパスに埋める", async () => {
    await channel.getInfo({ channelId: "ch1" });
    const { url, method } = lastCall(fetchMock);
    expect(url).toBe("/api/channel/get-info/ch1");
    expect(method).toBe("GET");
  });

  it("getHistory は未指定の任意項目を body から落とす", async () => {
    await channel.getHistory({ channelId: "ch1", fetchLength: 10 });
    const { url, body } = lastCall(fetchMock);
    expect(url).toBe("/api/channel/get-history/ch1");
    // undefined のキーは JSON.stringify で消える
    expect(body).toEqual({ fetchLength: 10 });
  });
});
```

### 5-5. コンポーネント

`src/components/unique/Target.test.tsx`（`Target` は書式を示すための仮名。実在ファイルではない）

```tsx
import { render, screen } from "@solidjs/testing-library";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import Target from "~/components/unique/Target.tsx";

describe("Target", () => {
  it("渡した文言を表示する", () => {
    // render には「コンポーネントを返す関数」を渡す（Solid 流儀）
    render(() => <Target label="送信" />);
    expect(screen.getByRole("button", { name: "送信" })).toBeInTheDocument();
  });

  it("クリックで onClick が呼ばれる", async () => {
    const onClick = vi.fn();
    render(() => <Target label="送信" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "送信" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
```

### 5-6. ストア（`setTimeout` 落とし穴つき）

`src/stores/History.test.ts`

```ts
import { reconcile } from "solid-js/store";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  addMessage,
  insertHistory,
  setStoreHistory,
  storeHistory,
} from "~/stores/History.ts";
import type { IMessage } from "~/types/Message.ts";

const makeMessage = (over: Partial<IMessage> = {}): IMessage => ({
  channelId: "ch1",
  content: "テスト",
  isEdited: false,
  createdAt: new Date("2026-01-01T00:00:00Z").toISOString(),
  id: "m1",
  isSystemMessage: false,
  userId: "u1",
  MessageUrlPreview: [],
  MessageFileAttached: [],
  reactionSummary: [],
  replyingMessageId: null,
  ...over,
});

describe("History store", () => {
  beforeEach(() => {
    // モジュールシングルトンなので毎テストで全消しする。
    // setStoreHistory({}) はマージで消えないため reconcile 必須（§3-1）
    setStoreHistory(reconcile({}));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("insertHistory は setTimeout(0) 経由で反映される", () => {
    vi.useFakeTimers();
    insertHistory([makeMessage()]);
    expect(storeHistory.ch1).toBeUndefined(); // まだ反映されていない
    vi.runAllTimers();
    expect(storeHistory.ch1.history).toHaveLength(1);
  });

  it("空配列なら何もしない", () => {
    vi.useFakeTimers();
    insertHistory([]);
    vi.runAllTimers();
    expect(storeHistory.ch1).toBeUndefined();
  });

  it("addMessage は未初期化チャンネルを無視する", () => {
    addMessage(makeMessage());
    expect(storeHistory.ch1).toBeUndefined();
  });

  it("addMessage は atEnd が false のとき無視する", () => {
    setStoreHistory({ ch1: { history: [], atTop: false, atEnd: false } });
    addMessage(makeMessage());
    expect(storeHistory.ch1.history).toHaveLength(0);
  });

  it("addMessage は先頭に unshift しひな形をマージする", () => {
    setStoreHistory({ ch1: { history: [], atTop: true, atEnd: true } });
    // 欠損フィールドがある不完全なデータを渡す
    addMessage({ id: "m9", channelId: "ch1", content: "やあ" } as IMessage);
    expect(storeHistory.ch1.history[0]).toMatchObject({
      id: "m9",
      content: "やあ",
      reactionSummary: [], // ひな形から補完される
      replyingMessageId: null,
    });
  });
});
```

### 5-7. WSハンドラ（依存を vi.mock で切る）

`src/WS/Message/SendMessage.test.ts`

```ts
import { reconcile } from "solid-js/store";
import { beforeEach, describe, expect, it, vi } from "vitest";

// import より先に巻き上げられる。依存モジュールを丸ごと差し替える
vi.mock("~/utils/Notify.ts", () => ({ notifyIt: vi.fn() }));
vi.mock("~/utils/UpdateReadTimeOnRemoteAndStore.util", () => ({
  default: vi.fn(),
}));
vi.mock("~/stores/History.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/stores/History.ts")>();
  return { ...actual, addMessage: vi.fn() };
});

import {
  setStoreHasNewMessage,
  storeHasNewMessage,
} from "~/stores/HasNewMessage.ts";
import { addMessage } from "~/stores/History.ts";
import { setStoreMyUserinfo } from "~/stores/MyUserinfo.ts";
import type { IMessage } from "~/types/Message.ts";
import { notifyIt } from "~/utils/Notify.ts";
import WSSendMessage from "~/WS/Message/SendMessage.ts";

const makeMessage = (over: Partial<IMessage> = {}): IMessage =>
  ({
    channelId: "ch1",
    content: "やあ",
    createdAt: "2026-01-01T00:00:00Z",
    id: "m1",
    userId: "other",
    isEdited: false,
    isSystemMessage: false,
    MessageUrlPreview: [],
    MessageFileAttached: [],
    reactionSummary: [],
    replyingMessageId: null,
    ...over,
  }) as IMessage;

describe("WSSendMessage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setStoreHasNewMessage(reconcile({})); // §3-1: {} 渡しはマージで消えない
    setStoreMyUserinfo("id", "me");
    window.history.pushState({}, "", "/app/channel/other-channel");
    vi.spyOn(document, "hasFocus").mockReturnValue(false);
  });

  it("別チャンネルの他人の発言なら新着フラグを立てる", () => {
    WSSendMessage(makeMessage({ channelId: "ch1", userId: "other" }));
    expect(storeHasNewMessage.ch1).toBe(true);
  });

  it("自分の発言なら新着フラグを立てない", () => {
    WSSendMessage(makeMessage({ channelId: "ch1", userId: "me" }));
    expect(storeHasNewMessage.ch1).toBeUndefined();
    expect(notifyIt).not.toHaveBeenCalled();
  });

  it("どの分岐でも履歴には必ず追加する", () => {
    WSSendMessage(makeMessage({ userId: "me" }));
    expect(addMessage).toHaveBeenCalledTimes(1);
  });
});
```

### 5-8. WebSocket モック（WScontroller 用）

`src/test/mocks/WebSocket.ts`

```ts
import { vi } from "vitest";

/** テストから onmessage / onopen / onclose を手動発火できる WebSocket モック */
export class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  /** 直近に生成されたインスタンス。テストから触るための入口 */
  static latest: MockWebSocket | undefined;

  readyState = MockWebSocket.CONNECTING;
  url: string;
  send = vi.fn();
  close = vi.fn();
  onmessage: ((e: { data: string }) => void) | null = null;
  onopen: ((e: unknown) => void) | null = null;
  onclose: ((e: unknown) => void) | null = null;
  onerror: ((e: unknown) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockWebSocket.latest = this;
  }

  /** テスト側から受信をシミュレートする */
  emit(signal: string, data: unknown) {
    this.onmessage?.({ data: JSON.stringify({ signal, data }) });
  }
}
```

使い方:

```ts
vi.stubGlobal("WebSocket", MockWebSocket);
await initWS();
MockWebSocket.latest?.emit("message::SendMessage", makeMessage());
expect(WSSendMessage).toHaveBeenCalled(); // vi.mock 済みハンドラ
```

---

## 6. テストコード生成用プロンプト集

そのままコピーして AI エージェントに渡す。`{{ }}` を埋める。
※ この節は AI への指示文のため、通常の日本語で記述している。

### 6-0. 共通ヘッダ（全プロンプトの先頭に必ず貼る）

```
【前提】
- リポジトリ: Giracle フロントエンド（SolidJS + Vite + TypeScript）
- 開発ガイド AGENTS.md、テストガイド TESTING.md を先に読むこと
- テストランナー: Vitest / DOM: jsdom / コンポーネント: @solidjs/testing-library
- パッケージマネージャ: pnpm

【厳守ルール】
1. React ではなく SolidJS。useState / useEffect / className は存在しない
2. import は `~/` エイリアス + `.ts` / `.tsx` 拡張子付き
3. テストファイルは対象ファイルの隣に co-location（例: src/utils/Foo.ts → src/utils/Foo.test.ts）
4. describe / it の説明文は日本語
5. vitest から describe, it, expect, vi, beforeEach を明示 import する（globals に頼らない）
6. src/stores/* はモジュールシングルトン。同一ファイル内の test 間で状態が残るので beforeEach でリセットする。
   リセットは必ず reconcile を使う（setStoreXxx({}) はマージなので既存キーが消えない）:
   import { reconcile } from "solid-js/store"; → setStoreXxx(reconcile({}))
7. 本体コードを変更してはならない。テストを通すために本体を書き換えたくなったら、変更せず
   「本体側のこの挙動がテスト困難」と報告する
8. 実装を写経したテストを書かない。「入力 → 期待する出力・副作用」の観測可能な振る舞いだけを検証する
9. 境界値・異常系を必ず含める（空・undefined・0件・上限超え・API エラー）
10. 生成後、必ず `pnpm test:run` を実行して緑にする。加えて `npx biome check .` と
    `npx tsc --noEmit --skipLibCheck` を実行し、型エラー件数が変更前から増えていないことを確認する
    （既存エラーが約20件あるため「0件」は合格基準にならない）
```

### 6-1. 環境構築プロンプト

```
{{共通ヘッダ}}

【依頼】
このリポジトリに Vitest ベースのテスト環境を構築してください。
TESTING.md の「2. 環境構築手順」に厳密に従うこと。

作成・変更するもの:
- pnpm add -D で依存追加（vitest, @vitest/coverage-v8, jsdom,
  @solidjs/testing-library, @testing-library/jest-dom, @testing-library/user-event）
- vitest.config.ts を新規作成（vite.config.ts は変更しない。VitePWA をテストで走らせないため）
- src/test/setup.ts を新規作成
- tsconfig.json の compilerOptions.types に "vitest/globals" と "@testing-library/jest-dom" を追加
- package.json に test / test:run / test:coverage スクリプトを追加
- .gitignore に coverage/ を追加

必須の設定ポイント（省略禁止）:
- resolve.conditions: ["development", "browser"]（無いと Solid のリアクティビティが壊れる）
- resolve.alias の "~/" を src の絶対パスに解決
- define.__VERSION__ を package.json の version から埋める
- test.environment: "jsdom", test.globals: true, setupFiles で src/test/setup.ts を読む
- coverage の exclude に src/components/ui, src/sw.ts, src/types を含める

完了条件:
1. 動作確認用に src/utils/ConvertSizeToHumanSize.test.ts を 1 本だけ作る
2. `pnpm test:run` が緑
3. `npx tsc --noEmit --skipLibCheck` の型エラー件数が構築前から増えていない
4. `npx biome check .` が通る
5. `pnpm build` が通る
```

### 6-2. 純粋関数・ユーティリティ

```
{{共通ヘッダ}}

【依頼】
{{対象ファイルパス}} のユニットテストを書いてください。

観点:
- 正常系の代表値
- 境界値（0、空文字、空配列、上限ちょうど、上限+1）
- 異常系（不正な入力、未存在の ID、例外を投げる依存）
- 副作用の有無（純粋関数なら「呼んでも外部状態が変わらない」ことも確認）

外部依存（ストア / API / DOM API）がある場合:
- vi.mock でモジュールごと差し替えるか、vi.stubGlobal でグローバルを差し替える
- jsdom に無い API（Notification, navigator.serviceWorker, IntersectionObserver）は
  必ず vi.stubGlobal でダミーを入れる。TESTING.md 「3-6」参照
```

### 6-3. API 層

```
{{共通ヘッダ}}

【依頼】
{{src/api/domains/xxx.ts}} の全メソッドについてテストを書いてください。

検証する内容は「FETCH_CLIENT に渡る URL / HTTP method / body のキー名と値」です。
レスポンスの中身は検証対象外（型でしか保証していないため）。

やり方:
- vi.stubGlobal("fetch", vi.fn()) でグローバル fetch を差し替える
- fetchMock.mock.calls から [url, init] を取り出し、init.method と JSON.parse(init.body) を検証
- TESTING.md 「5-4」の lastCall ヘルパーをそのまま使ってよい

必須ケース:
- 各メソッドの URL・method・body が実装どおりか
- パスパラメータを埋めるメソッド（get-history, get-info など）で ID が正しく埋まるか
- 任意引数を省略したとき body からキーが落ちるか
- クエリを独自構築している特殊メソッド（message.search など）はその組み立て結果

注意: 期待値は「実装ファイルの現在のコード」から転記すること。
バックエンドの正解を推測して書き換えてはならない。実装と食い違うと感じたら
テストを実装に合わせた上で、その食い違いを報告する。
```

### 6-4. ストア

```
{{共通ヘッダ}}

【依頼】
{{src/stores/xxx.ts}} のテストを書いてください。

必読の注意（TESTING.md 「3-1」「3-2」「3-3」）:
- ストアはモジュールシングルトン。beforeEach で setStoreXxx(reconcile({})) を使い初期状態に戻すこと。
  setStoreXxx({}) はトップレベルのマージなので既存キーが残る（テストが前のテストの状態に汚染される）
- History.insertHistory は setTimeout(..., 0) 経由で反映される。
  vi.useFakeTimers() + vi.runAllTimers() で進めてからアサートする。
  afterEach で vi.useRealTimers() に戻す
- createEffect / createMemo を検証する場合のみ createRoot(dispose => {...}) で包み、
  最後に dispose() を呼ぶ。effect の反映は await Promise.resolve() で 1 tick 待つ

観点:
- setter を叩いた後の store の中身
- 派生ゲッター（getRolePower, isChannelMuted など）の全分岐
- 未初期化キーへのアクセス（early return するか）
- 件数上限・トリム処理の境界（History なら 119件 / 120件 / 121件）
```

### 6-5. WS ハンドラ

```
{{共通ヘッダ}}

【依頼】
{{src/WS/xxx/yyy.ts}} のテストを書いてください。

やり方:
- ハンドラが呼ぶ他モジュール（Notify, UpdateReadTimeOnRemoteAndStore, api など）は
  vi.mock でモジュールごと差し替え、呼ばれた回数と引数を検証する
- vi.mock はファイル冒頭に置く（import より先に巻き上げられる）
- 一部だけ差し替えたい場合は importOriginal を使う:
  vi.mock("~/stores/History.ts", async (importOriginal) => {
    const actual = await importOriginal<typeof import("~/stores/History.ts")>();
    return { ...actual, addMessage: vi.fn() };
  });
- location.pathname は window.history.pushState({}, "", "/app/channel/ch1") で変える
- document.hasFocus は vi.spyOn(document, "hasFocus").mockReturnValue(bool)

観点:
- 受け取った data の全分岐（自分の発言 / 他人の発言、フォーカス有無、
  同じチャンネル / 別チャンネル、ミュート有無、atEnd の真偽）
- 分岐に関わらず必ず起きる副作用（例: SendMessage なら addMessage は常に呼ばれる）
- 不正なデータ（欠損フィールド、undefined）を渡しても例外を投げないこと
```

### 6-6. WScontroller（振り分け）

```
{{共通ヘッダ}}

【依頼】
src/WS/WScontroller.ts の signal 振り分けテストを書いてください。

やり方:
- TESTING.md 「5-8」の MockWebSocket を src/test/mocks/WebSocket.ts に作り、
  vi.stubGlobal("WebSocket", MockWebSocket) で差し替える
  （jsdom は相対URL "/ws" の WebSocket を作れないため必須）
- 全ハンドラモジュールを vi.mock で spy 化する
- initWS() を呼び、MockWebSocket.latest.emit(signal, data) で受信をシミュレートする

観点:
- switch の全 case で対応するハンドラが 1 回だけ呼ばれること
  （role::Deleted と role::Unlinked が同じ WSRoleUnlinked を呼ぶ点も含む）
- 未知の signal では何も呼ばれないこと
- signal "ERROR" かつ data "token not valid" で storeAppStatus.loggedIn が false になること
- 不正な JSON を受け取っても例外を外に投げず console.error で握り潰すこと
- onclose 時、エラーフラグが立っていれば再接続しないこと（vi.useFakeTimers で検証）
```

### 6-7. コンポーネント

```
{{共通ヘッダ}}

【依頼】
{{src/components/xxx/Yyy.tsx}} のコンポーネントテストを書いてください。

やり方:
- import { render, screen } from "@solidjs/testing-library"
- render には関数を渡す: render(() => <Yyy prop={...} />)
- 操作は userEvent（await 必須）。fireEvent は使わない
- 要素取得は getByRole > getByLabelText > getByText の優先順。
  data-testid は他に手段が無いときだけ

観点:
- props に応じた表示の出し分け（Show / For の分岐）
- ユーザー操作でコールバックが正しい引数で呼ばれること
- ストア依存がある場合、beforeEach でストアを目的の状態にしてから render する
- 権限による表示制御（getRolePower 依存）は RoleInfo / MyUserinfo ストアを組んで検証

禁止事項:
- src/components/ui/ 配下（solid-ui 生成物）を直接テストしない
- 実装の内部関数名やクラス名に依存したアサーションを書かない
  （Tailwind のクラス文字列を expect するのは最終手段）
- スナップショットテストを書かない（差分レビューが機能しなくなるため）
```

### 6-8. 既存バグの回帰テスト

```
{{共通ヘッダ}}

【依頼】
以下の不具合に対する回帰テストを書いてください。

不具合: {{再現手順と誤った挙動}}
修正コミット / 修正箇所: {{ある場合}}

手順:
1. まず「修正前なら落ちる」テストを書く
2. そのテストが現在の実装で通ることを確認する（既に修正済みの場合）
3. まだ未修正なら、テストが落ちる状態のまま報告し、本体の修正は別途指示を仰ぐ
```

---

## 7. 導入後の確認手順（AGENTS.md 追記案）

AGENTS.md 「変更時の確認手順」を以下に差し替え → 整合が取れる。

```markdown
1. `pnpm test:run` でテストが全て通ることを確認。
2. `npx tsc --noEmit --skipLibCheck` で自分の変更が新規の型エラーを増やしていないことを確認
   （既存エラーが約 20 件あるため 0 件は基準にできない）。
   `npx biome check .` で lint/format 違反も確認（`--write` で自動修正可）。
3. UI 変更はバックエンドを起動した上で `pnpm dev` → http://localhost:3333 で動作確認。
4. PWA / Service Worker 関連の変更は `dev-dist/` が生成される（gitignore 済み）。
   SW の挙動はブラウザの DevTools → Application で確認。
5. ビルドが通るか `pnpm build` で確認。
```

同じく AGENTS.md 「コマンド」節の「テストは存在しない。テストランナーも未導入。」を
「テストは Vitest。詳細は [TESTING.md](TESTING.md)。」に差し替え。

---

## 8. 段階的 導入ロードマップ

- **Phase 1** — 環境構築（§6-1）+ 優先度A 純粋関数（ConvertSizeToHumanSize / GetCookie / cn）。テストが「ある」状態を作る
- **Phase 2** — `FETCH_CLIENT` + `api/domains/*` 全域。バックエンド仕様の転記ミスを機械的に検出できる状態にする
- **Phase 3** — ストア（History / MyUserinfo / Notification / MessageFetchCache）。ロジックの塊 → 回帰しやすい
- **Phase 4** — WSハンドラ + WScontroller 振り分け表
- **Phase 5** — コンポーネント。unique/ から始め Channel/ へ

カバレッジ目標 = 最初は設定しない。Phase 3 完了時点で `pnpm test:coverage` 計測 → そこを基準線にする。
