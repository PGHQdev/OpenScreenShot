---
title: 'Alternativa ao Nimbus Screenshot: captura local depois da mudança para FuseBase'
description: O Nimbus Screenshot agora é o FuseBase Pro. O OpenScreenShot é uma opção grátis e de código aberto para capturar, anotar e gravar abas no seu dispositivo.
order: 5
---

O Nimbus Screenshot agora é distribuído no Chrome como FuseBase Pro, da Nimbus Web. Mude para o OpenScreenShot se você usava o Nimbus para capturar, anotar e gravar páginas web e quer uma ferramenta grátis que mantém os arquivos no seu dispositivo, sem conta e sem espaço de trabalho na nuvem. Fique com o FuseBase Pro se você precisa do que o OpenScreenShot não tem: gravação de tela além de uma aba e uploads para FuseBase, Google Drive, Dropbox ou Slack. O OpenScreenShot grava uma aba do navegador, só no Chrome. Ele não captura janelas do desktop nem a tela inteira.

O OpenScreenShot é o nosso produto. As informações sobre o FuseBase Pro nesta página são de 9 de outubro de 2026 e vêm da [página na Chrome Web Store](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn), da [página de capturas de tela](https://thefusebase.com/screenshot/) e da [página de preços](https://thefusebase.com/pricing/) do FuseBase, da antiga [página do complemento Nimbus para Firefox](https://addons.mozilla.org/en-US/firefox/addon/nimbus-screenshot/) e do manifesto da versão 3.6.19 obtido no servidor de atualizações do Google.

## O que aconteceu com o Nimbus Screenshot

A página original do Nimbus Screenshot & Screen Video Recorder não está mais na Chrome Web Store. A antiga página de capturas do Nimbus, nimbusweb.me/screenshot.php, agora redireciona para a página de capturas do FuseBase. A extensão atual para Chrome é “FuseBase Pro - Capture screenshots and Video record”, oferecida pela Nimbus Web, Inc. O antigo complemento Nimbus ainda está listado para Firefox. A última atualização dele foi em 31 de julho de 2020.

## FuseBase Pro e OpenScreenShot lado a lado

|                              | FuseBase Pro (antigo Nimbus)                                                         | OpenScreenShot                                            |
| ---------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Preço                        | Plano grátis com gravações de até 5 minutos; plano Pro com gravações de até 10 horas | Grátis, sem plano pago                                    |
| Código aberto                | Não                                                                                  | Sim, MIT                                                  |
| Acesso a sites na instalação | Todos os sites (`<all_urls>` obrigatório, content scripts em todas as páginas)       | Nenhum. Acesso à aba atual quando você inicia uma captura |
| Captura de página inteira    | Sim                                                                                  | Sim                                                       |
| Anotações e desfoque         | Sim                                                                                  | Sim, todas as ferramentas grátis                          |
| Exportação em PDF            | Sim, segundo a página na loja                                                        | Sim                                                       |
| Gravação de abas             | Sim, tela e webcam; a conversão para GIF e MP4 é premium                             | Sim, só a aba, no Chrome; MP4 e WebM grátis               |
| Conta ou nuvem               | Uploads para FuseBase, Google Drive, Dropbox e Slack                                 | Sem conta, sem uploads                                    |

A página de capturas do FuseBase não mostra um preço para o plano Pro de captura. A página de preços do FuseBase lista planos de espaço de trabalho, a partir do Solo por $32 ou $39 por mês conforme a cobrança, e não cita a extensão de captura.

## O que continua igual

Você continua com a captura de página inteira, um editor com ferramentas de anotação e desfoque, e a exportação em PDF. No Chrome, você continua com a gravação com webcam, e o OpenScreenShot também grava o microfone e o som da aba. As exportações não têm marca d'água.

## O que muda

Os arquivos ficam no seu dispositivo. O OpenScreenShot guarda as capturas no armazenamento local do navegador e as gravações no IndexedDB até você excluí-las, e não tem analytics nem telemetria. A seção de privacidade do FuseBase Pro na Chrome Web Store declara a coleta de informações de identificação pessoal, informações de autenticação e conteúdo de sites. Para compartilhar uma captura do OpenScreenShot, clique em **Copiar** e cole, ou clique em **Salvar imagem** e anexe o arquivo.

O acesso na instalação é menor. O OpenScreenShot usa `activeTab`, que cobre uma aba quando você inicia uma captura. O Chrome pede a permissão opcional de captura de aba na primeira vez que você clica em **Gravar**, e pede acesso a todos os sites só se você ativar **Gravar em todos os sites**.

A gravação cobre uma aba. Clique em **Gravar** no popup, escolha **Mic**, **Som da aba** ou **Webcam** e grave a aba inteira ou uma área que você arrasta. O editor de gravação adiciona um zoom de 2x em cada clique, e você pode aparar trechos e posicionar a bolha da webcam. A exportação em MP4 e WebM é grátis. O OpenScreenShot não exporta em GIF. Veja a [referência de gravação](/pt-br/docs/#record).

## Como mudar

1. Instale o OpenScreenShot pela [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ou pelo [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/). A versão para Firefox só faz capturas de tela.
2. Fixe o ícone na barra de ferramentas.
3. Clique no ícone em uma página. Com o **Modo Express de um clique** padrão, isso inicia uma captura de **Página inteira** e abre o **Editor**. Clique com o botão direito na página para **Área visível**, **Região selecionada** e **Capturar elemento**.
4. Defina **Após capturar** em **Configurações**: **Editor**, **Copiar** ou **Baixar**.
5. Baixe os arquivos que você quer manter do FuseBase ou do seu armazenamento em nuvem. Para anotar uma captura antiga, solte a imagem no editor do OpenScreenShot.
6. Confira `chrome://extensions` e remova a extensão Nimbus ou FuseBase se você não a usa mais.

Para vídeos curtos de recursos, veja [vídeos de demonstração de produto](/pt-br/use-cases/product-demos/). Para capturas com marcações para uma equipe, veja [como capturar uma página para revisão de design](/pt-br/use-cases/design-review/). Para outros gravadores, veja a [alternativa ao Awesome Screenshot](/pt-br/alternatives/awesome-screenshot/) e a [alternativa ao Screenity](/pt-br/alternatives/screenity/).
