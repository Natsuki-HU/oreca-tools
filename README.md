# ORECA Tools

GitHub Pages で公開できる静的Webアプリです。サーバー処理や外部ライブラリは不要です。

## 現在の機能

- ダメージ計算
  - 攻撃力
  - 攻撃バフ・デバフ 最大10個
  - 属性倍率 最大2個
  - 技倍率
  - ヒット数
  - アンデッド補正
  - 防御バフ・デバフ 最大10個
  - ダメージ軽減 最大5個
  - 最低ダメージ / 最高ダメージ

- 撃破確率計算（初期実装）
  - 敵HP・属性・素早さ
  - 味方1～3体の攻撃力・素早さ
  - 複数ターン／複数攻撃
  - 攻撃力・素早さバフ／デバフ
  - 敵防御ダウン
  - 毒・猛毒
  - 敵回復
  - 素早さによる行動順
  - 最後の味方行動までの撃破確率

## GitHub Pagesで公開

1. このフォルダの中身をGitHubリポジトリのルートへアップロード
2. GitHubのリポジトリで `Settings` → `Pages`
3. `Build and deployment` の Source を `Deploy from a branch`
4. Branchを `main`、Folderを `/(root)` にして Save
5. 表示された `https://ユーザー名.github.io/リポジトリ名/` を開く

相対パスだけを使っているため、GitHub PagesのプロジェクトURL配下でも動作します。

## 更新時

確認→修正を繰り返す前提で、Service Workerはオンライン時に新しいファイルを優先する network-first にしています。
バージョン更新時は、以下も更新します。

- `package.json` の version
- `assets/version.js`
- `service-worker.js` の CACHE_NAME
- `CHANGELOG.md`

## ローカルテスト

Node.jsがある場合、追加ライブラリ不要で計算エンジンの回帰テストを実行できます。

```bash
npm test
```

HTMLをローカル確認する場合は、ES Modulesのため `file://` 直接開きではなく簡易HTTPサーバーを推奨します。

例:

```bash
python -m http.server 8000
```

その後 `http://localhost:8000/` を開きます。
