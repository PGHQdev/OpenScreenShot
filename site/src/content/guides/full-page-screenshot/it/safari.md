---
title: Come fare uno screenshot a pagina intera in Safari
description: Safari su Mac non cattura immagini a pagina intera. Salva l’intera pagina come PDF, cattura un elemento con Web Inspector o usa un altro browser.
order: 4
---

Safari su Mac non ha un comando per gli screenshot a pagina intera. L’opzione integrata più vicina è un PDF: scegli **File** > **Print** (Stampa), clicca **PDF** in fondo alla finestra e salva il file. Per un file immagine, il Web Inspector di Safari può catturare un elemento della pagina. OpenScreenShot non ha una versione per Safari. Safari installa le Safari Web Extensions dal Mac App Store e non può installare pacchetti del Chrome Web Store o componenti aggiuntivi di Firefox. Su un Mac, Chrome, Firefox, Edge e altri browser possono eseguire OpenScreenShot.

## Metodo integrato

### Salva la pagina come PDF

Apple descrive questo metodo in [Print or create a PDF of a webpage in Safari](https://support.apple.com/guide/safari/print-or-create-a-pdf-of-a-webpage-ibrw1060/18.0/mac/15.0).

1. Apri la pagina che vuoi conservare.
2. Scorri la pagina una volta, così si caricano le immagini che arrivano in ritardo.
3. Scegli **File** > **Print**.
4. Per mantenere i colori della pagina, attiva la stampa delle immagini e dei colori di sfondo nelle opzioni di stampa. Puoi anche aggiungere l’indirizzo web e la data nelle intestazioni e nei piè di pagina.
5. Clicca **PDF** in fondo alla finestra e salva il file.

### Cattura un elemento con Web Inspector

1. Scegli **Safari** > **Settings** (Impostazioni) > **Advanced** (Avanzate) e seleziona **Show features for web developers** (mostra funzioni per sviluppatori web). WebKit lo spiega in [Enabling Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/).
2. Apri la pagina e premi `Option+Cmd+I` per aprire Web Inspector.
3. Nella scheda **Elements** (Elementi), fai clic con il tasto destro su un nodo, per esempio `<html>` o `<body>`, e seleziona **Capture Screenshot** (cattura screenshot).
4. Safari salva in un file l’istantanea di quel nodo.

Apple non documenta se una cattura di `<html>` includa il contenuto sotto la parte visibile della pagina, né quale formato di immagine scriva. Controlla il file prima di farci affidamento.

## Limiti

- **Nessuna immagine a pagina intera.** Nessuno dei due metodi produce lo screenshot che otterresti da uno strumento di cattura a pagina intera. Il PDF è una versione di stampa della pagina, e la voce di Web Inspector cattura un solo nodo.
- **Layout di stampa.** Il PDF usa il layout di stampa, quindi la pagina nel file può apparire diversa da quella sullo schermo. Attiva immagini e colori di sfondo se il design dipende da essi.
- **Caricamento differito.** Le immagini contrassegnate con `loading="lazy"` si caricano solo quando scorri vicino a esse. Scorri la pagina prima di stamparla o catturarla, altrimenti alcune parti possono restare vuote.
- **Contenitori di scorrimento interni.** Alcuni sviluppatori segnalano che le catture automatiche a pagina intera in WebKit, il motore di Safari, mostrano solo un’altezza di schermo quando una pagina fa scorrere un pannello dentro una struttura ad altezza fissa. Controlla con attenzione le pagine costruite in quel modo.
- **Intestazioni fisse.** Controlla nel risultato se un’intestazione manca, è ripetuta o è nel posto sbagliato.

## Con OpenScreenShot

OpenScreenShot non è disponibile per Safari. Se hai Chrome, Firefox, Edge, Brave, Opera, Vivaldi o Arc sullo stesso Mac, apri lì la pagina e usa l’estensione. Chrome e gli altri browser Chromium la installano dal [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). Firefox la installa da [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).

1. Installa OpenScreenShot nell’altro browser e fissa la sua icona alla barra degli strumenti.
2. Apri la pagina e clicca l’icona. In Chrome, anche `⌘⇧S` avvia una cattura a pagina intera.
3. Controlla il risultato nell’editor.
4. Clicca **Salva immagine** e scegli PNG, JPEG, WebP o PDF.

L’estensione scorre la pagina, unisce le parti in un’unica immagine e inserisce le intestazioni fisse una sola volta in cima. Una pagina più alta di 32.000 pixel del dispositivo viene salvata in un massimo di sei immagini. La [guida per Chrome](/it/full-page-screenshot/chrome/) e la [guida per Firefox](/it/full-page-screenshot/firefox/) danno i passi per ciascun browser, compresi i loro strumenti integrati.

## Quale usare

- Usa **File** > **Print** > **PDF** in Safari per conservare una copia leggibile di un articolo o di una pagina di ricevuta.
- Usa **Capture Screenshot** di Web Inspector per un’immagine di una parte della pagina, come una scheda o un grafico.
- Usa OpenScreenShot in un altro browser sul tuo Mac per un’immagine a pagina intera da annotare, o per un PDF della pagina così come appare sullo schermo. La [guida da screenshot a PDF](/it/blog/save-screenshot-as-pdf/) confronta i layout PDF, e [salvare una copia visiva di una pagina](/it/use-cases/archive-web-pages/) tratta nomi dei file e archiviazione.

Per altre domande, consulta [assistenza e limitazioni note](/it/support/).
