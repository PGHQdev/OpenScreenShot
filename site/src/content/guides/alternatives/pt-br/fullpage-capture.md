---
title: 'Alternativa ao FullPage Capture: código aberto e sem acesso a todos os sites na instalação'
description: FullPage Capture vs. OpenScreenShot. Os dois capturam e anotam páginas inteiras de graça. O OpenScreenShot tem código aberto e não pede acesso a todos os sites.
order: 2
---

Mude para o OpenScreenShot se você quer uma extensão de captura de página inteira cujo código você pode ler e que não pede acesso a todos os sites na instalação. Fique com o FullPage Capture se você precisa do que a exportação em PDF dele oferece: a página na loja descreve PDFs com links clicáveis e quebras de página inteligentes, e o plano Pro adiciona PDFs pesquisáveis. O OpenScreenShot salva o PDF como imagem, então o texto não pode ser pesquisado nem selecionado e os links não funcionam. O OpenScreenShot captura apenas páginas web no navegador; ele não captura janelas do desktop nem a tela inteira.

O OpenScreenShot é o nosso produto. As informações sobre o FullPage Capture nesta página são de 9 de outubro de 2026 e vêm da [página na Chrome Web Store](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol), do [site](https://fullpagecapture.net/) e do manifesto da versão 1.19.67 obtido no servidor de atualizações do Google.

## FullPage Capture e OpenScreenShot lado a lado

|                              | FullPage Capture                                                                            | OpenScreenShot                                                                                                |
| ---------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Preço                        | Grátis; o Pro custa $19 por ano depois de 7 dias de teste                                   | Grátis, sem plano pago                                                                                        |
| Código aberto                | Não                                                                                         | Sim, MIT                                                                                                      |
| Acesso a sites na instalação | Todos os sites (`<all_urls>` obrigatório)                                                   | Nenhum. Acesso à aba atual quando você inicia uma captura                                                     |
| Captura de página inteira    | Sim, grátis e sem marca d'água                                                              | Sim, grátis e sem marca d'água                                                                                |
| Anotações e desfoque         | Grátis (setas, formas, texto, marca-texto, caneta, selos numerados, desfoque e pixelização) | Grátis (formas, setas, texto, marca-texto, caneta, números de passo, desfoque, mosaico, preenchimento Sólido) |
| Exportação em PDF            | Sim, com links clicáveis e quebras de página inteligentes; o PDF pesquisável é Pro          | Sim, como imagem: uma página, ou páginas A4 ou Carta com sobreposição                                         |
| Gravação de abas             | Não                                                                                         | Sim, no Chrome (a versão para Firefox só faz capturas de tela)                                                |
| Conta ou nuvem               | A página na loja diz que não há conta; o Pro usa uma conta e “Send to your cloud”           | Sem conta, sem uploads                                                                                        |

A [comparação completa](/pt-br/compare/) coloca o GoFullPage na mesma tabela.

## Acesso na instalação

O manifesto do FullPage Capture exige a permissão de host `<all_urls>`. O Chrome mostra o aviso “Ler e alterar todos os seus dados em todos os sites” quando você instala uma extensão com essa permissão. A página na loja diz “No account, no analytics, no network requests. Files stay on your device” (sem conta, sem analytics, sem requisições de rede; os arquivos ficam no seu dispositivo), e o site diz “The extension makes zero network requests” (a extensão não faz nenhuma requisição de rede). Não testamos o comportamento de rede dele, e esta página não faz nenhuma afirmação sobre isso.

O OpenScreenShot não exige permissão de host. Ele usa `activeTab`, que dá acesso a uma aba no momento em que você clica no ícone, pressiona um atalho ou escolhe uma captura no menu do botão direito. O Chrome pede a permissão opcional de captura de aba só na primeira vez que você clica em **Gravar**. O acesso a todos os sites só é pedido se você ativar **Gravar em todos os sites**. A [seção de privacidade](/pt-br/docs/#privacy) explica como as capturas ficam no seu dispositivo.

## O que continua igual

O fluxo de trabalho é parecido. Um clique no ícone da barra de ferramentas inicia uma captura de **Página inteira** com o **Modo Express de um clique** padrão, e o resultado abre no **Editor**. Setas, formas, texto, selos numerados e desfoque são todos grátis. Salvar, copiar e exportar em PDF também são grátis, e nenhuma exportação tem marca d'água.

## O que muda

Para ocultar dados, escolha **Desfoque** (`B`) e depois o preenchimento **Sólido** em **Ocultação**. O Sólido cobre a área por completo na exportação. O [guia de ocultação](/pt-br/blog/redact-screenshot/) mostra como conferir o arquivo salvo.

O PDF funciona de outra forma. Clique em **Salvar imagem** para abrir o diálogo **Exportar**, escolha **PDF** e selecione **Inteira** para uma página do tamanho da imagem, ou **A4** ou **Carta** com **Dividir em várias páginas**. As páginas se sobrepõem em 5 mm para que o texto não seja cortado no meio da linha. O [guia de captura para PDF](/pt-br/blog/save-screenshot-as-pdf/) compara os layouts.

O OpenScreenShot não tem captura em lote nem upload para a nuvem. Ele adiciona **Capturar elemento** para um cartão ou uma tabela, o painel **Beautify** para margem, cantos, sombra e fundo, e, no Chrome, gravação de abas em MP4 ou WebM. Ele também funciona no Firefox para capturas de tela.

## Como mudar

1. Instale o OpenScreenShot pela [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ou pelo [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fixe o ícone na barra de ferramentas e desafixe o FullPage Capture se ele estiver no mesmo lugar.
3. Abra uma página longa e clique no ícone. Confira o resultado no **Editor**.
4. Defina **Após capturar** em **Configurações**: **Editor** para anotar, **Copiar** para colar a imagem na hora ou **Baixar** para salvar um PNG sem abrir aba.
5. Defina um **Nome do arquivo** em **Configurações**, por exemplo `{date}_{domain}`, para que os arquivos salvos fiquem ordenados por data e site.
6. Remova o FullPage Capture em `chrome://extensions` quando não o usar mais.

Para capturas anotadas em sistemas de issues, veja [capturas de tela para relatórios de bugs](/pt-br/use-cases/bug-reports/). A [referência de modos de captura](/pt-br/docs/#modes) cobre todos os modos. Para outras ferramentas de página inteira, veja a [alternativa ao GoFullPage](/pt-br/alternatives/gofullpage/) e a [alternativa ao FireShot](/pt-br/alternatives/fireshot/).
