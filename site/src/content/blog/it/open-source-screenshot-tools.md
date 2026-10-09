---
title: Strumenti open source per screenshot su ogni piattaforma
description: Strumenti open source per screenshot ordinati per dove funzionano, da OpenScreenShot e Screenity nel browser a ShareX su Windows, Flameshot su Linux, macOS e Windows, Firefox Screenshots, e shot-scraper, Playwright e Puppeteer per gli script.
audience: everyday
order: 8
---

Scegli uno strumento open source per screenshot in base a dove si trova ciò che catturi. Per qualsiasi cosa sullo schermo di Windows, usa ShareX. Per desktop Linux, macOS o Windows, usa Flameshot. Per le pagine web, usa uno strumento del browser come OpenScreenShot o lo strumento Screenshots integrato in Firefox, e per gli screenshot da uno script, usa shot-scraper, Playwright o Puppeteer.

OpenScreenShot è un nostro prodotto. Questa pagina dice dove non è adatto, e non stila una classifica degli strumenti. Tutti i fatti sono aggiornati al 9 ottobre 2026 e vengono dal repository, dalla scheda nello store o dal sito ufficiale di ogni progetto, con i link qui sotto.

## Quale strumento copre quale piattaforma

| Strumento           | Funziona su                                             | Cattura                                                                               | Licenza          | Pagina intera                    | Video                                                |
| ------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------- | -------------------------------- | ---------------------------------------------------- |
| OpenScreenShot      | Chrome, Firefox                                         | Pagine web in una scheda                                                              | MIT              | Sì                               | Registrazione della scheda, solo versione per Chrome |
| Screenity           | Chrome e browser Chromium che usano il Chrome Web Store | Registrazioni di una scheda, un’area, il desktop, una finestra di app o la fotocamera | GPL-3.0          | Non documentato                  | Sì                                                   |
| ShareX              | Windows                                                 | Qualsiasi cosa sullo schermo                                                          | GPL-3.0          | Cattura a scorrimento            | Video e GIF                                          |
| Flameshot           | Linux, macOS, Windows                                   | Un’area dello schermo                                                                 | GPL-3.0          | No                               | Non documentato                                      |
| Firefox Screenshots | Firefox desktop                                         | Pagine web                                                                            | Parte di Firefox | Sì                               | Non documentato                                      |
| shot-scraper        | Python 3.10 o successivo                                | Pagine web, da un comando                                                             | Apache-2.0       | Sì, per impostazione predefinita | Sì, da un file di script                             |
| Playwright          | Node.js, Python, Java, .NET                             | Pagine web, dal codice                                                                | Apache-2.0       | Sì                               | Sì                                                   |
| Puppeteer           | Node.js                                                 | Pagine web, dal codice                                                                | Apache-2.0       | Sì                               | Sì, Chrome                                           |

Nessuno di questi strumenti funziona su Android o iOS. Un’estensione del browser vede solo la pagina web nella sua scheda. Un’app desktop vede tutto lo schermo ma non sa dove finisce una pagina web.

## Nel browser: OpenScreenShot

[OpenScreenShot](https://github.com/pghqdev/OpenScreenShot) è un’estensione con licenza MIT per [Chrome](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) e [Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/). Cattura una pagina intera, l’area visibile, una regione selezionata o un singolo elemento. Poi apre un editor con frecce, forme, testo, numeri dei passi, sfocatura e ritaglio, ed esporta in PNG, JPEG, WebP o PDF. Cattura e modifica avvengono nel tuo browser, e l’estensione non carica online i tuoi screenshot o le tue registrazioni. La [documentazione](/it/docs/) copre ogni modalità.

La versione per Chrome può anche [registrare una scheda](/it/docs/#record) con microfono, audio della scheda e webcam facoltativi, ed esporta in MP4 o WebM. La versione per Firefox fa solo screenshot.

OpenScreenShot è lo strumento sbagliato quando ciò che ti serve è fuori da una scheda del browser. Non può catturare il desktop, un’altra app o una pagina di impostazioni del browser, e non registra l’intero schermo.

## Registrazione nel browser: Screenity

[Screenity](https://github.com/alyssaxuu/screenity) è un’estensione per Chrome che registra lo schermo e permette di annotare. Registra una scheda, un’area, il desktop, qualsiasi finestra di app o la fotocamera, con microfono e audio interno. Esporta in MP4, GIF o WebM, o salva su Google Drive. Puoi disegnare, aggiungere testo, frecce e forme, e sfocare i contenuti sensibili della pagina.

La licenza è [GPL-3.0](https://github.com/alyssaxuu/screenity/blob/master/LICENSE). Il README dice che la licenza è passata a GPLv3 per la versione Manifest V3, dalla versione 3.0.0. L’estensione è gratuita e non richiede l’accesso a un account per le registrazioni locali. [Screenity Pro](https://screenity.io/pro) costa 10 $ al mese o 120 $ l’anno dopo una prova di 7 giorni e aggiunge un editor, la condivisione tramite link e l’hosting nel cloud su server nell’UE, con un account. Il README dice che alcune parti del codice si collegano a Screenity Pro, e che sono attive solo nella versione del Chrome Web Store.

Screenity chiede l’accesso a tutti i siti web all’installazione. La sua documentazione non descrive screenshot a pagina intera. Sceglilo al posto di OpenScreenShot quando devi registrare il desktop o un’altra app; vedi le [alternative a Screenity](/it/alternatives/screenity/).

## Windows: ShareX

[ShareX](https://getsharex.com/) è un’app gratuita per Windows senza pubblicità, con licenza [GPL-3.0](https://github.com/ShareX/ShareX). Cattura lo schermo, una finestra o una regione, e la sua [cattura a scorrimento](https://getsharex.com/docs/scrolling-screenshot) confronta screenshot successivi e aggiunge le sezioni cambiate, così una sola immagine può contenere contenuti che scorrono oltre lo schermo. Registra anche video e GIF, e il suo README elenca l’OCR e la scansione dei codici QR.

L’editor di immagini ha forme, frecce, testo, fumetti, sfocatura, pixelatura, evidenziazione e spotlight. ShareX può caricare su molti servizi, e le attività dopo la cattura possono caricare in automatico se le configuri. Controlla queste impostazioni prima di catturare contenuti privati. Puoi ottenerlo come programma di installazione, come versione portatile, o dal Microsoft Store o da Steam. L’ultima release, v21.0.0, è uscita il 3 luglio 2026.

ShareX non funziona su macOS o Linux.

## Linux, macOS e Windows: Flameshot

[Flameshot](https://flameshot.org/) è uno strumento gratuito per screenshot per Linux, macOS e Windows, con licenza [GPL-3.0](https://github.com/flameshot-org/flameshot). Selezioni un’area e la annoti sul posto con frecce, evidenziazioni, sfocatura o pixelatura, testo, linee a mano libera, riquadri e numeri progressivi. Ha anche un’interfaccia a riga di comando. Il suo README elenca un caricamento facoltativo su Imgur, che il tasto Invio avvia, quindi impara a conoscere quel tasto prima di catturare contenuti privati.

La [versione 14.0.0](https://github.com/flameshot-org/flameshot/releases/tag/v14.0.0) (giugno 2026) chiede quale monitor catturare e usa xdg-desktop-portal come percorso di cattura principale su Linux. Il README definisce sperimentale il supporto per GNOME e Plasma su Wayland.

Flameshot non ha la cattura a scorrimento. La [richiesta di funzione](https://github.com/flameshot-org/flameshot/issues/1130) è ancora aperta. Non abbiamo trovato funzioni di registrazione nella sua documentazione. Per una pagina web intera su Linux, abbina Flameshot a uno strumento del browser.

## Integrato: Firefox Screenshots

Firefox è open source, e il suo strumento Screenshots non richiede installazione. Fai clic destro su una pagina, scegli **Take Screenshot** («Acquisisci schermata») e scegli una regione, l’area visibile o **Save full page** («Salva pagina intera»), secondo la [guida di Mozilla](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/). Il risultato lo copi o lo scarichi. Mozilla [ha interrotto i caricamenti](https://blog.mozilla.org/futurereleases/2019/01/24/clarifying-the-future-of-firefox-screenshots/) sul suo server Screenshots con Firefox 67 (maggio 2019), quindi le catture restano in locale.

Per un comando, la console di Firefox DevTools accetta `:screenshot --fullpage`, che salva un PNG in Download, secondo la [documentazione di DevTools](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html). Anche il front end di DevTools di Chrome è open source, con licenza [BSD-3-Clause](https://github.com/ChromeDevTools/devtools-frontend), e il suo comando **Capture full size screenshot** («Acquisisci screenshot a grandezza intera») salva un PNG. Le [guide allo screenshot a pagina intera](/it/full-page-screenshot/) coprono ogni browser.

## Da uno script: shot-scraper, Playwright, Puppeteer

Questi strumenti catturano pagine web da un comando o dal codice, per il lavoro ripetuto e la CI. Caricano la pagina nel loro browser, quindi non vedono le schede in cui hai effettuato l’accesso.

- [shot-scraper](https://github.com/simonw/shot-scraper) è uno strumento Python a riga di comando basato su Playwright. Fa screenshot a pagina intera per impostazione predefinita e salva anche PDF e registra video da uno script YAML.
- [Playwright](https://github.com/microsoft/playwright) è il framework di automazione del browser e di test di Microsoft per Chromium, Firefox e WebKit, con API per screenshot, PDF e video.
- [Puppeteer](https://github.com/puppeteer/puppeteer) è la libreria Node.js di Google per Chrome e Firefox, con API per screenshot, PDF e registrazione MP4.

Il nostro pacchetto `openscreenshot`, con licenza MIT, aggiunge uno strumento a riga di comando e un server MCP per agenti AI. Il [confronto per sviluppatori](/it/blog/website-screenshot-tools-for-developers/) copre tutti questi strumenti con i relativi comandi.

## Quale scegliere

- **Qualsiasi cosa sullo schermo di Windows, con cattura a scorrimento:** ShareX.
- **Un’area dello schermo su Linux o macOS:** Flameshot.
- **Una pagina web intera con markup ed esportazione PDF:** OpenScreenShot, o Firefox Screenshots per una cattura rapida senza installazione.
- **Una registrazione del desktop o di un’altra app:** Screenity, o ShareX su Windows.
- **Screenshot da uno script o dalla CI:** shot-scraper, Playwright o Puppeteer.

Se lo strumento non deve per forza essere open source, il [confronto tra estensioni per la pagina intera](/it/blog/full-page-screenshot-extensions/) aggiunge GoFullPage, FireShot e altri. La [pagina di confronto](/it/compare/) mette fianco a fianco OpenScreenShot, GoFullPage e FullPage Capture.
