---
title: Como fazer uma captura de página inteira no Arc
description: Execute o comando Capture Full Page do Arc no macOS para salvar um PNG, saiba o que o Arc não documenta e use o OpenScreenShot da Chrome Web Store.
order: 8
---

O Arc para macOS tem um comando **Capture Full Page** (capturar a página inteira). Pressione `Cmd+T` para abrir a Command Bar, digite `Capture Full Page` e selecione o comando. O Arc baixa um PNG da página inteira para o seu local de download padrão. A ajuda do Arc documenta esse comando só para macOS. O OpenScreenShot também funciona no Arc: o Arc é um navegador Chromium e instala extensões da Chrome Web Store.

## Método nativo

O Arc descreve o comando em [How to take full page screen captures in Arc](https://resources.arc.net/hc/en-us/articles/25481392111895-How-To-Take-Full-Page-Screen-Captures-in-Arc).

1. Abra a página que você quer capturar.
2. Pressione `Cmd+T` para abrir a Command Bar, digite `Capture Full Page` e selecione o comando. Você também pode escolher **File** > **Capture Full Page**.
3. O Arc baixa um PNG para o seu local de download padrão.

O comando não tem atalho padrão. Para adicionar um, abra **Arc** > **Settings** > **Shortcuts**, pesquise `capture` e defina uma tecla para **Capture Full Page**.

Para uma captura estilizada, ative o [Developer Mode](https://resources.arc.net/hc/en-us/articles/20468488031511-Developer-Mode-Instant-Dev-Tools) e use o botão de captura na barra de ferramentas, ou execute **Capture in Portrait Mode** (capturar no modo retrato) pela Command Bar. A ferramenta Capture separada do Arc captura uma seleção com edição e Easels, e também é só para macOS.

## Limites

- **Só macOS.** O Arc não documenta um comando de página inteira para o Arc no Windows.
- **Comportamento não documentado.** O Arc não documenta como monta a imagem, qual é o limite de tamanho nem como trata cabeçalhos fixos. Confira o topo e o meio do PNG para ver se falta ou se repete um cabeçalho.
- **Marcações.** O Arc não documenta edição para capturas de página inteira. Para adicionar setas ou texto, abra o PNG em outro aplicativo.
- **Carregamento lento.** Imagens marcadas com `loading="lazy"` só carregam quando você rola até perto delas. Role a página antes de capturá-la, ou partes da imagem podem ficar em branco.
- **Contêineres de rolagem internos.** Desenvolvedores relatam que as capturas de página inteira no Chromium, no Firefox e no WebKit mostram só a altura de uma tela de um painel que rola dentro de uma estrutura de altura fixa. Confira aplicativos web e sites de documentação com um painel de conteúdo que rola.
- **Rolagem infinita.** Um feed que continua carregando não tem fim de verdade. A captura contém só o que carregou antes de você começar.

## Com o OpenScreenShot

O OpenScreenShot rola a página uma janela de cada vez e costura as partes em uma única imagem. Os cabeçalhos fixos são capturados uma vez no topo, e páginas que rolam um elemento interno também funcionam. Uma página com mais de 32.000 pixels de dispositivo de altura é salva em até seis imagens.

1. Abra a [página do OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) no Arc e adicione a extensão. O Arc explica instalações pela Chrome Web Store em [Extensions in Arc](https://resources.arc.net/hc/en-us/articles/19434259167767-Extensions-in-Arc-How-to-Import-Add-Open).
2. Fixe o ícone do OpenScreenShot.
3. Abra a página e clique no ícone, ou pressione `⌘⇧S`. Com as configurações padrão, uma captura de página inteira começa e o resultado abre no editor.
4. Confira o topo, o fim e qualquer navegação fixa.
5. Clique em **Salvar imagem** e escolha PNG, JPEG, WebP ou PDF, ou clique em **Copiar**.

Se o ícone abrir um menu, selecione **Página inteira**; a configuração **Modo Express de um clique** controla isso. Para estilizar a captura no OpenScreenShot, abra o painel **Beautify** no editor: ele adiciona margem, cantos arredondados, uma sombra e um fundo em gradiente, sólido ou transparente, e a moldura vai para todas as exportações. A [referência de modos de captura](/pt-br/docs/#modes) e a [referência de exportação](/pt-br/docs/#export) listam todas as opções.

## Qual usar

- Use **Capture Full Page** no Arc para macOS para um PNG rápido de uma página que rola a janela inteira.
- Use o OpenScreenShot em páginas que rolam um painel interno, ou quando você quer marcar, ocultar dados ou salvar a captura em PDF, como em [revisão de design](/pt-br/use-cases/design-review/).
- Use o painel **Beautify** do OpenScreenShot para uma imagem estilizada com a sua própria margem e fundo, como em [capturas de tela para redes sociais](/pt-br/use-cases/social-media/).

O [guia do Chrome](/pt-br/full-page-screenshot/chrome/) compara a captura do DevTools do Chrome com a extensão, e o [guia do Brave](/pt-br/full-page-screenshot/brave/) cobre outro navegador Chromium com uma ferramenta nativa. Para páginas que bloqueiam extensões, como as configurações do navegador, veja [suporte e limitações conhecidas](/pt-br/support/).
