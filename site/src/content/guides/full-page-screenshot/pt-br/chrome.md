---
title: 'Como fazer uma captura de página inteira no Chrome: DevTools ou extensão'
description: Use o comando Capture full size screenshot do DevTools do Chrome, veja onde ele falha e compare com uma captura de página inteira no OpenScreenShot.
order: 1
---

O Chrome pode fazer uma captura de página inteira sem extensão, mas só pelo DevTools. Abra o DevTools, abra o Command Menu, digite `screenshot` e execute **Capture full size screenshot** (capturar a página em tamanho completo). O Chrome salva a página inteira como um arquivo PNG. Os menus normais do Chrome não têm item de captura de tela: a ajuda do Google lista Share, Send to your devices e Create QR code (compartilhar, enviar para seus dispositivos e criar QR code) em **Cast, save, and share** (transmitir, salvar e compartilhar). Para uma captura que você pode marcar, exportar em PDF ou fazer em uma página que rola dentro de um painel, instale o OpenScreenShot e clique no ícone dele.

## Método nativo

1. Abra a página que você quer capturar.
2. [Abra o DevTools](https://developer.chrome.com/docs/devtools/open): pressione `F12` ou `Ctrl+Shift+I` no Windows e no Linux, ou `Cmd+Option+I` no macOS.
3. Abra o [Command Menu](https://developer.chrome.com/docs/devtools/command-menu): pressione `Ctrl+Shift+P`, ou `Cmd+Shift+P` no macOS.
4. Digite `screenshot` e selecione **Capture full size screenshot**.
5. O Chrome salva um arquivo PNG da página inteira.

A mesma captura está no Device Mode. Ative a barra de dispositivos, abra o menu **More options** (mais opções) dela e selecione o item de captura em tamanho completo. A [documentação do Device Mode](https://developer.chrome.com/docs/devtools/device-mode) do Google o chama de **Capture a full size screenshot**.

Não há um atalho único para a sequência inteira. O Google não documenta ferramentas de marcação para a captura, então setas, texto e ocultação de dados ficam para outro aplicativo.

## Limites

- **O DevTools precisa estar aberto.** O comando está só no Command Menu e no menu do Device Mode.
- **Tamanho da página.** O Chromium recusa uma página com 131.072 pixels CSS ou mais de largura ou altura, com o erro “Page is too large.”
- **Elementos fixos e sticky.** Para a captura, o Chromium redimensiona a visualização para o tamanho da página inteira e oculta as barras de rolagem. Seções com a altura da janela (`100vh`) e cabeçalhos ou rodapés fixos podem então se ajustar a essa visualização alta. Um rodapé fixo pode aparecer uma vez no fim da imagem, e uma seção de destaque com altura total pode ficar esticada.
- **Carregamento lento.** Imagens e frames marcados com `loading="lazy"` só carregam quando você rola até perto deles. Role a página antes de executar o comando, ou partes da imagem podem ficar em branco.
- **Contêineres de rolagem internos.** O Chromium calcula o tamanho da captura a partir da rolagem da própria página. Quando uma página rola um painel dentro de uma estrutura de altura fixa, por exemplo um aplicativo web ou um site de documentação com um painel de conteúdo que rola, a captura mostra só a altura de uma tela desse painel.

## Com o OpenScreenShot

O OpenScreenShot rola a página uma janela de cada vez, captura cada parte e costura as partes em uma única imagem. Ele captura os cabeçalhos fixos na primeira parte e os coloca uma vez no topo. Páginas que rolam um elemento interno em vez da janela também funcionam. Uma página com mais de 32.000 pixels de dispositivo de altura é salva em até seis imagens.

1. Instale o [OpenScreenShot pela Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) e fixe o ícone dele na barra de ferramentas.
2. Abra a página e clique no ícone, ou pressione `Ctrl+Shift+S` (`⌘⇧S` no macOS).
3. Confira o resultado no editor, principalmente o topo, o fim e qualquer navegação fixa.
4. Clique em **Salvar imagem** e escolha PNG, JPEG, WebP ou PDF. **Copiar** e **PDF**, ao lado, concluem com um clique.

Se um menu abrir em vez de uma captura, selecione **Página inteira**. A configuração **Modo Express de um clique** controla isso. O [guia de captura de página inteira no Chrome](/pt-br/blog/full-page-screenshot-chrome/) mostra a extensão passo a passo, incluindo seções que faltam ou se repetem. A [referência de modos de captura](/pt-br/docs/#modes) e a [referência de exportação](/pt-br/docs/#export) listam todas as opções.

## DevTools e OpenScreenShot lado a lado

- **Início:** o DevTools precisa de dois atalhos e de um comando digitado. O OpenScreenShot precisa de um clique ou de um atalho.
- **Saída:** o DevTools salva um PNG. O OpenScreenShot exporta em PNG, JPEG, WebP ou PDF, ou copia a imagem.
- **Edição:** o DevTools não tem nenhuma. O OpenScreenShot abre um editor com setas, texto, números de passo, desfoque e recorte.
- **Instalação:** o DevTools já está no Chrome. O OpenScreenShot é uma extensão com licença MIT que processa as capturas localmente.

## Qual usar

- Use o DevTools para um PNG avulso de uma página comum em um computador em que você não pode adicionar extensões.
- Use o OpenScreenShot para páginas que rolam um painel interno, páginas com cabeçalhos fixos e capturas que você quer marcar antes de compartilhar, como em [relatórios de bugs](/pt-br/use-cases/bug-reports/) ou [revisão de design](/pt-br/use-cases/design-review/).
- Use qualquer um dos dois também no Microsoft Edge; o [guia do Edge](/pt-br/full-page-screenshot/edge/) cobre a ferramenta de captura do próprio Edge.

Se uma captura falhar em uma página do navegador como `chrome://settings`, veja [suporte e limitações conhecidas](/pt-br/support/).
