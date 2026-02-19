# マインスイーパーMVP ライブラリ調査（2026-02-19）

## 決定事項
- 2026-02-19: 採用ライブラリは `@maxxam0n/minesweeper-engine` とする。

## 調査目的
- SolidJS ベースの既存プロジェクトに、MVP要件（プレイ可能・表示/非表示・難易度2段階）を満たす実装を最短で載せる。

## 前提
- 既存プロジェクトは `solid-js@1.9.11`。
- UI側には `@kobalte/core` が既に導入済み（表示/非表示のポップアップ実装に利用可能）。

## 候補一覧（npm検索ベース）
- `@maxxam0n/minesweeper-engine`（ロジック）
- `minesweeper-redux`（ロジック、Redux前提）
- `minesweeper`（ロジック、旧）
- `mine-sweeper-tag`（Web Component UI）
- `minesweeper-for-web`（Web Component UI）
- `mindsweeper`（ロジック）

## 比較結果
| package | 種別 | 最新公開日 | 直近週DL* | 型定義 | 依存 | GitHub最終push | 判定 |
| --- | --- | --- | ---: | --- | --- | --- | --- |
| `@maxxam0n/minesweeper-engine` | ロジック | 2026-01-28 | 12 | あり | なし | 2026-01-28 | 採用候補A |
| `minesweeper-redux` | ロジック | 2023-09-22 | 55 | あり | なし | 2023-09-24 | 採用候補B |
| `minesweeper` | ロジック | 2015-10-07 | 12 | なし | なし | 2015-10-07 | 非推奨 |
| `mine-sweeper-tag` | UI(Web Component) | 2023-01-15 | 133 | なし | `vue` | 2023-01-15 | 非推奨 |
| `minesweeper-for-web` | UI(Web Component) | 2022-12-15 | 38 | あり | `lit` | 2024-01-30 | 条件付き候補 |
| `mindsweeper` | ロジック | 2023-03-07 | 21 | あり | `ts-node-dev` | (repo情報なし) | 非推奨 |

\* `last-week` は 2026-02-11 〜 2026-02-17 の npm API 値。

## 所見
### 1) `@maxxam0n/minesweeper-engine`
- 良い点: 更新が新しい（2026-01-28）、TypeScript型あり、依存なし、UI非依存で Solid へ組み込みやすい。
- 注意点: 採用実績（DL/スター）がまだ小さい。GitHub API上で license が `null`（npm上は MIT 表記）なので、導入時に LICENSE ファイルを目視確認した方が安全。

### 2) `minesweeper-redux`
- 良い点: 型あり、難易度生成ヘルパーあり、実績は候補内で比較的多い。
- 注意点: Redux前提の設計。Solid に素直に載せるには抽象が重い。npmでは ISC、repoはMIT表示でメタ情報に差分あり（法務厳格なら確認推奨）。

### 3) Web Component系（`mine-sweeper-tag` / `minesweeper-for-web`）
- 良い点: UI込みで最速導入できる。
- 注意点: 見た目や操作を既存UIと馴染ませる自由度が低い。`mine-sweeper-tag` は `vue` 依存（重い）。`minesweeper-for-web` は `lit` 依存で、既存の Solid コンポーネント思想と分離される。

## 推奨
### 推奨1（本命）
- `@maxxam0n/minesweeper-engine` をロジック層として採用。
- 盤面描画と操作UIは Solid コンポーネントとして自作。
- 表示/非表示は既存 `@kobalte/core` の `Popover` or `Dialog` で実装。

### 推奨2（短期MVP最優先）
- `minesweeper-for-web` を暫定採用し、ポップアップ内へWeb Componentを埋め込む。
- 後続でSolidネイティブ実装へ置換する前提を置く。

## 不採用推奨
- `minesweeper`（古すぎる、型なし）
- `mine-sweeper-tag`（Vue依存）
- `mindsweeper`（repo不明 + `ts-node-dev` を runtime dependency に持つ）

## 再現コマンド（実施済み）
```powershell
npm search minesweeper --json
npm search solid minesweeper --json
npm view @maxxam0n/minesweeper-engine version time license dependencies types repository --json
npm view minesweeper-redux version time license dependencies types repository --json
npm view minesweeper version time license dependencies types repository --json
npm view mine-sweeper-tag version time license dependencies repository --json
npm view minesweeper-for-web version time license dependencies types repository --json
npm view mindsweeper --json
```

```powershell
Invoke-RestMethod https://api.npmjs.org/downloads/point/last-week/<package>
Invoke-RestMethod https://api.github.com/repos/<owner>/<repo>
```
