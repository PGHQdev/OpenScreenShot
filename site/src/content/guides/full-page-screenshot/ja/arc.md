---
title: Arc でページ全体のスクリーンショットを撮る方法
description: Arc（macOS）の Capture Full Page で PNG を保存し、未記載の点を知り、Chrome ウェブストア の OpenScreenShot を使います。
order: 8
---

macOS 版の Arc には **Capture Full Page**（ページ全体をキャプチャ）コマンドがあります。`Cmd+T` を押してコマンド バーを開き、`Capture Full Page` と入力して選びます。Arc はページ全体の PNG を既定のダウンロード先にダウンロードします。Arc のヘルプがこのコマンドを記載しているのは macOS 版だけです。OpenScreenShot も Arc で動作します。Arc は Chromium ベースのブラウザで、Chrome ウェブストア から拡張機能をインストールできます。

## 標準機能による方法

Arc は [How to take full page screen captures in Arc](https://resources.arc.net/hc/en-us/articles/25481392111895-How-To-Take-Full-Page-Screen-Captures-in-Arc) でこのコマンドを説明しています。

1. キャプチャしたいページを開きます。
2. `Cmd+T` を押してコマンド バーを開き、`Capture Full Page` と入力して選びます。**File**（ファイル）> **Capture Full Page** を選ぶこともできます。
3. Arc が既定のダウンロード先に PNG をダウンロードします。

このコマンドには既定のショートカットがありません。追加するには、**Arc** > **Settings**（設定）> **Shortcuts**（ショートカット）を開き、`capture` で検索して、**Capture Full Page** にキーを設定します。

装飾付きのスクリーンショットには、[Developer Mode](https://resources.arc.net/hc/en-us/articles/20468488031511-Developer-Mode-Instant-Dev-Tools) をオンにしてツールバーのスクリーンショット ボタンを使うか、コマンド バーから **Capture in Portrait Mode**（縦向きモードでキャプチャ）を実行します。Arc の別の Capture ツールは、編集機能と Easel 付きで選択範囲をキャプチャします。こちらも macOS 版だけです。

## 制限事項

- **macOS 版だけです。** Windows 版の Arc について、Arc はページ全体のコマンドを記載していません。
- **記載されていない動作。** Arc は、画像の作り方、サイズの上限、固定ヘッダーの扱いを記載していません。PNG の先頭と途中で、ヘッダーが欠けていないか、繰り返されていないかを確認してください。
- **注釈。** Arc は、ページ全体のキャプチャの編集機能を記載していません。矢印やテキストを追加するには、PNG を別のアプリで開きます。
- **遅延読み込み。** `loading="lazy"` が指定された画像は、その近くまでスクロールしたときにだけ読み込まれます。キャプチャする前にページを最後までスクロールしてください。そうしないと、画像の一部が空白のまま残ることがあります。
- **内側のスクロール コンテナ。** 開発者の報告によると、Chromium、Firefox、WebKit のページ全体のキャプチャでは、高さが固定された枠の中でスクロールするパネルの 1 画面分の高さしか写りません。コンテンツ欄がスクロールするウェブアプリやドキュメント サイトは確認してください。
- **無限スクロール。** 読み込みが続くフィードには、本当の末尾がありません。キャプチャに入るのは、開始前に読み込まれた分だけです。

## OpenScreenShot を使う場合

OpenScreenShot はページをビューポート単位でスクロールし、各部分を 1 枚の画像につなぎ合わせます。固定ヘッダーは最上部に 1 回だけキャプチャされ、内側の要素がスクロールするページにも対応しています。高さが 32,000 デバイス ピクセルを超えるページは、最大 6 枚の画像として保存されます。

1. Arc で [OpenScreenShot の掲載ページ](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)を開き、拡張機能を追加します。Chrome ウェブストア からのインストールについては、Arc の [Extensions in Arc](https://resources.arc.net/hc/en-us/articles/19434259167767-Extensions-in-Arc-How-to-Import-Add-Open) で説明されています。
2. OpenScreenShot のアイコンを固定します。
3. ページを開いてアイコンをクリックするか、`⌘⇧S` を押します。初期設定では、ページ全体のキャプチャが始まり、結果がエディタで開きます。
4. 先頭、末尾、固定されたナビゲーションを確認します。
5. **画像を保存**をクリックして PNG、JPEG、WebP、PDF のいずれかを選ぶか、**コピー**をクリックします。

アイコンでメニューが開く場合は**ページ全体**を選びます。この動作は**ワンクリック Express モード**の設定で切り替えます。OpenScreenShot でキャプチャを装飾するには、エディタで **Beautify** パネルを開きます。余白、角丸、影、グラデーション / 単色 / 透明の背景を追加でき、フレームはすべての書き出しに含まれます。すべてのオプションは[キャプチャ モードのリファレンス](/ja/docs/#modes)と[書き出しのリファレンス](/ja/docs/#export)で確認できます。

## どちらを使うか

- ウィンドウ全体がスクロールするページを手早く PNG にするには、macOS の Arc で **Capture Full Page** を使います。
- 内側のパネルがスクロールするページや、キャプチャに注釈を付けたい、マスク処理をしたい、PDF で保存したい場合は OpenScreenShot を使います。たとえば[デザイン レビュー](/ja/use-cases/design-review/)です。
- 余白と背景を自分で決めた装飾付きの画像には、OpenScreenShot の **Beautify** パネルを使います。たとえば [SNS 用のスクリーンショット](/ja/use-cases/social-media/)です。

[Chrome のガイド](/ja/full-page-screenshot/chrome/)では Chrome の DevTools のキャプチャと拡張機能を比べています。[Brave のガイド](/ja/full-page-screenshot/brave/)では、標準のツールを持つ別の Chromium ブラウザを説明しています。ブラウザの設定など、拡張機能をブロックするページについては、[サポートと既知の制限事項](/ja/support/)を参照してください。
