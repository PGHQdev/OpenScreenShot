---
title: 'Alternativa a Nimbus Screenshot: cattura in locale dopo il passaggio a FuseBase'
description: Nimbus Screenshot ora è FuseBase Pro. OpenScreenShot è un’opzione gratuita e open source per cattura a pagina intera, annotazioni e registrazione in locale.
order: 5
---

Nimbus Screenshot ora è distribuito in Chrome come FuseBase Pro, da Nimbus Web. Passa a OpenScreenShot se usavi Nimbus per catturare, annotare e registrare pagine web e vuoi uno strumento gratuito che tiene i file sul tuo dispositivo, senza account e senza spazio di lavoro nel cloud. Resta con FuseBase Pro se ti serve ciò che OpenScreenShot non ha: la registrazione dello schermo oltre una singola scheda, e i caricamenti su FuseBase, Google Drive, Dropbox o Slack. OpenScreenShot registra una scheda del browser, solo in Chrome. Non cattura finestre del desktop né l’intero schermo.

OpenScreenShot è il nostro prodotto. Le informazioni su FuseBase Pro in questa pagina sono aggiornate al 9 ottobre 2026 e provengono dalla sua [scheda sul Chrome Web Store](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn), dalla [pagina sugli screenshot](https://thefusebase.com/screenshot/) e dalla [pagina dei prezzi](https://thefusebase.com/pricing/) di FuseBase, dalla vecchia [pagina di Nimbus su Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/nimbus-screenshot/) e dal manifest della versione 3.6.19 ottenuto dal server di aggiornamento di Google.

## Cosa è successo a Nimbus Screenshot

La scheda originale di Nimbus Screenshot & Screen Video Recorder non è più presente nel Chrome Web Store. La vecchia pagina sugli screenshot di Nimbus, nimbusweb.me/screenshot.php, ora reindirizza alla pagina sugli screenshot di FuseBase. L’attuale estensione per Chrome è «FuseBase Pro - Capture screenshots and Video record», offerta da Nimbus Web, Inc. Il vecchio componente aggiuntivo Nimbus è ancora presente per Firefox. È stato aggiornato l’ultima volta il 31 luglio 2020.

## FuseBase Pro e OpenScreenShot a confronto

|                                   | FuseBase Pro (in precedenza Nimbus)                                                         | OpenScreenShot                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Prezzo                            | Piano gratuito con registrazioni fino a 5 minuti; piano Pro con registrazioni fino a 10 ore | Gratuito, nessun piano a pagamento                             |
| Open source                       | No                                                                                          | Sì, MIT                                                        |
| Accesso ai siti all’installazione | Tutti i siti web (`<all_urls>` obbligatorio, script di contenuto su ogni pagina)            | Nessuno. Accesso alla scheda corrente quando avvii una cattura |
| Cattura a pagina intera           | Sì                                                                                          | Sì                                                             |
| Annotazioni e sfocatura           | Sì                                                                                          | Sì, tutti gli strumenti gratuiti                               |
| Esportazione PDF                  | Sì, secondo la sua scheda                                                                   | Sì                                                             |
| Registrazione della scheda        | Sì, schermo e webcam; la conversione in GIF e MP4 è premium                                 | Sì, solo la scheda, in Chrome; MP4 e WebM gratuiti             |
| Account o cloud                   | Caricamenti su FuseBase, Google Drive, Dropbox e Slack                                      | Nessun account, nessun caricamento                             |

La pagina sugli screenshot di FuseBase non mostra un prezzo per il piano Pro di cattura. La pagina dei prezzi di FuseBase elenca i piani per lo spazio di lavoro, a partire da Solo a 32 $ o 39 $ al mese a seconda della fatturazione, e non nomina l’estensione di cattura.

## Cosa resta uguale

Mantieni la cattura a pagina intera, un editor con strumenti di annotazione e sfocatura, e l’esportazione PDF. In Chrome mantieni la registrazione con la webcam, e OpenScreenShot registra anche il microfono e l’audio della scheda. Le esportazioni non hanno filigrana.

## Cosa cambia

I file restano sul tuo dispositivo. OpenScreenShot conserva le catture nello spazio di archiviazione locale del browser e le registrazioni in IndexedDB finché non le elimini, e non ha analisi né telemetria. La sezione sulla privacy di FuseBase Pro sul Chrome Web Store dichiara la raccolta di informazioni che consentono l’identificazione personale, informazioni di autenticazione e contenuti dei siti web. Per condividere una cattura di OpenScreenShot, clicca **Copia** e incollala, oppure clicca **Salva immagine** e allega il file.

L’accesso all’installazione è più limitato. OpenScreenShot usa `activeTab`, che copre una scheda quando avvii una cattura. Chrome chiede il permesso facoltativo di cattura della scheda la prima volta che clicchi **Registra**, e l’accesso a tutti i siti solo se attivi **Registra su tutti i siti**.

La registrazione copre una scheda. Clicca **Registra** nel popup, scegli **Mic**, **Audio scheda** o **Webcam**, e registra l’intera scheda o un’area che trascini. L’editor di registrazione aggiunge uno zoom 2x a ogni clic, e puoi tagliare i segmenti e posizionare la bolla della webcam. L’esportazione MP4 e WebM è gratuita. OpenScreenShot non esporta in GIF. Consulta il [riferimento della registrazione](/it/docs/#record).

## Come passare a OpenScreenShot

1. Installa OpenScreenShot dal [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) o da [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/). La versione per Firefox cattura solo screenshot.
2. Fissa l’icona alla barra degli strumenti.
3. Clicca l’icona su una pagina. Con la **Modalità Express con un clic** predefinita, questo avvia una cattura **Pagina intera** e apre l’**Editor**. Fai clic con il tasto destro sulla pagina per **Area visibile**, **Regione selezionata** e **Cattura elemento**.
4. Imposta **Dopo la cattura** nelle **Impostazioni**: **Editor**, **Appunti** o **Scarica**.
5. Scarica da FuseBase o dal tuo archivio cloud i file che vuoi conservare. Per annotare una vecchia cattura, trascina l’immagine sull’editor di OpenScreenShot.
6. Controlla `chrome://extensions` e rimuovi l’estensione Nimbus o FuseBase se non la usi più.

Per brevi video sulle funzioni, consulta [video dimostrativi di prodotto](/it/use-cases/product-demos/). Per catture annotate per un team, consulta [catturare una pagina per la revisione del design](/it/use-cases/design-review/). Per altri registratori, consulta l’[alternativa ad Awesome Screenshot](/it/alternatives/awesome-screenshot/) e l’[alternativa a Screenity](/it/alternatives/screenity/).
