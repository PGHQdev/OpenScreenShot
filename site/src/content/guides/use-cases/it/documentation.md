---
title: Come creare screenshot per documentazione di aiuto e tutorial
description: Mantieni le stesse dimensioni negli screenshot dei tutorial, numera i passi, evidenzia il controllo giusto e salva ogni file in una cartella.
order: 3
---

Per la documentazione di aiuto e i tutorial, cattura ogni schermata nello stesso modo, numera le azioni ed esporta ogni immagine alla stessa larghezza. In OpenScreenShot, imposta una larghezza esatta in pixel in **Scala** nella finestra **Esporta**, aggiungi i badge **Numero passo** per ogni azione e usa **Spotlight** per guidare chi legge al controllo giusto. Un modello del nome file come `Docs/{title}` salva ogni immagine in una cartella dentro Download.

## Crea uno screenshot per un tutorial passo per passo

1. Imposta la finestra del browser alla stessa dimensione per ogni cattura dell’articolo. Usa ogni volta lo stesso tema e lo stesso livello di zoom.
2. Cattura la schermata. **Regione selezionata** o **Cattura elemento** nel menu del tasto destro limitano l’immagine alla parte dell’interfaccia che riguarda il passo.
3. Nell’**Editor**, aggiungi un **Numero passo** (`S`) su ogni controllo, nell’ordine in cui chi legge li usa.
4. Aggiungi **Spotlight** (`O`) sull’area importante quando la schermata contiene molti altri elementi.
5. Copri i dati di esempio dei clienti, gli indirizzi email reali e le chiavi API con **Sfocatura** (`B`) e il riempimento **Pieno**.
6. Se vuoi, apri **Beautify** nella barra superiore per aggiungere spaziatura, angoli arrotondati e un’ombra.
7. Clicca **Salva immagine**. Nella finestra **Esporta**, scegli **PNG**, inserisci la larghezza della tua pagina in **Scala**, controlla il nome del file e clicca **Esporta**.

## Mantieni ogni immagine della stessa dimensione

Chi legge nota quando gli screenshot di un articolo cambiano dimensione da un passo all’altro. In **Scala**, scegli 25, 50, 100 o 200 %, oppure digita una larghezza esatta in pixel. Una larghezza fissa fa corrispondere ogni immagine di un articolo alla colonna dei contenuti del tuo sito di documentazione.

Attiva **Ricorda queste impostazioni** nella finestra **Esporta** per mantenere formato e qualità come nuovi valori predefiniti. La larghezza non fa parte di questi valori predefiniti, quindi inseriscila di nuovo a ogni esportazione. Una larghezza oltre il limite del canvas di Chrome viene rifiutata, così l’estensione non scrive mai un file vuoto.

Il PNG mantiene nitido il testo dell’interfaccia perché è senza perdita. Usa JPEG o WebP solo quando la tua piattaforma di documentazione limita la dimensione dei file.

## Numera i passi in modo che restino in ordine

I badge **Numero passo** si incrementano da soli: il primo clic inserisce 1, il successivo 2. Quando elimini un badge, quelli rimasti si rinumerano, quindi puoi togliere un passo senza modificare ogni numero successivo. Fai corrispondere i numeri dell’immagine all’elenco numerato del tuo articolo.

Usa la palette di otto colori sui tasti `1`–`8`. L’editor ricorda colore, spessore del tratto e dimensione del carattere tra una sessione e l’altra, quindi gli screenshot di un articolo mantengono lo stesso stile.

## Evidenzia e incornicia

**Spotlight** lascia illuminate una o più aree e scurisce il resto. I ritagli possono essere un rettangolo, un rettangolo arrotondato o un’ellisse. Per una pagina di impostazioni lunga, lo strumento **Cut** (`X`) rimuove le fasce orizzontali che non servono a chi legge, con un’anteprima dal vivo prima di applicarlo.

Il pannello **Beautify**, descritto nella [documentazione](/it/docs/#annotate), aggiunge spaziatura, raggio degli angoli, un’ombra e uno sfondo attorno allo screenshot. La cornice arriva in ogni esportazione e negli appunti. Scegli uno stile e usalo per ogni immagine della documentazione.

## Dai un nome alle immagini e archiviale

Apri le **Impostazioni** dal popup o dal menu del tasto destro dell’icona nella barra degli strumenti, poi modifica **Modello nome file**. Clicca un token per inserire `{date}`, `{time}`, `{title}`, `{domain}`, `{w}` o `{h}`, e controlla l’anteprima dal vivo.

Aggiungi `/` per salvare in una cartella dentro Download. Per esempio, `Docs/{title}` salva ogni immagine in una cartella `Docs`, con il titolo della pagina come nome. Il token `{title}` sostituisce i caratteri non ammessi nei nomi file, quindi una `/` nel titolo di una pagina non crea un’altra cartella. La finestra **Esporta** mostra il nome del file prima del salvataggio, e lì puoi modificarlo.

## Limiti

Gli screenshot dell’interfaccia diventano obsoleti quando il prodotto cambia. Tieni il titolo della pagina o l’URL nel nome del file, così puoi trovare e sostituire le immagini vecchie. Uno screenshot del browser mostra solo il contenuto della pagina; non include la barra degli indirizzi né la barra degli strumenti del browser.

Il [riferimento dell’esportazione](/it/docs/#export) e il [riferimento delle impostazioni](/it/docs/#settings) elencano ogni opzione. Per preparare un’immagine per un post, consulta [condividere screenshot sui social media](/it/use-cases/social-media/).
