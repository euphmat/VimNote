# VimNote

Vim キーバインドで編集する、静的な Markdown メモアプリです。ノートはブラウザの `localStorage` に保存され、サーバーには送信されません。

The app starts with a blank workspace and uses English throughout the interface.

## 起動

```sh
python3 -m http.server 4173
```

その後 `http://localhost:4173` を開いてください。

## 主な機能

- CodeMirror の Vim モード（`jj` で Esc、`/` 検索、`:w` 保存）
- Markdown シンタックスハイライトとプレビュー
- 先頭行の `# Heading` と同期するノートタイトル（独立したタイトル欄なし）
- 自動保存、検索、ピン留め、階層フォルダ管理、Markdown エクスポート
- ノート専用右クリックメニュー（ピン留め・複製・移動・書き出し・削除）
- 保存可能な Comfortable / Compact ノート一覧表示
- ドラッグ＆ドロップによるフォルダ移動
- 12色のパレットによるフォルダカラー設定
- 専用右クリックメニューによるサブフォルダ作成・名前変更・複製・削除
- 保存可能な折り畳み状態を持つコンパクトなフォルダーツリー
- ページ全体を固定し、フォルダー・ノート・エディターに限定した内部スクロール
- ブラウザの推定ストレージ残量・使用量表示
- 保存可能なサイドバー表示状態と `⌘/Ctrl + B` 切り替え
- Sarasa Term J を全UIとエディターに使用
- ダークモードを含む10種類の保存可能なカラーテーマ
- ブランドに合わせた SVG favicon
- Tailwind CSS を使ったレスポンシブ UI
