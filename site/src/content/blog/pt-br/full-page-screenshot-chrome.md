---
title: Como fazer uma captura de página inteira no Chrome
description: Capture uma página web inteira com rolagem usando o OpenScreenShot, confira o resultado e exporte como imagem ou PDF.
audience: everyday
order: 1
---

Para fazer uma captura de página inteira com o OpenScreenShot, abra a página web e clique no ícone da extensão na barra de ferramentas. Com as configurações padrão, a captura começa na hora e a imagem final abre no editor. A extensão rola a página e junta as seções capturadas em uma única imagem.

## Capture a página passo a passo

1. Instale o [OpenScreenShot pela Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) e fixe o ícone dele na barra de ferramentas.
2. Abra a página que você quer capturar. Feche os banners ou as caixas de diálogo que você não quer na imagem.
3. Espere o conteúdo de que você precisa carregar. Em páginas com imagens de carregamento lento, role pelo conteúdo relevante antes de começar.
4. Clique no ícone do OpenScreenShot. Deixe a aba como está enquanto a captura termina.
5. Inspecione a imagem no editor, principalmente a primeira e a última seção e qualquer navegação fixa.
6. Clique em **Salvar imagem** e escolha PNG, JPEG, WebP ou PDF no diálogo **Exportar**.

Se o clique no ícone abrir o seletor de modos, selecione **Página inteira**. A configuração **Modo Express de um clique** controla qual comportamento você tem. Se o editor não abrir, confira **Após capturar**: Copiar e Baixar enviam o resultado direto para o destino.

## Página inteira, área visível ou região selecionada?

**Página inteira** é útil para revisar uma landing page, guardar uma cópia visual de um artigo ou mostrar uma tela de configurações longa. Ela inclui o conteúdo além da área visível atual.

**Área visível** captura o que está visível agora, sem rolagem. Use quando a interface ao redor é um contexto útil, mas o resto da página não importa.

**Região selecionada** captura um retângulo que você escolhe. Muitas vezes é a opção mais clara para um relatório de bug: capture o componente com problema e conteúdo ao redor suficiente para identificá-lo. Veja a [referência dos modos de captura](/pt-br/docs/#modes) para os controles de seleção e os atalhos.

## Por que uma parte da página está faltando ou repetida?

Uma captura de página inteira registra a página como ela está renderizada. Ela não é uma exportação de tudo o que um site poderia carregar com o tempo. Feeds infinitos, listas virtualizadas, conteúdo em movimento e áreas de rolagem incorporadas podem deixar essa diferença visível.

O OpenScreenShot lida com cabeçalhos fixos e áreas de rolagem aninhadas, mas uma página que substitui o conteúdo durante a rolagem ainda pode gerar um resultado incompleto. Deixe a página estabilizar, carregue a seção relevante e tente de novo. Para um feed que cresce sem fim, capture a região importante. Páginas internas do navegador e outras áreas protegidas podem bloquear a captura por extensões; veja [suporte e limitações conhecidas](/pt-br/support/).

## Escolha uma exportação que sirva ao destino

Use PNG para textos de interface e diagramas quando uma saída sem perdas importa. JPEG e WebP têm controles de qualidade para quando o tamanho do arquivo importa mais. Para anexar a um documento, siga o [guia de captura para PDF](/pt-br/blog/save-screenshot-as-pdf/).

Antes de compartilhar, remova as informações de que seu leitor não precisa. O [guia para ocultar dados](/pt-br/blog/redact-screenshot/) explica como cobrir conteúdo sensível e inspecionar o arquivo exportado. A captura e a edição na extensão acontecem localmente; enviar a captura exportada para outro lugar é uma ação separada que você controla.
