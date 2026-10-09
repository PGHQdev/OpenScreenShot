---
title: Fai screenshot di siti web dalla riga di comando
description: Usa la CLI di OpenScreenShot per salvare screenshot PNG con una viewport fissa, la cattura a pagina intera o l’output binario su stdout.
audience: developers
order: 4
---

La CLI di OpenScreenShot cattura una pagina web in PNG usando un browser compatibile con Chrome installato in locale. È un pacchetto separato dall’estensione per il browser. Con Node.js, pnpm e Chrome installati, esegui:

```sh
pnpm dlx openscreenshot shot https://example.com --out screenshot.png --full
```

Il comando avvia un browser headless separato, apre l’URL, scrive l’immagine e chiude il browser. Non si collega alle schede o al profilo con accesso del browser che usi ogni giorno.

## Imposta la viewport in modo esplicito

Per uno screenshot della viewport, ometti `--full`. La larghezza predefinita è 1280 pixel e l’altezza predefinita è 800 pixel. Imposta entrambe quando un layout ha bisogno di una dimensione precisa:

```sh
pnpm dlx openscreenshot shot https://example.com --out desktop.png --width 1440 --height 900
pnpm dlx openscreenshot shot https://example.com --out narrow.png --width 390 --height 844
```

La larghezza accetta numeri interi da 200 a 3840; l’altezza accetta numeri interi da 200 a 2160. Una viewport stretta verifica il layout responsive a quella larghezza. Non emula l’input touch di un telefono, il rapporto di pixel del dispositivo o un browser mobile: la CLI usa uno user agent desktop.

Aggiungi `--full` per catturare oltre la viewport. La cattura a pagina intera del browser headless è diversa dall’implementazione a scorrimento e unione dell’estensione; non dare per scontato che ogni pagina dinamica appaia identica in entrambi i casi.

## Salva un file o scrivi su stdout

Senza `--out`, il comando scrive `screenshot.png` nella directory corrente. Usa un nome file esplicito per rendere gli artefatti facili da identificare. Crea l’eventuale directory di output superiore prima di eseguire il comando.

`--out -` scrive i byte PNG su stdout:

```sh
pnpm dlx openscreenshot shot https://example.com --out - > screenshot.png
```

Usa un reindirizzamento sicuro per i dati binari. La CLI produce sempre PNG; chiamare l’output `capture.jpg` o `capture.pdf` non lo converte. Per immagini annotate o output PDF, usa l’[editor dell’estensione](/it/docs/#export).

## Risolvi gli errori comuni

Se Chrome non viene trovato, installalo o imposta `CHROME_PATH` sull’eseguibile del browser. Per esempio, su un sistema Linux dove Chromium è installato in quel percorso:

```sh
CHROME_PATH=/usr/bin/chromium pnpm dlx openscreenshot shot https://example.com --out screenshot.png
```

La navigazione aspetta `networkidle2` con un timeout di 30 secondi. Il comando attuale non ha opzioni per attese personalizzate, selettori, cookie o login. Una cattura riuscita non dimostra nemmeno che l’applicazione si sia caricata correttamente: controlla nel PNG pagine di errore, stati di caricamento e risorse mancanti.

Il codice di uscita 0 indica che il comando di cattura è stato completato, 1 indica un errore di cattura e 2 indica un uso non valido o argomenti non validi. Usa questi codici quando concateni i comandi, poi controlla l’immagine stessa.

Per artefatti ripetibili, leggi [la guida alla cattura in CI](/it/blog/screenshots-for-ci/). Per un flusso guidato da un agente, vedi [la guida alla configurazione MCP](/it/blog/screenshot-mcp-server/). Il [sorgente della CLI](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) è il riferimento per i flag disponibili.
