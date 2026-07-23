# VimNote

Vim キーバインドで編集する、静的な Markdown メモアプリです。ノートはブラウザの `localStorage` に保存され、サーバーには送信されません。

## 起動

```sh
python3 -m http.server 4173
```

その後 `http://localhost:4173` を開いてください。

## 主な機能

- CodeMirror の Vim モード（`jj` で Esc、`/` 検索、`:w` 保存）
- Markdown シンタックスハイライトとプレビュー
- 自動保存、検索、ピン留め、タグ、Markdown エクスポート
- Sarasa Term J を全UIとエディターに使用
- Tailwind CSS を使ったレスポンシブ UI
