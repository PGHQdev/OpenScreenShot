---
title: 'Alternativa ao Screenity: capturas de tela e gravação de abas em uma só extensão'
description: Screenity vs. OpenScreenShot. Os dois têm código aberto. O OpenScreenShot adiciona capturas de página inteira e PDF, sem pedir acesso a todos os sites.
order: 7
---

Mude para o OpenScreenShot se você grava abas do navegador e também faz capturas de página inteira, e quer uma extensão de código aberto que faça as duas coisas sem acesso a todos os sites na instalação. Fique com o Screenity se você grava mais do que uma aba: ele grava uma área, o desktop, a janela de qualquer aplicativo ou a câmera, e exporta em GIF ou salva no Google Drive. O OpenScreenShot grava uma aba do navegador e não captura janelas do desktop nem a tela inteira. O plano pago Pro do Screenity também adiciona compartilhamento por link e hospedagem na nuvem, que o OpenScreenShot não oferece.

O OpenScreenShot é o nosso produto. As informações sobre o Screenity nesta página são de 9 de outubro de 2026 e vêm do [repositório no GitHub](https://github.com/alyssaxuu/screenity) e do [manifesto](https://github.com/alyssaxuu/screenity/blob/master/src/manifest.json), da [página na Chrome Web Store](https://chromewebstore.google.com/detail/screenity-screen-recorder/kbbdabhdfibnancpjfhlkhafgdilcnji), da [página do Pro](https://screenity.io/pro) e da [lista de avisos de permissão](https://developer.chrome.com/docs/extensions/reference/permissions-list) do Chrome.

## Screenity e OpenScreenShot lado a lado

|                              | Screenity                                                                     | OpenScreenShot                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Preço                        | Extensão grátis; o Pro custa $10 por mês ou $120 por ano, com 7 dias de teste | Grátis, sem plano pago                                                                     |
| Código aberto                | Sim, GPL-3.0                                                                  | Sim, MIT                                                                                   |
| Acesso a sites na instalação | Todos os sites (`<all_urls>` obrigatório, além de `tabs` e `tabCapture`)      | Nenhum. A captura de aba é opcional e pedida na primeira gravação                          |
| Captura de página inteira    | Não consta nas fontes que consultamos                                         | Sim                                                                                        |
| Anotações e desfoque         | Desenho, texto, setas, formas; desfoque do conteúdo da página                 | Formas, setas, texto, números de passo, desfoque, spotlight e recorte nas capturas de tela |
| Exportação em PDF            | Não consta nas fontes que consultamos                                         | Sim                                                                                        |
| Gravação de abas             | Sim, além de área, desktop, janela de aplicativo e câmera                     | Sim, só a aba, no Chrome (a versão para Firefox só faz capturas de tela)                   |
| Exportação de vídeo          | MP4, GIF, WebM ou Google Drive                                                | MP4 ou WebM                                                                                |
| Conta ou nuvem               | Sem login na extensão grátis; o Pro usa uma conta e nuvem hospedada na UE     | Sem conta, sem uploads                                                                     |

## O que continua igual

As duas extensões têm código aberto, e as duas mantêm as gravações grátis no seu dispositivo sem login. No OpenScreenShot, clique em **Gravar** no popup e escolha **Mic**, **Som da aba** ou **Webcam**. Mantenha **Aba inteira** ou arraste sobre a prévia para gravar parte da página. A aba de gravação mostra o cronômetro e os botões **Pausar**, **Parar** e **Cancelar**, então nenhum controle aparece no vídeo. Pressione `Alt+Shift+X` para parar a partir de qualquer aba.

## O que muda

O editor de gravação adiciona um zoom de 2x em cada clique do seu cursor. Você pode mover ou excluir esses zooms, adicionar zooms manuais em 1,5x, 2x ou 3x e aparar cada trecho. A webcam entra na exportação como uma bolha redonda que você posiciona, e o painel **Beautify** adiciona margem e um fundo. A exportação gera um MP4 (H.264 e AAC) por padrão, ou WebM. A [referência de gravação](/pt-br/docs/#record) cobre cada controle.

As capturas de tela fazem parte da mesma extensão. Um clique no ícone da barra de ferramentas inicia uma captura de **Página inteira** com o **Modo Express de um clique** padrão. O editor de capturas tem **Desfoque** com preenchimento **Sólido** para ocultar dados, e **Salvar imagem** abre o diálogo **Exportar** para PNG, JPEG, WebP ou PDF. O OpenScreenShot não adiciona nada à página durante uma gravação, então você não pode desenhar na página enquanto grava. As anotações funcionam nas capturas de tela.

O acesso na instalação é menor. O manifesto do Screenity exige `<all_urls>`, e a lista do Chrome mostra “Ler e alterar todos os seus dados em todos os sites” para `tabCapture` e “Ler seu histórico de navegação” para `tabs`. O OpenScreenShot é instalado com `activeTab` e pede a captura de aba só na primeira vez que você clica em **Gravar**. Ele pede acesso a todos os sites só se você ativar **Gravar em todos os sites**, que permite ao rastreamento de cliques seguir uma aba até outro site.

## Como mudar

1. Instale o OpenScreenShot pela [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). A [versão para Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/) só faz capturas de tela.
2. Fixe o ícone na barra de ferramentas.
3. Faça uma primeira captura de tela: clique no ícone em uma página e confira o resultado no **Editor**.
4. Clique em **Gravar** no popup e aceite o pedido de captura de aba do Chrome. Grave um trecho curto e exporte.
5. Defina **Após capturar** em **Configurações** para as capturas de tela: **Editor**, **Copiar** ou **Baixar**.
6. Exporte as gravações do Screenity que você quer manter antes de removê-lo.

Para demonstrações de recursos, veja [vídeos de demonstração de produto](/pt-br/use-cases/product-demos/). Para mostrar um bug em uma issue, veja [capturas de tela para relatórios de bugs](/pt-br/use-cases/bug-reports/). Se você compartilha vídeos por link com uma equipe, compare a [alternativa ao Loom](/pt-br/alternatives/loom/). Para um gravador com upload para a nuvem, veja a [alternativa ao Nimbus](/pt-br/alternatives/nimbus/).
