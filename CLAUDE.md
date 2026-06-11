# atelier.yuske.app

## プロジェクト概要

Vite で静的配信する個人サイト。HTML / CSS / JS のみで構成し、フレームワークは使用しない。

## ディレクトリ構成

```
.
├── CLAUDE.md            # Claude Code 用の指示ファイル
├── biome.json           # Biome（リンター/フォーマッター）設定
├── eslint.config.mjs    # ESLint（非推奨 API 検出）設定
├── jsconfig.json        # JS の型チェック設定
├── package.json
├── playwright.config.js # Playwright（E2E テスト）設定
├── docs/                # 設計メモ・仕様・ガイド
│   └── README.md
├── tests/               # Playwright E2E テスト（*.spec.js）
└── public/              # 静的ファイル（Vite で配信）
    ├── index.html
    ├── template/        # 新規ページ作成用テンプレート
    └── ...
```

## 開発ガイド

### コマンド一覧

| コマンド | 説明 |
| --- | --- |
| `pnpm run dev` | 開発サーバー起動（Vite、フォアグラウンド） |
| `pnpm run dev:bg` | 開発サーバーをバックグラウンドで起動（PID 管理付き） |
| `pnpm run dev:status` | 開発サーバーの稼働状態を確認 |
| `pnpm run dev:stop` | バックグラウンドの開発サーバーを停止 |
| `pnpm run check` | lint チェック（Biome + ESLint） |
| `pnpm run format` | lint/format の自動修正（Biome） |

### 開発サーバー

```bash
pnpm run dev        # フォアグラウンドで起動
pnpm run dev:bg     # バックグラウンドで起動（推奨）
pnpm run dev:status # 稼働状態を確認
pnpm run dev:stop   # 停止
```

`public/` ディレクトリをルートとして配信する。

バックグラウンド起動時は `.vite.pid` で PID を管理する。Claude Code など非対話環境では `dev:bg` / `dev:stop` を使うこと。

### lint / format

```bash
pnpm run check    # チェックのみ
pnpm run format   # 自動修正
```

### テスト

```bash
npx playwright test        # E2E テスト
npx playwright test --ui   # UI モードで実行
```

テストファイルは `tests/` に `*.spec.js` 形式で配置する。

## ページ追加手順

1. `public/` 配下に HTML ファイルを作成する
2. 必要に応じて CSS / JS ファイルを同ディレクトリに配置する
3. トップページ（`public/index.html`）からリンクを追加する

## コーディング規約

- インデント: スペース 2 つ
- JS クォート: シングルクォート
- Biome の recommended ルールに従う
- ESLint の `@typescript-eslint/no-deprecated` で非推奨 API を検出する
- JS ファイルの先頭に `// @ts-check` を記述する
- `jsconfig.json` で `strict: true` / `checkJs: true` を有効化済み
- 日本語でコメント・ドキュメントを記述する
- CSS では `px` を使わず相対単位（`rem`, `em`, `%` 等）を使用する
- 細線は `0.0625rem`（= 1px 相当）を使用する
