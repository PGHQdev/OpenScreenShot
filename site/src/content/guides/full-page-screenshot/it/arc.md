---
title: Come fare uno screenshot a pagina intera in Arc
description: Esegui il comando Capture Full Page di Arc su macOS per salvare un PNG, scopri cosa Arc non documenta e usa OpenScreenShot dal Chrome Web Store.
order: 8
---

Arc per macOS ha un comando **Capture Full Page** (cattura pagina intera). Premi `Cmd+T` per aprire la Command Bar, digita `Capture Full Page` e selezionalo. Arc scarica un PNG dell’intera pagina nella posizione di download predefinita. La guida di Arc documenta questo comando solo per macOS. OpenScreenShot funziona anche in Arc: Arc è un browser Chromium e installa le estensioni dal Chrome Web Store.

## Metodo integrato

Arc descrive il comando in [How to take full page screen captures in Arc](https://resources.arc.net/hc/en-us/articles/25481392111895-How-To-Take-Full-Page-Screen-Captures-in-Arc).

1. Apri la pagina che vuoi catturare.
2. Premi `Cmd+T` per aprire la Command Bar, digita `Capture Full Page` e selezionalo. Puoi anche scegliere **File** > **Capture Full Page**.
3. Arc scarica un PNG nella posizione di download predefinita.

Il comando non ha una scorciatoia predefinita. Per aggiungerne una, apri **Arc** > **Settings** (Impostazioni) > **Shortcuts** (Scorciatoie), cerca `capture` e imposta un tasto per **Capture Full Page**.

Per uno screenshot con stile, attiva la [Developer Mode](https://resources.arc.net/hc/en-us/articles/20468488031511-Developer-Mode-Instant-Dev-Tools) e usa il pulsante screenshot nella barra degli strumenti, oppure esegui **Capture in Portrait Mode** (cattura in modalità ritratto) dalla Command Bar. Lo strumento Capture separato di Arc cattura una selezione con modifica ed Easels, ed è anch’esso solo per macOS.

## Limiti

- **Solo macOS.** Arc non documenta alcun comando per la pagina intera in Arc per Windows.
- **Comportamento non documentato.** Arc non documenta come costruisce l’immagine, il suo limite di dimensione né come tratta le intestazioni fisse. Controlla in cima e al centro del PNG se un’intestazione manca o è ripetuta.
- **Annotazioni.** Arc non documenta la modifica delle catture a pagina intera. Per aggiungere frecce o testo, apri il PNG in un’altra app.
- **Caricamento differito.** Le immagini contrassegnate con `loading="lazy"` si caricano solo quando scorri vicino a esse. Scorri la pagina prima di catturarla, altrimenti parti dell’immagine possono restare vuote.
- **Contenitori di scorrimento interni.** Alcuni sviluppatori segnalano che le catture a pagina intera in Chromium, Firefox e WebKit mostrano solo un’altezza di schermo di un pannello che scorre dentro una struttura ad altezza fissa. Controlla le web app e i siti di documentazione con un riquadro dei contenuti scorrevole.
- **Scorrimento infinito.** Un feed che continua a caricare non ha una vera fine. La cattura contiene solo ciò che si è caricato prima dell’avvio.

## Con OpenScreenShot

OpenScreenShot scorre la pagina una schermata alla volta e unisce le parti in un’unica immagine. Le intestazioni fisse vengono catturate una sola volta in cima, e funzionano anche le pagine che fanno scorrere un elemento interno. Una pagina più alta di 32.000 pixel del dispositivo viene salvata in un massimo di sei immagini.

1. Apri la [scheda di OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Arc e aggiungi l’estensione. Arc descrive le installazioni dal Chrome Web Store in [Extensions in Arc](https://resources.arc.net/hc/en-us/articles/19434259167767-Extensions-in-Arc-How-to-Import-Add-Open).
2. Fissa l’icona di OpenScreenShot.
3. Apri la pagina e clicca l’icona, oppure premi `⌘⇧S`. Con le impostazioni predefinite parte una cattura a pagina intera e il risultato si apre nell’editor.
4. Controlla la parte iniziale, la parte finale e ogni barra di navigazione fissa.
5. Clicca **Salva immagine** e scegli PNG, JPEG, WebP o PDF, oppure clicca **Copia**.

Se l’icona apre un menu, seleziona **Pagina intera**; l’impostazione **Modalità Express con un clic** controlla questo comportamento. Per dare stile alla cattura in OpenScreenShot, apri il pannello **Beautify** nell’editor: aggiunge spaziatura, angoli arrotondati, un’ombra e uno sfondo sfumato, in tinta unita o trasparente, e la cornice arriva in ogni esportazione. Il [riferimento delle modalità di cattura](/it/docs/#modes) e il [riferimento dell’esportazione](/it/docs/#export) elencano ogni opzione.

## Quale usare

- Usa **Capture Full Page** in Arc su macOS per un PNG rapido di una pagina che fa scorrere l’intera finestra.
- Usa OpenScreenShot sulle pagine che fanno scorrere un pannello interno, o quando vuoi annotare, oscurare o salvare la cattura in PDF, come nella [revisione del design](/it/use-cases/design-review/).
- Usa il pannello **Beautify** di OpenScreenShot per un’immagine con stile, con spaziatura e sfondo a tua scelta, come negli [screenshot per i social media](/it/use-cases/social-media/).

La [guida per Chrome](/it/full-page-screenshot/chrome/) confronta la cattura dei DevTools di Chrome con l’estensione, e la [guida per Brave](/it/full-page-screenshot/brave/) tratta un altro browser Chromium con uno strumento integrato. Per le pagine che bloccano le estensioni, come le impostazioni del browser, consulta [assistenza e limitazioni note](/it/support/).
