---
title: Come usare gli screenshot per rispondere ai ticket di assistenza
description: Copia uno screenshot direttamente nella risposta a un ticket, numera i passi, nascondi i dati dei clienti e annota un’immagine inviata da un cliente.
order: 7
---

Per rispondere a un ticket di assistenza con uno screenshot, cattura la schermata che il cliente deve vedere, numera i passi che deve seguire, nascondi i dati dei clienti e incolla l’immagine nella tua risposta. In OpenScreenShot, l’azione **Appunti** copia una cattura senza aprire l’editor, e i badge **Numero passo** mostrano l’ordine dei clic. Per annotare uno screenshot inviato da un cliente, incollalo o trascinalo nell’**Editor**.

## Rispondi con uno screenshot annotato passo per passo

1. Apri la schermata del tuo prodotto che risponde alla domanda, per esempio una pagina di impostazioni.
2. Fai clic con il tasto destro sulla pagina, apri il sottomenu **OpenScreenShot** e scegli **Regione selezionata** o **Cattura elemento**. Includi abbastanza interfaccia perché il cliente trovi lo stesso punto.
3. Nell’**Editor**, aggiungi un **Numero passo** (`S`) su ogni controllo, nell’ordine in cui il cliente lo clicca.
4. Seleziona **Sfocatura** (`B`), scegli **Pieno** in **Oscuramento** e copri nomi, indirizzi email, numeri d’ordine e ID account.
5. Clicca **Copia**, oppure premi `Ctrl+C` (`⌘C` su macOS).
6. Incolla l’immagine nella risposta al ticket e scrivi gli stessi passi come elenco numerato sotto di essa.

I passi scritti aiutano i clienti che usano un lettore di schermo o che leggono la risposta in un client email che blocca le immagini.

## Copia senza l’editor

Per una risposta rapida che non richiede annotazioni, imposta **Dopo la cattura** su **Appunti** nel popup o nelle **Impostazioni**. Ogni cattura va quindi direttamente negli appunti, e il badge sull’icona lo conferma. Incollala nella risposta con `Ctrl+V` o `⌘V`.

L’impostazione vale per i pulsanti del popup, le scorciatoie da tastiera e il menu del tasto destro. Torna a **Editor** quando lo screenshot mostra dati dei clienti che devi prima nascondere. **Riapri ultima** nel footer del popup apre in qualsiasi momento l’ultima cattura nell’editor.

## Numera i passi

I badge **Numero passo** si incrementano da soli: il primo clic inserisce 1, il successivo 2. Quando elimini un badge, quelli rimasti si rinumerano. Mantieni i numeri dell’immagine uguali a quelli della tua risposta scritta.

Aggiungi una **Freccia** (`A`) quando un controllo è piccolo o difficile da trovare, e una breve nota di **Testo** (`T`) quando un passo richiede un valore, come l’opzione da selezionare. **Spotlight** (`O`) scurisce il resto della schermata quando la pagina è piena di elementi.

## Nascondi i dati dei clienti

Le tue viste di amministrazione mostrano spesso dati di altri clienti: nomi in un elenco, indirizzi email, dati di pagamento e note interne. Controlla l’intera immagine, bordi compresi, prima di inviarla.

Una sfocatura leggera o un mosaico possono lasciare indizi su un testo breve. **Pieno** copre completamente l’area nell’esportazione. Copri ogni elemento con un piccolo margine attorno ai caratteri visibili. La [guida all’oscuramento](/it/blog/redact-screenshot/) spiega come controllare il risultato.

## Annota uno screenshot inviato da un cliente

I clienti inviano spesso uno screenshot del problema. Per indicare il dettaglio che non hanno visto:

1. Copia l’immagine del cliente, oppure salvala sul tuo computer.
2. Apri una scheda dell’editor. Se non ce n’è una aperta, cattura una pagina qualsiasi con **Area visibile**; l’importazione sostituisce quella cattura.
3. Premi `Ctrl+V` o `⌘V` fuori da un campo di testo per incollare l’immagine, oppure trascina il file immagine sull’editor.
4. Aggiungi frecce, numeri di passo o testo, e nascondi tutto ciò che il cliente non intendeva condividere.
5. Clicca **Copia** e incolla l’immagine annotata nella tua risposta.

La barra superiore mostra **Importata**, e ogni strumento, la cornice Beautify e ogni formato di esportazione funzionano sull’immagine. Un’importazione sostituisce il canvas, quindi l’editor chiede conferma quando l’immagine corrente ha annotazioni.

## Limiti

L’estensione cattura solo il contenuto della pagina. L’immagine non mostra la barra degli indirizzi, quindi inserisci l’URL nella risposta quando il cliente deve aprire una pagina specifica. Le pagine interne del browser e altre pagine protette bloccano la cattura; consulta [assistenza e limitazioni note](/it/support/).

Catture e modifiche restano sul tuo computer. Lo strumento di help desk in cui incolli l’immagine la conserva secondo le proprie regole. Il [riferimento delle annotazioni](/it/docs/#annotate) elenca ogni strumento. Per gli screenshot destinati al tuo team di sviluppo, consulta [screenshot per le segnalazioni di bug](/it/use-cases/bug-reports/).
