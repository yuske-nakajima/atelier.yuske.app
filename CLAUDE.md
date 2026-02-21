# atelier.yuske.app

## プロジェクト概要

Vite で静的配信する個人サイト。HTML / CSS / JS のみで構成し、フレームワークは使用しない。

## ディレクトリ構成

```
.
├── CLAUDE.md          # Claude Code 用の指示ファイル
├── biome.json         # Biome（リンター/フォーマッター）設定
├── jsconfig.json      # JS の型チェック設定
├── package.json
├── docs/              # 設計メモ・仕様・ガイド
│   └── README.md
└── public/            # 静的ファイル（Vite で配信）
    ├── index.html
    └── ...
```

## 開発ガイド

### コマンド一覧

| コマンド | 説明 |
| --- | --- |
| `npm run dev` | 開発サーバー起動（Vite） |
| `npm run check` | lint チェック（Biome） |
| `npm run format` | lint/format の自動修正（Biome） |

### 開発サーバー

```bash
npm run dev
```

`public/` ディレクトリをルートとして配信する。

### lint / format

```bash
npm run check    # チェックのみ
npm run format   # 自動修正
```

## ページ追加手順

1. `public/` 配下に HTML ファイルを作成する
2. 必要に応じて CSS / JS ファイルを同ディレクトリに配置する
3. トップページ（`public/index.html`）からリンクを追加する

## コーディング規約

- インデント: スペース 2 つ
- JS クォート: シングルクォート
- Biome の recommended ルールに従う
- `jsconfig.json` で `strict: true` / `checkJs: true` を有効化済み
- 日本語でコメント・ドキュメントを記述する
