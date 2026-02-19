# マインスイーパーMVP 詳細設計

## 0. 目的と前提
- 本書は `minesweeper_MVP/basic_design.md` を実装可能な粒度に分解した詳細設計である。
- 実装対象はフロントエンドのみ。外部連携・バックエンド連携は行わない。
- 採用ライブラリは `@maxxam0n/minesweeper-engine` とする。
- 起動トリガーは「サイドバー最上部の『Giracle』文字」とする。
- 本書でいう「サービス名」は、サイドバー最上部の「Giracle」文字を指す。

## 1. 仕様確定事項
### 1.1 難易度定義
- `easy`: 9 x 9, 地雷 10
- `kyoyo`: 30 x 30, 地雷 150
- 表示名マッピング: `easy` は `Easy`、`kyoyo` は `教養` として表示する。

### 1.2 再スタート仕様
- 勝利または敗北時のみ、ゲーム状態表示のアイコンをクリックして再スタートできる。
- 再スタート時は現在の難易度設定を維持して新規ゲームを開始する。

### 1.3 ポップアップ開閉時の状態保持
- ポップアップを閉じてもゲーム状態は保持する。
- 再表示時は閉じる前の状態から再開する。
- 難易度変更または再スタート時のみゲーム状態を初期化する。

## 2. 画面構成（実装単位）
### 2.1 MinesweeperTrigger
- 責務: サービス名のクリック受付。
- 入力: なし。
- 出力: `toggleOpen` イベント発火。

### 2.2 Minesweeperのポップアップ画面
- 責務: 開閉管理、外側クリックで閉じる、内側の閉じる導線提供。
- 表示要素: 難易度トグルスイッチ、盤面、ゲーム状態表示（プレイ中 / 勝利 / 敗北）
- 入力: `isOpen`, `difficulty`, `gameState`
- 出力: `requestClose`, `changeDifficulty`, `openCell`, `toggleFlag`, `restart`

### 2.3 Minesweeper本体
- 責務: 盤面セルの描画と操作入力受付。
- 操作: 左クリックでセル開封、右クリックでフラグ切替（PC）、長押しでフラグ切替（モバイル）

### 2.4 ゲーム状態表示
- 責務: ゲーム状態表示。
- クリック動作: `won` または `lost` の場合のみ `restart` を発火し、`playing` の場合はクリック無効。
- アイコンマッピング（`@tabler/icons-solidjs`）:
- `playing`: `IconMoodSmileFilled`
- `lost`（爆弾を踏んだ）: `IconMoodWrrrFilled`
- `won`（成功）: `IconRocket`

## 3. 状態設計
### 3.1 UI状態
- `isOpen: boolean`
- ポップアップ表示状態。
- `difficulty: 'easy' | 'kyoyo'`
- 現在の難易度。
- `isFlagModeMobile: boolean`
- モバイル操作補助（必要時のみ有効化）。

### 3.2 ゲーム状態
- `status: 'playing' | 'won' | 'lost'`
- `rows: number`
- `cols: number`
- `mines: number`
- `remainingMines: number`
- 意味: `mines - flaggedCount`。画面上の「残り地雷数」表示に使う。
- `cells: CellViewModel[][]`
- 意味: 盤面をそのまま描画できる2次元配列（行・列でアクセス）。

### 3.3 CellViewModel
- 意味: 1セル分の描画に必要な情報をまとめたUI向けデータ。
- `row: number`
- `col: number`
- `revealed: boolean`
- `flagged: boolean`
- `adjacentMines: number`
- `isMine: boolean`（敗北後またはデバッグ時に使用）

## 4. 状態遷移
| 現在状態 | イベント | 次状態 | 備考 |
| --- | --- | --- | --- |
| Popup Closed | サービス名クリック | Popup Open | 既存ゲーム状態を表示 |
| Popup Open | サービス名クリック | Popup Closed | ゲーム状態保持 |
| Popup Open | 外側クリック | Popup Closed | ゲーム状態保持 |
| Popup Open | 内側閉じる導線クリック | Popup Closed | ゲーム状態保持 |
| Playing | セル開封 | Playing/Won/Lost | エンジン判定に従う |
| Playing | フラグ切替 | Playing | 地雷残数表示更新 |
| Any | 難易度変更 | Playing | 新規ゲーム開始 |
| Won/Lost | 状態表示クリック | Playing | 同難易度で再スタート |

## 5. イベント詳細
### 5.1 開閉イベント
- `toggleOpen()`
- 呼び出し元: サービス名クリック
- 動作: `isOpen = !isOpen`

- `requestClose()`
- 呼び出し元: 外側クリック、内側導線、サービス名再クリック
- 動作: `isOpen = false`

### 5.2 難易度イベント
- `changeDifficulty(nextDifficulty)`
- 動作:
1. `difficulty` を更新
2. 新しい設定でエンジンを再生成
3. `status = playing` で開始

### 5.3 セル操作イベント
- `openCell(row, col)`
- 事前条件: `status === playing`
- 動作: エンジンのセル開封APIを実行し、`gameState` を再同期

- `toggleFlag(row, col)`
- 事前条件: `status === playing`
- 動作: エンジンのフラグ切替APIを実行し、`gameState` を再同期

### 5.4 再スタートイベント
- `restartGame()`
- 事前条件: `status === won || status === lost`
- 動作: 同一難易度でエンジン再生成、`status = playing`

## 6. エンジン連携設計
### 6.1 連携方針
- ライブラリAPIを直接UIへ露出しない。
- `MinesweeperController`（またはHook）を介してUIへ必要情報のみ渡す。

### 6.2 MinesweeperController責務
- 難易度に応じたエンジン初期化。
- `openCell` / `toggleFlag` / `restartGame` の窓口。
- エンジンスナップショットから `CellViewModel[][]` への変換。
- `remainingMines`、`status` の導出。

### 6.3 例外時の扱い
- エンジン初期化失敗時は、ポップアップ内に「ゲームの初期化に失敗しました」を表示する。
- 再試行導線（再読み込み不要）を表示する。

## 7. 操作デバイス別仕様
### 7.1 デスクトップ
- 左クリック: 開封
- 右クリック: フラグ切替
- 盤面上のコンテキストメニューは抑止する。

### 7.2 モバイル
- タップ: 開封
- 長押し（350ms）: フラグ切替
- 長押し中はスクロール誤操作を防止する。

## 8. レイアウト仕様
- ポップアップはビューポートを超えない最大サイズを持つ。
- `30 x 30` の盤面はスクロール可能領域で表示する。
- 最小幅環境でも難易度選択と状態表示が視認できる配置を維持する。

## 9. 非機能詳細
- 操作応答: セル開封/フラグ切替後、視覚更新が体感で遅れないこと（目標: 100ms以内）。
- 安定性: ポップアップ開閉を連続実行してもエラーなく動作すること。
- 既存機能非干渉: チャット入力、送信、スクロール操作へ副作用を出さないこと。

## 10. 受け入れテスト観点（詳細）
### 10.1 開閉
- サービス名クリックで開く、再クリックで閉じる。
- 外側クリックで閉じる。
- 内側閉じる導線で閉じる。

### 10.2 プレイ
- `easy` と `教養` の2難易度で開始できる。
- 開封とフラグが想定通り動作する。
- 勝利/敗北が状態表示に反映される。

### 10.3 再スタート
- 勝利/敗北時に状態表示クリックで再スタートできる。
- `playing` 中は状態表示クリックで再スタートしない。

### 10.4 状態保持
- ポップアップを閉じて再度開くと同じゲーム状態が表示される。

## 11. 実装前確認事項
- モバイル長押し時間（現案350ms）の妥当性。

## 12. テスト方針
- 本プロジェクトは既存で自動テスト基盤/テスト運用が整備されていないため、今回のMVPでは自動テストコードを新規追加しない。
- 品質確認は本書「10. 受け入れテスト観点（詳細）」に基づく手動確認で実施する。
