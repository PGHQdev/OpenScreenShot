---
title: Come fare uno screenshot a pagina intera in Chrome
description: Cattura un’intera pagina web scorrevole con OpenScreenShot, controlla il risultato ed esportalo come immagine o PDF.
audience: everyday
order: 1
---

Per fare uno screenshot a pagina intera con OpenScreenShot, apri la pagina web e clicca l’icona dell’estensione nella barra degli strumenti. Con le impostazioni predefinite, la cattura parte subito e l’immagine finita si apre nell’editor. L’estensione fa scorrere la pagina e unisce le sezioni catturate in una sola immagine.

## Cattura la pagina passo per passo

1. Installa [OpenScreenShot dal Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) e fissa la sua icona nella barra degli strumenti.
2. Apri la pagina che vuoi catturare. Chiudi i banner o le finestre di dialogo che non vuoi nell’immagine.
3. Aspetta che il contenuto che ti serve venga caricato. Per le pagine con immagini a caricamento differito, scorri il contenuto rilevante prima di iniziare.
4. Clicca l’icona di OpenScreenShot. Lascia la scheda dov’è mentre la cattura si completa.
5. Controlla l’immagine nell’editor, in particolare la prima e l’ultima sezione e qualsiasi barra di navigazione fissa.
6. Clicca **Salva immagine** e scegli PNG, JPEG, WebP o PDF nella finestra **Esporta**.

Se invece il clic sull’icona apre il selettore delle modalità, scegli **Pagina intera**. L’impostazione **Modalità Express con un clic** decide quale comportamento ottieni. Se l’editor non si apre, controlla **Dopo la cattura**: Appunti e Scarica inviano il risultato direttamente alla loro destinazione.

## Pagina intera, area visibile o regione selezionata?

**Pagina intera** è utile per rivedere una landing page, conservare una copia visiva di un articolo o mostrare una lunga schermata di impostazioni. Include il contenuto oltre la viewport corrente.

**Area visibile** cattura ciò che è visibile in questo momento, senza scorrere. Usala quando l’interfaccia circostante è un contesto utile ma il resto della pagina non conta.

**Regione selezionata** cattura un rettangolo che scegli tu. Spesso è l’opzione più chiara per una segnalazione di bug: cattura il componente rotto e abbastanza contenuto intorno per identificarlo. Vedi il [riferimento delle modalità di cattura](/it/docs/#modes) per i controlli di selezione e le scorciatoie.

## Perché una parte della pagina manca o è ripetuta?

Uno screenshot a pagina intera registra una pagina così come viene visualizzata. Non è un’esportazione di tutto ciò che un sito web potrebbe caricare prima o poi. Feed infiniti, elenchi virtualizzati, contenuti in movimento e aree di scorrimento incorporate possono rendere visibile questa differenza.

OpenScreenShot gestisce le intestazioni fisse e gli elementi scorrevoli annidati, ma una pagina che sostituisce il suo contenuto mentre scorre può comunque produrre un risultato incompleto. Lascia che la pagina si stabilizzi, carica la sezione rilevante, poi riprova. Per un feed che cresce senza fine, cattura invece la regione importante. Le pagine interne del browser e altre superfici protette possono bloccare la cattura da parte delle estensioni; vedi [supporto e limiti noti](/it/support/).

## Scegli un’esportazione adatta alla destinazione

Usa PNG per testo dell’interfaccia e diagrammi quando conta un risultato senza perdita. JPEG e WebP offrono controlli di qualità quando la dimensione del file è più importante. Per un allegato a un documento, segui la [guida da screenshot a PDF](/it/blog/save-screenshot-as-pdf/).

Prima di condividere, rimuovi le informazioni che non servono a chi legge. La [guida all’oscuramento](/it/blog/redact-screenshot/) spiega come coprire i contenuti sensibili e controllare il file esportato. La cattura e la modifica nell’estensione avvengono in locale; caricare altrove lo screenshot esportato è un’azione separata che controlli tu.
