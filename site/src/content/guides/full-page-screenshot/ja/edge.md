---
title: Microsoft Edge でページ全体のスクリーンショットを撮る方法
description: Edge 標準のスクリーンショット ツールか DevTools でページ全体を撮り、制限を知り、Chrome ウェブストア の OpenScreenShot を使います。
order: 2
---

Microsoft Edge には、以前は Web キャプチャと呼ばれていたスクリーンショット ツールが標準で入っています。`Ctrl+Shift+S` を押して **Capture full page**（ページ全体をキャプチャ）を選び、キャプチャをコピーするかデバイスに保存します。OpenScreenShot も Edge で動作します。Edge は Chromium ベースのブラウザで、ほかのストアからの拡張機能を許可すれば Chrome ウェブストア から OpenScreenShot をインストールできます。

## 標準機能による方法

Microsoft は、[Edge でのスクリーンショットのガイド](https://www.microsoft.com/en-us/edge/learning-center/screenshot-webpage)でこのツールを説明しています。

1. キャプチャしたいページを開きます。
2. `Ctrl+Shift+S` を押します。ページを右クリックして **Screenshot**（スクリーンショット）を選ぶか、**Settings and more**（設定など）（**...**）を開いて **Screenshot** を選ぶこともできます。
3. 中央の選択肢の **Capture full page** を選びます。
4. 必要に応じて、プレビューで描画ツールを使ってキャプチャに書き込みます。
5. キャプチャをコピーするか、デバイスに保存します。

Microsoft によると、この機能を使えるかどうかはデバイスの種類、市場、ブラウザのバージョンによって異なります。管理者は [WebCaptureEnabled ポリシー](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled)でこのツールをオフにすることもできます。職場のコンピューターで **Screenshot** の項目がない場合は、このポリシーが設定されている可能性があります。

Edge には Chromium の DevTools によるキャプチャもあります。DevTools を開き、デバイス エミュレーションをオンにして **More options**（その他のオプション）を開き、**Capture a full size screenshot**（フルサイズのスクリーンショットをキャプチャ）を選びます。Microsoft はこの方法を[デバイスモードの記事](https://learn.microsoft.com/en-us/microsoft-edge/devtools/device-mode/)で説明しています。この方法と拡張機能の比較は [Chrome のガイド](/ja/full-page-screenshot/chrome/)にあります。

## 制限事項

- **記載されていない動作。** スクリーンショット ツールがページ全体の画像をどう作るか、ページの長さの上限、固定ヘッダー、遅延読み込み、内側のスクロール コンテナの扱いについて、Microsoft は記載していません。共有する前に各キャプチャを確認してください。
- **内側のスクロール コンテナ。** Microsoft Q&A では、内側の要素の中でスクロールするページ（たとえば、コンテンツ欄がスクロールするウェブアプリ）でページ全体のキャプチャに失敗したというユーザーの報告があります。Microsoft はこれを確認していません。
- **DevTools のページ サイズ。** DevTools のキャプチャは Chromium のスクリーンショット コマンドを使います。このコマンドは、幅または高さが 131,072 CSS ピクセル以上のページを “Page is too large.”（ページが大きすぎます）というエラーで拒否します。
- **遅延読み込み。** `loading="lazy"` が指定された画像は、その近くまでスクロールしたときにだけ読み込まれます。キャプチャする前にページを最後までスクロールしてください。そうしないと、画像の一部が空白のまま残ることがあります。
- **固定ヘッダー。** スクロールして複数の部分をつなぎ合わせるキャプチャ ツールでは、画面に残り続ける要素が繰り返し写ります。画像の下のほうでヘッダーが 2 回以上写っていないか確認してください。

## OpenScreenShot を使う場合

OpenScreenShot はページをスクロールし、部分ごとにキャプチャして 1 枚の画像につなぎ合わせます。固定ヘッダーは最上部に 1 回だけキャプチャされ、内側の要素がスクロールするページにも対応しています。高さが 32,000 デバイス ピクセルを超えるページは、最大 6 枚の画像として保存されます。

1. Edge で [OpenScreenShot の掲載ページ](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp)を開きます。Edge で確認が表示されたら **Allow extensions from other stores**（他のストアからの拡張機能を許可する）を選び、拡張機能を追加します。この手順は Microsoft の[拡張機能のヘルプ](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge)で説明されています。
2. OpenScreenShot のアイコンをツールバーに固定します。
3. ページを開いてアイコンをクリックします。初期設定では、ページ全体のキャプチャが始まり、結果がエディタで開きます。
4. 先頭、末尾、スクロールに合わせて読み込まれるセクションを確認します。
5. **画像を保存**をクリックして PNG、JPEG、WebP、PDF のいずれかを選ぶか、**コピー**をクリックします。

OpenScreenShot のページ全体のショートカットは `Ctrl+Shift+S` で、Edge のスクリーンショット ツールと同じキーです。このキーで Edge のツールが開く場合は、代わりにアイコンをクリックするか、キャプチャ メニューの**ショートカット**のリンクから別のキーを設定します。ほかのモードは[キャプチャ モードのリファレンス](/ja/docs/#modes)で確認できます。

## どちらを使うか

- ウィンドウ全体がスクロールするページで、ペンで少し書き込むだけの手早いキャプチャには Edge のスクリーンショット ツールを使います。
- 内側のパネルがスクロールするページ、PDF、JPEG、WebP での書き出しが必要な場合、手順番号や塗りつぶしのマスク処理が必要な場合は OpenScreenShot を使います。たとえば[ヘルプ記事やチュートリアル](/ja/use-cases/documentation/)や[サポートの返信](/ja/use-cases/customer-support/)です。
- 管理者がスクリーンショット ツールをオフにしていて、拡張機能もインストールできない場合は DevTools のキャプチャを使います。

ファイル形式と倍率については[書き出しのリファレンス](/ja/docs/#export)で説明しています。ブラウザの設定など、OpenScreenShot でキャプチャできないページについては、[サポートと既知の制限事項](/ja/support/)を参照してください。
