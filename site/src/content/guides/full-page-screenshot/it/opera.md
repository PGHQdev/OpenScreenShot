---
title: Come fare uno screenshot a pagina intera in Opera
description: Lo strumento Snapshot di Opera salva una pagina intera solo come PDF. Scopri passi e limiti, e come catturare un’immagine a pagina intera con OpenScreenShot.
order: 6
---

Lo strumento Snapshot integrato in Opera cattura una selezione o l’area visibile come immagine, e la pagina intera solo come PDF. Premi `Shift+Ctrl+5` (`Shift+Cmd+2` su macOS) e seleziona **Save page as PDF** (salva pagina come PDF). Per un file immagine a pagina intera, installa OpenScreenShot. Opera è un browser Chromium e lo installa dal Chrome Web Store dopo che hai aggiunto il componente **Install Chrome Extensions** di Opera.

## Metodo integrato

Opera descrive Snapshot nella sua [pagina di aiuto sulle funzioni](https://help.opera.com/en/latest/features/) e nella sua [pagina su Snapshot](https://www.opera.com/features/snapshot).

1. Apri la pagina che vuoi catturare.
2. Premi `Shift+Ctrl+5` su Windows e Linux, oppure `Shift+Cmd+2` su macOS. Puoi anche cliccare l’icona della fotocamera sul lato destro della barra degli strumenti.
3. Seleziona **Save page as PDF**. Opera salva l’intera pagina, dall’alto in basso, come PDF.

Snapshot ha due opzioni per le immagini. **Capture Full Screen** (cattura schermo intero) cattura solo l’area visibile della pagina, e **Capture** (cattura) cattura un riquadro che regoli tu. Entrambe producono un’immagine che puoi annotare con Zoom, Arrow, Blur, Highlight, Pencil, Selfie camera, Emojis e Text, poi salvare come PNG con **Save Image** (salva immagine) o copiare negli appunti.

## Limiti

- **PDF solo per la pagina intera.** Le catture come immagine coprono l’area visibile o una selezione. Per avere l’intera pagina, ottieni un PDF.
- **Layout non documentato.** Opera non documenta se il PDF è una sola pagina lunga o più pagine, come tratta le intestazioni fisse, né come gestisce una pagina che fa scorrere un pannello dentro una struttura ad altezza fissa. Apri il PDF e controllalo prima di condividerlo.
- **Caricamento differito.** Le immagini contrassegnate con `loading="lazy"` si caricano solo quando scorri vicino a esse. Scorri la pagina prima di salvarla, altrimenti alcune parti possono restare vuote.
- **Scorrimento infinito.** Un feed che continua a caricare non ha una vera fine. Qualsiasi cattura contiene solo ciò che si è caricato prima dell’avvio.

## Con OpenScreenShot

OpenScreenShot scorre la pagina, la cattura in parti e unisce le parti in un’unica immagine. Le intestazioni fisse vengono catturate una sola volta in cima, e funzionano anche le pagine che fanno scorrere un elemento interno. Una pagina più alta di 32.000 pixel del dispositivo viene salvata in un massimo di sei immagini.

1. Aggiungi il componente **Install Chrome Extensions** dai componenti aggiuntivi di Opera. Opera lo spiega in [Using add-ons from Chrome in Opera](https://blogs.opera.com/tips-and-tricks/2021/10/using-addons-from-chrome-in-opera/).
2. Apri la [scheda di OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) e aggiungi l’estensione.
3. Fissa l’icona di OpenScreenShot alla barra degli strumenti.
4. Apri la pagina e clicca l’icona, oppure premi `Ctrl+Shift+S` (`⌘⇧S` su macOS). Con le impostazioni predefinite parte una cattura a pagina intera e il risultato si apre nell’editor.
5. Controlla la parte iniziale, la parte finale e ogni barra di navigazione fissa.
6. Clicca **Salva immagine** e scegli PNG, JPEG, WebP o PDF, oppure clicca **Copia**.

Se l’icona apre un menu, seleziona **Pagina intera**; l’impostazione **Modalità Express con un clic** controlla questo comportamento. Un PDF di OpenScreenShot contiene lo screenshot come immagine, quindi appare come la pagina sullo schermo, ma il suo testo non si può cercare né selezionare. In **Formato pagina**, **Intera** crea una sola pagina delle dimensioni dell’immagine, e **A4** o **Letter** possono dividere una cattura lunga su più pagine. La [guida da screenshot a PDF](/it/blog/save-screenshot-as-pdf/) confronta questi layout.

## Quale usare

- Usa **Save page as PDF** di Snapshot per un PDF rapido a pagina intera senza installare nulla.
- Usa le opzioni immagine di Snapshot per l’area visibile o una selezione con qualche segno.
- Usa OpenScreenShot per un PNG, JPEG o WebP a pagina intera, per le pagine che fanno scorrere un pannello interno, o per un PDF che corrisponde allo schermo, come nella [revisione del design](/it/use-cases/design-review/) o in una [copia salvata di una pagina](/it/use-cases/archive-web-pages/).

Il [riferimento delle modalità di cattura](/it/docs/#modes) e il [riferimento dell’esportazione](/it/docs/#export) elencano ogni opzione. La [guida per Vivaldi](/it/full-page-screenshot/vivaldi/) tratta un altro browser Chromium con un proprio strumento di cattura. Per le pagine che bloccano le estensioni, come le impostazioni del browser, consulta [assistenza e limitazioni note](/it/support/).
