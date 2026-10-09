---
title: 'Alternativa a Lightshot: cattura a pagina intera senza caricamenti pubblici'
description: Lightshot o OpenScreenShot? Cattura a pagina intera, sfocatura ed export PDF nel browser, con i file sul tuo dispositivo e nessun link prnt.sc.
order: 6
---

Passa a OpenScreenShot se fai screenshot di pagine web in Chrome o Firefox e vuoi cattura a pagina intera, sfocatura ed esportazione PDF, con file che restano sul tuo dispositivo. Resta con Lightshot se catturi altre app o l’intero desktop: Lightshot ha app desktop per Windows e Mac, mentre OpenScreenShot cattura solo pagine web nel browser. Resta anche se dipendi dai suoi link brevi istantanei. OpenScreenShot non ha un servizio di caricamento, quindi condividi una cattura incollandola o allegando il file.

OpenScreenShot è il nostro prodotto. Le informazioni su Lightshot in questa pagina sono aggiornate al 9 ottobre 2026 e provengono dalla sua [scheda sul Chrome Web Store](https://chromewebstore.google.com/detail/mbniclmhobmnbdlbpiphghaielnnpgdp), dal suo [sito web](https://app.prntscr.com/en/index.html), dalla sua [pagina su Firefox Add-ons](https://addons.mozilla.org/firefox/addon/lightshot/) e dal manifest della versione 7.0.1 ottenuto dal server di aggiornamento di Google.

## Lightshot e OpenScreenShot a confronto

|                                   | Lightshot                                                                              | OpenScreenShot                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Prezzo                            | Gratuito                                                                               | Gratuito                                                        |
| Open source                       | No (licenza personalizzata)                                                            | Sì, MIT                                                         |
| Accesso ai siti all’installazione | Tutti i siti web (`*://*/*` obbligatorio)                                              | Nessuno. Accesso alla scheda corrente quando avvii una cattura  |
| Cattura a pagina intera           | No; la scheda descrive la selezione di un’area                                         | Sì                                                              |
| Annotazioni e sfocatura           | Modifica sul posto                                                                     | Forme, frecce, testo, numeri di passo, sfocatura, ritaglio      |
| Esportazione PDF                  | No                                                                                     | Sì                                                              |
| Registrazione della scheda        | No                                                                                     | Sì, in Chrome (la versione per Firefox cattura solo screenshot) |
| Account o cloud                   | Caricamento facoltativo su prnt.sc per un link breve; salvataggio su disco disponibile | Nessun account, nessun caricamento                              |
| Cattura del desktop               | Sì, con le app per Windows e Mac                                                       | No                                                              |

L’estensione Lightshot per Chrome è stata aggiornata l’ultima volta il 23 luglio 2024.

## Caricamenti e link di condivisione

Lightshot può caricare uno screenshot su prnt.sc e darti un link breve. Per vedere un caricamento non serve un account. Nel 2021, [Kaspersky ha segnalato](https://www.kaspersky.com/blog/cryptoscam-in-lightshot/39224/) che gli URL erano sequenziali, quindi cambiando un carattere si poteva aprire un’altra immagine, e che «Anyone can see published screenshots without authentication» (chiunque può vedere gli screenshot pubblicati senza autenticazione). Quello stesso anno [AIN.UA ha segnalato](https://en.ain.ua/2021/09/08/lightshot-allows-people-to-view-screenshots-of-other-users) lo stesso problema. Non abbiamo verificato se questo valga ancora nel 2026.

OpenScreenShot non ha un passaggio di caricamento. Elabora e conserva le catture nel browser, e un file esportato va nella cartella dei download. Nessuno vede una cattura finché non la incolli o la alleghi da qualche parte. La [sezione sulla privacy](/it/docs/#privacy) contiene i dettagli.

## Cosa resta uguale

La cattura rapida di una regione resta. Premi `Ctrl+Shift+E` (`⌘⇧E` su macOS) o fai clic con il tasto destro sulla pagina e scegli **Regione selezionata**, poi trascina un rettangolo e premi `Enter`. L’editor si apre con frecce, testo, forme ed evidenziatore. **Copia** mette l’immagine negli appunti, pronta da incollare in una chat.

Per saltare l’editor, imposta **Dopo la cattura** su **Appunti**. Ogni cattura va quindi direttamente negli appunti, un comportamento vicino all’abitudine di catturare e incollare.

## Cosa cambia

Puoi catturare una parte più ampia della pagina. **Pagina intera** scorre la pagina e la unisce in un’unica immagine. **Cattura elemento** cattura una scheda, una tabella o un grafico esattamente entro i suoi limiti. **Area visibile** cattura ciò che è sullo schermo nella scheda.

L’editor aggiunge **Sfocatura** (`B`) con una sfocatura leggera, un mosaico o il riempimento **Pieno**, che copre completamente i dati privati. I badge **Numero passo** si incrementano da soli. Clicca **Salva immagine** per aprire la finestra **Esporta** e salvare in PNG, JPEG, WebP o PDF.

L’accesso all’installazione è più limitato. OpenScreenShot usa `activeTab` per una scheda alla volta, e non può catturare le pagine delle impostazioni del browser, le pagine delle estensioni o qualsiasi cosa fuori dal browser. Per un’app desktop o la finestra di un altro programma, ti serve comunque uno strumento desktop.

## Come passare a OpenScreenShot

1. Installa OpenScreenShot dal [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) o da [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fissa l’icona alla barra degli strumenti.
3. Prova una prima cattura. Un clic sull’icona avvia una cattura **Pagina intera** con la **Modalità Express con un clic** predefinita. Per un’area, usa `Ctrl+Shift+E` o il menu del tasto destro.
4. Imposta **Dopo la cattura** nelle **Impostazioni**: **Appunti** per incollare subito, **Editor** per annotare, oppure **Scarica** per salvare un PNG.
5. Se tieni un’app desktop per gli screenshot di altri programmi, assicurati che non usi gli stessi tasti di OpenScreenShot. In Chrome puoi cambiare i tasti dell’estensione in `chrome://extensions/shortcuts`.

Per immagini rapide nelle risposte di assistenza, consulta [screenshot per l’assistenza clienti](/it/use-cases/customer-support/). Per i post, consulta [screenshot per i social media](/it/use-cases/social-media/). Se ti serve la cattura del desktop, consulta la pagina [alternativa a Snagit](/it/alternatives/snagit/) per sapere cosa copre uno strumento desktop.
