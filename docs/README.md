# docs

設計メモ・仕様・ガイドの置き場。

## ページ一覧

| パス | 概要 |
| --- | --- |
| `/` | トップページ（ダーク/ライト切り替え付き） |
| `/t8-random-pattern/` | T-8 Random Pattern Switcher（ランダムパターン生成） |
| `/voxel-walker/` | Voxel Walker（天気連動ジェネラティブアート壁紙） |
| `/voxel-explorer/` | Voxel Explorer（天気連動ドラクエ風俯瞰ジェネラティブアート） |
| `/earth-orbit-simulator/` | Earth Orbit Simulator（地球軌道シミュレーター） |
| `/midi-vj/` | MIDI VJ（MIDI キーボードで操作するビジュアルジョッキー） |

## トップページ仕様

- ダーク/ライトモード切り替え（ボタン1つでトグル）
- `prefers-color-scheme` で初期テーマを検出、`localStorage` に保存
- CSS 変数 + `[data-theme]` 属性で切り替え
- shadcn/ui ベースのデザインシステム（CSS 変数によるテーマ管理）
- FOUC 防止のためインラインスクリプトで CSS 読み込み前にテーマ適用

### デザインシステム

shadcn/ui の CSS 変数体系をバニラ CSS で再実装：

- `--background` / `--foreground`: 基本の背景色・文字色
- `--card` / `--card-foreground`: カードコンポーネント用
- `--primary` / `--primary-foreground`: プライマリアクション用
- `--muted` / `--muted-foreground`: 補助テキスト用
- `--accent` / `--accent-foreground`: ホバー・アクティブ状態用
- `--border`: ボーダー色
- `--ring`: フォーカスリング色
- `--radius`: 角丸の基準値

### CSS ユニット規約

- `px` は使用せず、相対単位（`rem`, `em`, `%` 等）を使用する
- `body` の `font-size` は `100%`（ブラウザデフォルト 16px 相当）を基準とする
- ボーダー等の細線は `0.0625rem`（= 1px 相当）を使用する

## ディレクトリ構成

```
docs/
└── README.md   # このファイル
```

必要に応じてカテゴリごとにファイルを追加する。
