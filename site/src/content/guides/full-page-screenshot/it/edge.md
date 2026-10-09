---
title: Come fare uno screenshot a pagina intera in Microsoft Edge
description: Cattura un’intera pagina con lo strumento Screenshot integrato di Edge o il comando dei DevTools, conosci i limiti e usa OpenScreenShot dal Chrome Web Store.
order: 2
---

Microsoft Edge ha uno strumento Screenshot integrato, prima chiamato Web capture. Premi `Ctrl+Shift+S`, seleziona **Capture full page** (cattura pagina intera), poi copia la cattura o salvala sul tuo dispositivo. OpenScreenShot funziona anche in Edge: Edge è un browser Chromium e lo installa dal Chrome Web Store dopo che hai consentito le estensioni di altri store.

## Metodo integrato

Microsoft descrive lo strumento nella sua [guida agli screenshot in Edge](https://www.microsoft.com/en-us/edge/learning-center/screenshot-webpage).

1. Apri la pagina che vuoi catturare.
2. Premi `Ctrl+Shift+S`. Puoi anche fare clic con il tasto destro sulla pagina e selezionare **Screenshot**, oppure aprire **Settings and more** (impostazioni e altro, **...**) e selezionare **Screenshot**.
3. Seleziona **Capture full page**, l’opzione centrale.
4. Nell’anteprima, usa gli strumenti di disegno per annotare la cattura se ti serve.
5. Copia la cattura, oppure salvala sul tuo dispositivo.

Microsoft afferma che la disponibilità delle funzioni può variare in base al tipo di dispositivo, al mercato e alla versione del browser. Gli amministratori possono anche disattivare lo strumento con il [criterio WebCaptureEnabled](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled). Su un computer di lavoro, l’assenza della voce **Screenshot** può significare che quel criterio è impostato.

Edge ha anche la cattura dei DevTools di Chromium. Apri i DevTools, attiva l’emulazione del dispositivo (Device Emulation), apri **More options** (altre opzioni) e seleziona **Capture a full size screenshot**. Microsoft lo documenta nel suo [articolo su Device Mode](https://learn.microsoft.com/en-us/microsoft-edge/devtools/device-mode/). La [guida per Chrome](/it/full-page-screenshot/chrome/) confronta questo metodo con un’estensione.

## Limiti

- **Comportamento non documentato.** Microsoft non documenta come lo strumento Screenshot costruisce un’immagine a pagina intera, la lunghezza massima della pagina, né come tratta intestazioni fisse, caricamento differito e contenitori di scorrimento interni. Controlla ogni cattura prima di condividerla.
- **Contenitori di scorrimento interni.** Alcuni utenti su Microsoft Q&A segnalano che la cattura a pagina intera non è riuscita su pagine che scorrono dentro un elemento interno, per esempio una web app con un riquadro dei contenuti scorrevole. Microsoft non lo ha confermato.
- **Dimensioni della pagina nei DevTools.** La cattura dei DevTools usa il comando screenshot di Chromium, che rifiuta una pagina larga o alta 131.072 pixel CSS o più con l’errore «Page is too large.»
- **Caricamento differito.** Le immagini contrassegnate con `loading="lazy"` si caricano solo quando scorri vicino a esse. Scorri la pagina prima di catturarla, altrimenti parti dell’immagine possono restare vuote.
- **Intestazioni fisse.** Uno strumento di cattura che scorre e unisce più parti ripete ogni elemento che resta sullo schermo. Controlla se un’intestazione compare più di una volta lungo l’immagine.

## Con OpenScreenShot

OpenScreenShot scorre la pagina, la cattura in parti e unisce le parti in un’unica immagine. Le intestazioni fisse vengono catturate una sola volta in cima, e funzionano anche le pagine che fanno scorrere un elemento interno. Una pagina più alta di 32.000 pixel del dispositivo viene salvata in un massimo di sei immagini.

1. Apri la [scheda di OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Edge. Quando Edge lo chiede, seleziona **Allow extensions from other stores** (consenti estensioni da altri store), poi aggiungi l’estensione. Microsoft spiega questo passaggio nella sua [guida alle estensioni](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge).
2. Fissa l’icona di OpenScreenShot alla barra degli strumenti.
3. Apri la pagina e clicca l’icona. Con le impostazioni predefinite parte una cattura a pagina intera e il risultato si apre nell’editor.
4. Controlla la parte iniziale, la parte finale e ogni sezione che si carica durante lo scorrimento.
5. Clicca **Salva immagine** e scegli PNG, JPEG, WebP o PDF, oppure clicca **Copia**.

La scorciatoia per la pagina intera di OpenScreenShot è `Ctrl+Shift+S`, gli stessi tasti dello strumento Screenshot di Edge. Se i tasti aprono lo strumento di Edge, clicca invece l’icona, oppure imposta un tasto diverso con il link **Scorciatoie** nel menu di cattura. Il [riferimento delle modalità di cattura](/it/docs/#modes) elenca le altre modalità.

## Quale usare

- Usa lo strumento Screenshot di Edge per una cattura rapida con qualche segno a penna, su una pagina che fa scorrere l’intera finestra.
- Usa OpenScreenShot quando una pagina fa scorrere un pannello interno, quando ti serve l’esportazione in PDF, JPEG o WebP, oppure quando ti servono numeri di passo e oscuramento pieno, come nella [documentazione di aiuto e nei tutorial](/it/use-cases/documentation/) o nelle [risposte di assistenza](/it/use-cases/customer-support/).
- Usa la cattura dei DevTools quando l’amministratore ha disattivato lo strumento Screenshot e non puoi installare estensioni.

Il [riferimento dell’esportazione](/it/docs/#export) descrive formati di file e scala. Per le pagine che OpenScreenShot non può catturare, come le impostazioni del browser, consulta [assistenza e limitazioni note](/it/support/).
