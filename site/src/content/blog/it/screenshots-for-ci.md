---
title: Cattura screenshot di siti web per la CI e le revisioni dei rilasci
description: Crea artefatti PNG ripetibili con la CLI di OpenScreenShot e capisci cosa può verificare una cattura di screenshot in una pipeline di build.
audience: developers
order: 6
---

Usa la CLI di OpenScreenShot nella CI per salvare un PNG di un’applicazione in esecuzione da rivedere. Predisponi un browser compatibile con Chrome, avvia l’applicazione, aspetta che sia pronta, poi cattura un URL e una viewport fissi. Carica il file risultante con il meccanismo degli artefatti del tuo fornitore di CI.

## Rendi l’ambiente ripetibile

Per un progetto che usa già pnpm, aggiungi la CLI come dipendenza di sviluppo ed esegui il commit delle modifiche risultanti al manifest e al lockfile:

```sh
pnpm add -D -E openscreenshot
```

Installa le dipendenze in CI con il lockfile congelato del progetto. Il pacchetto usa `puppeteer-core` e non scarica un browser, quindi il runner ha bisogno anche di Chrome o Chromium. Imposta `CHROME_PATH` se l’eseguibile non si trova in una posizione predefinita supportata.

Mantieni stabili la versione del browser, i font, la viewport, i dati dell’applicazione e la versione del pacchetto quando confronti le catture. Un font o un motore di rendering del browser diverso può alterare un’immagine anche quando il codice dell’applicazione non è cambiato.

## Cattura dopo che l’applicazione è pronta

Avvia il server di sviluppo o di anteprima con il comando del progetto. Aspetta che la route e le sue dipendenze siano pronte prima di eseguire questo esempio; la porta 4321 è solo un esempio e deve corrispondere alla tua applicazione:

```sh
mkdir -p artifacts
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/desktop.png --width 1440 --height 900
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/narrow.png --width 390 --height 844
```

Questi comandi producono catture della viewport. Aggiungi `--full` per una revisione dell’intera pagina. Passa la directory `artifacts/` al passaggio di caricamento degli artefatti della CI, così chi rivede può aprire i file accanto a una pull request o a un rilascio.

La CLI aspetta l’inattività della rete durante la navigazione, ma questo non garantisce che il lavoro specifico dell’applicazione sia finito. Non ha un’attesa configurabile su selettori né uno script di preparazione iniettato. Usa una route di revisione dedicata e stabile con dati deterministici quando la route normale contiene animazioni, contenuti variabili o autenticazione.

## Un’immagine catturata non è un test visivo superato

Il comando può uscire con successo dopo aver fatto lo screenshot di un errore del server o di una schermata di caricamento. Tratta il PNG come un artefatto da rivedere. Un sistema di regressione visiva ha bisogno anche di una baseline, di un metodo di confronto delle immagini, di soglie e di un processo per accettare le modifiche volute; la CLI di OpenScreenShot non fornisce questi elementi.

Uno screenshot stretto è un utile controllo del layout responsive, ma non è un’emulazione di dispositivi mobili. Allo stesso modo, uno screenshot non verifica interazioni, accessibilità o comportamento delle API. Mantieni i controlli pertinenti dell’applicazione accanto al passaggio di cattura.

## Risolvi i problemi della pipeline

**Chrome non trovato:** verifica che l’immagine del runner includa un browser e che `CHROME_PATH` punti al suo eseguibile.

**Navigazione non riuscita o scaduta:** verifica che il server sia raggiungibile dal processo di cattura, usi la porta prevista e sia pronto prima che la cattura inizi. La navigazione ha un timeout di 30 secondi.

**Compare una pagina di login inattesa:** la CLI avvia una sessione del browser nuova. Non riusa il tuo profilo locale e non offre l’iniezione di cookie.

**Il file di output manca:** crea la directory di output, controlla lo stato di uscita del comando e verifica il percorso dell’artefatto rispetto alla directory di lavoro della CI.

La [guida di riferimento della CLI](/it/blog/screenshot-cli/) copre flag e codici di uscita. Se una persona o un agente deve decidere quale pagina controllare dopo, usa il [flusso di screenshot con MCP](/it/blog/screenshot-mcp-server/).
