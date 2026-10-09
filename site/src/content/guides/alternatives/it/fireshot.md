---
title: 'Alternativa a FireShot: un editor gratuito nel browser e open source'
description: FireShot e OpenScreenShot catturano pagine intere in locale. OpenScreenShot è open source, con un editor gratuito nel browser e la registrazione delle schede.
order: 4
---

Passa a OpenScreenShot se vuoi annotare e sfocare gratis gli screenshot a pagina intera nel browser, su qualsiasi sistema operativo che esegue Chrome o Firefox, con codice che puoi leggere. Resta con FireShot se ti servono PDF con link funzionanti, catture in batch o automatizzate, o gli extra di FireShot Pro, come l’esportazione PDF avanzata e una cronologia delle catture. OpenScreenShot salva un PDF come immagine, quindi il suo testo non si può cercare e i suoi link non funzionano. Cattura solo pagine web e non cattura finestre del desktop né l’intero schermo.

OpenScreenShot è il nostro prodotto. Le informazioni su FireShot in questa pagina sono aggiornate al 9 ottobre 2026 e provengono dalla sua [scheda sul Chrome Web Store](https://chromewebstore.google.com/detail/mcbpblocgmgfnpjjppndjkmgjaogfceg), dal suo [sito web](https://getfireshot.com/), dalla sua [pagina di acquisto](https://getfireshot.com/buy.php), dalla sua [pagina su Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/fireshot/) e dal manifest della versione 2.1.4.18 ottenuto dal server di aggiornamento di Google.

## FireShot e OpenScreenShot a confronto

|                                   | FireShot                                                                                                        | OpenScreenShot                                                               |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Prezzo                            | Gratuito (Lite); Pro costa 39,95 $ all’anno oppure 99,95 $ una tantum per una licenza a vita su due dispositivi | Gratuito, nessun piano a pagamento                                           |
| Open source                       | No (licenza personalizzata)                                                                                     | Sì, MIT                                                                      |
| Accesso ai siti all’installazione | Nessuno in Chrome; l’accesso a tutti i siti è facoltativo. `nativeMessaging` è obbligatorio                     | Nessuno. Accesso alla scheda corrente quando avvii una cattura               |
| Cattura a pagina intera           | Sì                                                                                                              | Sì                                                                           |
| Annotazioni e sfocatura           | La scheda cita testo, frecce e sfocatura; Pro elenca «Editor & smart annotations (on Windows)»                  | Gratuite, nel browser                                                        |
| Esportazione PDF                  | Sì, con link; il PDF avanzato è Pro                                                                             | Sì, come immagine: una pagina, oppure pagine A4 o Letter con sovrapposizione |
| Registrazione della scheda        | No                                                                                                              | Sì, in Chrome (la versione per Firefox cattura solo screenshot)              |
| Account o cloud                   | Cattura in locale; caricamenti e condivisione facoltativi                                                       | Nessun account, nessun caricamento                                           |

## Cosa resta uguale

In entrambi gli strumenti le catture restano in locale. Il sito di FireShot dice «100% local captures keep your work private and offline-safe» (le catture al 100% in locale mantengono il tuo lavoro privato e al sicuro offline). OpenScreenShot elabora le catture nel browser e non le carica. Nessuno dei due chiede accesso a tutti i siti all’installazione in Chrome.

Mantieni la cattura a pagina intera delle pagine lunghe e l’esportazione in PNG, JPEG e PDF. OpenScreenShot salva anche in WebP.

## Cosa cambia

L’editor funziona in una scheda del browser, quindi funziona allo stesso modo su ogni sistema operativo, e ogni strumento è gratuito. Usa **Freccia**, **Testo**, **Numero passo** e **Spotlight** per indicare i dettagli, e **Sfocatura** (`B`) con il riempimento **Pieno** per nascondere i dati privati. **Ritaglia** e **Cut** accorciano una cattura lunga. Il [riferimento delle annotazioni](/it/docs/#annotate) elenca gli strumenti.

Il PDF funziona in modo diverso. Clicca **Salva immagine** per aprire la finestra **Esporta** e scegli **PDF**. **Intera** crea una sola pagina delle dimensioni dell’immagine. **A4** o **Letter** con **Dividi su più pagine** divide una cattura lunga con una sovrapposizione di 5 mm. Il PDF contiene lo screenshot come immagine, quindi non ha link cliccabili né testo selezionabile. Se invii PDF in cui chi legge segue i link, FireShot è più adatto a quel lavoro.

OpenScreenShot non ha cattura in batch, cronologia delle catture né caricamento via email o su OneNote. Ha **Cattura elemento**, il pannello **Beautify** per un’immagine incorniciata e, in Chrome, la registrazione della scheda con zoom sui clic ed esportazione MP4.

Il manifest di FireShot per Chrome richiede `nativeMessaging`, che permette all’estensione di comunicare con un programma installato sul tuo computer. OpenScreenShot non usa alcun programma nativo. Chrome chiede il suo permesso facoltativo di cattura della scheda solo la prima volta che clicchi **Registra**.

Il componente aggiuntivo FireShot per Firefox è stato aggiornato l’ultima volta il 5 giugno 2023 e chiede accesso ai tuoi dati su tutti i siti web. La versione di OpenScreenShot per Firefox non chiede accesso ai siti all’installazione e cattura solo screenshot.

## Come passare a OpenScreenShot

1. Installa OpenScreenShot dal [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) o da [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fissa l’icona alla barra degli strumenti.
3. Clicca l’icona su una pagina lunga. Con la **Modalità Express con un clic** predefinita, questo avvia una cattura **Pagina intera** e apre l’**Editor**.
4. Imposta **Dopo la cattura** nelle **Impostazioni**. Scegli **Scarica** per salvare ogni cattura direttamente nella cartella dei download come PNG, oppure **Appunti** per incollarla subito.
5. Imposta un **Modello nome file** con token come `{date}`, `{domain}` e `{title}`. Una `/` salva in una cartella dentro Download.

Se una scorciatoia da tastiera non avvia una cattura, apri `chrome://extensions/shortcuts` e controlla se un’altra estensione usa gli stessi tasti.

Per copie datate delle pagine, consulta [salvare una copia visiva di una pagina web](/it/use-cases/archive-web-pages/). Per pagine di aiuto con catture annotate, consulta [screenshot per la documentazione](/it/use-cases/documentation/). Il [riferimento dell’esportazione](/it/docs/#export) descrive formati e scala. Per altri strumenti a pagina intera, consulta l’[alternativa a GoFullPage](/it/alternatives/gofullpage/) e l’[alternativa a FullPage Capture](/it/alternatives/fullpage-capture/).
