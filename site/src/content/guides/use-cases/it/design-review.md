---
title: Come catturare una pagina web per la revisione del design
description: Cattura una pagina intera o un singolo componente, guida i revisori ai dettagli con spotlight e note di testo e condividi un PDF di più pagine.
order: 2
---

Per una revisione del design, cattura l’intera pagina con **Pagina intera**, segna i punti su cui vuoi un parere e condividi un PDF che i revisori possono leggere pagina per pagina. In OpenScreenShot, **Spotlight** scurisce tutto ciò che è fuori dall’area in discussione, e **Testo** e **Freccia** aggiungono note. Usa **Cattura elemento** quando la revisione riguarda un solo componente, come una scheda, un grafico o una tabella.

## Prepara una pagina per la revisione passo per passo

1. Apri la pagina alla larghezza di finestra che vuoi revisionare. La cattura mostra il layout alla larghezza corrente, quindi ridimensiona prima la finestra per revisionare un altro breakpoint.
2. Scorri la pagina una volta, così si caricano le immagini con caricamento differito, poi torna in cima. Chiudi i banner dei cookie e i widget di chat che non fanno parte della revisione.
3. Clicca l’icona di OpenScreenShot. Con le impostazioni predefinite, questo avvia una cattura **Pagina intera**. Lascia la scheda dove si trova finché non si apre l’editor.
4. Controlla la prima e l’ultima sezione, l’intestazione e ogni area in movimento, come un carosello.
5. Seleziona **Spotlight** (`O`) e trascina su ogni area che vuoi far guardare ai revisori. Più ritagli si uniscono in un unico livello scurito.
6. Aggiungi una nota di **Testo** (`T`) accanto a ogni area, e una **Freccia** (`A`) dove una nota deve indicare un piccolo dettaglio.
7. Clicca **Salva immagine** per aprire la finestra **Esporta**. Scegli **PDF**, poi segui i passi di esportazione qui sotto.

## Cattura un singolo componente

Fai clic con il tasto destro sulla pagina, apri il sottomenu **OpenScreenShot** e scegli **Cattura elemento**. Passa il puntatore sul componente finché non è evidenziato, poi clicca o premi `Enter` per catturarne i limiti. Premi `↑` per selezionare l’elemento padre, per esempio la sezione che contiene una scheda, e `←` o `→` per passare a un elemento vicino.

Una cattura di elemento produce un’immagine aderente senza ritaglio manuale, utile per confrontare due versioni dello stesso componente. Se l’elemento non è completamente visibile sullo schermo, il selettore propone invece una cattura a pagina intera.

## Segna i commenti in modo che i revisori li seguano

I ritagli dello spotlight possono essere un rettangolo, un rettangolo arrotondato o un’ellisse. Usa un’immagine con spotlight per ogni argomento: un’immagine con molte aree illuminate costringe i revisori a indovinare quale nota va con quale area. Per commenti numerati, aggiungi un **Numero passo** (`S`) in ogni punto e cita i numeri nella discussione della revisione. I numeri si incrementano da soli e si rinumerano quando ne elimini uno.

Lo strumento **Forma** (`R`) disegna un contorno attorno a un’area senza scurire il resto della pagina. Lo strumento **Freccia** offre punte piene, aperte, doppie e a punto, e puoi trascinare la sua maniglia centrale per curvarla attorno ad altri contenuti.

## Condividi la revisione come PDF

Nella finestra **Esporta**, scegli **PDF**, seleziona **A4** o **Letter** in **Formato pagina** e attiva **Dividi su più pagine**. Le pagine consecutive si sovrappongono di 5 mm, quindi una riga di testo su un’interruzione di pagina compare in entrambe le pagine. Scegli **Intera** in **Formato pagina** per mantenere la pagina su un’unica pagina PDF alta, per la lettura a schermo.

Il PDF contiene lo screenshot come immagine, con le tue annotazioni. Non ha testo selezionabile. La [guida da screenshot a PDF](/it/blog/save-screenshot-as-pdf/) confronta i layout, e il [riferimento dell’esportazione](/it/docs/#export) elenca gli altri formati.

## Limiti di una cattura a pagina intera

Una cattura a pagina intera registra la pagina così come viene visualizzata mentre l’estensione la scorre. Alcuni contenuti cambiano durante lo scorrimento:

- Un’intestazione fissa viene catturata nel primo riquadro e aggiunta una sola volta in cima. Controlla che gli altri elementi fissi, come barre laterali o barre inferiori, compaiano dove ti aspetti.
- Le immagini che si caricano solo quando entrano nella vista possono apparire come riquadri vuoti se la cattura le raggiunge prima. Scorri la pagina prima di catturarla.
- Caroselli, animazioni, contatori in tempo reale e feed infiniti possono cambiare tra un riquadro e l’altro. Mettili in pausa, oppure cattura invece la regione importante.

Una pagina più alta di 32.000 pixel del dispositivo viene salvata in un massimo di sei immagini, ciascuna in una propria scheda dell’editor. La [guida agli screenshot a pagina intera](/it/blog/full-page-screenshot-chrome/) tratta altri problemi. Per gli screenshot destinati agli articoli di assistenza, consulta [screenshot per la documentazione](/it/use-cases/documentation/).
