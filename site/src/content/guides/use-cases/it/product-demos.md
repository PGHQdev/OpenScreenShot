---
title: Come registrare un video dimostrativo di un prodotto in Chrome
description: Registra una scheda del browser con webcam e voce, aggiungi uno zoom a ogni clic, taglia la ripresa ed esporta un MP4, tutto in Chrome sul tuo computer.
order: 6
---

Per registrare una breve demo di un prodotto da una scheda del browser, usa **Registra** nell’estensione Chrome di OpenScreenShot. Scegli l’intera scheda o una sua parte, attiva il microfono, l’audio della scheda o la webcam e registra la demo. L’editor aggiunge poi uno zoom a ogni clic, ti permette di tagliare la ripresa ed esporta un MP4. La versione per Firefox supporta solo gli screenshot e non ha il registratore.

## Registra una demo passo per passo

1. Prepara la demo in una normale scheda del browser: accedi, carica i dati di esempio e chiudi le notifiche. Le pagine interne del browser non si possono registrare.
2. Con le impostazioni predefinite, un clic sull’icona nella barra degli strumenti cattura uno screenshot. Fai clic con il tasto destro sull’icona e disattiva **Modalità Express con un clic**, così il clic successivo apre il popup.
3. Clicca **Registra** nel popup. La scheda di registrazione si apre accanto alla tua pagina. La prima volta, Chrome chiede una sola volta il permesso di catturare la scheda.
4. Attiva **Mic**, **Audio scheda** o **Webcam** secondo necessità, e consenti la richiesta di permesso del browser.
5. Lascia **Scheda intera**, oppure trascina sull’immagine della tua pagina per registrarne solo una parte.
6. Clicca **Avvia la registrazione**. OpenScreenShot passa alla tua pagina. Esegui la demo a ritmo costante, con clic decisi.
7. Premi `Alt+Shift+X` per fermare, oppure torna alla scheda di registrazione e clicca **Stop**. L’editor di registrazione si apre nella stessa scheda.
8. Regola gli zoom, taglia l’inizio e la fine e clicca **Esporta MP4**.

La scheda di registrazione ha anche i pulsanti Pausa/Riprendi e Annulla. Alla pagina che registri non viene aggiunto nulla, quindi nel video non compaiono controlli.

## Zoom ai clic

L’editor aggiunge uno zoom fluido 2x a ogni clic del tuo cursore. Sulla timeline puoi regolare o eliminare ogni blocco di zoom. Clicca **Aggiungi zoom** per inserire un tuo blocco a 1.5x, 2x o 3x, per esempio su un numero che cambia senza un clic.

Gli effetti clic segnano dove hai cliccato. L’impostazione del cursore può mostrare un puntatore fluido che segue il percorso registrato, mostrare solo i clic oppure nascondere il puntatore.

Se la demo passa a un altro sito, il tracciamento dei clic richiede il permesso facoltativo **Registra su tutti i siti** nelle **Impostazioni**. Senza di esso, il badge sull’icona diventa ambra, e zoom ed effetti clic si fermano per il resto del video. Il video continua comunque a registrare.

## Webcam, voce e audio della scheda

La webcam entra nell’esportazione come bolla rotonda. Nell’editor puoi metterla in un angolo qualsiasi, cambiarne la dimensione o nasconderla. Cursori separati regolano il volume del microfono e quello della scheda, così puoi mantenere la tua voce sopra i suoni del prodotto.

Registra prima una breve ripresa di prova per controllare i livelli e la posizione della bolla.

## Taglia e incornicia la ripresa

Trascina le maniglie all’inizio o alla fine di un segmento per tagliarlo. Annulla e ripeti funzionano sulla timeline. Il pannello **Beautify** nel pannello laterale aggiunge spaziatura, angoli, un’ombra e uno sfondo attorno al video, la stessa cornice offerta dall’editor degli screenshot.

## Esporta il video

**Esporta MP4** elabora la ripresa con zoom, tracce audio, bolla della webcam e cornice, e scarica un file MP4 con video H.264 e audio AAC. Scegli WebM dal selettore accanto al pulsante per ottenere un file WebM. Tieni visibile la scheda dell’editor durante l’elaborazione, perché l’elaborazione si mette in pausa quando la scheda è nascosta.

L’MP4 è limitato a 4096×2304 pixel, quindi una scheda più grande viene ridimensionata per rientrare nel limite. Un browser senza registrazione MP4 esporta solo WebM. Il file prende il nome dal tuo **Modello nome file** nelle **Impostazioni**.

## Limiti e archiviazione

Il registratore cattura una scheda del browser. Non registra altre finestre, altre app o il desktop. Una pagina interna del browser o una pagina protetta non si possono registrare.

Registrazioni, log del cursore e flussi di webcam e microfono restano nello spazio di archiviazione del browser sul tuo dispositivo finché non li elimini. Attiva **Elimina la registrazione dopo l’esportazione** per rimuovere la ripresa una volta salvato il file. Non viene caricato nulla, a meno che tu non condivida il file esportato.

Il [riferimento della registrazione](/it/docs/#record) contiene ogni controllo. Per immagini statiche dello stesso bug o della stessa funzione, consulta [screenshot per le segnalazioni di bug](/it/use-cases/bug-reports/).
