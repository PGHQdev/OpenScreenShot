---
title: 'Come fare uno screenshot a pagina intera in Chrome: DevTools o un’estensione'
description: Usa il comando Capture full size screenshot dei DevTools di Chrome, scopri dove non basta e confrontalo con una cattura a pagina intera in OpenScreenShot.
order: 1
---

Chrome può fare uno screenshot a pagina intera senza estensioni, ma solo dai DevTools. Apri i DevTools, apri il Command Menu, digita `screenshot` ed esegui **Capture full size screenshot** (cattura screenshot a dimensione intera). Chrome salva l’intera pagina come file PNG. I normali menu di Chrome non hanno una voce per gli screenshot: la guida di Google elenca Share, Send to your devices e Create QR code sotto **Cast, save, and share** (trasmetti, salva e condividi). Per una cattura che puoi annotare, esportare in PDF o fare su una pagina che scorre dentro un pannello, installa OpenScreenShot e clicca la sua icona.

## Metodo integrato

1. Apri la pagina che vuoi catturare.
2. [Apri i DevTools](https://developer.chrome.com/docs/devtools/open): premi `F12` o `Ctrl+Shift+I` su Windows e Linux, oppure `Cmd+Option+I` su macOS.
3. Apri il [Command Menu](https://developer.chrome.com/docs/devtools/command-menu): premi `Ctrl+Shift+P`, oppure `Cmd+Shift+P` su macOS.
4. Digita `screenshot` e seleziona **Capture full size screenshot**.
5. Chrome salva un file PNG dell’intera pagina.

La stessa cattura si trova nella modalità dispositivo (Device Mode). Attiva la barra degli strumenti del dispositivo, apri il suo menu **More options** (altre opzioni) e seleziona la voce dello screenshot a dimensione intera. La [documentazione di Google su Device Mode](https://developer.chrome.com/docs/devtools/device-mode) la chiama **Capture a full size screenshot**.

Non esiste una singola scorciatoia per l’intera sequenza. Google non documenta strumenti di annotazione per la cattura, quindi frecce, testo e oscuramento vanno fatti in un’altra app.

## Limiti

- **I DevTools devono essere aperti.** Il comando si trova solo nel Command Menu e nel menu della modalità dispositivo.
- **Dimensioni della pagina.** Chromium rifiuta una pagina larga o alta 131.072 pixel CSS o più, con l’errore «Page is too large.»
- **Elementi sticky e fissi.** Per la cattura, Chromium ridimensiona la vista all’intera dimensione della pagina e nasconde le barre di scorrimento. Le sezioni dimensionate sull’altezza della finestra (`100vh`) e le intestazioni o i piè di pagina fissi possono quindi disporsi rispetto a quella vista alta. Un piè di pagina fisso può comparire una volta in fondo all’immagine, e una sezione hero a tutta altezza può allungarsi.
- **Caricamento differito.** Immagini e frame contrassegnati con `loading="lazy"` si caricano solo quando scorri vicino a essi. Scorri la pagina prima di eseguire il comando, altrimenti parti dell’immagine possono restare vuote.
- **Contenitori di scorrimento interni.** Chromium dimensiona la cattura in base alla dimensione di scorrimento della pagina stessa. Quando una pagina fa scorrere un pannello dentro una struttura ad altezza fissa, per esempio una web app o un sito di documentazione con un riquadro dei contenuti scorrevole, la cattura mostra solo un’altezza di schermo di quel pannello.

## Con OpenScreenShot

OpenScreenShot scorre la pagina una schermata alla volta, cattura ogni parte e unisce le parti in un’unica immagine. Cattura le intestazioni fisse nella prima parte e le inserisce una sola volta in cima. Funzionano anche le pagine che fanno scorrere un elemento interno invece della finestra. Una pagina più alta di 32.000 pixel del dispositivo viene salvata in un massimo di sei immagini.

1. Installa [OpenScreenShot dal Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) e fissa la sua icona alla barra degli strumenti.
2. Apri la pagina e clicca l’icona, oppure premi `Ctrl+Shift+S` (`⌘⇧S` su macOS).
3. Controlla il risultato nell’editor, soprattutto la parte iniziale, la parte finale e ogni barra di navigazione fissa.
4. Clicca **Salva immagine** e scegli PNG, JPEG, WebP o PDF. **Copia** e **PDF** accanto completano l’operazione con un clic.

Se si apre un menu invece di una cattura, seleziona **Pagina intera**. L’impostazione **Modalità Express con un clic** controlla questo comportamento. La [guida agli screenshot a pagina intera in Chrome](/it/blog/full-page-screenshot-chrome/) illustra l’estensione passo per passo, comprese le sezioni mancanti o ripetute. Il [riferimento delle modalità di cattura](/it/docs/#modes) e il [riferimento dell’esportazione](/it/docs/#export) elencano ogni opzione.

## DevTools e OpenScreenShot a confronto

- **Avvio:** i DevTools richiedono due scorciatoie e un comando digitato. OpenScreenShot richiede un clic o una scorciatoia.
- **Risultato:** i DevTools salvano un PNG. OpenScreenShot esporta PNG, JPEG, WebP o PDF, oppure copia l’immagine.
- **Modifica:** i DevTools non ne offrono. OpenScreenShot apre un editor con frecce, testo, numeri di passo, sfocatura e ritaglio.
- **Installazione:** i DevTools sono già in Chrome. OpenScreenShot è un’estensione con licenza MIT che elabora le catture in locale.

## Quale usare

- Usa i DevTools per un PNG occasionale di una pagina normale su un computer dove non puoi aggiungere estensioni.
- Usa OpenScreenShot per le pagine che fanno scorrere un pannello interno, le pagine con intestazioni fisse e le catture che vuoi annotare prima di condividerle, come nelle [segnalazioni di bug](/it/use-cases/bug-reports/) o nella [revisione del design](/it/use-cases/design-review/).
- Puoi usare entrambi anche in Microsoft Edge; la [guida per Edge](/it/full-page-screenshot/edge/) descrive lo strumento Screenshot di Edge.

Se una cattura non riesce su una pagina del browser come `chrome://settings`, consulta [assistenza e limitazioni note](/it/support/).
