---
title: Come salvare una copia visiva di una pagina web
description: Cattura un’intera pagina web come PNG o PDF, dai ai file un nome con data e dominio e gestisci le pagine molto lunghe salvate in più immagini.
order: 5
---

Per conservare una copia visiva di una pagina web, catturala con **Pagina intera** e salvala come PNG o PDF con la data e il sito nel nome del file. OpenScreenShot scorre la pagina, unisce le parti in un’unica immagine e salva il file sul tuo computer. Uno screenshot registra come appariva la pagina sul tuo schermo; non prova che la pagina fosse autentica o non modificata.

## Salva una copia di una pagina passo per passo

1. Apri le **Impostazioni** dal popup o dal menu del tasto destro dell’icona nella barra degli strumenti. Imposta **Modello nome file** su uno schema con `{date}` e `{domain}`, per esempio `Archive/{domain}/{date}_{title}`.
2. Apri la pagina. Scorrila una volta, così si caricano le immagini e i commenti con caricamento differito, poi torna in cima.
3. Clicca l’icona di OpenScreenShot. Con le impostazioni predefinite, questo avvia una cattura **Pagina intera** e apre il risultato nell’**Editor**.
4. Controlla la parte iniziale, la parte finale e ogni sezione che si carica durante lo scorrimento.
5. Clicca **Salva immagine**. Nella finestra **Esporta**, scegli **PNG** o **PDF**, controlla il nome del file e clicca **Esporta**.

Per salvare senza l’editor, imposta **Dopo la cattura** su **Scarica** nelle **Impostazioni**. Ogni cattura va quindi direttamente nella cartella dei download come PNG, con il nome del tuo modello.

## PNG o PDF?

Scegli **PNG** per conservare ogni pixel della cattura. È un formato senza perdita, quindi il testo dell’interfaccia resta nitido, e qualsiasi visualizzatore di immagini lo apre.

Scegli **PDF** quando la copia va in una cartella di documenti o deve essere stampata. In **Formato pagina**, **Intera** crea una sola pagina delle dimensioni dell’immagine. **A4** o **Letter** con **Dividi su più pagine** divide una cattura lunga in pagine con una sovrapposizione di 5 mm. Il PDF contiene lo screenshot come immagine, quindi il suo testo non si può cercare né selezionare. La [guida da screenshot a PDF](/it/blog/save-screenshot-as-pdf/) confronta i layout.

## Dai ai file un nome che ti permetta di ritrovarli

Il modello del nome file accetta questi token:

- `{date}`: la data nel formato YYYY-MM-DD, dall’orologio del tuo computer
- `{time}`: l’ora nel formato HHMMSS
- `{domain}`: il nome host del sito, senza `www.`
- `{title}`: il titolo della pagina, con i caratteri non ammessi nei nomi file sostituiti
- `{w}` e `{h}`: larghezza e altezza dell’immagine in pixel

Una `/` nel modello salva in una cartella dentro Download, quindi `Archive/{domain}/{date}_{title}` ordina le copie per sito e poi per data. L’anteprima dal vivo nelle **Impostazioni** mostra il risultato prima della cattura.

## Pagine molto lunghe

Una sola immagine contiene una pagina alta fino a 32.000 pixel del dispositivo. Una pagina più alta viene salvata in un massimo di sei immagini. Con **Scarica**, ogni parte prende il nome dal tuo modello con un suffisso come `_part1of3`. Con **Editor** o **Appunti**, ogni parte si apre in una propria scheda dell’editor, dove la esporti separatamente.

Una pagina troppo alta per sei immagini viene rifiutata con un errore. In quel caso cattura le sezioni che ti servono con **Area visibile** o **Regione selezionata**. La [guida agli screenshot a pagina intera](/it/blog/full-page-screenshot-chrome/) tratta altri casi, come le aree di scorrimento annidate e le intestazioni fisse.

## Cosa può e non può mostrare uno screenshot

Uno screenshot è una registrazione visiva di ciò che il browser mostrava in un dato momento. Non ha firma né controllo contro le manomissioni, e chiunque può modificare un file immagine. Il token `{date}` viene dall’orologio del tuo computer nel momento in cui il file riceve il nome. Quando ti serve una prova che una pagina esisteva in una certa forma, usa un servizio creato per quello scopo e conserva lo screenshot come riferimento personale.

Una cattura a pagina intera perde anche i contenuti che la pagina non ha mai mostrato: sezioni compresse, altre schede di una pagina, feed infiniti oltre il punto fino a cui hai scorso e contenuti dietro un login che non hai aperto.

## Dove sono conservate le copie

OpenScreenShot elabora le catture nel browser e le conserva nello spazio di archiviazione locale del tuo dispositivo. Non le carica su un server. I file esportati vanno nella cartella dei download. Restano sul tuo computer finché non li condividi o li carichi, e il servizio su cui li carichi ha le sue regole di conservazione. Consulta l’[informativa sulla privacy](/it/privacy/) per i dettagli.

Il [riferimento delle impostazioni](/it/docs/#settings) descrive il modello del nome file. Per annotare una cattura per i colleghi, consulta [catturare una pagina per la revisione del design](/it/use-cases/design-review/).
