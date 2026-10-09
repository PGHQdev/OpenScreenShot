---
title: Como fazer uma captura de página inteira no Brave
description: Ative o botão de captura de tela do Brave, capture uma página inteira em PNG, confira os limites e use o OpenScreenShot da Chrome Web Store.
order: 5
---

O Brave 1.94 e versões posteriores têm uma ferramenta de captura de tela nativa. Ative o botão de captura em `brave://settings/appearance`, clique nele e selecione **Full page** (página inteira). No Brave 1.96 e posteriores, abre uma prévia em que você baixa um PNG ou copia a imagem. O OpenScreenShot também funciona no Brave: o Brave é um navegador Chromium e instala extensões da Chrome Web Store.

## Método nativo

O Brave não tem artigo na central de ajuda sobre a ferramenta. Os passos abaixo seguem as [notas de versão](https://brave.com/latest/) do Brave e o [sistema de issues](https://github.com/brave/brave-browser/issues/57937) dele.

1. Vá para `brave://settings/appearance` e ative o botão de captura de tela na seção da barra de ferramentas.
2. Abra a página que você quer capturar.
3. Clique no botão **Take a screenshot** (fazer uma captura de tela) na barra de ferramentas.
4. No balão **Capture screenshot** (capturar tela), selecione **Full page**. O balão também oferece **Selected area** (área selecionada) e **Visible area** (área visível).
5. No diálogo **Screenshot preview** (prévia da captura), selecione **Download** para salvar um PNG, ou selecione **Copy to clipboard** (copiar para a área de transferência).

`Ctrl+Shift+S` (`Shift+Cmd+S` no macOS) abre a ferramenta de captura do Brave no Brave 1.75 e posteriores. O sistema de issues do Brave descreve esse atalho como uma captura por seleção, então use o botão da barra de ferramentas para **Full page**. No Brave 1.96, o item de captura no menu do aplicativo passou para a seção Save de **Save and share** (salvar e compartilhar).

A prévia oferece **Download** e **Copy to clipboard**. Para adicionar setas ou texto, abra o PNG em outro aplicativo.

## Limites

- **Tamanho da página.** A opção **Full page** usa o comando de captura do DevTools do Chromium. Esse comando recusa uma página com 131.072 pixels CSS ou mais de largura ou altura, com o erro “Page is too large.”
- **Elementos fixos e sticky.** Para esse comando, o Chromium redimensiona a visualização para o tamanho da página inteira. Seções com a altura da janela (`100vh`) e cabeçalhos ou rodapés fixos podem então se ajustar a essa visualização alta, e um rodapé fixo pode aparecer uma vez no fim da imagem.
- **Carregamento lento.** Imagens marcadas com `loading="lazy"` só carregam quando você rola até perto delas. Role a página antes de capturá-la, ou partes da imagem podem ficar em branco.
- **Contêineres de rolagem internos.** O Chromium calcula o tamanho da captura a partir da rolagem da própria página. Quando uma página rola um painel dentro de uma estrutura de altura fixa, a captura mostra só a altura de uma tela desse painel.
- **Rolagem infinita.** Um feed que continua carregando não tem fim de verdade. A captura contém só o que carregou antes de você começar.

## Com o OpenScreenShot

O OpenScreenShot rola a página uma janela de cada vez e costura as partes em uma única imagem. Os cabeçalhos fixos são capturados uma vez no topo, e páginas que rolam um elemento interno também funcionam. Uma página com mais de 32.000 pixels de dispositivo de altura é salva em até seis imagens.

1. Abra a [página do OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) no Brave e adicione a extensão. O Brave explica instalações pela Chrome Web Store em [Using Chrome extensions in Brave](https://brave.com/learn/using-chrome-extensions-in-brave/).
2. Fixe o ícone do OpenScreenShot na barra de ferramentas.
3. Abra a página e clique no ícone. Com as configurações padrão, uma captura de página inteira começa e o resultado abre no editor.
4. Confira o topo, o fim e qualquer navegação fixa.
5. Clique em **Salvar imagem** e escolha PNG, JPEG, WebP ou PDF, ou clique em **Copiar**.

O atalho de página inteira do OpenScreenShot é `Ctrl+Shift+S` (`⌘⇧S` no macOS), as mesmas teclas da ferramenta de captura do Brave. Se as teclas abrirem a ferramenta do Brave, clique no ícone, ou defina outra tecla pelo link **Atalhos** no menu de captura. Se o ícone abrir um menu, selecione **Página inteira**; a configuração **Modo Express de um clique** controla isso.

## Qual usar

- Use o botão **Full page** do Brave para um PNG rápido de uma página que rola a janela inteira.
- Use o OpenScreenShot para páginas que rolam um painel interno, para exportar em PDF, JPEG ou WebP, ou para marcar e ocultar dados antes de compartilhar, como em [relatórios de bugs](/pt-br/use-cases/bug-reports/).
- Use o painel **Beautify** do OpenScreenShot quando a captura vai para um post: ele adiciona margem, cantos arredondados, uma sombra e um fundo. Veja [capturas de tela para redes sociais](/pt-br/use-cases/social-media/).

A [referência de modos de captura](/pt-br/docs/#modes) e a [referência de exportação](/pt-br/docs/#export) listam todas as opções. O [guia do Chrome](/pt-br/full-page-screenshot/chrome/) cobre a captura pelo DevTools, que o Brave também tem. Para páginas que bloqueiam extensões, como as configurações do navegador, veja [suporte e limitações conhecidas](/pt-br/support/).
