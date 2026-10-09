---
title: Como fazer uma captura de página inteira no Microsoft Edge
description: Capture uma página inteira com a ferramenta Screenshot do Edge ou com o comando do DevTools, conheça os limites e use o OpenScreenShot da Chrome Web Store.
order: 2
---

O Microsoft Edge tem uma ferramenta de captura de tela nativa, antes chamada Web capture. Pressione `Ctrl+Shift+S`, selecione **Capture full page** (capturar a página inteira) e depois copie a captura ou salve-a no seu dispositivo. O OpenScreenShot também funciona no Edge: o Edge é um navegador Chromium e o instala pela Chrome Web Store depois que você permite extensões de outras lojas.

## Método nativo

A Microsoft descreve a ferramenta no [guia de capturas de tela no Edge](https://www.microsoft.com/en-us/edge/learning-center/screenshot-webpage).

1. Abra a página que você quer capturar.
2. Pressione `Ctrl+Shift+S`. Você também pode clicar com o botão direito na página e selecionar **Screenshot** (captura de tela), ou abrir **Settings and more** (configurações e mais) (**...**) e selecionar **Screenshot**.
3. Selecione **Capture full page**, a opção do meio.
4. Na prévia, use as ferramentas de desenho para marcar a captura, se precisar.
5. Copie a captura ou salve-a no seu dispositivo.

A Microsoft diz que a disponibilidade do recurso pode variar conforme o tipo de dispositivo, o mercado e a versão do navegador. Os administradores também podem desativar a ferramenta com a [política WebCaptureEnabled](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled). Em um computador de trabalho, a falta do item **Screenshot** pode indicar que essa política está definida.

O Edge também tem a captura do DevTools do Chromium. Abra o DevTools, ative a Device Emulation, abra **More options** (mais opções) e selecione **Capture a full size screenshot**. A Microsoft documenta isso no [artigo sobre o Device Mode](https://learn.microsoft.com/en-us/microsoft-edge/devtools/device-mode/). O [guia do Chrome](/pt-br/full-page-screenshot/chrome/) compara esse caminho com uma extensão.

## Limites

- **Comportamento não documentado.** A Microsoft não documenta como a ferramenta Screenshot monta uma imagem de página inteira, o comprimento máximo da página nem como trata cabeçalhos fixos, carregamento lento e contêineres de rolagem internos. Confira cada captura antes de compartilhá-la.
- **Contêineres de rolagem internos.** Usuários no Microsoft Q&A relatam que a captura de página inteira falhou em páginas que rolam dentro de um elemento interno, por exemplo um aplicativo web com um painel de conteúdo que rola. A Microsoft não confirmou isso.
- **Tamanho da página no DevTools.** A captura do DevTools usa o comando de captura do Chromium, que recusa uma página com 131.072 pixels CSS ou mais de largura ou altura com o erro “Page is too large.”
- **Carregamento lento.** Imagens marcadas com `loading="lazy"` só carregam quando você rola até perto delas. Role a página antes de capturá-la, ou partes da imagem podem ficar em branco.
- **Cabeçalhos fixos.** Uma ferramenta de captura que rola e junta várias partes repete qualquer elemento que fica na tela. Procure um cabeçalho que aparece mais de uma vez ao longo da imagem.

## Com o OpenScreenShot

O OpenScreenShot rola a página, captura-a em partes e costura as partes em uma única imagem. Os cabeçalhos fixos são capturados uma vez no topo, e páginas que rolam um elemento interno também funcionam. Uma página com mais de 32.000 pixels de dispositivo de altura é salva em até seis imagens.

1. Abra a [página do OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) no Edge. Quando o Edge perguntar, selecione **Allow extensions from other stores** (permitir extensões de outras lojas) e depois adicione a extensão. A Microsoft explica esse passo na [ajuda sobre extensões](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge).
2. Fixe o ícone do OpenScreenShot na barra de ferramentas.
3. Abra a página e clique no ícone. Com as configurações padrão, uma captura de página inteira começa e o resultado abre no editor.
4. Confira o topo, o fim e qualquer seção que carrega conforme você rola.
5. Clique em **Salvar imagem** e escolha PNG, JPEG, WebP ou PDF, ou clique em **Copiar**.

O atalho de página inteira do OpenScreenShot é `Ctrl+Shift+S`, as mesmas teclas da ferramenta Screenshot do Edge. Se as teclas abrirem a ferramenta do Edge, clique no ícone, ou defina outra tecla pelo link **Atalhos** no menu de captura. A [referência de modos de captura](/pt-br/docs/#modes) lista os outros modos.

## Qual usar

- Use a ferramenta Screenshot do Edge para uma captura rápida com algumas marcas de caneta, em uma página que rola a janela inteira.
- Use o OpenScreenShot quando uma página rola um painel interno, quando você precisa exportar em PDF, JPEG ou WebP, ou quando precisa de números de passo e ocultação sólida, como em [documentação de ajuda e tutoriais](/pt-br/use-cases/documentation/) ou [respostas de suporte](/pt-br/use-cases/customer-support/).
- Use a captura do DevTools quando o seu administrador desativou a ferramenta Screenshot e você não pode instalar extensões.

A [referência de exportação](/pt-br/docs/#export) cobre formatos de arquivo e escala. Para páginas que o OpenScreenShot não pode capturar, como as configurações do navegador, veja [suporte e limitações conhecidas](/pt-br/support/).
