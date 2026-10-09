---
title: Come fare uno screenshot a pagina intera in Firefox
description: 'Cattura una pagina intera con lo strumento Screenshots integrato in Firefox o il comando :screenshot, verifica i limiti e usa il componente OpenScreenShot.'
order: 3
---

Firefox ha uno strumento Screenshots integrato. Premi `Ctrl+Shift+S` (`Cmd+Shift+S` su macOS), seleziona **Save full page** (salva pagina intera), poi seleziona **Download** per salvare un PNG o **Copy** (copia) per mettere l’immagine negli appunti. Il componente aggiuntivo OpenScreenShot per Firefox aggiunge un editor per frecce, testo e oscuramento, ed esporta in PNG, JPEG, WebP o PDF.

## Metodo integrato

Mozilla descrive lo strumento in [Take screenshots in Firefox](https://support.mozilla.org/en-US/kb/take-screenshots-firefox).

1. Apri la pagina che vuoi catturare.
2. Premi `Ctrl+Shift+S` su Windows e Linux, oppure `Cmd+Shift+S` su macOS. Puoi anche fare clic con il tasto destro su una parte vuota della pagina e selezionare **Take Screenshot** (acquisisci schermata).
3. Seleziona **Save full page** in alto a destra.
4. Nell’anteprima, seleziona **Download** per salvare un PNG nella cartella dei download di Firefox, oppure seleziona **Copy**.

L’anteprima offre **Copy** e **Download**. Per aggiungere frecce o testo, apri il PNG in un’altra app.

I DevTools di Firefox offrono un secondo metodo. Apri la Web Console e digita `:screenshot --fullpage`, e Firefox salva un PNG dell’intera pagina. Puoi anche attivare il pulsante **Take a screenshot of the entire page** (cattura l’intera pagina) in **Available Toolbox Buttons** (pulsanti disponibili) nelle impostazioni dei DevTools. Mozilla documenta entrambi nella sua [guida agli screenshot nei DevTools](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html).

## Limiti

- **Dimensioni.** Firefox ritaglia una cattura più grande di 32.766 pixel per lato o di 472.907.776 pixel di area, e mostra «Your screenshot was cropped because it was too large.» Il messaggio di errore di Firefox per una cattura troppo grande indica numeri diversi: meno di 32.700 pixel sul lato più lungo o 124.900.000 pixel di area totale.
- **Scala dello schermo.** Firefox conta questi limiti in pixel del dispositivo: larghezza e altezza della pagina moltiplicate per il rapporto di pixel dello schermo. Su uno schermo 2x, il limite di altezza della pagina in pixel CSS è la metà, circa 16.383.
- **Contenitori di scorrimento interni.** Firefox prende i limiti della pagina intera dalla larghezza e dall’altezza di scorrimento della finestra. Quando una pagina fa scorrere un pannello dentro una struttura ad altezza fissa, il contenuto di quel pannello non si espande, quindi la cattura ne mostra solo un’altezza di schermo.
- **Caricamento differito.** Le immagini contrassegnate con `loading="lazy"` si caricano solo quando scorri vicino a esse. Scorri la pagina prima di catturarla, altrimenti parti dell’immagine possono restare vuote.
- **Scorrimento infinito.** Un feed che carica altri contenuti mentre scorri non ha una vera fine. La cattura contiene solo ciò che si è caricato prima dell’avvio.
- **Intestazioni fisse.** Prima di condividere l’immagine, controlla in cima e al centro se un’intestazione manca, è ripetuta o è nel posto sbagliato.

## Con OpenScreenShot

La versione di OpenScreenShot per Firefox fa solo screenshot. La registrazione delle schede è nella versione per Chrome. La sua modalità a pagina intera scorre la pagina, la cattura in parti e unisce le parti in un’unica immagine, con le intestazioni fisse inserite una sola volta in cima. Funzionano anche le pagine che fanno scorrere un elemento interno invece della finestra.

1. Installa [OpenScreenShot da Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) e fissa la sua icona alla barra degli strumenti.
2. Apri la pagina e scorrila una volta, così si caricano le immagini con caricamento differito, poi torna in cima.
3. Clicca l’icona di OpenScreenShot e scegli **Pagina intera** se si apre il menu delle modalità.
4. Controlla il risultato nell’editor, soprattutto la parte iniziale, la parte finale e ogni barra di navigazione fissa.
5. Clicca **Salva immagine** e scegli PNG, JPEG, WebP o PDF, oppure clicca **Copia**.

Firefox usa `Ctrl+Shift+S` per il proprio strumento Screenshots, quindi clicca l’icona nella barra degli strumenti quando vuoi usare OpenScreenShot. Il [riferimento delle modalità di cattura](/it/docs/#modes) descrive ogni modalità, e il [riferimento dell’esportazione](/it/docs/#export) descrive formati e scala.

## Quale usare

- Usa Firefox Screenshots per un PNG rapido di una pagina che fa scorrere l’intera finestra e rientra nel limite di dimensione.
- Usa il comando `:screenshot --fullpage` quando lavori già nella Web Console.
- Usa OpenScreenShot per le pagine che fanno scorrere un pannello interno, e per le catture che vuoi annotare o salvare in PDF, come nelle [segnalazioni di bug](/it/use-cases/bug-reports/) o in una [copia salvata di una pagina](/it/use-cases/archive-web-pages/).

La [guida per Chrome](/it/full-page-screenshot/chrome/) e la [guida per Edge](/it/full-page-screenshot/edge/) trattano la stessa attività nei browser Chromium, dove OpenScreenShot può anche registrare le schede. Per le pagine che bloccano le estensioni, come le impostazioni di Firefox, consulta [assistenza e limitazioni note](/it/support/).
