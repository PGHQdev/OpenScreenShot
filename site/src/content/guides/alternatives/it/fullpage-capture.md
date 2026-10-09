---
title: 'Alternativa a FullPage Capture: open source e senza accesso a tutti i siti all’installazione'
description: FullPage Capture e OpenScreenShot catturano e annotano gratis pagine intere. OpenScreenShot è open source e non chiede accesso a tutti i siti all’installazione.
order: 2
---

Passa a OpenScreenShot se vuoi un’estensione per screenshot a pagina intera di cui puoi leggere il codice e che all’installazione non chiede accesso a tutti i siti web. Resta con FullPage Capture se ti serve ciò che offre la sua esportazione PDF: la sua scheda descrive PDF con link cliccabili e interruzioni di pagina intelligenti, e il suo piano Pro aggiunge PDF ricercabili. OpenScreenShot salva un PDF come immagine, quindi il suo testo non si può cercare né selezionare e i suoi link non funzionano. OpenScreenShot cattura solo pagine web nel browser; non cattura finestre del desktop né l’intero schermo.

OpenScreenShot è il nostro prodotto. Le informazioni su FullPage Capture in questa pagina sono aggiornate al 9 ottobre 2026 e provengono dalla sua [scheda sul Chrome Web Store](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol), dal suo [sito web](https://fullpagecapture.net/) e dal manifest della versione 1.19.67 ottenuto dal server di aggiornamento di Google.

## FullPage Capture e OpenScreenShot a confronto

|                                   | FullPage Capture                                                                              | OpenScreenShot                                                                                                |
| --------------------------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Prezzo                            | Gratuito; Pro costa 19 $ all’anno dopo 7 giorni di prova                                      | Gratuito, nessun piano a pagamento                                                                            |
| Open source                       | No                                                                                            | Sì, MIT                                                                                                       |
| Accesso ai siti all’installazione | Tutti i siti web (`<all_urls>` obbligatorio)                                                  | Nessuno. Accesso alla scheda corrente quando avvii una cattura                                                |
| Cattura a pagina intera           | Sì, gratuita e senza filigrana                                                                | Sì, gratuita e senza filigrana                                                                                |
| Annotazioni e sfocatura           | Gratuite (frecce, forme, testo, evidenziatore, penna, badge numerati, sfocatura e pixelatura) | Gratuite (forme, frecce, testo, evidenziatore, penna, numeri di passo, sfocatura, mosaico, riempimento Pieno) |
| Esportazione PDF                  | Sì, con link cliccabili e interruzioni di pagina intelligenti; il PDF ricercabile è Pro       | Sì, come immagine: una pagina, oppure pagine A4 o Letter con sovrapposizione                                  |
| Registrazione della scheda        | No                                                                                            | Sì, in Chrome (la versione per Firefox cattura solo screenshot)                                               |
| Account o cloud                   | La scheda indica nessun account; Pro usa un account e «Send to your cloud»                    | Nessun account, nessun caricamento                                                                            |

Il [confronto completo](/it/compare/) inserisce GoFullPage nella stessa tabella.

## Accesso all’installazione

Il manifest di FullPage Capture richiede il permesso host `<all_urls>`. Chrome mostra l’avviso «Read and change all your data on all websites» (leggere e modificare tutti i tuoi dati su tutti i siti web) quando installi un’estensione con quel permesso. La scheda dice «No account, no analytics, no network requests. Files stay on your device» (nessun account, nessuna analisi, nessuna richiesta di rete; i file restano sul tuo dispositivo), e il sito web dice «The extension makes zero network requests» (l’estensione non fa alcuna richiesta di rete). Non abbiamo testato il suo comportamento di rete, e questa pagina non afferma nulla al riguardo.

OpenScreenShot non richiede permessi host. Usa `activeTab`, che dà accesso a una scheda nel momento in cui clicchi l’icona, premi una scorciatoia o scegli una cattura dal menu del tasto destro. Chrome chiede il permesso facoltativo di cattura della scheda solo la prima volta che clicchi **Registra**. L’accesso a tutti i siti viene richiesto solo se attivi **Registra su tutti i siti**. La [sezione sulla privacy](/it/docs/#privacy) spiega come le catture restano sul tuo dispositivo.

## Cosa resta uguale

Il flusso di lavoro è simile. Un clic sull’icona nella barra degli strumenti avvia una cattura **Pagina intera** con la **Modalità Express con un clic** predefinita, e il risultato si apre nell’**Editor**. Frecce, forme, testo, badge numerati e sfocatura sono tutti gratuiti. Anche salvataggio, copia ed esportazione PDF sono gratuiti, e nessuna esportazione ha una filigrana.

## Cosa cambia

Per l’oscuramento, scegli **Sfocatura** (`B`) e poi il riempimento **Pieno** in **Oscuramento**. Pieno copre completamente l’area nell’esportazione. La [guida all’oscuramento](/it/blog/redact-screenshot/) mostra come controllare il file salvato.

Il PDF funziona in modo diverso. Clicca **Salva immagine** per aprire la finestra **Esporta**, scegli **PDF** e seleziona **Intera** per una sola pagina delle dimensioni dell’immagine, oppure **A4** o **Letter** con **Dividi su più pagine**. Le pagine si sovrappongono di 5 mm, così il testo non viene tagliato a metà riga. La [guida da screenshot a PDF](/it/blog/save-screenshot-as-pdf/) confronta i layout.

OpenScreenShot non ha cattura in batch né caricamento nel cloud. Aggiunge **Cattura elemento** per una singola scheda o tabella, il pannello **Beautify** per spaziatura, angoli, ombra e sfondo, e la registrazione della scheda in MP4 o WebM in Chrome. Funziona anche in Firefox per gli screenshot.

## Come passare a OpenScreenShot

1. Installa OpenScreenShot dal [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) o da [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fissa l’icona alla barra degli strumenti, e sgancia FullPage Capture se si trova nello stesso punto.
3. Apri una pagina lunga e clicca l’icona. Controlla il risultato nell’**Editor**.
4. Imposta **Dopo la cattura** nelle **Impostazioni**: **Editor** per annotare, **Appunti** per incollare subito l’immagine, oppure **Scarica** per salvare un PNG senza aprire schede.
5. Imposta un **Modello nome file** nelle **Impostazioni**, per esempio `{date}_{domain}`, così i file salvati si ordinano per data e sito.
6. Rimuovi FullPage Capture da `chrome://extensions` quando non lo usi più.

Per catture annotate negli issue tracker, consulta [screenshot per le segnalazioni di bug](/it/use-cases/bug-reports/). Il [riferimento delle modalità di cattura](/it/docs/#modes) descrive ogni modalità. Per altri strumenti a pagina intera, consulta l’[alternativa a GoFullPage](/it/alternatives/gofullpage/) e l’[alternativa a FireShot](/it/alternatives/fireshot/).
