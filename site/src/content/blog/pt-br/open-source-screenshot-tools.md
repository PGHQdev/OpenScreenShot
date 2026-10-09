---
title: Ferramentas de captura de tela de código aberto para cada plataforma
description: 'Ferramentas de captura de código aberto por plataforma: OpenScreenShot, Screenity, ShareX, Flameshot, Firefox Screenshots, shot-scraper, Playwright e Puppeteer.'
audience: everyday
order: 8
---

Escolha uma ferramenta de captura de tela de código aberto de acordo com o lugar onde está o que você quer capturar. Para qualquer coisa na tela do Windows, use o ShareX. Para desktops Linux, macOS ou Windows, use o Flameshot. Para páginas web, use uma ferramenta de navegador como o OpenScreenShot ou a ferramenta Screenshots nativa do Firefox, e para capturas a partir de um script, use shot-scraper, Playwright ou Puppeteer.

O OpenScreenShot é nosso produto. Esta página diz onde ele não serve e não classifica as ferramentas. Todos os fatos são de 9 de outubro de 2026 e vêm do repositório, da página na loja ou do site oficial de cada projeto, com links abaixo.

## Qual ferramenta cobre qual plataforma

| Ferramenta          | Onde funciona                                             | O que captura                                                       | Licença          | Página inteira      | Vídeo                                      |
| ------------------- | --------------------------------------------------------- | ------------------------------------------------------------------- | ---------------- | ------------------- | ------------------------------------------ |
| OpenScreenShot      | Chrome, Firefox                                           | Páginas web em uma aba                                              | MIT              | Sim                 | Gravação de abas, só na versão para Chrome |
| Screenity           | Chrome e navegadores Chromium que usam a Chrome Web Store | Gravações de uma aba, área, desktop, janela de aplicativo ou câmera | GPL-3.0          | Não documentado     | Sim                                        |
| ShareX              | Windows                                                   | Qualquer coisa na tela                                              | GPL-3.0          | Captura com rolagem | Vídeo e GIF                                |
| Flameshot           | Linux, macOS, Windows                                     | Uma área da tela                                                    | GPL-3.0          | Não                 | Não documentado                            |
| Firefox Screenshots | Firefox para desktop                                      | Páginas web                                                         | Parte do Firefox | Sim                 | Não documentado                            |
| shot-scraper        | Python 3.10 ou mais recente                               | Páginas web, por um comando                                         | Apache-2.0       | Sim, por padrão     | Sim, a partir de um arquivo de script      |
| Playwright          | Node.js, Python, Java, .NET                               | Páginas web, por código                                             | Apache-2.0       | Sim                 | Sim                                        |
| Puppeteer           | Node.js                                                   | Páginas web, por código                                             | Apache-2.0       | Sim                 | Sim, Chrome                                |

Nenhuma dessas ferramentas funciona no Android ou no iOS. Uma extensão de navegador vê só a página web na aba dela. Um aplicativo de desktop vê a tela inteira, mas não sabe onde uma página web termina.

## No navegador: OpenScreenShot

O [OpenScreenShot](https://github.com/pghqdev/OpenScreenShot) é uma extensão com licença MIT para [Chrome](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) e [Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/). Ele captura uma página inteira, a área visível, uma região selecionada ou um elemento. Depois, abre um editor com setas, formas, texto, números de passo, desfoque e recorte, e exporta PNG, JPEG, WebP ou PDF. A captura e a edição são executadas no seu navegador, e a extensão não envia suas capturas ou gravações para servidores. A [documentação](/pt-br/docs/) explica cada modo.

A versão para Chrome também [grava uma aba](/pt-br/docs/#record) com microfone, som da aba e webcam opcionais, e exporta MP4 ou WebM. A versão para Firefox só faz capturas de tela.

O OpenScreenShot não é a ferramenta certa quando o que você precisa está fora de uma aba do navegador. Ele não captura a área de trabalho, outro aplicativo nem uma página de configurações do navegador, e não grava a tela inteira.

## Gravação no navegador: Screenity

O [Screenity](https://github.com/alyssaxuu/screenity) é uma extensão de gravação de tela e anotação para Chrome. Ele grava uma aba, uma área, a área de trabalho, qualquer janela de aplicativo ou a câmera, com microfone e áudio interno. Ele exporta MP4, GIF ou WebM, ou salva no Google Drive. Você pode desenhar, adicionar texto, setas e formas, e desfocar conteúdo sensível da página.

A licença é [GPL-3.0](https://github.com/alyssaxuu/screenity/blob/master/LICENSE). O README diz que a licença mudou para GPLv3 na versão Manifest V3, a partir da versão 3.0.0. A extensão é grátis e não exige login para gravações locais. O [Screenity Pro](https://screenity.io/pro) custa US$ 10 por mês ou US$ 120 por ano depois de um teste de 7 dias e adiciona um editor, compartilhamento por link e hospedagem na nuvem em servidores na UE, com uma conta. O README diz que alguns trechos do código se conectam ao Screenity Pro e que eles só ficam ativos na versão da Chrome Web Store.

O Screenity pede acesso a todos os sites na instalação. A documentação dele não descreve capturas de página inteira. Escolha-o em vez do OpenScreenShot quando você precisa gravar a área de trabalho ou outro aplicativo; veja [alternativas ao Screenity](/pt-br/alternatives/screenity/).

## Windows: ShareX

O [ShareX](https://getsharex.com/) é um aplicativo grátis para Windows, sem anúncios, com licença [GPL-3.0](https://github.com/ShareX/ShareX). Ele captura a tela, uma janela ou uma região, e a [captura com rolagem](https://getsharex.com/docs/scrolling-screenshot) dele compara capturas sucessivas e acrescenta as seções que mudaram, então uma única imagem pode conter conteúdo que passa da tela. Ele também grava vídeos e GIFs, e o README dele lista OCR e leitura de QR codes.

O editor de imagens tem formas, setas, texto, balões de fala, desfoque, pixelização, destaque e spotlight. O ShareX pode enviar arquivos para muitos serviços, e as tarefas após a captura podem fazer o envio automaticamente se você configurá-las. Confira essas configurações antes de capturar conteúdo privado. Você pode obtê-lo como instalador, como versão portátil ou pela Microsoft Store ou pela Steam. A versão mais recente, v21.0.0, saiu em 3 de julho de 2026.

O ShareX não funciona no macOS nem no Linux.

## Linux, macOS e Windows: Flameshot

O [Flameshot](https://flameshot.org/) é uma ferramenta de captura de tela grátis para Linux, macOS e Windows, com licença [GPL-3.0](https://github.com/flameshot-org/flameshot). Você seleciona uma área e faz anotações no próprio lugar com setas, destaques, desfoque ou pixelização, texto, linhas à mão livre, caixas e números de contagem. Ele também tem uma interface de linha de comando. O README dele lista um envio opcional para o Imgur, que a tecla Return inicia, então aprenda essa tecla antes de capturar conteúdo privado.

A [versão 14.0.0](https://github.com/flameshot-org/flameshot/releases/tag/v14.0.0) (junho de 2026) pergunta qual monitor capturar e usa o xdg-desktop-portal como principal caminho de captura no Linux. O README diz que o suporte ao Wayland no GNOME e no Plasma é experimental.

O Flameshot não tem captura com rolagem. O [pedido do recurso](https://github.com/flameshot-org/flameshot/issues/1130) continua aberto. Não encontramos um recurso de gravação na documentação dele. Para uma página web inteira no Linux, combine o Flameshot com uma ferramenta de navegador.

## Nativo: Firefox Screenshots

O Firefox é de código aberto, e a ferramenta Screenshots dele não exige instalação. Clique com o botão direito em uma página, escolha **Take Screenshot** (fazer captura de tela) e selecione uma região, a área visível ou **Save full page** (salvar página inteira), segundo o [guia da Mozilla](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/). Você copia ou baixa o resultado. A Mozilla [encerrou o envio](https://blog.mozilla.org/futurereleases/2019/01/24/clarifying-the-future-of-firefox-screenshots/) para o servidor do Screenshots no Firefox 67 (maio de 2019), então as capturas ficam no dispositivo.

Para usar um comando, o console do DevTools do Firefox aceita `:screenshot --fullpage`, que salva um PNG em Downloads, segundo a [documentação do DevTools](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html). O front-end do DevTools do Chrome também é de código aberto, sob a licença [BSD-3-Clause](https://github.com/ChromeDevTools/devtools-frontend), e o comando **Capture full size screenshot** (capturar a página em tamanho completo) dele salva um PNG. Os [guias de captura de página inteira](/pt-br/full-page-screenshot/) explicam cada navegador.

## A partir de um script: shot-scraper, Playwright, Puppeteer

Essas ferramentas capturam páginas web a partir de um comando ou de código, para trabalho repetitivo e CI. Elas carregam a página no próprio navegador, então não veem suas abas com sessão iniciada.

- O [shot-scraper](https://github.com/simonw/shot-scraper) é uma ferramenta de linha de comando em Python baseada no Playwright. Ele faz capturas de página inteira por padrão e também salva PDFs e grava vídeos a partir de um script YAML.
- O [Playwright](https://github.com/microsoft/playwright) é o framework de automação de navegadores e testes da Microsoft para Chromium, Firefox e WebKit, com APIs de captura de tela, PDF e vídeo.
- O [Puppeteer](https://github.com/puppeteer/puppeteer) é a biblioteca Node.js do Google para Chrome e Firefox, com APIs de captura de tela, PDF e gravação em MP4.

Nosso próprio pacote `openscreenshot`, com licença MIT, adiciona uma ferramenta de linha de comando e um servidor MCP para agentes de IA. A [comparação para desenvolvedores](/pt-br/blog/website-screenshot-tools-for-developers/) cobre todas essas ferramentas, com comandos.

## Qual escolher

- **Qualquer coisa na tela do Windows, com captura com rolagem:** ShareX.
- **Uma área da tela no Linux ou no macOS:** Flameshot.
- **Uma página web inteira com marcação e exportação em PDF:** OpenScreenShot, ou Firefox Screenshots para uma captura rápida sem instalação.
- **Uma gravação da área de trabalho ou de outro aplicativo:** Screenity, ou ShareX no Windows.
- **Capturas a partir de um script ou de CI:** shot-scraper, Playwright ou Puppeteer.

Se a ferramenta não precisa ser de código aberto, a [comparação de extensões de página inteira](/pt-br/blog/full-page-screenshot-extensions/) inclui GoFullPage, FireShot e outras. A [página de comparação](/pt-br/compare/) coloca OpenScreenShot, GoFullPage e FullPage Capture lado a lado.
