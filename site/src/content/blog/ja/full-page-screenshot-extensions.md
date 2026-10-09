---
title: ページ全体のスクリーンショット拡張機能を比較（2026 年）
description: OpenScreenShot、GoFullPage など 6 つの拡張機能を価格、ソース、権限、注釈、PDF、録画で比較。ブラウザ内蔵ツールも紹介。
audience: everyday
order: 7
---

ページ全体のスクリーンショットがたまにしか必要ない場合は、Chrome DevTools、Microsoft Edge、Firefox に組み込まれたツールで、インストールせずにページ全体をキャプチャできます。ページをよくキャプチャする場合は、以下の拡張機能を比べてください。無料で使える範囲、インストール時に求めるサイトへのアクセス権、動画を録画できるか、ソースが公開されているかが異なります。各セクションに、そのツールが向いている人を記載しています。

OpenScreenShot は私たちの製品です。ほかのツールのほうが合うケースも記載しています。すべての情報は 2026年10月9日時点のもので、各セクションにリンクしたストアの掲載ページ、拡張機能のマニフェスト、提供元のページに基づいています。このページは機能を比較するもので、ツールを順位付けするものではありません。

## ツールの一覧

| ツール                | 価格                                        | オープンソース                          | インストール時の全サイトへのアクセス | 注釈は無料？                             | PDF                                  | 録画                       |
| --------------------- | ------------------------------------------- | --------------------------------------- | ------------------------------------ | ---------------------------------------- | ------------------------------------ | -------------------------- |
| OpenScreenShot        | 無料                                        | はい、MIT                               | いいえ                               | はい                                     | はい                                 | タブのみ、Chrome 版        |
| GoFullPage            | 無料。Premium は年 $12                      | いいえ                                  | いいえ                               | いいえ、Premium                          | はい。スマートなページ分割は Premium | いいえ                     |
| FullPage Capture      | 無料。Pro は年 $19                          | いいえ                                  | はい                                 | はい                                     | はい。検索可能な PDF は Pro          | いいえ                     |
| Awesome Screenshot    | 無料プラン。有料は月 $5 から                | ソースは非公開                          | はい                                 | 基本ツール。全ツールは有料プラン         | はい                                 | デスクトップ、タブ、カメラ |
| FireShot              | 無料。Pro は年 $39.95 または買い切り $99.95 | いいえ                                  | いいえ                               | 掲載ページによるとテキスト、矢印、ぼかし | はい、リンク付き。高度な PDF は Pro  | いいえ                     |
| FuseBase Pro (Nimbus) | 無料プラン。Pro の価格は非公開              | いいえ                                  | はい                                 | 注釈とぼかし。無料と有料の区分は非公開   | はい                                 | 画面とウェブカメラ         |
| Chrome DevTools       | 無料、組み込み                              | DevTools のフロントエンド、BSD-3-Clause | インストール不要                     | エディタの記載なし                       | 記載なし                             | 記載なし                   |
| Edge Screenshot       | 無料、組み込み                              | いいえ                                  | インストール不要                     | ペンとタッチでの書き込み                 | 記載なし                             | 記載なし                   |
| Firefox Screenshots   | 無料、組み込み                              | Firefox の一部                          | インストール不要                     | 記載なし                                 | 記載なし                             | 記載なし                   |

「インストール時の全サイトへのアクセス」は、拡張機能を追加するときに、すべてのウェブサイトへのホスト権限を求めることを意味します。Chrome はこの要求を「Read and change all your data on all websites」（すべてのウェブサイト上のデータの読み取りと変更）と表示します。

## OpenScreenShot

[OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) は無料で、有料プランはありません。[ソースは GitHub](https://github.com/pghqdev/OpenScreenShot) で MIT ライセンスのもと公開しています。Chrome ウェブストア と [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) で入手できます。ツールバーのアイコンをワンクリックすると、ページ全体のキャプチャが始まります。表示領域、選択範囲、要素の各モードは、右クリックメニューとキーボード ショートカットから使えます。[キャプチャ モード](/ja/docs/#modes)をご覧ください。

エディタには、図形、矢印、テキスト、手順番号、不透明な塗りつぶしを含むぼかし、Spotlight、切り抜き、Cut があります。書き出し形式は PNG、JPEG、WebP、PDF で、PDF は 1 ページにまとめるか、A4 または Letter に合わせるか、複数ページに分割できます。インストール時にホスト権限は求めません。Chrome 版は[タブを録画](/ja/docs/#record)して MP4 または WebM で書き出せます。初めて録画するとき、Chrome がタブキャプチャの許可を求めます。Firefox 版はスクリーンショットのみに対応しています。

あまり向いていないケース:

- キャプチャできるのはブラウザのタブ内のウェブページです。デスクトップやほかのアプリはキャプチャできず、録画もタブのみです。
- クラウド ストレージや共有リンクはありません。書き出したファイルはご自身で共有します。
- PDF にはスクリーンショットが画像として入るため、テキストは検索できません。
- `chrome://` の設定ページやブラウザのストアなどのブラウザ ページはキャプチャできません。

## GoFullPage

[GoFullPage](https://gofullpage.com/) はワンクリックでページをキャプチャし、PNG、JPEG、PDF で書き出します。[FAQ](https://gofullpage.com/faq) によると、無料版ではスクリーンショットの枚数や画像・PDF の書き出しに制限はありません。[Premium](https://gofullpage.com/premium) は 7 日間の試用期間の後に年 $12 で、切り抜き、注釈（ぼかし、テキスト、ハイライト）、URL とタイムスタンプ、スマートな PDF ページ分割が加わります。

コードは非公開です。FAQ によると、開発者は 2018 年に元の MIT プロジェクトの非公開フォークを作成しました。GoFullPage は 2026年8月、同社の[ブログ](https://blog.gofullpage.com/2026/08/11/gofullpage-chrome-update/)が「a copyright-related issue」（著作権関連の問題）と呼ぶ理由で Chrome ウェブストア から削除され、メインの掲載ページは 2026年9月10日に復活しました。公式の [Firefox 版](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/)は 2026年9月7日に公開されました。インストール時にホスト権限は求めません。

GoFullPage は、注釈なしでワンクリック キャプチャと PDF 書き出しを使いたい人や、注釈機能に料金を払う人に向いています。[GoFullPage の代替ツール](/ja/alternatives/gofullpage/)をご覧ください。

## FullPage Capture

[FullPage Capture](https://fullpagecapture.net/) によると、キャプチャ、保存、コピー、印刷は無料で、ウォーターマークも使用制限もありません。[Chrome の掲載ページ](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol)には、矢印、図形、テキスト、蛍光ペン、番号バッジ、ぼかしを備えた無料のエディタと、クリックできるリンク付きの PDF が記載されています。Pro は 7 日間の試用期間の後に年 $19 で、検索可能な PDF、エビデンス モード、一括キャプチャ、クラウドへのアップロードが加わります。

コードは非公開で、見つかったのは Chrome の掲載ページのみです。マニフェストがすべてのウェブサイトへのアクセスを必須としているため、インストール時に Chrome が全サイトへのアクセスの警告を表示します。検索可能な PDF や一括キャプチャが必要で、その権限を受け入れられる人に向いています。[FullPage Capture の代替ツール](/ja/alternatives/fullpage-capture/)をご覧ください。

## Awesome Screenshot

Diigo の [Awesome Screenshot](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj) は、スクリーンショットと、デスクトップ、タブ、カメラの録画機能を組み合わせたツールです。[料金ページ](https://www.awesomescreenshot.com/pricing)には、スクリーンショット 100 枚まで、基本的な注釈、720p の録画を含む無料プランが記載されています。Basic は年払いで月 $5、Professional は年払いで月 $6 で、最大 4K で録画できます。共有リンク付きのクラウド ストレージと、ローカル保存に対応しています。

インストール時にすべてのウェブサイトへのアクセスを求め、Chrome のプライバシー欄では「Website content」（ウェブサイトのコンテンツ）の収集を開示しています。[Firefox の掲載ページ](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/)には Mozilla Public License 2.0 と記載されていますが、公開されたソース リポジトリは見つかりませんでした。共有リンクと画面録画を 1 つのツールで使いたいチームに向いています。[Awesome Screenshot の代替ツール](/ja/alternatives/awesome-screenshot/)をご覧ください。

## FireShot

[FireShot](https://getfireshot.com/) は、ページ全体をリンク付きの PDF、PNG、JPEG で保存します。[購入ページ](https://getfireshot.com/buy.php)によると、FireShot Pro は 2 台のデバイスで年 $39.95、または買い切り $99.95 です。Pro では、高度な PDF 書き出し、Windows でのスマート注釈付きエディタ、キャプチャ履歴、一括キャプチャが加わります。無料の Chrome 版にどの編集ツールが含まれるかは確認できませんでした。

コードは非公開です。FireShot はインストール時にホスト権限を求めませんが、ネイティブ メッセージングを要求するため、Chrome が別の警告を表示します。[Firefox アドオン](https://addons.mozilla.org/en-US/firefox/addon/fireshot/)の最終更新日は 2023年6月5日です。FireShot は、一括キャプチャや買い切りライセンスを求める Windows ユーザーに向いています。[FireShot の代替ツール](/ja/alternatives/fireshot/)をご覧ください。

## Nimbus と FuseBase Pro

元の Nimbus Screenshot の Chrome 掲載ページには現在「This item is not available」（このアイテムは利用できません）と表示され、Nimbus のキャプチャ ページは [FuseBase](https://thefusebase.com/screenshot/) にリダイレクトされます。現在、Nimbus Web は [FuseBase Pro](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn) を公開しており、スクリーンショット、画面とウェブカメラの録画、注釈、ぼかし、PDF 保存に対応しています。アップロード先は FuseBase、Google Drive、Dropbox、Slack です。

録画は無料プランで最大 5 分、Pro で最大 10 時間です。[FuseBase の料金ページ](https://thefusebase.com/pricing/)にはプラットフォームのプランが記載されていますが、拡張機能の価格は明記されていません。FuseBase Pro はインストール時にすべてのウェブサイトへのアクセスを求めます。すでに FuseBase を使っている人に向いています。[Nimbus の代替ツール](/ja/alternatives/nimbus/)をご覧ください。

## インストール不要: ブラウザに組み込まれたツール

### Chrome DevTools

DevTools を開いて Ctrl+Shift+P（macOS では Cmd+Shift+P）を押し、「screenshot」と入力して **Capture full size screenshot**（フルサイズのスクリーンショットをキャプチャ）を選びます。Chrome が PNG を保存します。ドキュメントにエディタの記載はありません。ほかのスクリーンショット コマンドは [Command Menu のドキュメント](https://developer.chrome.com/docs/devtools/command-menu)に記載されています。[Chrome のガイド](/ja/full-page-screenshot/chrome/)をご覧ください。

### Microsoft Edge Screenshot

Microsoft の[ポリシー ページ](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled)によると、Edge は Web Capture を Screenshot に名称変更し、Ctrl+Shift+S で開きます。ページ全体または一部の範囲をキャプチャでき、ペンやタッチで書き込めます。[Edge のガイド](/ja/full-page-screenshot/edge/)をご覧ください。

### Firefox Screenshots

[Mozilla のガイド](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/)によると、ページを右クリックして **Take Screenshot**（スクリーンショットを撮影）を選び、**Save full page**（ページ全体を保存）を選びます。結果はコピーまたはダウンロードします。Mozilla のサーバーへのアップロードは、2019年5月の Firefox 67 で終了しました。[Firefox のガイド](/ja/full-page-screenshot/firefox/)をご覧ください。

Safari、Brave、Opera、Vivaldi、Arc については、[ブラウザ別のガイド](/ja/full-page-screenshot/)をご覧ください。

## どれを選ぶか

- **1 ページだけ、今すぐ、インストールなしで:** お使いのブラウザに組み込まれたツール。
- **無料の注釈と PDF、インストール時の全サイトへのアクセスなし、読めるソース:** OpenScreenShot。
- **注釈なしのワンクリック キャプチャ:** GoFullPage の無料版。
- **検索可能な PDF や一括キャプチャ:** FullPage Capture Pro または FireShot Pro。
- **チーム向けの共有リンクとデスクトップ録画:** Awesome Screenshot または FuseBase Pro。
- **デスクトップ アプリのスクリーンショット:** デスクトップ ツール。[あらゆるプラットフォーム向けのオープンソース スクリーンショット ツール](/ja/blog/open-source-screenshot-tools/)をご覧ください。
- **スクリプトや CI からのスクリーンショット:** [開発者向けのウェブサイト スクリーンショット ツール](/ja/blog/website-screenshot-tools-for-developers/)をご覧ください。

これらのツールはどれも、無限スクロールのフィードや遅延読み込みの画像をうまく扱えないことがあります。キャプチャの確認方法は [Chrome でページ全体をキャプチャするガイド](/ja/blog/full-page-screenshot-chrome/)で説明しています。OpenScreenShot、GoFullPage、FullPage Capture を並べて比べるには、[比較ページ](/ja/compare/)をご覧ください。
