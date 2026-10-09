---
title: Como fazer uma captura de página inteira no Safari
description: O Safari no Mac não captura a página inteira como imagem. Salve a página como PDF, capture um elemento no Web Inspector ou use outro navegador.
order: 4
---

O Safari no Mac não tem comando de captura de página inteira. A opção nativa mais próxima é um PDF: escolha **Arquivo** > **Imprimir**, clique em **PDF** na parte de baixo do diálogo e salve o arquivo. Para um arquivo de imagem, o Web Inspector do Safari pode capturar um elemento da página. O OpenScreenShot não tem versão para Safari. O Safari instala Safari Web Extensions pela Mac App Store e não pode instalar pacotes da Chrome Web Store nem complementos do Firefox. No Mac, o Chrome, o Firefox, o Edge e outros navegadores podem rodar o OpenScreenShot.

## Método nativo

### Salvar a página como PDF

A Apple descreve esse caminho em [Print or create a PDF of a webpage in Safari](https://support.apple.com/guide/safari/print-or-create-a-pdf-of-a-webpage-ibrw1060/18.0/mac/15.0).

1. Abra a página que você quer guardar.
2. Role a página uma vez para que as imagens que carregam tarde já tenham carregado.
3. Escolha **Arquivo** > **Imprimir**.
4. Para manter as cores da página, ative a impressão de imagens e cores de fundo nas opções de impressão. Você também pode adicionar o endereço web e a data nos cabeçalhos e rodapés.
5. Clique em **PDF** na parte de baixo do diálogo e salve o arquivo.

### Capturar um elemento no Web Inspector

1. Escolha **Safari** > **Ajustes** > **Avançado** e selecione **Show features for web developers** (mostrar recursos para desenvolvedores web). O WebKit explica isso em [Enabling Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/).
2. Abra a página e pressione `Option+Cmd+I` para abrir o Web Inspector.
3. Na aba **Elements** (elementos), clique com o botão direito em um nó, por exemplo `<html>` ou `<body>`, e selecione **Capture Screenshot** (capturar tela).
4. O Safari salva a imagem desse nó em um arquivo.

A Apple não documenta se uma captura de `<html>` inclui o conteúdo abaixo da parte visível da página, nem qual formato de imagem ela grava. Confira o arquivo antes de confiar nele.

## Limites

- **Nenhuma imagem de página inteira.** Nenhum dos dois caminhos gera a captura que você teria com uma ferramenta de captura de página inteira. O PDF é uma versão de impressão da página, e o item do Web Inspector captura um nó.
- **Layout de impressão.** O PDF usa o layout de impressão, então a página no arquivo pode ficar diferente da página na tela. Ative as imagens e cores de fundo se o design depende delas.
- **Carregamento lento.** Imagens marcadas com `loading="lazy"` só carregam quando você rola até perto delas. Role a página antes de imprimir ou capturar, ou partes podem ficar em branco.
- **Contêineres de rolagem internos.** Desenvolvedores relatam que capturas automatizadas de página inteira no WebKit, o motor por trás do Safari, mostram só a altura de uma tela quando uma página rola um painel dentro de uma estrutura de altura fixa. Confira com cuidado as páginas feitas dessa forma.
- **Cabeçalhos fixos.** Confira se no resultado um cabeçalho falta, se repete ou está no lugar errado.

## Com o OpenScreenShot

O OpenScreenShot não está disponível para Safari. Se você tem o Chrome, o Firefox, o Edge, o Brave, o Opera, o Vivaldi ou o Arc no mesmo Mac, abra a página nele e use a extensão. O Chrome e os outros navegadores Chromium a instalam pela [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). O Firefox a instala pelo [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).

1. Instale o OpenScreenShot no outro navegador e fixe o ícone dele na barra de ferramentas.
2. Abra a página e clique no ícone. No Chrome, `⌘⇧S` também inicia uma captura de página inteira.
3. Confira o resultado no editor.
4. Clique em **Salvar imagem** e escolha PNG, JPEG, WebP ou PDF.

A extensão rola a página, costura as partes em uma única imagem e coloca os cabeçalhos fixos uma vez no topo. Uma página com mais de 32.000 pixels de dispositivo de altura é salva em até seis imagens. O [guia do Chrome](/pt-br/full-page-screenshot/chrome/) e o [guia do Firefox](/pt-br/full-page-screenshot/firefox/) dão os passos para cada navegador, incluindo as ferramentas nativas de cada um.

## Qual usar

- Use **Arquivo** > **Imprimir** > **PDF** no Safari para guardar uma cópia legível de um artigo ou de uma página de recibo.
- Use **Capture Screenshot** do Web Inspector para uma imagem de uma parte da página, como um cartão ou um gráfico.
- Use o OpenScreenShot em outro navegador no seu Mac para uma imagem da página inteira que você pode marcar, ou para um PDF da página como ela aparece na tela. O [guia de captura para PDF](/pt-br/blog/save-screenshot-as-pdf/) compara layouts de PDF, e [como salvar uma cópia visual de uma página](/pt-br/use-cases/archive-web-pages/) cobre nomes de arquivo e armazenamento.

Para outras dúvidas, veja [suporte e limitações conhecidas](/pt-br/support/).
