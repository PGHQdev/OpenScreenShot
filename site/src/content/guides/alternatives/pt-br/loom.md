---
title: 'Alternativa ao Loom: gravações de abas que ficam no seu dispositivo'
description: Loom vs. OpenScreenShot. Grave uma aba do navegador com webcam, microfone e zoom automático e exporte um MP4 localmente, sem conta e sem plano pago.
order: 8
---

Mude para o OpenScreenShot se você grava demonstrações de um aplicativo web ou de uma página no Chrome e quer exportar um arquivo MP4 no seu próprio dispositivo, sem conta. Fique com o Loom se você compartilha vídeos por link: o Loom hospeda cada vídeo, oferece uma biblioteca e um espaço de trabalho para equipes, e lista aplicativos para desktop e celular. O OpenScreenShot não tem hospedagem nem links de compartilhamento, então você mesmo faz o upload ou anexa o arquivo exportado. Ele grava uma aba do navegador, só no Chrome, e não captura janelas do desktop nem a tela inteira.

O OpenScreenShot é o nosso produto. As informações sobre o Loom nesta página são de 9 de outubro de 2026 e vêm da [página de preços](https://www.loom.com/pricing), da [página na Chrome Web Store](https://chromewebstore.google.com/detail/loom-%E2%80%93-screen-recorder-sc/liecbddmkiiihnedobmlmillhodjkdmb), da [página de ajuda sobre contas](https://support.atlassian.com/loom/docs/use-loom-with-an-atlassian-account) da Atlassian e da [lista de avisos de permissão](https://developer.chrome.com/docs/extensions/reference/permissions-list) do Chrome.

## Loom e OpenScreenShot lado a lado

|                              | Loom                                                                                                                                                                   | OpenScreenShot                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Preço                        | Starter $0 (25 vídeos, gravações de tela de até 5 minutos); Business $18 por usuário por mês; Business + AI listado a $24 por usuário por mês; Enterprise sob consulta | Grátis, sem plano pago                                                   |
| Código aberto                | Não                                                                                                                                                                    | Sim, MIT                                                                 |
| Acesso a sites na instalação | Todos os sites (`<all_urls>` obrigatório, content scripts em todas as páginas)                                                                                         | Nenhum. A captura de aba é opcional e pedida na primeira gravação        |
| Captura de página inteira    | Não consta nas fontes que consultamos                                                                                                                                  | Sim                                                                      |
| Anotações e desfoque         | Não consta nas fontes que consultamos                                                                                                                                  | Sim, nas capturas de tela                                                |
| Exportação em PDF            | Não consta nas fontes que consultamos                                                                                                                                  | Sim, para capturas de tela                                               |
| Gravação de abas             | Gravação de tela, com limites por plano                                                                                                                                | Sim, só a aba, no Chrome (a versão para Firefox só faz capturas de tela) |
| Conta ou nuvem               | Conta obrigatória; vídeos hospedados pelo Loom                                                                                                                         | Sem conta, sem uploads                                                   |

O Loom faz parte da Atlassian desde novembro de 2023, e uma conta do Loom pode usar uma conta da Atlassian.

## O que continua igual

Você continua com um gravador que inicia pela barra de ferramentas do navegador. Clique em **Gravar** no popup do OpenScreenShot, ative **Mic** e **Webcam** e clique em **Iniciar gravação**. Sua webcam aparece na exportação como uma bolha redonda que você posiciona. **Som da aba** adiciona o som da página.

## O que muda

O vídeo é um arquivo. Quando você para, o editor de gravação abre na mesma aba. Ele adiciona um zoom de 2x em cada clique, para que quem assiste veja onde você clicou. Você pode ajustar ou excluir cada zoom, adicionar os seus em 1,5x, 2x ou 3x e aparar trechos. A exportação gera um arquivo MP4 (H.264 e AAC) ou WebM na sua pasta de downloads. Faça o upload para o seu próprio serviço de vídeo, um chat ou um ticket. A [referência de gravação](/pt-br/docs/#record) cobre cada controle.

As gravações ficam no seu dispositivo. O OpenScreenShot as salva no IndexedDB enquanto você grava e as mantém até você excluir a sessão. Ele não tem analytics nem telemetria. A [seção de privacidade](/pt-br/docs/#privacy) tem os detalhes.

O escopo é uma aba. Mantenha **Aba inteira** ou arraste sobre a prévia para gravar parte da página. Se a aba for para outro site durante uma gravação, o rastreamento de cliques precisa de **Gravar em todos os sites**, que pede acesso a todos os sites. Sem isso, o zoom e os efeitos de clique param no resto do vídeo, e o vídeo continua gravando.

O acesso na instalação é menor. O manifesto do Loom exige `<all_urls>`, `tabCapture` e `desktopCapture`. A lista do Chrome mostra “Ler e alterar todos os seus dados em todos os sites” para `tabCapture` e “Capture content of your screen” (capturar o conteúdo da sua tela) para `desktopCapture`. O OpenScreenShot é instalado com `activeTab` e pede a captura de aba só na primeira vez que você clica em **Gravar**.

O OpenScreenShot também faz capturas de tela. Um clique no ícone da barra de ferramentas inicia uma captura de **Página inteira** com o **Modo Express de um clique** padrão, e o editor tem setas, números de passo e **Desfoque** com preenchimento **Sólido**.

## Como mudar

1. Instale o OpenScreenShot pela [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). A [versão para Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/) só faz capturas de tela.
2. Fixe o ícone na barra de ferramentas.
3. Clique em **Gravar** no popup e aceite o pedido de captura de aba do Chrome. Grave um trecho curto e clique em **Exportar**.
4. Pressione `Alt+Shift+X` para parar uma gravação a partir de qualquer aba.
5. Para capturas de tela, defina **Após capturar** em **Configurações**: **Editor**, **Copiar** ou **Baixar**.
6. Baixe os vídeos do Loom que você quer manter antes de encerrar sua conta ou mudar de plano.

Para demonstrações de recursos, veja [vídeos de demonstração de produto](/pt-br/use-cases/product-demos/). Para respostas de suporte, veja [capturas de tela para suporte ao cliente](/pt-br/use-cases/customer-support/). Para um gravador de código aberto que também grava o desktop, veja a [alternativa ao Screenity](/pt-br/alternatives/screenity/). Para um gravador com links na nuvem, veja a [alternativa ao Awesome Screenshot](/pt-br/alternatives/awesome-screenshot/).
