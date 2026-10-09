---
title: Como fazer uma captura de página inteira no Opera
description: A ferramenta Snapshot do Opera salva a página inteira só em PDF. Veja os passos e os limites, e como capturar a página inteira em imagem com o OpenScreenShot.
order: 6
---

A ferramenta Snapshot nativa do Opera captura uma seleção ou a área visível como imagem, e a página inteira só como PDF. Pressione `Shift+Ctrl+5` (`Shift+Cmd+2` no macOS) e selecione **Save page as PDF** (salvar página como PDF). Para um arquivo de imagem da página inteira, instale o OpenScreenShot. O Opera é um navegador Chromium e o instala pela Chrome Web Store depois que você adiciona o complemento **Install Chrome Extensions** do Opera.

## Método nativo

O Opera descreve o Snapshot na [página de ajuda sobre recursos](https://help.opera.com/en/latest/features/) e na [página do Snapshot](https://www.opera.com/features/snapshot).

1. Abra a página que você quer capturar.
2. Pressione `Shift+Ctrl+5` no Windows e no Linux, ou `Shift+Cmd+2` no macOS. Você também pode clicar no ícone de câmera no lado direito da barra de ferramentas.
3. Selecione **Save page as PDF**. O Opera salva a página inteira, de cima a baixo, como PDF.

O Snapshot tem duas opções de imagem. **Capture Full Screen** (capturar tela inteira) captura só a área visível da página, e **Capture** (capturar) captura um quadro que você ajusta. As duas geram uma imagem que você pode marcar com Zoom, Arrow, Blur, Highlight, Pencil, Selfie camera, Emojis e Text, e depois salvar como PNG com **Save Image** (salvar imagem) ou copiar para a área de transferência.

## Limites

- **PDF só para a página inteira.** As capturas de imagem cobrem a área visível ou uma seleção. Para obter a página inteira, você recebe um PDF.
- **Layout não documentado.** O Opera não documenta se o PDF é uma página longa ou várias páginas, como trata cabeçalhos fixos nem como lida com uma página que rola um painel dentro de uma estrutura de altura fixa. Abra o PDF e confira antes de compartilhá-lo.
- **Carregamento lento.** Imagens marcadas com `loading="lazy"` só carregam quando você rola até perto delas. Role a página antes de salvá-la, ou partes podem ficar em branco.
- **Rolagem infinita.** Um feed que continua carregando não tem fim de verdade. Qualquer captura contém só o que carregou antes de você começar.

## Com o OpenScreenShot

O OpenScreenShot rola a página, captura-a em partes e costura as partes em uma única imagem. Os cabeçalhos fixos são capturados uma vez no topo, e páginas que rolam um elemento interno também funcionam. Uma página com mais de 32.000 pixels de dispositivo de altura é salva em até seis imagens.

1. Adicione o complemento **Install Chrome Extensions** pelo Opera add-ons. O Opera explica isso em [Using add-ons from Chrome in Opera](https://blogs.opera.com/tips-and-tricks/2021/10/using-addons-from-chrome-in-opera/).
2. Abra a [página do OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) e adicione a extensão.
3. Fixe o ícone do OpenScreenShot na barra de ferramentas.
4. Abra a página e clique no ícone, ou pressione `Ctrl+Shift+S` (`⌘⇧S` no macOS). Com as configurações padrão, uma captura de página inteira começa e o resultado abre no editor.
5. Confira o topo, o fim e qualquer navegação fixa.
6. Clique em **Salvar imagem** e escolha PNG, JPEG, WebP ou PDF, ou clique em **Copiar**.

Se o ícone abrir um menu, selecione **Página inteira**; a configuração **Modo Express de um clique** controla isso. Um PDF do OpenScreenShot guarda a captura como imagem, então ele se parece com a página na tela, mas o texto não pode ser pesquisado nem selecionado. Em **Tamanho da página**, **Inteira** gera uma página do tamanho da imagem, e **A4** ou **Carta** pode dividir uma captura longa em várias páginas. O [guia de captura para PDF](/pt-br/blog/save-screenshot-as-pdf/) compara esses layouts.

## Qual usar

- Use **Save page as PDF** do Snapshot para um PDF rápido da página inteira sem instalar nada.
- Use as opções de imagem do Snapshot para a área visível ou uma seleção com algumas marcas.
- Use o OpenScreenShot para um PNG, JPEG ou WebP da página inteira, para páginas que rolam um painel interno ou para um PDF igual à tela, como em [revisão de design](/pt-br/use-cases/design-review/) ou em uma [cópia salva de uma página](/pt-br/use-cases/archive-web-pages/).

A [referência de modos de captura](/pt-br/docs/#modes) e a [referência de exportação](/pt-br/docs/#export) listam todas as opções. O [guia do Vivaldi](/pt-br/full-page-screenshot/vivaldi/) cobre outro navegador Chromium com a sua própria ferramenta de captura. Para páginas que bloqueiam extensões, como as configurações do navegador, veja [suporte e limitações conhecidas](/pt-br/support/).
