# ORECA Tools

GitHub Pages で公開できる静的Webアプリです。サーバー処理や外部ライブラリは不要です。

## 現在の機能

- ダメージ計算
  - 攻撃力・攻撃補正
  - 属性・技倍率・ヒット数
  - アンデッド補正
  - 防御補正・ダメージ軽減
  - 最低ダメージ / 最高ダメージ

- 撃破確率計算
  - 敵HP・属性・素早さ
  - 味方1～3体
  - モンスター選択プリセット
  - 複数ターン／同行動
  - 攻撃力・素早さバフ／デバフ
  - 敵防御補正
  - 毒・猛毒
  - 敵行動効果（攻撃・素早さデバフ、敵の攻撃・防御・素早さアップ、回復）
  - 素早さによる行動順
  - 最後の味方行動までの撃破確率

## GitHub Pagesで公開

1. このフォルダの中身をGitHubリポジトリのルートへアップロード
2. GitHubのリポジトリで `Settings` → `Pages`
3. `Build and deployment` の Source を `Deploy from a branch`
4. Branchを `main`、Folderを `/(root)` にして Save
5. 表示された公開URLを開く

相対パスだけを使っているため、GitHub PagesのプロジェクトURL配下でも動作します。

## 更新時

Service Workerはオンライン時に新しいファイルを優先する network-first です。バージョン更新時は `package.json`、`assets/version.js`、`service-worker.js`、`CHANGELOG.md` を更新します。

## ローカルテスト

```bash
npm test
```

HTMLはES Modulesを使用するため、ローカル確認では簡易HTTPサーバーを使用してください。


## v0.4.7 UI
バフ／デバフの対象は、1・2・3・12・13・23・123からプルダウンで選択します。味方人数に応じて有効な組み合わせだけを表示します。
