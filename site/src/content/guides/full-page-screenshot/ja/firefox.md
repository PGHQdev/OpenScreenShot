---
title: Firefox でページ全体のスクリーンショットを撮る方法
description: 'Firefox 標準のスクリーンショット ツールか :screenshot コマンドでページ全体を撮り、サイズ上限を確認し、OpenScreenShot アドオンを使います。'
order: 3
---

Firefox にはスクリーンショット ツールが標準で入っています。`Ctrl+Shift+S`（macOS では `Cmd+Shift+S`）を押して **Save full page**（ページ全体を保存）を選び、**Download**（ダウンロード）で PNG を保存するか、**Copy**（コピー）で画像をクリップボードに入れます。Firefox 用の OpenScreenShot アドオンは、矢印、テキスト、マスク処理のためのエディタを追加し、PNG、JPEG、WebP、PDF で書き出します。

## 標準機能による方法

Mozilla は [Take screenshots in Firefox](https://support.mozilla.org/en-US/kb/take-screenshots-firefox) でこのツールを説明しています。

1. キャプチャしたいページを開きます。
2. Windows と Linux では `Ctrl+Shift+S`、macOS では `Cmd+Shift+S` を押します。ページの何もない部分を右クリックして **Take Screenshot**（スクリーンショットを撮る）を選ぶこともできます。
3. 右上の **Save full page** を選びます。
4. プレビューで **Download** を選ぶと Firefox のダウンロード フォルダに PNG が保存されます。**Copy** を選ぶこともできます。

プレビューにあるのは **Copy** と **Download** です。矢印やテキストを追加するには、PNG を別のアプリで開きます。

Firefox の DevTools には 2 つ目の方法があります。Web コンソールを開いて `:screenshot --fullpage` と入力すると、Firefox がページ全体の PNG を保存します。DevTools の設定の **Available Toolbox Buttons**（利用可能なツールボックスボタン）で **Take a screenshot of the entire page**（ページ全体のスクリーンショットを撮る）ボタンをオンにすることもできます。Mozilla はどちらも [DevTools のスクリーンショット ガイド](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html)で説明しています。

## 制限事項

- **サイズ。** Firefox は、1 辺が 32,766 ピクセル、または面積が 472,907,776 ピクセルを超えるキャプチャを切り詰め、“Your screenshot was cropped because it was too large.”（スクリーンショットが大きすぎるため切り詰められました）と表示します。大きすぎるキャプチャに対する Firefox のエラー メッセージには別の数値が示されます。最も長い辺が 32,700 ピクセル未満、または総面積が 124,900,000 ピクセル未満というものです。
- **ディスプレイの倍率。** Firefox はこれらの上限をデバイス ピクセルで数えます。ページの幅と高さにディスプレイのピクセル比を掛けた値です。2 倍のディスプレイでは、CSS ピクセルでのページの高さの上限は半分の約 16,383 になります。
- **内側のスクロール コンテナ。** Firefox は、ページ全体の範囲をウィンドウのスクロール幅と高さから取得します。高さが固定された枠の中でパネルがスクロールするページでは、そのパネルの内容は広がらないため、パネルの 1 画面分の高さしか写りません。
- **遅延読み込み。** `loading="lazy"` が指定された画像は、その近くまでスクロールしたときにだけ読み込まれます。キャプチャする前にページを最後までスクロールしてください。そうしないと、画像の一部が空白のまま残ることがあります。
- **無限スクロール。** スクロールに合わせて続きを読み込むフィードには、本当の末尾がありません。キャプチャに入るのは、開始前に読み込まれた分だけです。
- **固定ヘッダー。** 共有する前に、画像の先頭と途中で、ヘッダーが欠けていないか、繰り返されていないか、ずれていないかを確認してください。

## OpenScreenShot を使う場合

Firefox 版の OpenScreenShot はスクリーンショットだけに対応しています。タブの録画は Chrome 版にあります。ページ全体のモードはページをスクロールし、部分ごとにキャプチャして 1 枚の画像につなぎ合わせ、固定ヘッダーを最上部に 1 回だけ配置します。ウィンドウの代わりに内側の要素がスクロールするページにも対応しています。

1. [Firefox Add-ons から OpenScreenShot](https://addons.mozilla.org/firefox/addon/openscreenshot/) をインストールし、アイコンをツールバーに固定します。
2. ページを開き、遅延読み込みの画像が読み込まれるように一度最後までスクロールしてから、先頭に戻ります。
3. OpenScreenShot のアイコンをクリックし、モードのメニューが開いた場合は**ページ全体**を選びます。
4. エディタで結果を確認します。特に先頭、末尾、固定されたナビゲーションを確認してください。
5. **画像を保存**をクリックして PNG、JPEG、WebP、PDF のいずれかを選ぶか、**コピー**をクリックします。

Firefox は `Ctrl+Shift+S` を自身のスクリーンショット ツールに使っているため、OpenScreenShot を使うときはツールバーのアイコンをクリックしてください。各モードは[キャプチャ モードのリファレンス](/ja/docs/#modes)で、形式と倍率は[書き出しのリファレンス](/ja/docs/#export)で説明しています。

## どちらを使うか

- ウィンドウ全体がスクロールし、サイズの上限に収まるページを手早く PNG にするには、Firefox のスクリーンショット ツールを使います。
- すでに Web コンソールで作業している場合は、`:screenshot --fullpage` コマンドを使います。
- 内側のパネルがスクロールするページや、注釈を付けたい、または PDF で保存したいキャプチャには OpenScreenShot を使います。たとえば[バグ報告](/ja/use-cases/bug-reports/)や[ページのコピーの保存](/ja/use-cases/archive-web-pages/)です。

[Chrome のガイド](/ja/full-page-screenshot/chrome/)と [Edge のガイド](/ja/full-page-screenshot/edge/)では、Chromium ブラウザで同じ作業を行う方法を説明しています。Chromium ブラウザでは OpenScreenShot でタブを録画することもできます。Firefox の設定など、拡張機能をブロックするページについては、[サポートと既知の制限事項](/ja/support/)を参照してください。
