---
title: Como fazer uma captura de página inteira no Vivaldi
description: Capture uma página inteira em PNG ou JPEG com a ferramenta Capture do Vivaldi, conheça o limite de 30.000 pixels e use o OpenScreenShot da Chrome Web Store.
order: 7
---

O Vivaldi tem uma ferramenta Capture nativa. Clique no ícone de câmera na Status Bar, selecione **Full Page** (página inteira), escolha PNG, JPEG ou a área de transferência e clique em **Capture** (capturar). As capturas Full Page param em 30.000 pixels. O OpenScreenShot também funciona no Vivaldi: o Vivaldi é um navegador Chromium e instala extensões da Chrome Web Store.

## Método nativo

O Vivaldi descreve a ferramenta em [Capture a screenshot](https://help.vivaldi.com/desktop/tools/capture-a-screenshot/).

1. Abra a página que você quer capturar.
2. Clique no ícone de câmera na Status Bar. Você também pode abrir os Quick Commands com `F2` no Windows e no Linux, ou `Cmd+E` no macOS, e digitar `Capture`.
3. Selecione **Full Page**.
4. Selecione a saída: **Save as PNG** (salvar como PNG), **Save as JPEG** (salvar como JPEG) ou **Copy to Clipboard** (copiar para a área de transferência).
5. Clique em **Capture**. Os arquivos salvos vão para a pasta definida em **Settings** > **Webpages** > **Image Capture** > **Capture Storage Folder** (Configurações > Páginas web > Captura de imagem > Pasta de armazenamento das capturas).

O Vivaldi também pode transformar uma captura em uma nova nota no painel Notes, com a data da captura e a URL da página.

A [lista de atalhos de teclado do Vivaldi](https://help.vivaldi.com/desktop/shortcuts/keyboard-shortcuts/) não mostra uma tecla padrão para capturar a página. Para ter uma, abra **Settings** > **Keyboard** (Configurações > Teclado) e associe uma tecla a **Capture Page to disk** (capturar página para o disco) ou **Capture Page to Clipboard** (capturar página para a área de transferência).

## Limites

- **Tamanho.** As capturas Full Page chegam a no máximo 30.000 pixels. Em uma página mais longa, capture as seções de que você precisa.
- **Comportamento não documentado.** O Vivaldi não documenta como monta a imagem da página inteira nem como trata cabeçalhos fixos. Confira o topo e o meio da imagem para ver se falta ou se repete um cabeçalho.
- **Carregamento lento.** Imagens marcadas com `loading="lazy"` só carregam quando você rola até perto delas. Role a página antes de capturá-la, ou partes da imagem podem ficar em branco.
- **Contêineres de rolagem internos.** Desenvolvedores relatam que as capturas de página inteira no Chromium, no Firefox e no WebKit mostram só a altura de uma tela de um painel que rola dentro de uma estrutura de altura fixa. O Vivaldi não documenta o comportamento dele nesse caso, então confira aplicativos web e sites de documentação com um painel de conteúdo que rola.
- **Marcações.** O Vivaldi não documenta ferramentas de desenho ou marcação para capturas. Para adicionar setas ou texto, abra o arquivo em outro aplicativo.

## Com o OpenScreenShot

O OpenScreenShot rola a página uma janela de cada vez e costura as partes em uma única imagem. Os cabeçalhos fixos são capturados uma vez no topo, e páginas que rolam um elemento interno também funcionam. Uma página com mais de 32.000 pixels de dispositivo de altura é salva em até seis imagens.

1. Abra a [página do OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) no Vivaldi e adicione a extensão. O Vivaldi explica instalações pela Chrome Web Store na [ajuda sobre extensões](https://help.vivaldi.com/desktop/appearance-customization/extensions/).
2. Fixe o ícone do OpenScreenShot na barra de ferramentas.
3. Abra a página e clique no ícone, ou pressione `Ctrl+Shift+S` (`⌘⇧S` no macOS). Com as configurações padrão, uma captura de página inteira começa e o resultado abre no editor.
4. Confira o topo, o fim e qualquer navegação fixa.
5. Clique em **Salvar imagem** e escolha PNG, JPEG, WebP ou PDF, ou clique em **Copiar**.

Se o ícone abrir um menu, selecione **Página inteira**; a configuração **Modo Express de um clique** controla isso. O editor adiciona setas, texto, números de passo, desfoque e recorte antes de você exportar. A [referência de modos de captura](/pt-br/docs/#modes) e a [referência de exportação](/pt-br/docs/#export) listam todas as opções.

## Qual usar

- Use a ferramenta Capture do Vivaldi para um PNG ou JPEG de uma página com menos de 30.000 pixels, principalmente quando você quer a captura em uma nota com a URL.
- Use o OpenScreenShot para páginas mais longas, páginas que rolam um painel interno ou capturas que você quer marcar ou salvar em PDF, como em [documentação de ajuda e tutoriais](/pt-br/use-cases/documentation/) ou [revisão de design](/pt-br/use-cases/design-review/).
- Associe um atalho no Vivaldi se você captura com frequência e não precisa de marcações.

O [guia do Opera](/pt-br/full-page-screenshot/opera/) e o [guia do Brave](/pt-br/full-page-screenshot/brave/) cobrem outros navegadores Chromium com ferramentas de captura próprias. Para páginas que bloqueiam extensões, como as configurações do navegador, veja [suporte e limitações conhecidas](/pt-br/support/).
