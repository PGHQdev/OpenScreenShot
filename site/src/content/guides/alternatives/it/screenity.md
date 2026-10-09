---
title: 'Alternativa a Screenity: screenshot e registrazione della scheda in un’unica estensione'
description: Screenity o OpenScreenShot? Entrambi open source. OpenScreenShot aggiunge pagina intera ed export PDF, e non chiede accesso a tutti i siti all’installazione.
order: 7
---

Passa a OpenScreenShot se registri schede del browser e fai anche screenshot a pagina intera, e vuoi un’unica estensione open source che faccia entrambe le cose senza accesso a tutti i siti web all’installazione. Resta con Screenity se registri più di una scheda: registra un’area, il desktop, la finestra di qualsiasi app o la fotocamera, ed esporta in GIF o salva su Google Drive. OpenScreenShot registra una scheda del browser e non cattura finestre del desktop né l’intero schermo. Il piano Pro a pagamento di Screenity aggiunge anche la condivisione tramite link e l’hosting nel cloud, che OpenScreenShot non offre.

OpenScreenShot è il nostro prodotto. Le informazioni su Screenity in questa pagina sono aggiornate al 9 ottobre 2026 e provengono dal suo [repository GitHub](https://github.com/alyssaxuu/screenity) e dal suo [manifest](https://github.com/alyssaxuu/screenity/blob/master/src/manifest.json), dalla sua [scheda sul Chrome Web Store](https://chromewebstore.google.com/detail/screenity-screen-recorder/kbbdabhdfibnancpjfhlkhafgdilcnji), dalla sua [pagina Pro](https://screenity.io/pro) e dall’[elenco degli avvisi sui permessi](https://developer.chrome.com/docs/extensions/reference/permissions-list) di Chrome.

## Screenity e OpenScreenShot a confronto

|                                   | Screenity                                                                                          | OpenScreenShot                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Prezzo                            | Estensione gratuita; Pro costa 10 $ al mese o 120 $ all’anno, con 7 giorni di prova                | Gratuito, nessun piano a pagamento                                                      |
| Open source                       | Sì, GPL-3.0                                                                                        | Sì, MIT                                                                                 |
| Accesso ai siti all’installazione | Tutti i siti web (`<all_urls>` obbligatorio, più `tabs` e `tabCapture`)                            | Nessuno. La cattura della scheda è facoltativa e viene chiesta alla prima registrazione |
| Cattura a pagina intera           | Non trattata nelle fonti che abbiamo controllato                                                   | Sì                                                                                      |
| Annotazioni e sfocatura           | Disegno, testo, frecce, forme; sfocatura dei contenuti della pagina                                | Forme, frecce, testo, numeri di passo, sfocatura, spotlight, ritaglio sugli screenshot  |
| Esportazione PDF                  | Non trattata nelle fonti che abbiamo controllato                                                   | Sì                                                                                      |
| Registrazione della scheda        | Sì, oltre ad area, desktop, finestra di un’app e fotocamera                                        | Sì, solo la scheda, in Chrome (la versione per Firefox cattura solo screenshot)         |
| Esportazione video                | MP4, GIF, WebM o Google Drive                                                                      | MP4 o WebM                                                                              |
| Account o cloud                   | Nessun accesso richiesto per l’estensione gratuita; Pro usa un account e un cloud ospitato nell’UE | Nessun account, nessun caricamento                                                      |

## Cosa resta uguale

Entrambe le estensioni sono open source, ed entrambe conservano le registrazioni gratuite sul tuo dispositivo senza richiedere l’accesso a un account. In OpenScreenShot, clicca **Registra** nel popup e scegli **Mic**, **Audio scheda** o **Webcam**. Lascia **Scheda intera** oppure trascina sull’anteprima per registrare una parte della pagina. La scheda di registrazione contiene il timer e i pulsanti **Pausa**, **Stop** e **Annulla**, quindi nel video non compaiono controlli. Premi `Alt+Shift+X` per fermare da qualsiasi scheda.

## Cosa cambia

L’editor di registrazione aggiunge uno zoom 2x a ogni clic del tuo cursore. Puoi spostare o eliminare quegli zoom, aggiungere zoom manuali a 1.5x, 2x o 3x e tagliare ogni segmento. La webcam entra nell’esportazione come una bolla rotonda che posizioni tu, e il pannello **Beautify** aggiunge spaziatura e uno sfondo. L’esportazione genera un MP4 (H.264 e AAC) per impostazione predefinita, oppure un WebM. Il [riferimento della registrazione](/it/docs/#record) descrive ogni controllo.

Gli screenshot fanno parte della stessa estensione. Un clic sull’icona nella barra degli strumenti avvia una cattura **Pagina intera** con la **Modalità Express con un clic** predefinita. L’editor degli screenshot ha **Sfocatura** con riempimento **Pieno** per l’oscuramento, e **Salva immagine** apre la finestra **Esporta** per PNG, JPEG, WebP o PDF. OpenScreenShot non aggiunge nulla alla pagina durante una registrazione, quindi non puoi disegnare sulla pagina mentre registri. Le annotazioni funzionano sugli screenshot.

L’accesso all’installazione è più limitato. Il manifest di Screenity richiede `<all_urls>`, e l’elenco di Chrome mostra «Read and change all your data on all websites» (leggere e modificare tutti i tuoi dati su tutti i siti web) per `tabCapture` e «Read your browsing history» (leggere la cronologia di navigazione) per `tabs`. OpenScreenShot si installa con `activeTab` e chiede la cattura della scheda solo la prima volta che clicchi **Registra**. Chiede l’accesso a tutti i siti solo se attivi **Registra su tutti i siti**, che permette al tracciamento dei clic di seguire una scheda su un altro sito.

## Come passare a OpenScreenShot

1. Installa OpenScreenShot dal [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). La [versione per Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/) cattura solo screenshot.
2. Fissa l’icona alla barra degli strumenti.
3. Fai un primo screenshot: clicca l’icona su una pagina e controlla il risultato nell’**Editor**.
4. Clicca **Registra** nel popup e accetta la richiesta di Chrome per la cattura della scheda. Registra una breve ripresa ed esportala.
5. Imposta **Dopo la cattura** nelle **Impostazioni** per gli screenshot: **Editor**, **Appunti** o **Scarica**.
6. Esporta le registrazioni di Screenity che vuoi conservare prima di rimuoverlo.

Per presentazioni guidate delle funzioni, consulta [video dimostrativi di prodotto](/it/use-cases/product-demos/). Per mostrare un bug in una issue, consulta [screenshot per le segnalazioni di bug](/it/use-cases/bug-reports/). Se condividi video tramite link con un team, confronta l’[alternativa a Loom](/it/alternatives/loom/). Per un registratore con caricamento nel cloud, consulta l’[alternativa a Nimbus](/it/alternatives/nimbus/).
