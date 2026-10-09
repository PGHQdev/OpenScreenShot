---
title: Come fare uno screenshot a pagina intera in Vivaldi
description: Cattura un’intera pagina in PNG o JPEG con lo strumento Capture di Vivaldi, conosci il suo limite di 30.000 pixel e usa OpenScreenShot dal Chrome Web Store.
order: 7
---

Vivaldi ha uno strumento Capture integrato. Clicca l’icona della fotocamera nella Status Bar, seleziona **Full Page** (pagina intera), scegli PNG, JPEG o gli appunti e clicca **Capture** (cattura). Le catture Full Page si fermano a 30.000 pixel. OpenScreenShot funziona anche in Vivaldi: Vivaldi è un browser Chromium e installa le estensioni dal Chrome Web Store.

## Metodo integrato

Vivaldi descrive lo strumento in [Capture a screenshot](https://help.vivaldi.com/desktop/tools/capture-a-screenshot/).

1. Apri la pagina che vuoi catturare.
2. Clicca l’icona della fotocamera nella Status Bar. Puoi anche aprire i Quick Commands con `F2` su Windows e Linux, oppure `Cmd+E` su macOS, e digitare `Capture`.
3. Seleziona **Full Page**.
4. Seleziona il formato di uscita: **Save as PNG** (salva come PNG), **Save as JPEG** (salva come JPEG) o **Copy to Clipboard** (copia negli appunti).
5. Clicca **Capture**. I file salvati vanno nella cartella impostata in **Settings** > **Webpages** > **Image Capture** > **Capture Storage Folder** (Impostazioni > Pagine web > Cattura immagini > Cartella di archiviazione delle catture).

Vivaldi può anche trasformare una cattura in una nuova nota nel pannello Notes, con la data della cattura e l’URL della pagina.

L’[elenco delle scorciatoie da tastiera di Vivaldi](https://help.vivaldi.com/desktop/shortcuts/keyboard-shortcuts/) non mostra alcun tasto predefinito per la cattura della pagina. Per averne uno, apri **Settings** > **Keyboard** (Impostazioni > Tastiera) e associa un tasto a **Capture Page to disk** (cattura pagina su disco) o **Capture Page to Clipboard** (cattura pagina negli appunti).

## Limiti

- **Dimensioni.** Le catture Full Page arrivano al massimo a 30.000 pixel. Su una pagina più lunga, cattura le sezioni che ti servono.
- **Comportamento non documentato.** Vivaldi non documenta come costruisce l’immagine a pagina intera, né come tratta le intestazioni fisse. Controlla in cima e al centro dell’immagine se un’intestazione manca o è ripetuta.
- **Caricamento differito.** Le immagini contrassegnate con `loading="lazy"` si caricano solo quando scorri vicino a esse. Scorri la pagina prima di catturarla, altrimenti parti dell’immagine possono restare vuote.
- **Contenitori di scorrimento interni.** Alcuni sviluppatori segnalano che le catture a pagina intera in Chromium, Firefox e WebKit mostrano solo un’altezza di schermo di un pannello che scorre dentro una struttura ad altezza fissa. Vivaldi non documenta il suo comportamento in questo caso, quindi controlla le web app e i siti di documentazione con un riquadro dei contenuti scorrevole.
- **Annotazioni.** Vivaldi non documenta strumenti di disegno o annotazione per le catture. Per aggiungere frecce o testo, apri il file in un’altra app.

## Con OpenScreenShot

OpenScreenShot scorre la pagina una schermata alla volta e unisce le parti in un’unica immagine. Le intestazioni fisse vengono catturate una sola volta in cima, e funzionano anche le pagine che fanno scorrere un elemento interno. Una pagina più alta di 32.000 pixel del dispositivo viene salvata in un massimo di sei immagini.

1. Apri la [scheda di OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Vivaldi e aggiungi l’estensione. Vivaldi descrive le installazioni dal Chrome Web Store nella sua [guida alle estensioni](https://help.vivaldi.com/desktop/appearance-customization/extensions/).
2. Fissa l’icona di OpenScreenShot alla barra degli strumenti.
3. Apri la pagina e clicca l’icona, oppure premi `Ctrl+Shift+S` (`⌘⇧S` su macOS). Con le impostazioni predefinite parte una cattura a pagina intera e il risultato si apre nell’editor.
4. Controlla la parte iniziale, la parte finale e ogni barra di navigazione fissa.
5. Clicca **Salva immagine** e scegli PNG, JPEG, WebP o PDF, oppure clicca **Copia**.

Se l’icona apre un menu, seleziona **Pagina intera**; l’impostazione **Modalità Express con un clic** controlla questo comportamento. L’editor aggiunge frecce, testo, numeri di passo, sfocatura e ritaglio prima dell’esportazione. Il [riferimento delle modalità di cattura](/it/docs/#modes) e il [riferimento dell’esportazione](/it/docs/#export) elencano ogni opzione.

## Quale usare

- Usa lo strumento Capture di Vivaldi per un PNG o un JPEG di una pagina sotto i 30.000 pixel, soprattutto quando vuoi la cattura in una nota con il suo URL.
- Usa OpenScreenShot per pagine più lunghe, pagine che fanno scorrere un pannello interno o catture che vuoi annotare o salvare in PDF, come nella [documentazione di aiuto e nei tutorial](/it/use-cases/documentation/) o nella [revisione del design](/it/use-cases/design-review/).
- Associa una scorciatoia di Vivaldi se catturi spesso e non ti servono annotazioni.

La [guida per Opera](/it/full-page-screenshot/opera/) e la [guida per Brave](/it/full-page-screenshot/brave/) trattano altri browser Chromium con propri strumenti di cattura. Per le pagine che bloccano le estensioni, come le impostazioni del browser, consulta [assistenza e limitazioni note](/it/support/).
