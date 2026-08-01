# AGENTS.md — AI エージェント向け開発ガイド

Giracle のフロントエンド（SolidJS 製チャットアプリ）。AI アシスタントがこのリポジトリで作業する際に必要な知識と手順をまとめる。

## プロジェクト概要

- セルフホスト型チャットサービス「Giracle」のフロントエンド。チャンネル・メッセージ・リアクション・ロール（権限）・カスタム絵文字・Inbox（メンション等の通知）・Web プッシュ通知などを持つ。
- バックエンドは別リポジトリ。開発時は Vite のプロキシで `/api` と `/ws` をバックエンド（デフォルト `http://localhost:3000`）へ転送する（[vite.config.ts](vite.config.ts) 参照）。
- PWA 対応（`vite-plugin-pwa`、`injectManifest` 戦略）。Service Worker は [src/sw.ts](src/sw.ts)。

## 技術スタック

- **UI フレームワーク**: SolidJS（React ではない。`createSignal` / `createStore` / `Show` / `For` などの Solid 流儀に従うこと。JSX で `class=` を使う。`className` ではない）
- **ルーティング**: `@solidjs/router`（ルート定義は [src/index.tsx](src/index.tsx) に集中）
- **スタイリング**: Tailwind CSS v3 + `tailwindcss-animate`。ユーティリティ結合は `cn()`（[src/lib/utils.ts](src/lib/utils.ts)、clsx + tailwind-merge）
- **UI コンポーネント**: solid-ui（shadcn/ui の Solid 版、Kobalte ベース）。生成物は [src/components/ui/](src/components/ui/) に配置。設定は [ui.config.json](ui.config.json)
- **ビルド**: Vite。TypeScript は `noEmit`（型チェックのみ）。`allowImportingTsExtensions` 有効のため import に `.ts` / `.tsx` 拡張子を付ける流儀
- **パスエイリアス**: `~/` → `src/`（tsconfig と vite.config の両方で定義）

## コマンド

パッケージマネージャは **pnpm**（`package.json` の `packageManager` 参照。README には `bun i` / `bun dev` とあるが、lock ファイルは `pnpm-lock.yaml`）。

```sh
pnpm i              # 依存インストール
pnpm dev            # 開発サーバー（ポート 3333）
pnpm dev-host       # LAN 公開で開発サーバー
pnpm build          # 本番ビルド（dist/）
pnpm serve          # ビルド結果のプレビュー
npx tsc --noEmit --skipLibCheck   # 型チェック（専用スクリプトは無い）
npx biome check .                 # lint + format チェック（専用スクリプトは無い）
npx biome check --write .         # lint + format 自動修正
```

型チェックの注意（2026-07 時点）:

- `--skipLibCheck` 必須。付けないと `@kobalte/core` の型定義が TypeScript 6 と非互換で node_modules 由来のエラーが大量に出る（tsconfig に `skipLibCheck` 未設定のため）。
- `--skipLibCheck` を付けても **src 配下に約 20 件の既存型エラーがある**（`src/routes/channel/[id].tsx`、`src/WS/Message/ReadTimeUpdate.ts`、`ChannelTextInput` 周辺など）。「エラー 0 件」を合格基準にしないこと。**変更前後でエラー件数・内容を比較し、自分の変更で新規エラーを増やしていないこと**を確認基準にする。

- テストは存在しない。テストランナーも未導入。
- Lint/format は Biome（[biome.json](biome.json)）。対象 `**/*.ts`（`src/components/ui` 除外）。ダブルクォート・スペース2幅・行幅80・import 自動整理（`organizeImports`）。`biome-ignore` コメントで個別除外可。npm script 未定義のため `npx biome check .` / `npx biome check --write .` を直接叩く。

## 環境変数

`.env.sample` をコピーして `.env` を作る。

- `VITE_CORS_ORIGIN` — バックエンドの URL（プロキシ先）
- `VITE_PROD_PORT` — `serve-host` 時のポート
- `VITE_PROD_DOMAIN` — プレビュー時に許可するドメイン

`__VERSION__` はビルド時に `package.json` の `version` が埋め込まれるグローバル定数。

## ディレクトリ構造と役割

- [src/index.tsx](src/index.tsx) — エントリポイント。全ルート定義、テーマ（Kobalte ColorMode）、サイドバー、初期のサーバー情報取得。
- [src/api/](src/api/) — REST API ラッパー。共通 fetch 関数とドメイン別チェーン API に統一されている。
  - [src/api/FETCH_CLIENT.ts](src/api/FETCH_CLIENT.ts) — 全エンドポイント共通の fetch 関数。JSON body / FormData body / クエリパラメータ / パスパラメータを吸収する。エラーハンドリング（`!res.ok` → `throw new Error(await res.text())`、ネットワークエラー → `{ cause }` 付き Error）もここに集約。
  - [src/api/domains/](src/api/domains/) — `channel.ts` / `message.ts` / `notification.ts` / `role.ts` / `server.ts` / `user.ts` にドメインごとのエンドポイントを定義。各メソッドは `FETCH_CLIENT` に型・URL・body を当てはめるだけの薄い関数で、引数はオブジェクト1個に統一（例: `{ channelId: string }`）。メソッド名は camelCase（`delete`, `list`, `getHistory` など）。
  - [src/api/index.ts](src/api/index.ts) — `export const api = { channel, message, notification, role, server, user }`。呼び出し側は `await api.channel.delete({ channelId })` のようにチェーン形式でアクセスする。
  - **新規エンドポイント追加時**: 該当する `domains/*.ts` を開き、既存メソッドと同じ形式（`FETCH_CLIENT<戻り値型>({ url, method, body?, query?, label })`）でメソッドを追加する。URL・HTTPメソッド・body のキー名はバックエンド実装から正確に転記すること（ファイル名やメソッド名からの推測は禁止）。FormData 送信時は `Content-Type` ヘッダを設定しない（`FETCH_CLIENT` が `body instanceof FormData` で自動判定する）。
  - 戻り値は `{ message, data }` 形式が基本。型は `~/types/` の型（`IChannel`, `IMessage` など）をそのまま参照する。
- [src/WS/](src/WS/) — WebSocket まわり。
  - [src/WS/WScontroller.ts](src/WS/WScontroller.ts) — WS 接続の確立・再接続・受信メッセージのディスパッチ。受信 JSON は `{ signal: string, data: any }` 形式で、`signal` の値で `switch` して各ハンドラへ振り分ける。
  - サブディレクトリ（`Message` / `Channel` / `Role` / `Server` / `User` / `inbox`）に signal ごとのハンドラ。新しい WS シグナルを追加する場合はハンドラファイルを作り WScontroller の `switch` に登録する。
- [src/stores/](src/stores/) — グローバル状態。`solid-js/store` の `createStore` を使い、`export const [storeXxx, setStoreXxx] = createStore(...)` のペアを named export する流儀。
  - 主要ストア: `MyUserinfo`（自分の情報＋`getRolePower()` による権限判定）、`ChannelInfo`、`History`（メッセージ履歴）、`Serverinfo`、`Notification`（通知設定・ミュート）、`HasNewMessage`（未読ドット）、`Readtime`（既読時刻）など。
- [src/routes/](src/routes/) — ページコンポーネント。認証必須ページは `/app` 配下で `AuthGuard` に包まれる。チャンネル画面は `/app/channel/:channelId/:messageId?`。
- [src/components/](src/components/) — 機能別コンポーネント。
  - `ui/` — solid-ui 生成のプリミティブ（手書き改変は最小限に）
  - `unique/` — プロジェクト固有の汎用部品
  - `Channel/` — チャット画面本体（メッセージ表示・入力・ヘッダー・管理）
- [src/types/](src/types/) — 共有型定義。`IMessage` / `IUser` / `IChannel` / `IRole` / `IServer` のように `I` 接頭辞のインターフェース。
- [src/utils/](src/utils/) — 補助関数。`Notify.ts`（ブラウザ通知）、`PushSubscription.ts`（Web プッシュ購読登録）、`InitLoad.ts`（ログイン後の初期データ取得）、`ExternalNavigater.ts`（コンポーネント外から router の navigate を呼ぶ仕組み）など。
- [src/sw.ts](src/sw.ts) — Service Worker。プッシュ受信時、Giracle のタブが既に開いていれば WS 経由の通知に任せて SW 側では通知しない（二重通知防止）。

## 認証・通信の要点

- 認証は Cookie ベース（`GetCookie.ts` 参照）。`AuthGuard` が `/app` 配下を保護。
- WS は `token not valid` シグナルを受けるとエラーフラグを立てて再認証フローへ。
- API レスポンスの `message` フィールドはテンプレートリテラル型で固定文字列を表現している（バックエンドのレスポンス仕様と一致させる）。

## コーディング規約・慣習

- コメント・UI 文言は日本語。既存のコメント密度に合わせる。
- import は `~/` エイリアス＋拡張子付き（例: `import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";`）。
- Solid の反応性を壊さない: props の分割代入をトップレベルでしない、ストア更新は setter か `produce` を使う。
- コンポーネントは基本 default export、ストア・ユーティリティは named export。
- コンポーネントに分離する際は単一のコンポーネントでのみ使われる場合はその親コンポーネントの名前のディレクトリに配置する。共通コンポーネントの場合、`src\components\unique`に配置する。
- Interfaceの定義は頭文字に`I`、typeの場合は頭文字に`T`、enumの場合は頭文字に`E`をつける

## コミット規約

日本語プレフィックス方式:

- `add - ` なにかしら新しく作成、追加 / `fix - ` 修正 / `change -` 変更・更新 / `remove -` 削除

例: `add - プッシュ通知の実装`、`fix - ポップアップ修正`

## 変更時の確認手順

1. `npx tsc --noEmit --skipLibCheck` で**自分の変更が新規の型エラーを増やしていない**ことを確認（テストが無いため型チェックが最重要の安全網。ただし既存エラーが約 20 件あるため 0 件は基準にできない。「コマンド」節の注意参照）。
   `npx biome check .` で lint/format 違反も確認（`--write` で自動修正可）。
2. UI 変更はバックエンドを起動した上で `pnpm dev` → `http://localhost:3333` で動作確認。
3. PWA / Service Worker 関連の変更は `dev-dist/` が生成される（gitignore 済み）。SW の挙動はブラウザの DevTools → Application で確認。
4. ビルドが通るか `pnpm build` で確認。

## 落とし穴

- React の知識で書かない（`useState` / `useEffect` / `className` は存在しない。再レンダリングモデルが根本的に違い、コンポーネント関数は一度しか実行されない）。
- `version` はリリース時に `package.json` で手動更新される（`0.x.y-alpha`）。UI 表示に `__VERSION__` を使用。
- `dev-dist/` と `dist/` は生成物。編集しない。
- API 呼び出しは必ず `~/api/index.ts` の `api` オブジェクト経由で行う（`import { api } from "~/api/index.ts";`）。個別のエンドポイントファイルを直接 import する旧方式（`~/api/CHANNEL/CHANNEL_DELETE.ts` など）は 2026-07 のリファクタで廃止済み。
- `FETCH_CLIENT` の `query` オプションは `undefined` 値のみ除外して `?key=value` を組み立てる。空文字列を除外したい・クエリ文字列を独自構築したい等、挙動を変えたくない特殊なエンドポイント（例: `message.search`）は `domains/*.ts` 内で独自にクエリ文字列を組み立てても構わない。
