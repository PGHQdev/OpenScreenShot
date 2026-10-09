---
title: Extensões de captura de página inteira comparadas (2026)
description: 'OpenScreenShot, GoFullPage, FullPage Capture, Awesome Screenshot, FireShot e Nimbus/FuseBase: preço, código, permissões, anotação, PDF, vídeo e opções nativas.'
audience: everyday
order: 7
---

Se você precisa de uma captura de página inteira só de vez em quando, as ferramentas nativas do Chrome DevTools, do Microsoft Edge e do Firefox capturam uma página inteira sem instalar nada. Se você captura páginas com frequência, as extensões abaixo diferem no que é grátis, no acesso a sites que pedem na instalação, na gravação de vídeo e na disponibilidade pública do código-fonte. Cada seção diz para quem a ferramenta serve.

O OpenScreenShot é nosso produto, e listamos os casos em que outra ferramenta serve melhor. Todos os fatos são de 9 de outubro de 2026 e vêm das páginas nas lojas, dos manifestos das extensões e das páginas dos fornecedores, com links em cada seção. Esta página compara recursos e não classifica as ferramentas.

## As ferramentas em resumo

| Ferramenta            | Preço                                                  | Código aberto                       | Acesso a todos os sites na instalação | Anotação grátis?                                        | PDF                                            | Gravação                    |
| --------------------- | ------------------------------------------------------ | ----------------------------------- | ------------------------------------- | ------------------------------------------------------- | ---------------------------------------------- | --------------------------- |
| OpenScreenShot        | Grátis                                                 | Sim, MIT                            | Não                                   | Sim                                                     | Sim                                            | Só abas, versão para Chrome |
| GoFullPage            | Grátis; Premium por US$ 12 por ano                     | Não                                 | Não                                   | Não, Premium                                            | Sim; divisão inteligente de páginas no Premium | Não                         |
| FullPage Capture      | Grátis; Pro por US$ 19 por ano                         | Não                                 | Sim                                   | Sim                                                     | Sim; PDF pesquisável no Pro                    | Não                         |
| Awesome Screenshot    | Plano grátis; pagos a partir de US$ 5 por mês          | Sem código-fonte público            | Sim                                   | Ferramentas básicas; todas nos planos pagos             | Sim                                            | Desktop, aba, câmera        |
| FireShot              | Grátis; Pro por US$ 39,95 por ano ou US$ 99,95 uma vez | Não                                 | Não                                   | Texto, setas, desfoque, segundo a página na loja        | Sim, com links; PDF avançado no Pro            | Não                         |
| FuseBase Pro (Nimbus) | Plano grátis; preço do Pro não publicado               | Não                                 | Sim                                   | Anotação e desfoque; divisão entre planos não publicada | Sim                                            | Tela e webcam               |
| Chrome DevTools       | Grátis, nativo                                         | Front-end do DevTools, BSD-3-Clause | Sem instalação                        | Nenhum editor documentado                               | Não documentado                                | Não documentado             |
| Edge Screenshot       | Grátis, nativo                                         | Não                                 | Sem instalação                        | Marcação com caneta e toque                             | Não documentado                                | Não documentado             |
| Firefox Screenshots   | Grátis, nativo                                         | Parte do Firefox                    | Sem instalação                        | Não documentado                                         | Não documentado                                | Não documentado             |

“Acesso a todos os sites na instalação” significa que a extensão pede acesso de host a todos os sites quando você a adiciona. O Chrome mostra esse pedido como “Ler e alterar todos os seus dados em todos os sites”.

## OpenScreenShot

O [OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) é grátis, não tem plano pago e publica o [código-fonte no GitHub](https://github.com/pghqdev/OpenScreenShot) sob a licença MIT. Ele está na Chrome Web Store e no [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/). Um clique no ícone da barra de ferramentas inicia uma captura de página inteira; os modos de área visível, região selecionada e elemento ficam no menu do botão direito e nos atalhos de teclado. Veja os [modos de captura](/pt-br/docs/#modes).

O editor inclui formas, setas, texto, números de passo, desfoque com preenchimento opaco, spotlight, recorte e corte. A exportação é em PNG, JPEG, WebP ou PDF em uma página, ajustado a A4 ou Letter, ou dividido em várias páginas. Ele não pede acesso de host na instalação. A versão para Chrome pode [gravar uma aba](/pt-br/docs/#record) em MP4 ou WebM; o Chrome pede permissão para capturar a aba na primeira gravação. A versão para Firefox só faz capturas de tela.

Onde ele serve menos:

- Ele captura páginas web em uma aba do navegador. Ele não captura sua área de trabalho nem outros aplicativos, e só grava abas.
- Ele não tem armazenamento em nuvem nem links de compartilhamento. Você mesmo compartilha o arquivo exportado.
- O PDF dele guarda a captura como imagem, então o texto não é pesquisável.
- Páginas do navegador, como as configurações em `chrome://` e as lojas dos navegadores, não podem ser capturadas.

## GoFullPage

O [GoFullPage](https://gofullpage.com/) captura uma página com um clique e exporta PNG, JPEG ou PDF. O [FAQ](https://gofullpage.com/faq) dele diz que a versão grátis não tem limite de capturas nem de exportação de imagens e PDF. O [Premium](https://gofullpage.com/premium) custa US$ 12 por ano depois de um teste de 7 dias e adiciona recorte, anotações (desfoque, texto, destaque), URL e data e hora, e divisão inteligente de páginas no PDF.

O código é fechado. O FAQ diz que o desenvolvedor criou um fork privado do projeto MIT original em 2018. O GoFullPage foi removido da Chrome Web Store em agosto de 2026 por causa do que o [blog](https://blog.gofullpage.com/2026/08/11/gofullpage-chrome-update/) dele chama de “a copyright-related issue” (um problema relacionado a direitos autorais), e a página principal voltou em 10 de setembro de 2026. Uma [versão oficial para Firefox](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/) chegou em 7 de setembro de 2026. Ele não pede acesso de host na instalação.

O GoFullPage serve para quem quer captura com um clique e exportação em PDF sem marcação, ou para quem vai pagar pela marcação. Veja [alternativas ao GoFullPage](/pt-br/alternatives/gofullpage/).

## FullPage Capture

O [FullPage Capture](https://fullpagecapture.net/) diz que capturar, salvar, copiar e imprimir são grátis, sem marca d’água e sem limite de uso. A [página na Chrome Web Store](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol) descreve um editor grátis com setas, formas, texto, marca-texto, selos numerados e desfoque, e PDF com links clicáveis. O Pro custa US$ 19 por ano depois de um teste de 7 dias e adiciona PDF pesquisável, modo de evidência, captura em lote e envio para a nuvem.

O código é fechado, e só encontramos uma página na loja do Chrome. O manifesto dele exige acesso a todos os sites, então o Chrome mostra o aviso de acesso a todos os sites na instalação. Ele serve para quem precisa de PDFs pesquisáveis ou de captura em lote e aceita essa permissão. Veja [alternativas ao FullPage Capture](/pt-br/alternatives/fullpage-capture/).

## Awesome Screenshot

O [Awesome Screenshot](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj), da Diigo, combina capturas de tela com um gravador para a área de trabalho, uma aba ou uma câmera. A [página de preços](https://www.awesomescreenshot.com/pricing) dele lista um plano grátis com até 100 capturas, anotação básica e gravações em 720p. O Basic custa US$ 5 por mês com cobrança anual, e o Professional custa US$ 6 por mês com cobrança anual, com gravação de até 4K. Ele oferece armazenamento em nuvem com links de compartilhamento e salvamento local.

Ele pede acesso a todos os sites na instalação, e a seção de privacidade na Chrome Web Store declara a coleta de “Website content” (conteúdo de sites). A [página no Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/) cita a Mozilla Public License 2.0, mas não encontramos um repositório público de código-fonte. Ele serve para equipes que querem links de compartilhamento e um gravador de tela em uma só ferramenta. Veja [alternativas ao Awesome Screenshot](/pt-br/alternatives/awesome-screenshot/).

## FireShot

O [FireShot](https://getfireshot.com/) salva uma página inteira como PDF com links, PNG ou JPEG. O FireShot Pro custa US$ 39,95 por ano ou US$ 99,95 em pagamento único para dois dispositivos, segundo a [página de compra](https://getfireshot.com/buy.php). O Pro adiciona exportação avançada em PDF, um editor com anotações inteligentes no Windows, histórico de capturas e captura em lote. Não confirmamos quais ferramentas de edição a versão grátis para Chrome inclui.

O código é fechado. O FireShot não pede acesso de host na instalação, mas solicita mensagens nativas, que o Chrome mostra como um aviso separado. O [complemento para Firefox](https://addons.mozilla.org/en-US/firefox/addon/fireshot/) dele foi atualizado pela última vez em 5 de junho de 2023. O FireShot serve para usuários do Windows que querem captura em lote ou uma licença de pagamento único. Veja [alternativas ao FireShot](/pt-br/alternatives/fireshot/).

## Nimbus e FuseBase Pro

A página original do Nimbus Screenshot na Chrome Web Store agora mostra “This item is not available” (este item não está disponível), e a página de captura do Nimbus redireciona para o [FuseBase](https://thefusebase.com/screenshot/). A Nimbus Web agora publica o [FuseBase Pro](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn) para capturas de tela, gravação de tela e webcam, anotação, desfoque e salvamento em PDF. Ele envia arquivos para o FuseBase, Google Drive, Dropbox e Slack.

O plano grátis grava até 5 minutos e o Pro até 10 horas. A [página de preços do FuseBase](https://thefusebase.com/pricing/) lista os planos da plataforma e não informa um preço para a extensão. O FuseBase Pro pede acesso a todos os sites na instalação. Ele serve para quem já trabalha no FuseBase. Veja [alternativas ao Nimbus](/pt-br/alternatives/nimbus/).

## Sem instalação: ferramentas nativas do navegador

### Chrome DevTools

Abra o DevTools, pressione Ctrl+Shift+P (Cmd+Shift+P no macOS), digite “screenshot” e escolha **Capture full size screenshot** (capturar a página em tamanho completo). O Chrome salva um PNG. A documentação não descreve um editor; a [documentação do Command Menu](https://developer.chrome.com/docs/devtools/command-menu) lista os outros comandos de captura. Veja [o guia do Chrome](/pt-br/full-page-screenshot/chrome/).

### Microsoft Edge Screenshot

O Edge renomeou o Web Capture para Screenshot, e Ctrl+Shift+S abre a ferramenta, segundo a [página de política](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled) da Microsoft. Ela captura uma página inteira ou uma área, e você pode fazer marcações com caneta ou toque. Veja [o guia do Edge](/pt-br/full-page-screenshot/edge/).

### Firefox Screenshots

Clique com o botão direito em uma página, escolha **Take Screenshot** (fazer captura de tela) e depois **Save full page** (salvar página inteira), segundo o [guia da Mozilla](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/). Você copia ou baixa o resultado. O envio para um servidor da Mozilla terminou com o Firefox 67, em maio de 2019. Veja [o guia do Firefox](/pt-br/full-page-screenshot/firefox/).

Para Safari, Brave, Opera, Vivaldi e Arc, veja os [guias por navegador](/pt-br/full-page-screenshot/).

## Qual escolher

- **Uma página, hoje, sem instalação:** a ferramenta nativa do seu navegador.
- **Marcação e PDF grátis, sem acesso a todos os sites na instalação, código-fonte legível:** OpenScreenShot.
- **Captura com um clique, sem marcação:** a versão grátis do GoFullPage.
- **PDF pesquisável ou captura em lote:** FullPage Capture Pro ou FireShot Pro.
- **Links de compartilhamento e gravação da área de trabalho para uma equipe:** Awesome Screenshot ou FuseBase Pro.
- **Capturas de aplicativos de desktop:** uma ferramenta de desktop; veja [ferramentas de captura de código aberto para cada plataforma](/pt-br/blog/open-source-screenshot-tools/).
- **Capturas a partir de um script ou de CI:** veja [ferramentas de captura de sites para desenvolvedores](/pt-br/blog/website-screenshot-tools-for-developers/).

Todas essas ferramentas podem ter dificuldade com feeds infinitos e imagens de carregamento lento; o [guia de página inteira no Chrome](/pt-br/blog/full-page-screenshot-chrome/) explica como conferir uma captura. Para ver OpenScreenShot, GoFullPage e FullPage Capture lado a lado, veja a [página de comparação](/pt-br/compare/).
