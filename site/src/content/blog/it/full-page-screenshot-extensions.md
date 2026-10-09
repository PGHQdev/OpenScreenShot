---
title: Estensioni per screenshot a pagina intera a confronto (2026)
description: OpenScreenShot, GoFullPage, FullPage Capture, Awesome Screenshot, FireShot e Nimbus/FuseBase a confronto per prezzo, codice sorgente, permessi all’installazione, annotazioni, PDF e registrazione, più gli strumenti senza installazione integrati nei browser.
audience: everyday
order: 7
---

Se ti serve uno screenshot a pagina intera solo ogni tanto, gli strumenti integrati in Chrome DevTools, Microsoft Edge e Firefox catturano una pagina intera senza installare nulla. Se catturi pagine spesso, le estensioni qui sotto differiscono per cosa è gratuito, quale accesso ai siti chiedono all’installazione, se registrano video e se il loro sorgente è pubblico. Ogni sezione dice a chi è adatto lo strumento.

OpenScreenShot è un nostro prodotto, e indichiamo i casi in cui un altro strumento è più adatto. Tutti i fatti sono aggiornati al 9 ottobre 2026 e vengono dalle schede degli store, dai manifest delle estensioni e dalle pagine dei produttori, con i link in ogni sezione. Questa pagina confronta le funzioni e non stila una classifica degli strumenti.

## Gli strumenti in sintesi

| Strumento             | Prezzo                                            | Open source                         | Accesso a tutti i siti all’installazione | Annotazioni gratuite?                                        | PDF                                                  | Registrazione                    |
| --------------------- | ------------------------------------------------- | ----------------------------------- | ---------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------- | -------------------------------- |
| OpenScreenShot        | Gratuito                                          | Sì, MIT                             | No                                       | Sì                                                           | Sì                                                   | Solo scheda, versione per Chrome |
| GoFullPage            | Gratuito; Premium 12 $ l’anno                     | No                                  | No                                       | No, Premium                                                  | Sì; la divisione intelligente delle pagine è Premium | No                               |
| FullPage Capture      | Gratuito; Pro 19 $ l’anno                         | No                                  | Sì                                       | Sì                                                           | Sì; il PDF ricercabile è Pro                         | No                               |
| Awesome Screenshot    | Piano gratuito; a pagamento da 5 $ al mese        | Nessun sorgente pubblico            | Sì                                       | Strumenti di base; tutti gli strumenti nei piani a pagamento | Sì                                                   | Desktop, scheda, fotocamera      |
| FireShot              | Gratuito; Pro 39,95 $ l’anno o 99,95 $ una tantum | No                                  | No                                       | Testo, frecce, sfocatura secondo la scheda dello store       | Sì, con link; il PDF avanzato è Pro                  | No                               |
| FuseBase Pro (Nimbus) | Piano gratuito; prezzo Pro non pubblicato         | No                                  | Sì                                       | Annotazioni e sfocatura; divisione non pubblicata            | Sì                                                   | Schermo e webcam                 |
| Chrome DevTools       | Gratuito, integrato                               | Front end di DevTools, BSD-3-Clause | Nessuna installazione                    | Nessun editor documentato                                    | Non documentato                                      | Non documentato                  |
| Edge Screenshot       | Gratuito, integrato                               | No                                  | Nessuna installazione                    | Markup con penna e tocco                                     | Non documentato                                      | Non documentato                  |
| Firefox Screenshots   | Gratuito, integrato                               | Parte di Firefox                    | Nessuna installazione                    | Non documentato                                              | Non documentato                                      | Non documentato                  |

«Accesso a tutti i siti all’installazione» significa che l’estensione chiede l’accesso host a ogni sito web quando la aggiungi. Chrome mostra questa richiesta come «Read and change all your data on all websites» («Leggere e modificare tutti i tuoi dati su tutti i siti web»).

## OpenScreenShot

[OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) è gratuito, non ha un livello a pagamento e pubblica il suo [sorgente su GitHub](https://github.com/pghqdev/OpenScreenShot) con licenza MIT. È sul Chrome Web Store e su [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/). Un clic sull’icona nella barra degli strumenti avvia una cattura a pagina intera; le modalità area visibile, regione selezionata ed elemento sono nel menu del tasto destro e nelle scorciatoie da tastiera. Vedi le [modalità di cattura](/it/docs/#modes).

L’editor include forme, frecce, testo, numeri dei passi, sfocatura con riempimento opaco, spotlight, ritaglio e taglio. L’esportazione è in PNG, JPEG, WebP o PDF come pagina singola, adattata ad A4 o Letter, o divisa su più pagine. Non chiede alcun accesso host all’installazione. La versione per Chrome può [registrare una scheda](/it/docs/#record) in MP4 o WebM; Chrome chiede l’autorizzazione per la cattura della scheda la prima volta che registri. La versione per Firefox fa solo screenshot.

Dove è meno adatto:

- Cattura pagine web in una scheda del browser. Non può catturare il desktop o altre app, e registra solo una scheda.
- Non ha archiviazione cloud né link di condivisione. Il file esportato lo condividi tu.
- Il suo PDF contiene lo screenshot come immagine, quindi il testo non è ricercabile.
- Le pagine del browser come le impostazioni `chrome://` e gli store dei browser non possono essere catturate.

## GoFullPage

[GoFullPage](https://gofullpage.com/) cattura una pagina con un clic ed esporta in PNG, JPEG o PDF. Le sue [FAQ](https://gofullpage.com/faq) dicono che la versione gratuita non ha limiti sugli screenshot né sull’esportazione di immagini e PDF. [Premium](https://gofullpage.com/premium) costa 12 $ l’anno dopo una prova di 7 giorni e aggiunge ritaglio, annotazioni (sfocatura, testo, evidenziazione), URL e data e ora, e la divisione intelligente delle pagine PDF.

Il codice è chiuso. Le FAQ dicono che lo sviluppatore ha creato un fork privato del progetto MIT originale nel 2018. GoFullPage è stata rimossa dal Chrome Web Store ad agosto 2026 per quello che il suo [blog](https://blog.gofullpage.com/2026/08/11/gofullpage-chrome-update/) chiama «a copyright-related issue» («un problema legato al copyright»), e la scheda principale è tornata il 10 settembre 2026. Una [versione per Firefox](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/) ufficiale è arrivata il 7 settembre 2026. Non chiede alcun accesso host all’installazione.

GoFullPage è adatta a chi vuole la cattura con un clic e l’esportazione PDF senza markup, o a chi è disposto a pagare per il markup. Vedi le [alternative a GoFullPage](/it/alternatives/gofullpage/).

## FullPage Capture

[FullPage Capture](https://fullpagecapture.net/) dice che cattura, salvataggio, copia e stampa sono gratuiti, senza filigrana e senza limiti d’uso. La sua [scheda sul Chrome Web Store](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol) descrive un editor gratuito con frecce, forme, testo, evidenziatore, badge numerati e sfocatura, più PDF con link cliccabili. Pro costa 19 $ l’anno dopo una prova di 7 giorni e aggiunge PDF ricercabile, modalità per prove documentali, cattura in batch e caricamento nel cloud.

Il codice è chiuso, e abbiamo trovato solo una scheda per Chrome. Il suo manifest richiede l’accesso a tutti i siti web, quindi Chrome mostra l’avviso per tutti i siti all’installazione. È adatta a chi ha bisogno di PDF ricercabili o della cattura in batch e accetta quel permesso. Vedi le [alternative a FullPage Capture](/it/alternatives/fullpage-capture/).

## Awesome Screenshot

[Awesome Screenshot](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj), di Diigo, unisce gli screenshot a un registratore per il desktop, una scheda o una fotocamera. La sua [pagina dei prezzi](https://www.awesomescreenshot.com/pricing) elenca un piano gratuito con un massimo di 100 screenshot, annotazioni di base e registrazioni a 720p. Basic costa 5 $ al mese con fatturazione annuale, e Professional costa 6 $ al mese con fatturazione annuale, con registrazione fino a 4K. Offre archiviazione cloud con link di condivisione, e il salvataggio in locale.

Chiede l’accesso a tutti i siti web all’installazione, e la sua sezione sulla privacy nel Chrome Web Store dichiara la raccolta di «Website content» («Contenuti dei siti web»). La sua [scheda su Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/) indica la Mozilla Public License 2.0, ma non abbiamo trovato alcun repository pubblico del sorgente. È adatta ai team che vogliono link di condivisione e un registratore dello schermo in un solo strumento. Vedi le [alternative ad Awesome Screenshot](/it/alternatives/awesome-screenshot/).

## FireShot

[FireShot](https://getfireshot.com/) salva una pagina intera come PDF con link, PNG o JPEG. FireShot Pro costa 39,95 $ l’anno o 99,95 $ una tantum per due dispositivi, secondo la sua [pagina di acquisto](https://getfireshot.com/buy.php). Pro aggiunge l’esportazione PDF avanzata, un editor con annotazioni intelligenti su Windows, la cronologia delle catture e la cattura in batch. Non abbiamo verificato quali strumenti di modifica includa la versione gratuita per Chrome.

Il codice è chiuso. FireShot non chiede alcun accesso host all’installazione, ma richiede la messaggistica nativa, che Chrome mostra come avviso separato. Il suo [componente aggiuntivo per Firefox](https://addons.mozilla.org/en-US/firefox/addon/fireshot/) è stato aggiornato l’ultima volta il 5 giugno 2023. FireShot è adatto agli utenti Windows che vogliono la cattura in batch o una licenza una tantum. Vedi le [alternative a FireShot](/it/alternatives/fireshot/).

## Nimbus e FuseBase Pro

La scheda originale di Nimbus Screenshot sul Chrome Web Store ora mostra «This item is not available» («Questo elemento non è disponibile»), e la pagina di cattura di Nimbus reindirizza a [FuseBase](https://thefusebase.com/screenshot/). Nimbus Web ora pubblica [FuseBase Pro](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn) per screenshot, registrazione dello schermo e della webcam, annotazioni, sfocatura e salvataggio in PDF. Carica su FuseBase, Google Drive, Dropbox e Slack.

Il piano gratuito registra fino a 5 minuti e Pro fino a 10 ore. La [pagina dei prezzi di FuseBase](https://thefusebase.com/pricing/) elenca i piani della piattaforma e non indica un prezzo per l’estensione. FuseBase Pro chiede l’accesso a tutti i siti web all’installazione. È adatta a chi lavora già in FuseBase. Vedi le [alternative a Nimbus](/it/alternatives/nimbus/).

## Senza installazione: gli strumenti integrati nel browser

### Chrome DevTools

Apri DevTools, premi Ctrl+Shift+P (Cmd+Shift+P su macOS), digita «screenshot» e scegli **Capture full size screenshot** («Acquisisci screenshot a grandezza intera»). Chrome salva un PNG. La documentazione non descrive alcun editor; la [documentazione del Command Menu](https://developer.chrome.com/docs/devtools/command-menu) elenca gli altri comandi per gli screenshot. Vedi [la guida per Chrome](/it/full-page-screenshot/chrome/).

### Microsoft Edge Screenshot

Edge ha rinominato Web Capture in Screenshot, e Ctrl+Shift+S lo apre, secondo la [pagina dei criteri](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled) di Microsoft. Cattura una pagina intera o un’area, e puoi aggiungere markup con la penna o il tocco. Vedi [la guida per Edge](/it/full-page-screenshot/edge/).

### Firefox Screenshots

Fai clic destro su una pagina, scegli **Take Screenshot** («Acquisisci schermata»), poi **Save full page** («Salva pagina intera»), secondo la [guida di Mozilla](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/). Il risultato lo copi o lo scarichi. I caricamenti su un server di Mozilla sono terminati con Firefox 67 a maggio 2019. Vedi [la guida per Firefox](/it/full-page-screenshot/firefox/).

Per Safari, Brave, Opera, Vivaldi e Arc, vedi le [guide per ogni browser](/it/full-page-screenshot/).

## Quale scegliere

- **Una pagina, oggi, senza installare nulla:** lo strumento integrato nel tuo browser.
- **Markup e PDF gratuiti, nessun accesso a tutti i siti all’installazione, sorgente leggibile:** OpenScreenShot.
- **Cattura con un clic senza markup:** la versione gratuita di GoFullPage.
- **PDF ricercabile o cattura in batch:** FullPage Capture Pro o FireShot Pro.
- **Link di condivisione e registrazione del desktop per un team:** Awesome Screenshot o FuseBase Pro.
- **Screenshot di app desktop:** uno strumento desktop; vedi [strumenti open source per screenshot su ogni piattaforma](/it/blog/open-source-screenshot-tools/).
- **Screenshot da uno script o dalla CI:** vedi [strumenti per screenshot di siti web per sviluppatori](/it/blog/website-screenshot-tools-for-developers/).

Tutti questi strumenti possono avere difficoltà con i feed infiniti e le immagini a caricamento differito; la [guida alla pagina intera in Chrome](/it/blog/full-page-screenshot-chrome/) spiega come controllare una cattura. Per un confronto diretto tra OpenScreenShot, GoFullPage e FullPage Capture, vedi la [pagina di confronto](/it/compare/).
