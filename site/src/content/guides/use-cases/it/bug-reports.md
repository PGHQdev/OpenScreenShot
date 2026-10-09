---
title: Come fare screenshot per le segnalazioni di bug
description: Cattura la parte difettosa di una pagina, segnala il problema con frecce e numeri di passo, nascondi token ed email e incolla l’immagine in una issue.
order: 1
---

Per una segnalazione di bug, cattura solo la parte della pagina che mostra il problema, segna cosa non va e nascondi tutto ciò che è privato prima di incollare l’immagine nella issue. In OpenScreenShot, usa **Regione selezionata** o **Cattura elemento** per la cattura, gli strumenti **Freccia** e **Numero passo** per i segni, e **Sfocatura** con il riempimento **Pieno** per l’oscuramento. Inserisci l’URL, il browser e i passi per riprodurre il problema nel testo della issue, perché lo screenshot mostra il contenuto della pagina senza la barra degli indirizzi.

## Cattura e segna un bug passo per passo

1. Apri la pagina e portala allo stato difettoso. Chiudi i banner che nascondono il problema.
2. Fai clic con il tasto destro sulla pagina, apri il sottomenu **OpenScreenShot** e scegli **Regione selezionata** o **Cattura elemento**. Con le impostazioni predefinite, un clic sull’icona nella barra degli strumenti cattura invece la pagina intera.
3. Per una regione, trascina un rettangolo attorno al problema, con abbastanza interfaccia intorno per capire dove si trova. Premi `Enter` per confermare. Per un elemento, passa il puntatore finché la scheda, la tabella o il modulo che vuoi non è evidenziato, poi clicca o premi `Enter`.
4. Nell’**Editor**, aggiungi una **Freccia** (`A`) sul dettaglio difettoso. Aggiungi un **Numero passo** (`S`) per ogni azione quando il bug richiede più clic per essere riprodotto.
5. Seleziona **Sfocatura** (`B`), scegli **Pieno** in **Oscuramento** e copri token di accesso, indirizzi email, nomi degli account e nomi host interni.
6. Clicca **Copia**, oppure premi `Ctrl+C` (`⌘C` su macOS), e incolla l’immagine nella issue.

In modalità elemento, `↑` seleziona l’elemento padre e `↓` l’elemento figlio, il che aiuta quando l’evidenziazione cade su un contenitore troppo piccolo o troppo grande. Se l’elemento non è completamente visibile, il selettore propone invece una cattura a pagina intera.

## Cattura stati hover, menu a discesa e tooltip

Un menu o un tooltip spesso si chiude quando clicchi altrove. Imposta **Ritardo** a 3, 5 o 10 secondi nel popup o nelle **Impostazioni**, avvia la cattura, poi apri il menu prima che il badge sull’icona finisca il conto alla rovescia.

Il ritardo scorre prima che inizi la selezione di una regione, quindi un trascinamento può comunque chiudere il menu. Per uno stato hover, usa **Area visibile** con un ritardo e ritaglia dopo con **Ritaglia** (`C`). Puoi anche selezionare la regione una volta, poi usare **Ripeti regione** dal menu del tasto destro con un ritardo: cattura lo stesso rettangolo senza un altro trascinamento.

## Salta l’editor con l’azione Appunti

Quando uno screenshot non ha bisogno di segni, imposta **Dopo la cattura** su **Appunti** nel popup o nelle **Impostazioni**. Ogni cattura va quindi direttamente negli appunti, e il badge sull’icona lo conferma. Incolla l’immagine nella issue con `Ctrl+V` o `⌘V`.

Questa impostazione vale anche per le scorciatoie da tastiera e il menu del tasto destro. Riportala su **Editor** quando devi annotare o oscurare. Una cattura negli appunti salta il passaggio di oscuramento, quindi controlla che la pagina non mostri dati privati prima di catturarla.

## Cosa scrivere accanto allo screenshot

Uno screenshot mostra cosa è andato storto. Il testo della issue fornisce il contesto che serve a uno sviluppatore per riprodurlo:

- l’URL della pagina, senza i parametri di query privati
- il nome e la versione del browser, e il sistema operativo
- i passi per riprodurre il problema, nello stesso ordine dei numeri di passo nell’immagine
- cosa ti aspettavi e cosa è successo invece
- l’ora del problema, se la pagina mostra dati in tempo reale

Tieni un solo problema per screenshot. Un secondo bug nella stessa immagine rende poco chiaro a quale dei due punta la freccia.

## Limiti

Sfocatura e mosaico ammorbidiscono i pixel, ma possono lasciare indizi su un testo breve. **Pieno** copre completamente l’area nell’esportazione; la [guida all’oscuramento](/it/blog/redact-screenshot/) spiega come controllare il risultato. Le pagine interne del browser e altre pagine protette bloccano la cattura da parte delle estensioni; consulta [assistenza e limitazioni note](/it/support/).

Il [riferimento delle modalità di cattura](/it/docs/#modes) descrive i controlli di selezione, e il [riferimento delle annotazioni](/it/docs/#annotate) elenca ogni strumento e scorciatoia. Per rispondere agli utenti che segnalano un problema, consulta [screenshot per l’assistenza clienti](/it/use-cases/customer-support/). Per mostrare il bug in movimento, consulta [video dimostrativi di prodotto](/it/use-cases/product-demos/).
