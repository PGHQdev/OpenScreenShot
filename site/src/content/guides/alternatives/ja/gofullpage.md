---
title: 'GoFullPage の代替: 無料の注釈機能とオープンソース'
description: GoFullPage と OpenScreenShot を比較。OpenScreenShot は注釈、ぼかし、切り抜き、PDF のページ分割が無料で、コードも公開しています。
order: 1
---

ページ全体をキャプチャした後に、切り抜き、ぼかし、注釈、PDF のページ分割が必要なら、OpenScreenShot に切り替えてください。GoFullPage ではこれらの機能が有料の Premium プランにあり、OpenScreenShot では無料で使えます。OpenScreenShot は MIT ライセンスでもあるため、ページ上で動くコードを読めます。ページ全体をキャプチャして画像や PDF として保存するだけで、編集はしないなら、GoFullPage のままで構いません。GoFullPage の無料版はそれをキャプチャ回数の制限なしで行え、FAQ には Microsoft Edge Add-ons 版へのリンクもあります。OpenScreenShot は Edge Add-ons に掲載されていませんが、Edge では Chrome ウェブストア からインストールできます。OpenScreenShot がキャプチャするのはブラウザ内のウェブページだけです。デスクトップのウィンドウや画面全体はキャプチャしません。

OpenScreenShot は私たちの製品です。このページの GoFullPage に関する情報は 2026年10月9日時点のもので、[Chrome ウェブストア の掲載ページ](https://chromewebstore.google.com/detail/fdpohaocaechififmbbbbbknoalclacl)、[FAQ](https://gofullpage.com/faq)、[Premium のページ](https://gofullpage.com/premium)、[Firefox アドオンのページ](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/)に基づいています。

## GoFullPage と OpenScreenShot の比較

|                                 | GoFullPage                                                     | OpenScreenShot                                           |
| ------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------- |
| 価格                            | 無料。Premium は年額 $12（税別）、7 日間の試用あり             | 無料。有料プランなし                                     |
| オープンソース                  | いいえ。MIT プロジェクトを 2018 年から非公開でフォークしたもの | はい、MIT                                                |
| インストール時のサイト アクセス | なし。すべてのサイトへのアクセスは任意                         | なし。キャプチャを開始したときに現在のタブにアクセス     |
| ページ全体のキャプチャ          | はい                                                           | はい                                                     |
| 注釈とぼかし                    | Premium のみ（ぼかし、テキスト、ハイライト、切り抜き）         | 無料（図形、矢印、テキスト、手順番号、ぼかし、切り抜き） |
| PDF の書き出し                  | 無料。スマートな PDF ページ分割は Premium                      | 無料。重なりを付けた A4 または Letter のページ分割も含む |
| タブの録画                      | いいえ                                                         | はい、Chrome で（Firefox 版はスクリーンショットのみ）    |
| アカウントやクラウド            | 無料のキャプチャにはアカウント不要。Premium はアカウントを使用 | アカウント不要、アップロードなし                         |
| ブラウザのストア                | Chrome ウェブストア、Firefox Add-ons、Edge Add-ons             | Chrome ウェブストア、Firefox Add-ons                     |

[詳しい比較](/ja/compare/)では、同じ表に FullPage Capture も加えています。

## 変わらないこと

基本の操作は同じです。初期設定では、OpenScreenShot のツールバー アイコンを 1 回クリックすると**ページ全体**のキャプチャが始まります。これが**ワンクリック Express モード**です。拡張機能はページをスクロールし、各部分を 1 枚の画像につなぎ合わせ、結果を**エディタ**で開きます。固定ヘッダーは最上部に 1 回だけ表示され、内側の要素がスクロールするページにも対応しています。

どちらの拡張機能も、インストール時にサイトへのアクセスを求めません。OpenScreenShot は `activeTab` を使うため、読み取れるのはキャプチャするタブだけで、それもキャプチャを開始した時点に限られます。どちらも PNG、JPEG、PDF のファイルを保存できます。どちらも Chrome と Firefox で動作します。

## 変わること

エディタのツールは無料です。**切り抜き**（`C`）で画像を切り詰め、**ぼかし**（`B`）の**塗りつぶし**で非公開のデータを覆い、**矢印**、**テキスト**、**手順番号**で重要な箇所を示します。**Cut**（`X`）は長いキャプチャから横方向の帯を削除します。すべてのツールとショートカットは[注釈のリファレンス](/ja/docs/#annotate)で確認できます。

PDF のレイアウトも無料です。**画像を保存**をクリックして**書き出し**ダイアログを開き、**PDF** を選んで、**A4** または **Letter** と**複数ページに分割**を選びます。各ページは次のページと 5 mm 重なるため、文字が行の途中で切れません。**画像を保存**の横にある **PDF** ボタンでは、1 回のクリックで PDF を保存できます。PDF にはスクリーンショットが画像として入るため、文字の検索や選択はできません。

キャプチャ モードも増えます。**表示領域**、**選択範囲**、そして 1 つのカード、表、グラフをその範囲どおりにキャプチャする**要素をキャプチャ**です。Chrome では、**録画**でタブを MP4 または WebM の動画として記録し、クリックごとにズームを入れられます。初回の録画では、タブのキャプチャのオプション権限を求めます。

OpenScreenShot には日付や URL のスタンプ機能はありません。代わりに、**設定**のファイル名テンプレートで `{date}` と `{domain}` を使い、その情報をファイル名に残してください。

## 切り替え方

1. [Chrome ウェブストア](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) または [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) から OpenScreenShot をインストールします。
2. アイコンをツールバーに固定します。同じ場所に GoFullPage が固定されている場合は、正しいアイコンをクリックできるように固定を外します。
3. 長いページを開き、OpenScreenShot のアイコンをクリックします。**エディタ**で、先頭、末尾、固定ヘッダーを確認します。
4. **設定**で**キャプチャ後**を設定します。**エディタ**では各キャプチャが注釈用に開きます。**ダウンロード**ではタブを開かずに PNG をダウンロード フォルダに保存するため、キャプチャして保存するだけの使い方に近くなります。**クリップボード**では画像をコピーします。
5. GoFullPage で保存した画像に注釈を付けるには、ファイルをエディタにドロップするか、`Ctrl+V`（macOS では `⌘V`）で貼り付けます。

キーボード ショートカットで OpenScreenShot のキャプチャが始まらない場合は、`chrome://extensions/shortcuts` を開き、ほかの拡張機能が同じキーを使っていないか確認してください。

日付入りのファイル名でページのコピーを残す方法は、[ウェブページの見た目をコピーとして保存する方法](/ja/use-cases/archive-web-pages/)を参照してください。クリックできるリンク付きの PDF が必要な場合は、[FireShot の代替](/ja/alternatives/fireshot/)と [FullPage Capture の代替](/ja/alternatives/fullpage-capture/)を比べてください。
