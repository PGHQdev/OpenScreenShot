---
title: Como capturar uma página web para revisão de design
description: Capture uma página inteira ou um componente, mostre detalhes aos revisores com spotlight e notas de texto e compartilhe um PDF com várias páginas.
order: 2
---

Para uma revisão de design, capture a página inteira com **Página inteira**, marque os pontos sobre os quais você quer feedback e compartilhe um PDF que os revisores possam ler página por página. No OpenScreenShot, **Spotlight** escurece tudo fora da área em discussão, e **Texto** e **Seta** adicionam notas. Use **Capturar elemento** quando a revisão é sobre um componente, como um cartão, um gráfico ou uma tabela.

## Preparar uma página para revisão passo a passo

1. Abra a página na largura de janela que você quer revisar. A captura mostra o layout na largura atual, então redimensione a janela antes para revisar outro breakpoint.
2. Role a página uma vez para que as imagens com carregamento lento carreguem, depois volte ao topo. Feche banners de cookies e widgets de chat que não fazem parte da revisão.
3. Clique no ícone do OpenScreenShot. Com as configurações padrão, isso inicia uma captura de **Página inteira**. Deixe a aba como está até o editor abrir.
4. Confira a primeira e a última seção, o cabeçalho e qualquer área com movimento, como um carrossel.
5. Selecione **Spotlight** (`O`) e arraste sobre cada área que você quer que os revisores olhem. Vários recortes se juntam em uma única camada escurecida.
6. Adicione uma nota de **Texto** (`T`) ao lado de cada área, e uma **Seta** (`A`) onde uma nota precisa apontar para um detalhe pequeno.
7. Clique em **Salvar imagem** para abrir o diálogo **Exportar**. Escolha **PDF** e siga os passos de exportação abaixo.

## Capturar um componente

Clique com o botão direito na página, abra o submenu **OpenScreenShot** e escolha **Capturar elemento**. Passe o mouse sobre o componente até ele ficar contornado, depois clique ou pressione `Enter` para capturar os limites dele. Pressione `↑` para selecionar o elemento pai, por exemplo a seção que contém um cartão, e `←` ou `→` para ir a um elemento vizinho.

Uma captura de elemento gera uma imagem justa sem recorte manual, o que é útil para comparar duas versões do mesmo componente. Se o elemento não estiver totalmente visível na tela, o seletor oferece uma captura de página inteira.

## Marcar o feedback para que os revisores possam acompanhar

Os recortes do Spotlight podem ser um retângulo, um retângulo arredondado ou uma elipse. Use uma imagem com spotlight por assunto: uma imagem com muitas áreas iluminadas faz os revisores adivinharem qual nota vai com qual área. Para feedback numerado, adicione um **Número do passo** (`S`) em cada ponto e cite os números na conversa da revisão. Os números contam sozinhos e são renumerados quando você exclui um deles.

A ferramenta **Forma** (`R`) desenha um contorno em volta de uma área sem escurecer o resto da página. A ferramenta **Seta** oferece pontas preenchida, aberta, dupla e de ponto, e você pode arrastar a alça do meio para curvá-la em volta de outro conteúdo.

## Compartilhar a revisão como PDF

No diálogo **Exportar**, escolha **PDF**, selecione **A4** ou **Carta** em **Tamanho da página** e ative **Dividir em várias páginas**. Páginas seguidas se sobrepõem em 5 mm, então uma linha de texto em uma quebra de página aparece nas duas páginas. Escolha **Inteira** em **Tamanho da página** para manter a página em uma única página de PDF alta, para leitura na tela.

O PDF guarda a captura como imagem, com as suas anotações. Ele não tem texto selecionável. O [guia de captura para PDF](/pt-br/blog/save-screenshot-as-pdf/) compara os layouts, e a [referência de exportação](/pt-br/docs/#export) lista os outros formatos.

## Limites de uma captura de página inteira

Uma captura de página inteira registra a página como ela é renderizada enquanto a extensão rola. Parte do conteúdo muda durante essa rolagem:

- Um cabeçalho fixo é capturado no primeiro bloco e adicionado uma vez no topo. Confira se outros elementos fixos, como barras laterais ou barras inferiores, aparecem onde você espera.
- Imagens que só carregam quando entram na tela podem aparecer como caixas vazias se a captura chegar nelas antes. Role a página antes de capturar.
- Carrosséis, animações, contadores ao vivo e feeds infinitos podem mudar entre um bloco e outro. Pause-os, ou capture só a região importante.

Uma página com mais de 32.000 pixels de dispositivo de altura é salva em até seis imagens, cada uma na própria aba do editor. O [guia de captura de página inteira](/pt-br/blog/full-page-screenshot-chrome/) cobre mais soluções de problemas. Para capturas que vão para artigos de ajuda, veja [capturas de tela para documentação](/pt-br/use-cases/documentation/).
