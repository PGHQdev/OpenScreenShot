---
title: 'Alternativa a GoFullPage: annotazioni gratuite e open source'
description: GoFullPage o OpenScreenShot per le pagine intere? OpenScreenShot offre gratis annotazioni, sfocatura, ritaglio e PDF divisi in pagine, e ha codice pubblico.
order: 1
---

Passa a OpenScreenShot se catturi pagine intere e poi devi ritagliarle, sfocarle, annotarle o dividere un PDF in pagine: GoFullPage mette queste funzioni nel suo piano Premium a pagamento, mentre OpenScreenShot le include gratis. OpenScreenShot ha anche licenza MIT, quindi puoi leggere il codice che viene eseguito sulle tue pagine. Resta con GoFullPage se catturi e salvi pagine intere come immagini o PDF senza modificarle. La sua versione gratuita lo fa già senza limiti al numero di catture, e le sue FAQ rimandano a una versione su Microsoft Edge Add-ons. OpenScreenShot non è presente su Edge Add-ons, ma Edge può installarlo dal Chrome Web Store. OpenScreenShot cattura solo pagine web nel browser; non cattura finestre del desktop né l’intero schermo.

OpenScreenShot è il nostro prodotto. Le informazioni su GoFullPage in questa pagina sono aggiornate al 9 ottobre 2026 e provengono dalla sua [scheda sul Chrome Web Store](https://chromewebstore.google.com/detail/fdpohaocaechififmbbbbbknoalclacl), dalle sue [FAQ](https://gofullpage.com/faq), dalla sua [pagina Premium](https://gofullpage.com/premium) e dalla sua [pagina su Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/).

## GoFullPage e OpenScreenShot a confronto

|                                   | GoFullPage                                                                   | OpenScreenShot                                                        |
| --------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Prezzo                            | Gratuito; Premium costa 12 $ all’anno (tasse escluse), con 7 giorni di prova | Gratuito, nessun piano a pagamento                                    |
| Open source                       | No. Un fork privato, dal 2018, di un progetto MIT                            | Sì, MIT                                                               |
| Accesso ai siti all’installazione | Nessuno. L’accesso a tutti i siti è facoltativo                              | Nessuno. Accesso alla scheda corrente quando avvii una cattura        |
| Cattura a pagina intera           | Sì                                                                           | Sì                                                                    |
| Annotazioni e sfocatura           | Solo Premium (sfocatura, testo, evidenziazione, ritaglio)                    | Gratuite (forme, frecce, testo, numeri di passo, sfocatura, ritaglio) |
| Esportazione PDF                  | Gratuita; la divisione intelligente in pagine PDF è Premium                  | Gratuita, comprese pagine A4 o Letter divise con sovrapposizione      |
| Registrazione della scheda        | No                                                                           | Sì, in Chrome (la versione per Firefox cattura solo screenshot)       |
| Account o cloud                   | Nessun account per la cattura gratuita; Premium usa un account               | Nessun account, nessun caricamento                                    |
| Store dei browser                 | Chrome Web Store, Firefox Add-ons, Edge Add-ons                              | Chrome Web Store, Firefox Add-ons                                     |

Il [confronto completo](/it/compare/) aggiunge FullPage Capture alla stessa tabella.

## Cosa resta uguale

L’abitudine principale non cambia. Con le impostazioni predefinite, un clic sull’icona di OpenScreenShot nella barra degli strumenti avvia una cattura **Pagina intera**. Questa è la **Modalità Express con un clic**. L’estensione scorre la pagina, unisce le parti in un’unica immagine e apre il risultato nell’**Editor**. Le intestazioni fisse compaiono una sola volta in cima, e funzionano anche le pagine che fanno scorrere un elemento interno.

Nessuna delle due estensioni chiede accesso ai siti all’installazione. OpenScreenShot usa `activeTab`, quindi può leggere solo la scheda che catturi, nel momento in cui avvii la cattura. Entrambe salvano file PNG, JPEG e PDF. Entrambe funzionano in Chrome e Firefox.

## Cosa cambia

Gli strumenti dell’editor sono gratuiti. **Ritaglia** (`C`) taglia l’immagine, **Sfocatura** (`B`) con il riempimento **Pieno** copre i dati privati, e **Freccia**, **Testo** e **Numero passo** segnano ciò che conta. **Cut** (`X`) rimuove fasce orizzontali da una cattura lunga. Il [riferimento delle annotazioni](/it/docs/#annotate) elenca ogni strumento e scorciatoia.

Anche il layout PDF è gratuito. Clicca **Salva immagine** per aprire la finestra **Esporta**, scegli **PDF** e seleziona **A4** o **Letter** con **Dividi su più pagine**. Ogni pagina si sovrappone alla successiva di 5 mm, quindi il testo non viene tagliato a metà riga. Il pulsante **PDF** accanto a **Salva immagine** salva un PDF con un clic. Il PDF contiene lo screenshot come immagine, quindi il suo testo non si può cercare né selezionare.

Hai anche più modalità di cattura: **Area visibile**, **Regione selezionata** e **Cattura elemento**, che cattura una scheda, una tabella o un grafico esattamente entro i suoi limiti. In Chrome, **Registra** cattura una scheda come video MP4 o WebM con uno zoom a ogni clic. La prima registrazione chiede il permesso facoltativo di cattura della scheda.

OpenScreenShot non ha un timbro con data o URL. Usa invece il modello del nome file nelle **Impostazioni** con `{date}` e `{domain}` per tenere quelle informazioni nel nome del file.

## Come passare a OpenScreenShot

1. Installa OpenScreenShot dal [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) o da [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fissa l’icona alla barra degli strumenti. Se GoFullPage è fissato nello stesso punto, sgancialo per cliccare l’icona giusta.
3. Apri una pagina lunga e clicca l’icona di OpenScreenShot. Controlla nell’**Editor** la parte iniziale, la parte finale e ogni intestazione fissa.
4. Imposta **Dopo la cattura** nelle **Impostazioni**. **Editor** apre ogni cattura per l’annotazione. **Scarica** salva un PNG nella cartella dei download senza aprire schede, un comportamento vicino all’abitudine di catturare e salvare. **Appunti** copia l’immagine.
5. Per annotare un’immagine salvata con GoFullPage, trascina il file sull’editor o incollalo con `Ctrl+V` (`⌘V` su macOS).

Se una scorciatoia da tastiera non avvia una cattura di OpenScreenShot, apri `chrome://extensions/shortcuts` e controlla se un’altra estensione usa gli stessi tasti.

Per conservare copie di pagine con nomi file datati, consulta [salvare una copia visiva di una pagina web](/it/use-cases/archive-web-pages/). Se vuoi un PDF con link cliccabili, confronta l’[alternativa a FireShot](/it/alternatives/fireshot/) e l’[alternativa a FullPage Capture](/it/alternatives/fullpage-capture/).
