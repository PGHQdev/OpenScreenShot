---
title: Como fazer uma captura de página inteira no Firefox
description: Capture uma página inteira com a ferramenta Screenshots do Firefox ou o comando :screenshot, confira os limites de tamanho e use o complemento OpenScreenShot.
order: 3
---

O Firefox tem uma ferramenta Screenshots nativa. Pressione `Ctrl+Shift+S` (`Cmd+Shift+S` no macOS), selecione **Save full page** (salvar página inteira) e depois selecione **Download** (baixar) para salvar um PNG ou **Copy** (copiar) para colocar a imagem na área de transferência. O complemento OpenScreenShot para Firefox adiciona um editor para setas, texto e ocultação de dados, e exporta em PNG, JPEG, WebP ou PDF.

## Método nativo

A Mozilla descreve a ferramenta em [Take screenshots in Firefox](https://support.mozilla.org/en-US/kb/take-screenshots-firefox).

1. Abra a página que você quer capturar.
2. Pressione `Ctrl+Shift+S` no Windows e no Linux, ou `Cmd+Shift+S` no macOS. Você também pode clicar com o botão direito em uma parte vazia da página e selecionar **Take Screenshot** (capturar tela).
3. Selecione **Save full page** no canto superior direito.
4. Na prévia, selecione **Download** para salvar um PNG na pasta de downloads do Firefox, ou selecione **Copy**.

A prévia oferece **Copy** e **Download**. Para adicionar setas ou texto, abra o PNG em outro aplicativo.

O DevTools do Firefox tem um segundo caminho. Abra o Web Console e digite `:screenshot --fullpage`, e o Firefox salva um PNG da página inteira. Você também pode ativar o botão **Take a screenshot of the entire page** (capturar a página inteira) em **Available Toolbox Buttons** (botões disponíveis na caixa de ferramentas) nas configurações do DevTools. A Mozilla documenta os dois no [guia de capturas do DevTools](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html).

## Limites

- **Tamanho.** O Firefox corta uma captura maior que 32.766 pixels em um lado ou 472.907.776 pixels de área, e mostra “Your screenshot was cropped because it was too large.” (sua captura foi cortada porque era grande demais). A mensagem de erro do Firefox para uma captura grande demais dá números diferentes: menos de 32.700 pixels no lado mais longo ou 124.900.000 pixels de área total.
- **Escala da tela.** O Firefox conta esses limites em pixels de dispositivo: a largura e a altura da página multiplicadas pela proporção de pixels da tela. Em uma tela 2x, o limite de altura da página em pixels CSS cai pela metade, cerca de 16.383.
- **Contêineres de rolagem internos.** O Firefox obtém os limites da página inteira a partir da largura e da altura de rolagem da janela. Quando uma página rola um painel dentro de uma estrutura de altura fixa, o conteúdo desse painel não se expande, então a captura mostra só a altura de uma tela dele.
- **Carregamento lento.** Imagens marcadas com `loading="lazy"` só carregam quando você rola até perto delas. Role a página antes de capturá-la, ou partes da imagem podem ficar em branco.
- **Rolagem infinita.** Um feed que carrega mais conteúdo conforme você rola não tem fim de verdade. A captura contém só o que carregou antes de você começar.
- **Cabeçalhos fixos.** Antes de compartilhar, confira o topo e o meio da imagem para ver se um cabeçalho falta, se repete ou está no lugar errado.

## Com o OpenScreenShot

A versão do OpenScreenShot para Firefox só faz capturas de tela. A gravação de abas está na versão para Chrome. O modo de página inteira rola a página, captura-a em partes e costura as partes em uma única imagem, com os cabeçalhos fixos colocados uma vez no topo. Páginas que rolam um elemento interno em vez da janela também funcionam.

1. Instale o [OpenScreenShot pelo Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) e fixe o ícone dele na barra de ferramentas.
2. Abra a página e role por ela uma vez para que as imagens com carregamento lento carreguem, depois volte ao topo.
3. Clique no ícone do OpenScreenShot e escolha **Página inteira** se o menu de modos abrir.
4. Confira o resultado no editor, principalmente o topo, o fim e qualquer navegação fixa.
5. Clique em **Salvar imagem** e escolha PNG, JPEG, WebP ou PDF, ou clique em **Copiar**.

O Firefox usa `Ctrl+Shift+S` para a própria ferramenta Screenshots, então clique no ícone da barra de ferramentas quando quiser usar o OpenScreenShot. A [referência de modos de captura](/pt-br/docs/#modes) descreve cada modo, e a [referência de exportação](/pt-br/docs/#export) cobre formatos e escala.

## Qual usar

- Use o Firefox Screenshots para um PNG rápido de uma página que rola a janela inteira e cabe no limite de tamanho.
- Use o comando `:screenshot --fullpage` quando você já trabalha no Web Console.
- Use o OpenScreenShot para páginas que rolam um painel interno e para capturas que você quer marcar ou salvar em PDF, como em [relatórios de bugs](/pt-br/use-cases/bug-reports/) ou em uma [cópia salva de uma página](/pt-br/use-cases/archive-web-pages/).

O [guia do Chrome](/pt-br/full-page-screenshot/chrome/) e o [guia do Edge](/pt-br/full-page-screenshot/edge/) cobrem a mesma tarefa em navegadores Chromium, em que o OpenScreenShot também pode gravar abas. Para páginas que bloqueiam extensões, como as configurações do Firefox, veja [suporte e limitações conhecidas](/pt-br/support/).
