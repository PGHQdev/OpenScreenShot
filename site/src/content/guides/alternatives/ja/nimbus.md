---
title: 'Nimbus Screenshot の代替: FuseBase への移行後もローカルでキャプチャ'
description: Nimbus Screenshot は現在 FuseBase Pro。OpenScreenShot はページ全体のキャプチャ、注釈、タブ録画をデバイス上で行う無料のオープンソース。
order: 5
---

Nimbus Screenshot は現在、Nimbus Web による FuseBase Pro として Chrome で提供されています。Nimbus でウェブページのキャプチャ、注釈、録画をしていて、アカウントもクラウドのワークスペースも不要で、ファイルをデバイス上にとどめる無料のツールがよいなら、OpenScreenShot に切り替えてください。1 つのタブを超える画面録画や、FuseBase、Google Drive、Dropbox、Slack へのアップロードなど、OpenScreenShot にない機能が必要なら、FuseBase Pro のままで構いません。OpenScreenShot が録画できるのは 1 つのブラウザ タブだけで、Chrome でのみ使えます。デスクトップのウィンドウや画面全体はキャプチャしません。

OpenScreenShot は私たちの製品です。このページの FuseBase Pro に関する情報は 2026年10月9日時点のもので、[Chrome ウェブストア の掲載ページ](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn)、FuseBase の[スクリーンショットのページ](https://thefusebase.com/screenshot/)と[料金ページ](https://thefusebase.com/pricing/)、以前の [Nimbus の Firefox アドオンのページ](https://addons.mozilla.org/en-US/firefox/addon/nimbus-screenshot/)、Google の更新サーバーから取得したバージョン 3.6.19 のマニフェストに基づいています。

## Nimbus Screenshot に何が起きたか

元の Nimbus Screenshot & Screen Video Recorder の掲載ページは、Chrome ウェブストア にもうありません。以前の Nimbus のスクリーンショットのページ nimbusweb.me/screenshot.php は、現在 FuseBase のスクリーンショットのページにリダイレクトされます。現在の Chrome 拡張機能は、Nimbus Web, Inc. が提供する "FuseBase Pro - Capture screenshots and Video record" です。以前の Nimbus アドオンは Firefox でまだ掲載されています。最終更新は 2020年7月31日です。

## FuseBase Pro と OpenScreenShot の比較

|                                 | FuseBase Pro（旧 Nimbus）                                                                | OpenScreenShot                                       |
| ------------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| 価格                            | 無料プランは録画最大 5 分、Pro プランは録画最大 10 時間                                  | 無料。有料プランなし                                 |
| オープンソース                  | いいえ                                                                                   | はい、MIT                                            |
| インストール時のサイト アクセス | すべてのウェブサイト（`<all_urls>` が必須、すべてのページでコンテンツ スクリプトを実行） | なし。キャプチャを開始したときに現在のタブにアクセス |
| ページ全体のキャプチャ          | はい                                                                                     | はい                                                 |
| 注釈とぼかし                    | はい                                                                                     | はい、すべてのツールが無料                           |
| PDF の書き出し                  | はい（掲載ページによる）                                                                 | はい                                                 |
| タブの録画                      | はい、画面とウェブカメラ。GIF と MP4 への変換はプレミアム                                | はい、タブのみ、Chrome で。MP4 と WebM は無料        |
| アカウントやクラウド            | FuseBase、Google Drive、Dropbox、Slack へのアップロード                                  | アカウント不要、アップロードなし                     |

FuseBase のスクリーンショットのページには、キャプチャ用 Pro プランの価格が表示されていません。FuseBase の料金ページにはワークスペースのプランが並び、最初の Solo は支払い方法に応じて月額 $32 または $39 です。キャプチャ拡張機能の名前は挙げられていません。

## 変わらないこと

ページ全体のキャプチャ、注釈ツールとぼかしを備えたエディタ、PDF の書き出しはそのまま使えます。Chrome では、ウェブカメラ付きの録画も使え、OpenScreenShot ではマイクとタブの音声も録音できます。書き出しに透かしは入りません。

## 変わること

ファイルはデバイス上にとどまります。OpenScreenShot は、削除するまでキャプチャをブラウザのローカル ストレージに、録画を IndexedDB に保存し、アナリティクスやテレメトリーはありません。Chrome ウェブストア の FuseBase Pro のプライバシーのセクションでは、個人を特定できる情報、認証情報、ウェブサイトのコンテンツを収集すると開示しています。OpenScreenShot のキャプチャを共有するには、**コピー**をクリックして貼り付けるか、**画像を保存**をクリックしてファイルを添付します。

インストール時のアクセスは少なくなります。OpenScreenShot は `activeTab` を使い、キャプチャを開始したときに 1 つのタブにアクセスします。タブのキャプチャのオプション権限を Chrome が求めるのは、初めて**録画**をクリックしたときです。すべてのサイトへのアクセスを求めるのは、**サイトをまたいで録画**をオンにした場合だけです。

録画の対象は 1 つのタブです。ポップアップで**録画**をクリックし、**マイク**、**タブの音声**、**ウェブカメラ**を選び、タブ全体またはドラッグした範囲を録画します。録画エディタはクリックごとに 2 倍のズームを追加し、セグメントの不要な部分を削ったり、ウェブカメラのバブルを配置したりできます。MP4 と WebM の書き出しは無料です。OpenScreenShot には GIF の書き出しはありません。[録画のリファレンス](/ja/docs/#record)を参照してください。

## 切り替え方

1. [Chrome ウェブストア](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) または [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) から OpenScreenShot をインストールします。Firefox 版はスクリーンショットだけに対応しています。
2. アイコンをツールバーに固定します。
3. ページでアイコンをクリックします。初期設定の**ワンクリック Express モード**では、これで**ページ全体**のキャプチャが始まり、**エディタ**が開きます。**表示領域**、**選択範囲**、**要素をキャプチャ**を使うには、ページを右クリックします。
4. **設定**で**キャプチャ後**を**エディタ**、**クリップボード**、**ダウンロード**のいずれかに設定します。
5. 残したいファイルを FuseBase またはクラウド ストレージからダウンロードします。古いキャプチャに注釈を付けるには、画像を OpenScreenShot のエディタにドロップします。
6. `chrome://extensions` を確認し、使わなくなった Nimbus または FuseBase の拡張機能を削除します。

機能を紹介する短い動画については、[製品デモ動画](/ja/use-cases/product-demos/)を参照してください。チーム向けの注釈付きキャプチャについては、[デザイン レビュー用にページをキャプチャする方法](/ja/use-cases/design-review/)を参照してください。ほかの録画ツールについては、[Awesome Screenshot の代替](/ja/alternatives/awesome-screenshot/)と [Screenity の代替](/ja/alternatives/screenity/)を参照してください。
