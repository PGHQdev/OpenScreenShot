---
title: Brave でページ全体のスクリーンショットを撮る方法
description: Brave のスクリーンショット ボタンを表示してページ全体を PNG で撮り、制限を確認し、Chrome ウェブストア の OpenScreenShot を使います。
order: 5
---

Brave 1.94 以降にはスクリーンショット ツールが標準で入っています。`brave://settings/appearance` でスクリーンショット ボタンをオンにし、ボタンをクリックして **Full page**（ページ全体）を選びます。Brave 1.96 以降では、プレビューが開き、そこで PNG をダウンロードするか画像をコピーします。OpenScreenShot も Brave で動作します。Brave は Chromium ベースのブラウザで、Chrome ウェブストア から拡張機能をインストールできます。

## 標準機能による方法

Brave にはこのツールのヘルプ センター記事がありません。以下の手順は、Brave の[リリース ノート](https://brave.com/latest/)と [issue トラッカー](https://github.com/brave/brave-browser/issues/57937)に基づいています。

1. `brave://settings/appearance` を開き、ツールバーのセクションでスクリーンショット ボタンをオンにします。
2. キャプチャしたいページを開きます。
3. ツールバーの **Take a screenshot**（スクリーンショットを撮る）ボタンをクリックします。
4. **Capture screenshot**（スクリーンショットをキャプチャ）の吹き出しで **Full page** を選びます。この吹き出しには **Selected area**（選択範囲）と **Visible area**（表示範囲）もあります。
5. **Screenshot preview**（スクリーンショットのプレビュー）ダイアログで **Download**（ダウンロード）を選んで PNG を保存するか、**Copy to clipboard**（クリップボードにコピー）を選びます。

Brave 1.75 以降では、`Ctrl+Shift+S`（macOS では `Shift+Cmd+S`）で Brave のスクリーンショット ツールが開きます。Brave の issue トラッカーでは、このショートカットは範囲選択型のキャプチャとされているため、**Full page** にはツールバーのボタンを使ってください。Brave 1.96 では、アプリ メニューのスクリーンショットの項目が **Save and share**（保存と共有）の保存セクションに移動しました。

プレビューにあるのは **Download** と **Copy to clipboard** です。矢印やテキストを追加するには、PNG を別のアプリで開きます。

## 制限事項

- **ページ サイズ。** **Full page** の選択肢は Chromium の DevTools のスクリーンショット コマンドを使います。このコマンドは、幅または高さが 131,072 CSS ピクセル以上のページを “Page is too large.”（ページが大きすぎます）というエラーで拒否します。
- **固定要素。** このコマンドでは、Chromium がビューをページ全体のサイズに変更します。そのため、ウィンドウの高さに合わせたセクション（`100vh`）や固定ヘッダー / フッターがその縦長のビューに合わせてレイアウトされ、固定フッターが画像の下端に 1 回だけ表示されることがあります。
- **遅延読み込み。** `loading="lazy"` が指定された画像は、その近くまでスクロールしたときにだけ読み込まれます。キャプチャする前にページを最後までスクロールしてください。そうしないと、画像の一部が空白のまま残ることがあります。
- **内側のスクロール コンテナ。** Chromium はページ自体のスクロール サイズからキャプチャのサイズを決めます。高さが固定された枠の中でパネルがスクロールするページでは、そのパネルの 1 画面分の高さしか写りません。
- **無限スクロール。** 読み込みが続くフィードには、本当の末尾がありません。キャプチャに入るのは、開始前に読み込まれた分だけです。

## OpenScreenShot を使う場合

OpenScreenShot はページをビューポート単位でスクロールし、各部分を 1 枚の画像につなぎ合わせます。固定ヘッダーは最上部に 1 回だけキャプチャされ、内側の要素がスクロールするページにも対応しています。高さが 32,000 デバイス ピクセルを超えるページは、最大 6 枚の画像として保存されます。

1. Brave で [OpenScreenShot の掲載ページ](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)を開き、拡張機能を追加します。Chrome ウェブストア からのインストールについては、Brave の [Using Chrome extensions in Brave](https://brave.com/learn/using-chrome-extensions-in-brave/) で説明されています。
2. OpenScreenShot のアイコンをツールバーに固定します。
3. ページを開いてアイコンをクリックします。初期設定では、ページ全体のキャプチャが始まり、結果がエディタで開きます。
4. 先頭、末尾、固定されたナビゲーションを確認します。
5. **画像を保存**をクリックして PNG、JPEG、WebP、PDF のいずれかを選ぶか、**コピー**をクリックします。

OpenScreenShot のページ全体のショートカットは `Ctrl+Shift+S`（macOS では `⌘⇧S`）で、Brave のスクリーンショット ツールと同じキーです。このキーで Brave のツールが開く場合は、代わりにアイコンをクリックするか、キャプチャ メニューの**ショートカット**のリンクから別のキーを設定します。アイコンでメニューが開く場合は**ページ全体**を選びます。この動作は**ワンクリック Express モード**の設定で切り替えます。

## どちらを使うか

- ウィンドウ全体がスクロールするページを手早く PNG にするには、Brave の **Full page** ボタンを使います。
- 内側のパネルがスクロールするページ、PDF、JPEG、WebP での書き出し、共有前の注釈やマスク処理には OpenScreenShot を使います。たとえば[バグ報告](/ja/use-cases/bug-reports/)です。
- キャプチャを投稿に使う場合は、OpenScreenShot の **Beautify** パネルを使います。余白、角丸、影、背景を追加できます。[SNS 用のスクリーンショット](/ja/use-cases/social-media/)を参照してください。

すべてのオプションは[キャプチャ モードのリファレンス](/ja/docs/#modes)と[書き出しのリファレンス](/ja/docs/#export)で確認できます。Brave にもある DevTools のキャプチャについては、[Chrome のガイド](/ja/full-page-screenshot/chrome/)で説明しています。ブラウザの設定など、拡張機能をブロックするページについては、[サポートと既知の制限事項](/ja/support/)を参照してください。
