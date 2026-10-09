---
title: Vivaldi でページ全体のスクリーンショットを撮る方法
description: Vivaldi でページ全体を PNG か JPEG で撮り、上限 30,000 px を知り、Chrome ウェブストア の OpenScreenShot を使います。
order: 7
---

Vivaldi にはキャプチャ ツールが標準で入っています。ステータスバーのカメラのアイコンをクリックし、**Full Page**（ページ全体）を選んで、PNG、JPEG、クリップボードのいずれかを選び、**Capture**（キャプチャ）をクリックします。Full Page のキャプチャは 30,000 ピクセルで止まります。OpenScreenShot も Vivaldi で動作します。Vivaldi は Chromium ベースのブラウザで、Chrome ウェブストア から拡張機能をインストールできます。

## 標準機能による方法

Vivaldi は [Capture a screenshot](https://help.vivaldi.com/desktop/tools/capture-a-screenshot/) でこのツールを説明しています。

1. キャプチャしたいページを開きます。
2. ステータスバーのカメラのアイコンをクリックします。Windows と Linux では `F2`、macOS では `Cmd+E` でクイックコマンドを開き、`Capture` と入力することもできます。
3. **Full Page** を選びます。
4. 出力先を選びます。**Save as PNG**（PNG で保存）、**Save as JPEG**（JPEG で保存）、**Copy to Clipboard**（クリップボードにコピー）のいずれかです。
5. **Capture** をクリックします。保存したファイルは、**Settings**（設定）> **Webpages**（ウェブページ）> **Image Capture**（画像キャプチャ）> **Capture Storage Folder**（キャプチャの保存フォルダ）で設定したフォルダに入ります。

Vivaldi では、キャプチャ日時とページの URL を付けて、キャプチャをメモ パネルの新しいメモにすることもできます。

[Vivaldi のキーボード ショートカット一覧](https://help.vivaldi.com/desktop/shortcuts/keyboard-shortcuts/)には、ページのキャプチャの既定のキーがありません。キーを設定するには、**Settings** > **Keyboard**（キーボード）を開き、**Capture Page to disk**（ページをディスクにキャプチャ）または **Capture Page to Clipboard**（ページをクリップボードにキャプチャ）にキーを割り当てます。

## 制限事項

- **サイズ。** Full Page のキャプチャは最大 30,000 ピクセルまでです。それより長いページでは、必要なセクションをキャプチャしてください。
- **記載されていない動作。** Vivaldi は、ページ全体の画像の作り方や固定ヘッダーの扱いを記載していません。画像の先頭と途中で、ヘッダーが欠けていないか、繰り返されていないかを確認してください。
- **遅延読み込み。** `loading="lazy"` が指定された画像は、その近くまでスクロールしたときにだけ読み込まれます。キャプチャする前にページを最後までスクロールしてください。そうしないと、画像の一部が空白のまま残ることがあります。
- **内側のスクロール コンテナ。** 開発者の報告によると、Chromium、Firefox、WebKit のページ全体のキャプチャでは、高さが固定された枠の中でスクロールするパネルの 1 画面分の高さしか写りません。Vivaldi はこの点の動作を記載していないため、コンテンツ欄がスクロールするウェブアプリやドキュメント サイトは確認してください。
- **注釈。** Vivaldi は、キャプチャへの描画や注釈のツールを記載していません。矢印やテキストを追加するには、ファイルを別のアプリで開きます。

## OpenScreenShot を使う場合

OpenScreenShot はページをビューポート単位でスクロールし、各部分を 1 枚の画像につなぎ合わせます。固定ヘッダーは最上部に 1 回だけキャプチャされ、内側の要素がスクロールするページにも対応しています。高さが 32,000 デバイス ピクセルを超えるページは、最大 6 枚の画像として保存されます。

1. Vivaldi で [OpenScreenShot の掲載ページ](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)を開き、拡張機能を追加します。Chrome ウェブストア からのインストールについては、Vivaldi の[拡張機能のヘルプ](https://help.vivaldi.com/desktop/appearance-customization/extensions/)で説明されています。
2. OpenScreenShot のアイコンをツールバーに固定します。
3. ページを開いてアイコンをクリックするか、`Ctrl+Shift+S`（macOS では `⌘⇧S`）を押します。初期設定では、ページ全体のキャプチャが始まり、結果がエディタで開きます。
4. 先頭、末尾、固定されたナビゲーションを確認します。
5. **画像を保存**をクリックして PNG、JPEG、WebP、PDF のいずれかを選ぶか、**コピー**をクリックします。

アイコンでメニューが開く場合は**ページ全体**を選びます。この動作は**ワンクリック Express モード**の設定で切り替えます。エディタでは、書き出す前に矢印、テキスト、手順番号、ぼかし、切り抜きを追加できます。すべてのオプションは[キャプチャ モードのリファレンス](/ja/docs/#modes)と[書き出しのリファレンス](/ja/docs/#export)で確認できます。

## どちらを使うか

- 30,000 ピクセル未満のページの PNG や JPEG には、Vivaldi のキャプチャ ツールを使います。特に、URL 付きのメモにキャプチャを残したい場合に向いています。
- それより長いページ、内側のパネルがスクロールするページ、注釈を付けたい、または PDF で保存したいキャプチャには OpenScreenShot を使います。たとえば[ヘルプ記事やチュートリアル](/ja/use-cases/documentation/)や[デザイン レビュー](/ja/use-cases/design-review/)です。
- 頻繁にキャプチャし、注釈が不要な場合は、Vivaldi のショートカットを割り当てます。

[Opera のガイド](/ja/full-page-screenshot/opera/)と [Brave のガイド](/ja/full-page-screenshot/brave/)では、独自のキャプチャ ツールを持つほかの Chromium ブラウザを説明しています。ブラウザの設定など、拡張機能をブロックするページについては、[サポートと既知の制限事項](/ja/support/)を参照してください。
