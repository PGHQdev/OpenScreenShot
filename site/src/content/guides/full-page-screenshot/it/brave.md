---
title: Come fare uno screenshot a pagina intera in Brave
description: Attiva il pulsante screenshot nella barra degli strumenti di Brave, cattura una pagina intera in PNG, vedi i limiti e usa OpenScreenShot dal Chrome Web Store.
order: 5
---

Brave 1.94 e versioni successive hanno uno strumento screenshot integrato. Attiva il pulsante screenshot in `brave://settings/appearance`, cliccalo e seleziona **Full page** (pagina intera). In Brave 1.96 e versioni successive si apre un’anteprima in cui scarichi un PNG o copi l’immagine. OpenScreenShot funziona anche in Brave: Brave è un browser Chromium e installa le estensioni dal Chrome Web Store.

## Metodo integrato

Brave non ha un articolo del centro assistenza per lo strumento. I passi qui sotto seguono le [note di rilascio](https://brave.com/latest/) di Brave e il suo [issue tracker](https://github.com/brave/brave-browser/issues/57937).

1. Vai su `brave://settings/appearance` e attiva il pulsante screenshot nella sezione della barra degli strumenti.
2. Apri la pagina che vuoi catturare.
3. Clicca il pulsante **Take a screenshot** (fai uno screenshot) nella barra degli strumenti.
4. Nel riquadro **Capture screenshot** (cattura screenshot), seleziona **Full page**. Il riquadro offre anche **Selected area** (area selezionata) e **Visible area** (area visibile).
5. Nella finestra **Screenshot preview** (anteprima screenshot), seleziona **Download** per salvare un PNG, oppure seleziona **Copy to clipboard** (copia negli appunti).

`Ctrl+Shift+S` (`Shift+Cmd+S` su macOS) apre lo strumento screenshot di Brave in Brave 1.75 e versioni successive. L’issue tracker di Brave descrive quella scorciatoia come una cattura di tipo selezione, quindi usa il pulsante nella barra degli strumenti per **Full page**. In Brave 1.96 la voce screenshot nel menu dell’app è passata alla sezione Save di **Save and share** (salva e condividi).

L’anteprima offre **Download** e **Copy to clipboard**. Per aggiungere frecce o testo, apri il PNG in un’altra app.

## Limiti

- **Dimensioni della pagina.** L’opzione **Full page** usa il comando screenshot dei DevTools di Chromium. Quel comando rifiuta una pagina larga o alta 131.072 pixel CSS o più, con l’errore «Page is too large.»
- **Elementi sticky e fissi.** Per quel comando, Chromium ridimensiona la vista all’intera dimensione della pagina. Le sezioni dimensionate sull’altezza della finestra (`100vh`) e le intestazioni o i piè di pagina fissi possono quindi disporsi rispetto a quella vista alta, per cui un piè di pagina fisso può comparire una volta in fondo all’immagine.
- **Caricamento differito.** Le immagini contrassegnate con `loading="lazy"` si caricano solo quando scorri vicino a esse. Scorri la pagina prima di catturarla, altrimenti parti dell’immagine possono restare vuote.
- **Contenitori di scorrimento interni.** Chromium dimensiona la cattura in base alla dimensione di scorrimento della pagina stessa. Quando una pagina fa scorrere un pannello dentro una struttura ad altezza fissa, la cattura mostra solo un’altezza di schermo di quel pannello.
- **Scorrimento infinito.** Un feed che continua a caricare non ha una vera fine. La cattura contiene solo ciò che si è caricato prima dell’avvio.

## Con OpenScreenShot

OpenScreenShot scorre la pagina una schermata alla volta e unisce le parti in un’unica immagine. Le intestazioni fisse vengono catturate una sola volta in cima, e funzionano anche le pagine che fanno scorrere un elemento interno. Una pagina più alta di 32.000 pixel del dispositivo viene salvata in un massimo di sei immagini.

1. Apri la [scheda di OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Brave e aggiungi l’estensione. Brave spiega le installazioni dal Chrome Web Store in [Using Chrome extensions in Brave](https://brave.com/learn/using-chrome-extensions-in-brave/).
2. Fissa l’icona di OpenScreenShot alla barra degli strumenti.
3. Apri la pagina e clicca l’icona. Con le impostazioni predefinite parte una cattura a pagina intera e il risultato si apre nell’editor.
4. Controlla la parte iniziale, la parte finale e ogni barra di navigazione fissa.
5. Clicca **Salva immagine** e scegli PNG, JPEG, WebP o PDF, oppure clicca **Copia**.

La scorciatoia per la pagina intera di OpenScreenShot è `Ctrl+Shift+S` (`⌘⇧S` su macOS), gli stessi tasti dello strumento screenshot di Brave. Se i tasti aprono lo strumento di Brave, clicca invece l’icona, oppure imposta un tasto diverso con il link **Scorciatoie** nel menu di cattura. Se l’icona apre un menu, seleziona **Pagina intera**; l’impostazione **Modalità Express con un clic** controlla questo comportamento.

## Quale usare

- Usa il pulsante **Full page** di Brave per un PNG rapido di una pagina che fa scorrere l’intera finestra.
- Usa OpenScreenShot per le pagine che fanno scorrere un pannello interno, per l’esportazione in PDF, JPEG o WebP, o per annotare e oscurare prima di condividere, come nelle [segnalazioni di bug](/it/use-cases/bug-reports/).
- Usa il pannello **Beautify** di OpenScreenShot quando la cattura va in un post: aggiunge spaziatura, angoli arrotondati, un’ombra e uno sfondo. Consulta [screenshot per i social media](/it/use-cases/social-media/).

Il [riferimento delle modalità di cattura](/it/docs/#modes) e il [riferimento dell’esportazione](/it/docs/#export) elencano ogni opzione. La [guida per Chrome](/it/full-page-screenshot/chrome/) tratta la cattura dei DevTools, presente anche in Brave. Per le pagine che bloccano le estensioni, come le impostazioni del browser, consulta [assistenza e limitazioni note](/it/support/).
