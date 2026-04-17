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
| `/simple-gui/` | Simple GUI（lil-gui 簡易版 GUI ライブラリ デモ） |
| `/simple-gui-sheet/` | Simple GUI Sheet（ボトムシート型 GUI ライブラリ デモ） |
| `/simple-gui-pill/` | Simple GUI Pill（ピル型 GUI ライブラリ デモ） |
| `/simple-gui-tab/` | Simple GUI Tab（タブバー型 GUI ライブラリ デモ） |
| `/simple-gui-grid/` | Simple GUI Grid（グリッドタイル型 GUI ライブラリ デモ） |
| `/strange-attractor/` | Strange Attractor（Lorenz アトラクター、Simple GUI Grid 適用例） |
| `/firefly-sync/` | Firefly Sync（蔵本モデルで群れが同期して明滅する蛍） |
| `/wave-interference/` | Wave Interference（複数波源が重なる同心円波の干渉パターン） |
| `/penrose-tiling/` | Penrose Tiling（黄金比で分割されるペンローズタイル） |
| `/voronoi-mosaic/` | Voronoi Mosaic（ランダム点群から生成するボロノイ分割モザイク） |
| `/fractal-tree/` | Fractal Tree（再帰的に枝分かれするフラクタルの木） |
| `/spirograph-engine/` | Spirograph Engine（ハイポ/エピサイクロイドで描くスピログラフ） |
| `/erosion-landscape/` | Erosion Landscape（雨粒の侵食で変化する地形シミュレーション） |
| `/magnetic-field-lines/` | Magnetic Field Lines（N/S 極の配置から描く磁力線ビジュアル） |
| `/crystal-growth/` | Crystal Growth（DLA 風に結晶が枝分かれしながら成長する） |
| `/smoke-plume/` | Smoke Plume（ゆらぎながら立ち昇る煙の流体風シミュレーション） |
| `/tessellation-lab/` | Tessellation Lab（正多角形タイルの敷き詰めパターン生成・変形） |
| `/julia-set-explorer/` | Julia Set Explorer（ジュリア集合をリアルタイムに探索するフラクタル） |
| `/l-system-garden/` | L-System Garden（L-System で生成する植物・樹木のフラクタル） |
| `/recursive-subdivision/` | Recursive Subdivision（矩形を再帰分割するモンドリアン風の構図） |
| `/sierpinski-variants/` | Sierpinski Variants（シェルピンスキー三角形/カーペットのフラクタル） |
| `/galaxy-spiral/` | Galaxy Spiral（腕を持つ渦巻銀河の星々が回転するビジュアル） |
| `/particle-life/` | Particle Life（色別粒子の引力・斥力から生まれる自己組織化） |
| `/waveform-sculptor/` | Waveform Sculptor（サイン波の重ね合わせで描くリサージュ波形） |
| `/rhythm-grid/` | Rhythm Grid（BPM 同期で点滅するステップシーケンサー風グリッド） |
| `/gradient-mesh/` | Gradient Mesh（メッシュ頂点の色から補間する滑らかなグラデーション） |
| `/ink-diffusion/` | Ink Diffusion（墨汁がにじみ広がる拡散シミュレーション） |
| `/islamic-geometry/` | Islamic Geometry（星形の回転対称で敷き詰めるイスラム幾何学模様） |
| `/swarm-intelligence/` | Swarm Intelligence（アリのフェロモントレイルから生まれる自己組織化） |
| `/cymatics/` | Cymatics（振動モード (m,n) で現れるクラドニ図形の砂模様） |
| `/double-pendulum-chaos/` | Double Pendulum Chaos（二重振り子の軌跡が描くカオス的感度依存性） |
| `/cantor-dust/` | Cantor Dust（区間を繰り返し分割して残すカントール塵） |

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
