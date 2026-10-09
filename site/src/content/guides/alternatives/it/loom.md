---
title: 'Alternativa a Loom: registrazioni della scheda che restano sul tuo dispositivo'
description: Loom o OpenScreenShot? Registra una scheda con webcam, microfono e zoom automatico ed esporta un MP4 in locale, senza account né piani a pagamento.
order: 8
---

Passa a OpenScreenShot se registri presentazioni guidate di una web app o di una pagina in Chrome e vuoi esportare un file MP4 sul tuo dispositivo, senza account. Resta con Loom se condividi i video tramite link: Loom ospita ogni video, ti dà una libreria e uno spazio di lavoro per il team, ed elenca app desktop e mobili. OpenScreenShot non ha hosting né link di condivisione, quindi carichi o alleghi tu il file esportato. Registra una scheda del browser, solo in Chrome, e non cattura finestre del desktop né l’intero schermo.

OpenScreenShot è il nostro prodotto. Le informazioni su Loom in questa pagina sono aggiornate al 9 ottobre 2026 e provengono dalla sua [pagina dei prezzi](https://www.loom.com/pricing), dalla sua [scheda sul Chrome Web Store](https://chromewebstore.google.com/detail/loom-%E2%80%93-screen-recorder-sc/liecbddmkiiihnedobmlmillhodjkdmb), dalla [pagina di aiuto sugli account](https://support.atlassian.com/loom/docs/use-loom-with-an-atlassian-account) di Atlassian e dall’[elenco degli avvisi sui permessi](https://developer.chrome.com/docs/extensions/reference/permissions-list) di Chrome.

## Loom e OpenScreenShot a confronto

|                                   | Loom                                                                                                                                                                             | OpenScreenShot                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Prezzo                            | Starter 0 $ (25 video, registrazioni dello schermo fino a 5 minuti); Business 18 $ per utente al mese; Business + AI indicato a 24 $ per utente al mese; Enterprise su richiesta | Gratuito, nessun piano a pagamento                                                      |
| Open source                       | No                                                                                                                                                                               | Sì, MIT                                                                                 |
| Accesso ai siti all’installazione | Tutti i siti web (`<all_urls>` obbligatorio, script di contenuto su ogni pagina)                                                                                                 | Nessuno. La cattura della scheda è facoltativa e viene chiesta alla prima registrazione |
| Cattura a pagina intera           | Non trattata nelle fonti che abbiamo controllato                                                                                                                                 | Sì                                                                                      |
| Annotazioni e sfocatura           | Non trattate nelle fonti che abbiamo controllato                                                                                                                                 | Sì, sugli screenshot                                                                    |
| Esportazione PDF                  | Non trattata nelle fonti che abbiamo controllato                                                                                                                                 | Sì, per gli screenshot                                                                  |
| Registrazione della scheda        | Registrazione dello schermo, con limiti per piano                                                                                                                                | Sì, solo la scheda, in Chrome (la versione per Firefox cattura solo screenshot)         |
| Account o cloud                   | Account obbligatorio; video ospitati da Loom                                                                                                                                     | Nessun account, nessun caricamento                                                      |

Loom fa parte di Atlassian da novembre 2023, e un account Loom può usare un account Atlassian.

## Cosa resta uguale

Mantieni un registratore che parte dalla barra degli strumenti del browser. Clicca **Registra** nel popup di OpenScreenShot, attiva **Mic** e **Webcam** e clicca **Avvia la registrazione**. La tua webcam compare nell’esportazione come una bolla rotonda che posizioni tu. **Audio scheda** aggiunge il suono della pagina.

## Cosa cambia

Il video è un file. Quando ti fermi, l’editor di registrazione si apre nella stessa scheda. Aggiunge uno zoom 2x a ogni clic, così chi guarda vede dove hai cliccato. Puoi regolare o eliminare ogni zoom, aggiungerne di tuoi a 1.5x, 2x o 3x e tagliare i segmenti. L’esportazione genera un file MP4 (H.264 e AAC) o WebM nella cartella dei download. Caricalo sul tuo servizio di hosting video, in una chat o in un ticket. Il [riferimento della registrazione](/it/docs/#record) descrive ogni controllo.

Le registrazioni restano sul tuo dispositivo. OpenScreenShot le salva in IndexedDB durante la registrazione e le conserva finché non elimini la sessione. Non ha analisi né telemetria. La [sezione sulla privacy](/it/docs/#privacy) contiene i dettagli.

L’ambito è una scheda. Lascia **Scheda intera** oppure trascina sull’anteprima per registrare una parte della pagina. Se durante una registrazione la scheda passa a un altro sito, il tracciamento dei clic richiede **Registra su tutti i siti**, che chiede l’accesso a tutti i siti. Senza di esso, zoom ed effetti clic si fermano per il resto del video, e il video continua a registrare.

L’accesso all’installazione è più limitato. Il manifest di Loom richiede `<all_urls>`, `tabCapture` e `desktopCapture`. L’elenco di Chrome mostra «Read and change all your data on all websites» (leggere e modificare tutti i tuoi dati su tutti i siti web) per `tabCapture` e «Capture content of your screen» (catturare i contenuti dello schermo) per `desktopCapture`. OpenScreenShot si installa con `activeTab` e chiede la cattura della scheda solo la prima volta che clicchi **Registra**.

OpenScreenShot fa anche screenshot. Un clic sull’icona nella barra degli strumenti avvia una cattura **Pagina intera** con la **Modalità Express con un clic** predefinita, e l’editor ha frecce, numeri di passo e **Sfocatura** con riempimento **Pieno**.

## Come passare a OpenScreenShot

1. Installa OpenScreenShot dal [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). La [versione per Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/) cattura solo screenshot.
2. Fissa l’icona alla barra degli strumenti.
3. Clicca **Registra** nel popup e accetta la richiesta di Chrome per la cattura della scheda. Registra una breve ripresa, poi clicca **Esporta**.
4. Premi `Alt+Shift+X` per fermare una registrazione da qualsiasi scheda.
5. Per gli screenshot, imposta **Dopo la cattura** nelle **Impostazioni**: **Editor**, **Appunti** o **Scarica**.
6. Scarica i video Loom che vuoi conservare prima di chiudere il tuo account o cambiare piano.

Per presentazioni guidate delle funzioni, consulta [video dimostrativi di prodotto](/it/use-cases/product-demos/). Per le risposte di assistenza, consulta [screenshot per l’assistenza clienti](/it/use-cases/customer-support/). Per un registratore open source che registra anche il desktop, consulta l’[alternativa a Screenity](/it/alternatives/screenity/). Per un registratore con link cloud, consulta l’[alternativa ad Awesome Screenshot](/it/alternatives/awesome-screenshot/).
