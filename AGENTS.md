# AGENTS.md — AI エージェント向け開発ガイド

Giracle フロントエンド（SolidJS 製チャットアプリ）。AI アシスタント作業に必要な知識・手順まとめ。

## プロジェクト概要

- セルフホスト型チャット「Giracle」フロントエンド。チャンネル・メッセージ・リアクション・ロール（権限）・カスタム絵文字・Inbox（メンション等通知）・Web プッシュ通知。
- バックエンド別リポジトリ。開発時 Vite プロキシで `/api` `/ws` をバックエンド（デフォルト `http://localhost:3000`）へ転送（[vite.config.ts](vite.config.ts) 参照）。
- PWA 対応（`vite-plugin-pwa`、`injectManifest` 戦略）。Service Worker は [src/sw.ts](src/sw.ts)。

## 技術スタック

- **UI フレームワーク**: SolidJS（React ではない。`createSignal` / `createStore` / `Show` / `For` 等 Solid 流儀に従う。JSX で `class=` 使用。`className` は存在しない）
- **ルーティング**: `@solidjs/router`（ルート定義 [src/index.tsx](src/index.tsx) に集中）
- **スタイリング**: Tailwind CSS v3 + `tailwindcss-animate`。ユーティリティ結合 `cn()`（[src/lib/utils.ts](src/lib/utils.ts)、clsx + tailwind-merge）
- **UI コンポーネント**: solid-ui（shadcn/ui の Solid 版、Kobalte ベース）。生成物 [src/components/ui/](src/components/ui/) 配置。設定 [ui.config.json](ui.config.json)
- **ビルド**: Vite。TypeScript は `noEmit`（型チェックのみ）。`allowImportingTsExtensions` 有効 → import に `.ts` / `.tsx` 拡張子付与流儀
- **パスエイリアス**: `~/` → `src/`（tsconfig・vite.config 両方定義）

## コマンド

パッケージマネージャ **pnpm**（`package.json` の `packageManager` 参照。README に `bun i` / `bun dev` 記載あるが lock ファイルは `pnpm-lock.yaml`）。

```sh
pnpm i              # 依存インストール
pnpm dev            # 開発サーバー（ポート 3333）
pnpm dev-host       # LAN 公開で開発サーバー
pnpm build          # 本番ビルド（dist/）
pnpm serve          # ビルド結果のプレビュー
npx tsc --noEmit --skipLibCheck   # 型チェック（専用スクリプト無し）
npx biome check .                 # lint + format チェック（専用スクリプト無し）
npx biome check --write .         # lint + format 自動修正
```

型チェック注意（2026-07 時点）:

- `--skipLibCheck` 必須。無いと `@kobalte/core` 型定義が TypeScript 6 と非互換 → node_modules 由来エラー大量発生（tsconfig に `skipLibCheck` 未設定）。
- `--skipLibCheck` 付けても **src 配下に既存型エラー約20件**（`src/routes/channel/[id].tsx`、`src/WS/Message/ReadTimeUpdate.ts`、`ChannelTextInput` 周辺等）。「エラー0件」を合格基準にするな。**変更前後でエラー件数・内容比較 → 自分の変更で新規エラー増やしていないこと**が確認基準。

- テスト無し。テストランナーも未導入。
- Lint/format は Biome（[biome.json](biome.json)）。対象 `**/*.ts`（`src/components/ui` 除外）。ダブルクォート・スペース2幅・行幅80・import 自動整理（`organizeImports`）。`biome-ignore` コメントで個別除外可。npm script 未定義 → `npx biome check .` / `npx biome check --write .` 直接実行。

## 環境変数

`.env.sample` コピーして `.env` 作成。

- `VITE_CORS_ORIGIN` — バックエンド URL（プロキシ先）
- `VITE_PROD_PORT` — `serve-host` 時ポート
- `VITE_PROD_DOMAIN` — プレビュー時許可ドメイン

`__VERSION__` はビルド時 `package.json` の `version` 埋込グローバル定数。

## ディレクトリ構造と役割

- [src/index.tsx](src/index.tsx) — エントリポイント。全ルート定義、テーマ（Kobalte ColorMode）、サイドバー、初期サーバー情報取得。
- [src/api/](src/api/) — REST API ラッパー。共通 fetch 関数＋ドメイン別チェーン API 統一。
  - [src/api/FETCH_CLIENT.ts](src/api/FETCH_CLIENT.ts) — 全エンドポイント共通 fetch 関数。JSON body / FormData body / クエリパラメータ / パスパラメータ吸収。エラーハンドリング（`!res.ok` → `throw new Error(await res.text())`、ネットワークエラー → `{ cause }` 付き Error）もここに集約。
  - [src/api/domains/](src/api/domains/) — `channel.ts` / `message.ts` / `notification.ts` / `role.ts` / `server.ts` / `user.ts` にドメイン別エンドポイント定義。各メソッドは `FETCH_CLIENT` に型・URL・body 当てはめるだけの薄い関数、引数はオブジェクト1個統一（例: `{ channelId: string }`）。メソッド名 camelCase（`delete`, `list`, `getHistory` 等）。
  - [src/api/index.ts](src/api/index.ts) — `export const api = { channel, message, notification, role, server, user }`。呼び出し側 `await api.channel.delete({ channelId })` のようチェーン形式アクセス。
  - **新規エンドポイント追加時**: 該当 `domains/*.ts` 開き既存メソッドと同形式（`FETCH_CLIENT<戻り値型>({ url, method, body?, query?, label })`）でメソッド追加。URL・HTTPメソッド・body キー名はバックエンド実装から正確転記（ファイル名・メソッド名からの推測禁止）。FormData 送信時 `Content-Type` ヘッダ設定しない（`FETCH_CLIENT` が `body instanceof FormData` で自動判定）。
  - 戻り値は `{ message, data }` 形式基本。型は `~/types/` の型（`IChannel`, `IMessage` 等）そのまま参照。
- [src/WS/](src/WS/) — WebSocket まわり。
  - [src/WS/WScontroller.ts](src/WS/WScontroller.ts) — WS 接続確立・再接続・受信メッセージディスパッチ。受信 JSON は `{ signal: string, data: any }` 形式、`signal` 値で `switch` して各ハンドラへ振り分け。
  - サブディレクトリ（`Message` / `Channel` / `Role` / `Server` / `User` / `inbox`）に signal ごとハンドラ。新規 WS シグナル追加時ハンドラファイル作成 → WScontroller の `switch` に登録。
- [src/stores/](src/stores/) — グローバル状態。`solid-js/store` の `createStore` 使用、`export const [storeXxx, setStoreXxx] = createStore(...)` ペア named export 流儀。
  - 主要ストア: `MyUserinfo`（自分の情報＋`getRolePower()` による権限判定）、`ChannelInfo`、`History`（メッセージ履歴）、`Serverinfo`、`Notification`（通知設定・ミュート）、`HasNewMessage`（未読ドット）、`Readtime`（既読時刻）等。
- [src/routes/](src/routes/) — ページコンポーネント。認証必須ページ `/app` 配下で `AuthGuard` に包まれる。チャンネル画面 `/app/channel/:channelId/:messageId?`。
- [src/components/](src/components/) — 機能別コンポーネント。
  - `ui/` — solid-ui 生成プリミティブ（手書き改変最小限）
  - `unique/` — プロジェクト固有汎用部品
  - `Channel/` — チャット画面本体（メッセージ表示・入力・ヘッダー・管理）
- [src/types/](src/types/) — 共有型定義。`IMessage` / `IUser` / `IChannel` / `IRole` / `IServer` のように `I` 接頭辞インターフェース。
- [src/utils/](src/utils/) — 補助関数。`Notify.ts`（ブラウザ通知）、`PushSubscription.ts`（Web プッシュ購読登録）、`InitLoad.ts`（ログイン後初期データ取得）、`ExternalNavigater.ts`（コンポーネント外から router の navigate 呼ぶ仕組み）等。
- [src/sw.ts](src/sw.ts) — Service Worker。プッシュ受信時、Giracle タブ既に開いていれば WS 経由通知に任せ SW 側では通知しない（二重通知防止）。

## 認証・通信の要点

- 認証は Cookie ベース（`GetCookie.ts` 参照）。`AuthGuard` が `/app` 配下保護。
- WS は `token not valid` シグナル受信でエラーフラグ立て再認証フローへ。
- API レスポンスの `message` フィールドはテンプレートリテラル型で固定文字列表現（バックエンドのレスポンス仕様と一致）。

## コーディング規約・慣習

- コメント・UI 文言は日本語。既存コメント密度に合わせる。
- import は `~/` エイリアス＋拡張子付き（例: `import { storeMyUserinfo } from "~/stores/MyUserinfo.ts";`）。
- Solid の反応性を壊さない: props の分割代入をトップレベルでしない、ストア更新は setter か `produce` 使用。
- コンポーネントは基本 default export、ストア・ユーティリティは named export。
- コンポーネント分離時、単一コンポーネントのみ使用なら親コンポーネント名のディレクトリに配置。共通コンポーネントなら `src\components\unique` に配置。
- Interface 頭文字 `I`、type 頭文字 `T`、enum 頭文字 `E`。

## コミット規約

日本語プレフィックス方式:

- `add - ` 新規作成・追加 / `fix - ` 修正 / `change -` 変更・更新 / `remove -` 削除

例: `add - プッシュ通知の実装`、`fix - ポップアップ修正`

## 変更時の確認手順

1. `npx tsc --noEmit --skipLibCheck` で**自分の変更が新規型エラー増やしていない**こと確認（テスト無しのため型チェックが最重要安全網。既存エラー約20件あり0件は基準不可。「コマンド」節注意参照）。
   `npx biome check .` で lint/format 違反も確認（`--write` で自動修正可）。
2. UI 変更はバックエンド起動した上で `pnpm dev` → `http://localhost:3333` で動作確認。
3. PWA / Service Worker 関連変更は `dev-dist/` 生成（gitignore 済み）。SW 挙動はブラウザ DevTools → Application で確認。
4. ビルド通るか `pnpm build` で確認。

## 落とし穴

- React の知識で書くな（`useState` / `useEffect` / `className` 存在しない。再レンダリングモデル根本的に違い、コンポーネント関数は一度しか実行されない）。
- `version` はリリース時 `package.json` で手動更新（`0.x.y-alpha`）。UI 表示に `__VERSION__` 使用。
- `dev-dist/` と `dist/` は生成物。編集禁止。
- API 呼び出しは必ず `~/api/index.ts` の `api` オブジェクト経由（`import { api } from "~/api/index.ts";`）。個別エンドポイントファイル直接 import する旧方式（`~/api/CHANNEL/CHANNEL_DELETE.ts` 等）は 2026-07 リファクタで廃止済み。
- `FETCH_CLIENT` の `query` オプションは `undefined` 値のみ除外して `?key=value` 組立。空文字列除外・クエリ文字列独自構築等挙動変えたい特殊エンドポイント（例: `message.search`）は `domains/*.ts` 内で独自にクエリ文字列組立可。
