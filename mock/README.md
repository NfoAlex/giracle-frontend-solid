# Mock プレビュー環境

バックエンドなしでフロントエンドの挙動を確認するためのモック環境。
既存の `index.html` / `src/` / Tailwind 設定をそのまま使い、`/api/*` と `/ws` を
Vite dev server 上のモック（connect middleware + WebSocket）で同一オリジンに供給する。
`src/` には一切手を入れていない。

## 起動

リポジトリルートで実行する（Tailwind の `content` glob が CWD 基準のため）。

```sh
pnpm vite --config mock/vite.config.ts
# → http://localhost:4444
```

ポートは `4444` 固定（`strictPort`）。PWA / Service Worker は干渉防止のため無効。

## ログイン

ユーザーは 6 人、パスワードは全員 `pass`。

| ユーザー | ロール | 参加チャンネル |
|---|---|---|
| `alice` | HOST（全権限） | 全 5 チャンネル |
| `bob` | MEMBER | 一般 / 雑談 / 開発談義 / アナウンス |
| `carol` | — | 一般 / 雑談 / 開発談義 |
| `dave` | — | 一般 / アナウンス |
| `eve` | — | 一般 / 雑談 |
| `frank` | — | 一般 |

別ユーザーでの確認はシークレットウィンドウなど、Cookie が分かれる環境で行う
（`token` Cookie は HttpOnly / SameSite=Lax）。

## 構成

```
mock/
  README.md
  vite.config.ts      # root=リポジトリルート, port 4444, モック plugin を登録
  mock/
    server.ts         # /api/* のルーティングと Cookie 認証 (Vite plugin)
    ws.ts             # /ws の WebSocket モック
    http.ts           # Ctx / Route 型と JSON・Cookie ヘルパ
    store.ts          # インメモリ DB とシリアライザ（src/types をそのまま使用）
    data.ts           # シードデータ
    routes/
      user.ts         # user / role / server / notification
      channel.ts      # channel の一覧・履歴・参加・管理等
      message.ts      # message の送信・編集・削除・リアクション・inbox 等
```

- 成功応答は `{ message, data }`、失敗はプレーンテキスト + 非 2xx
  （`src/api/FETCH_CLIENT.ts` の契約に合わせている）。
- 認証は Cookie `token`。`/api/user/sign-in`・`/api/user/sign-up`・`/api/server/config` のみ認証不要。
- 更新系 API は `src/WS/WScontroller.ts` と同じ signal 名で WS に broadcast する
  （`message::SendMessage` / `message::UpdateMessage` / `message::MessageDeleted` /
  `message::AddReaction` / `message::DeleteReaction` / `message::ReadTimeUpdated` /
  `inbox::Added` / `channel::Join` / `channel::Left` / `channel::UpdateChannel` 等）。
- WS はクライアントの 20 秒毎 `ping` に `pong` を返す。無効 token には
  `{"signal":"ERROR","data":"token not valid"}` を送って切断する。

## シード内容

- チャンネル 5 個（一般 / 雑談 / 開発談義 / アナウンス / イベント）。
  アナウンスは MEMBER 以上、イベントは HOST のみ閲覧可。
- メッセージは各チャンネル 30 件以上。通常文・長文・改行・英日混在・編集済み・返信・
  システムメッセージ・URL プレビュー・画像/PDF 添付・リアクション・メンションを含む。
- メンションは `inbox` に入り、サイドバーの通知件数に反映される。
- 初回履歴は最大 50 件返す（既読時間の読込直後でも 30 件以上表示させるため）。
  以降は `messageIdFrom` + `fetchDirection` でページングする。

## 制約

- データはメモリのみ。dev server 再起動（`mock/` 配下のファイル編集による Vite の
  自動再起動を含む）で初期化され、ログインセッションも消える。
- 添付ファイルの実バイナリは保存しない。アップロードは
  `{ data: { fileId: { id } } }` を返すだけ、画像取得は 1x1 PNG を返す。
- アイコン / バナー / カスタム絵文字は SVG プレースホルダ。
- bot・招待・ログ・Web Push は空データを返す最小実装。
- モックに無い `/api/*` は 404 `Not implemented in mock` を返す。
