# 汎用プレゼンテーションビューア

**設定可能でインタラクティブなHTMLスライドプレゼンテーションアプリケーション**

あらゆる種類のHTMLスライドに対応し、豊富な操作機能を提供する汎用性の高いプレゼンテーションツールです。
教育、ビジネス、個人利用など幅広い用途に対応します。

[🇺🇸 English README](README.md)

## 特徴

### 基本機能
- 📁 **HTMLスライドの自動検出** - フォルダ内のHTMLファイルを自動認識
- ✨ **スムーズなスライド遷移** - ディゾルブエフェクト付き
- 📱 **レスポンシブデザイン** - 画面サイズに自動対応
- ⌨️ **豊富なキーボードショートカット**
- 🖥️ **フルスクリーン表示対応**
- 📋 **スタンドアローンアプリ** - Electronベース

### インタラクティブ機能
- 🔍 **右クリックズーム** - マウス位置中心の2倍拡大
- 🎨 **リアルタイム描画** - マウスドラッグで線を描画、自動フェード
- 🖱️ **ズーム時スクロール** - ホイールで表示範囲を移動
- 👀 **カスタムマウスカーソル** - 軌跡付きの視認性向上

### カスタマイズ性
- ⚙️ **設定ファイル対応** - JSON設定でフル customization
- 🎨 **テーマ設定** - 色、サイズ、動作をカスタマイズ
- 📂 **柔軟なファイル構成** - 任意のスライド配置に対応

## クイックスタート

### 必要な環境
- Node.js (v16以上推奨)
- npm または yarn

### インストールと実行

1. **プロジェクトの準備**
```bash
# 依存関係のインストール
npm install

# 設定ファイルの確認（必要に応じて編集）
# config.json を編集してカスタマイズ
```

2. **スライドの準備**
```bash
# スライドフォルダを作成（例）
mkdir slides

# HTMLスライドファイルを配置
# 01.html, 02.html, 03.html...
# または slides-example フォルダを参考にしてください
```

3. **アプリケーションの起動**
```bash
# 開発環境で実行
npm run dev

# 本番環境で実行
npm start
```

## ビルド

### すべてのプラットフォーム用にビルド
```bash
npm run build
```

### プラットフォーム別ビルド
```bash
# macOS用
npm run build:mac

# Windows用
npm run build:win

# Linux用
npm run build:linux
```

ビルドされたファイルは `dist/` フォルダに生成されます。

## 操作方法

### キーボードショートカット

**スライド操作**
- `→` / `Space`: 次のスライド
- `←`: 前のスライド
- `Home`: 最初のスライド
- `End`: 最後のスライド

**表示操作**
- `F11` / `Ctrl+Cmd+F` (Mac): フルスクリーン切り替え
- `Escape`: フルスクリーン終了
- `+` / `=`: ズームイン
- `-` / `_`: ズームアウト
- `0`: ズームリセット

**アプリ操作**
- `Ctrl+R` / `Cmd+R`: 再読み込み
- `Ctrl+Q` / `Cmd+Q`: アプリ終了

### マウス操作

**基本操作**
- 画面下部のコントロールボタンでナビゲーション
- フルスクリーンボタンで全画面表示

**インタラクティブ機能**
- **右クリック**: 2倍ズーム/ズーム解除（マウス位置中心）
- **左クリック+ドラッグ**: 線の描画（3秒後に自動フェード）
- **ホイール（ズーム時）**: 表示範囲の上下スクロール
- **カスタムカーソル**: 赤色カーソルと軌跡表示

## ファイル構成

```
プロジェクトフォルダ/
├── main.js              # Electronメインプロセス
├── preload.js           # プリロードスクリプト
├── presentation.html    # メインアプリケーション
├── config.json          # 設定ファイル（カスタマイズ可能）
├── package.json         # プロジェクト設定
├── slides/              # スライドフォルダ（設定可能）
│   ├── 01.html
│   ├── 02.html
│   └── ...
├── slides-example/      # サンプルスライド
└── dist/               # ビルド出力フォルダ
```

## カスタマイズ

### 設定ファイル (config.json)

```json
{
  "presentation": {
    "title": "My Presentation",
    "slideDirectory": "./slides",
    "autoDetectSlides": true,
    "totalSlides": null
  },
  "ui": {
    "theme": {
      "backgroundColor": "#0a192f",
      "primaryColor": "#3b82f6"
    },
    "cursor": {
      "enabled": true,
      "color": "#ff0000",
      "size": 20
    }
  },
  "zoom": {
    "enabled": true,
    "factor": 2,
    "maxZoom": 3,
    "scrollSensitivity": 30
  },
  "drawing": {
    "enabled": true,
    "lineColor": "#ff0000",
    "lineWidth": 3,
    "fadeTimeout": 3000
  }
}
```

### スライドの作成

**HTMLスライドテンプレート**
```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <title>スライドタイトル</title>
    <style>
        .slide-container {
            width: 1280px;
            height: 720px;
            /* あなたのスタイル */
        }
    </style>
</head>
<body>
    <div class="slide-container">
        <!-- スライドコンテンツ -->
    </div>
</body>
</html>
```

**自動スライド検出**
- `autoDetectSlides: true` で01.html〜99.htmlを自動検出
- `slideDirectory` でスライドフォルダを指定可能
- ファイル名は連番（01.html, 02.html...）が推奨

## 技術仕様

### コア技術
- **フレームワーク**: Electron (クロスプラットフォーム)
- **フロントエンド**: HTML5, CSS3, Vanilla JavaScript
- **レンダリング**: CSS Transform + Canvas API
- **設定管理**: JSON設定ファイル

### 対応環境
- **OS**: Windows, macOS, Linux
- **Node.js**: v16以上
- **ブラウザ**: Chromium (Electron内蔵)
- **スライド形式**: HTML, HTM

### パフォーマンス最適化
- ResizeObserver による効率的なリサイズ対応
- スロットリングされたマウストラッキング
- 非同期スライド読み込み
- メモリ効率的な描画管理

## トラブルシューティング

### スライドが表示されない

**原因と対処法**
1. **ファイルが見つからない**
   ```bash
   # スライドファイルの存在確認
   ls slides/  # または ls *.html
   ```

2. **設定ファイルの問題**
   ```bash
   # config.jsonの構文チェック
   node -e "console.log(JSON.parse(require('fs').readFileSync('config.json')))"
   ```

3. **権限エラー**
   ```bash
   # ファイル権限の確認
   chmod 644 *.html slides/*.html
   ```

### 描画機能が動作しない

**確認事項**
- `config.json` で `"drawing.enabled": true` になっているか
- ブラウザの開発者ツール（F12）でエラーを確認
- Canvas APIがサポートされているか

### パフォーマンス問題

**最適化方法**
- 大きな画像ファイルを最適化（WebP形式推奨）
- `config.json` で不要な機能を無効化
- スライド数を調整（推奨: 50スライド以下）

### インストール問題

```bash
# 依存関係の完全再インストール
rm -rf node_modules package-lock.json
npm install

# Electronの再ビルド
npm run rebuild
```

## 貢献

### 機能要望・バグレポート
Issueを作成してお知らせください。

### 開発への参加
1. フォークを作成
2. 機能ブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 使用例

### 教育機関での利用
- 授業用プレゼンテーション
- 学会発表
- オンライン講義

### ビジネス用途
- 企業プレゼンテーション
- 製品デモ
- トレーニング資料

### 個人利用
- ポートフォリオ展示
- 写真スライドショー
- 個人プロジェクトの発表

## ライセンス

MIT License - 詳細は LICENSE ファイルを参照してください。