---
title: Como fazer capturas de tela para relatórios de bugs
description: Capture a parte quebrada de uma página, marque com setas e números de passo, oculte tokens e e-mails e cole a imagem em uma issue.
order: 1
---

Para um relatório de bug, capture só a parte da página que mostra o problema, marque o que está errado e oculte tudo o que for privado antes de colar a imagem na issue. No OpenScreenShot, use **Região selecionada** ou **Capturar elemento** para a captura, as ferramentas **Seta** e **Número do passo** para as marcações, e **Desfoque** com o preenchimento **Sólido** para ocultar dados. Coloque a URL, o navegador e os passos para reproduzir no texto da issue, porque a captura mostra o conteúdo da página sem a barra de endereços.

## Capturar e marcar um bug passo a passo

1. Abra a página e leve-a ao estado com o problema. Feche os banners que escondem o problema.
2. Clique com o botão direito na página, abra o submenu **OpenScreenShot** e escolha **Região selecionada** ou **Capturar elemento**. Com as configurações padrão, um clique no ícone da barra de ferramentas captura a página inteira.
3. Para uma região, arraste um retângulo em volta do problema com interface suficiente ao redor para identificar onde ele está. Pressione `Enter` para confirmar. Para um elemento, passe o mouse até o cartão, a tabela ou o formulário que você quer ficar contornado, depois clique ou pressione `Enter`.
4. No **Editor**, adicione uma **Seta** (`A`) no detalhe quebrado. Adicione um **Número do passo** (`S`) para cada ação quando o bug precisa de vários cliques para ser reproduzido.
5. Selecione **Desfoque** (`B`), escolha **Sólido** em **Ocultação** e cubra tokens de acesso, endereços de e-mail, nomes de contas e nomes de hosts internos.
6. Clique em **Copiar**, ou pressione `Ctrl+C` (`⌘C` no macOS), e cole a imagem na issue.

No modo de elemento, `↑` seleciona o elemento pai e `↓` o filho, o que ajuda quando o contorno cai em um contêiner pequeno ou grande demais. Se o elemento não estiver totalmente visível, o seletor oferece uma captura de página inteira.

## Capturar estados de hover, menus suspensos e tooltips

Um menu ou um tooltip muitas vezes fecha quando você clica em outro lugar. Defina o **Atraso** como 3, 5 ou 10 segundos no popup ou em **Configurações**, inicie a captura e abra o menu antes de o selo na barra de ferramentas terminar a contagem regressiva.

O atraso acontece antes de a seleção de região começar, então arrastar ainda pode fechar o menu. Para um estado de hover, use **Área visível** com atraso e recorte depois com **Recortar** (`C`). Você também pode selecionar a região uma vez e depois usar **Repetir região** no menu do botão direito com atraso: ela captura o mesmo retângulo sem arrastar de novo.

## Pular o editor com a ação Copiar

Quando uma captura não precisa de marcações, defina **Após capturar** como **Copiar** no popup ou em **Configurações**. Cada captura vai direto para a área de transferência, e o selo na barra de ferramentas confirma. Cole a imagem na issue com `Ctrl+V` ou `⌘V`.

Essa configuração vale também para os atalhos de teclado e o menu do botão direito. Volte para **Editor** quando precisar anotar ou ocultar dados. Uma captura para a área de transferência pula a etapa de ocultação, então confira se há dados privados na página antes de capturar.

## O que escrever ao lado da captura

Uma captura mostra o que deu errado. O texto da issue dá o contexto de que um desenvolvedor precisa para reproduzir o problema:

- a URL da página, sem parâmetros de consulta privados
- o nome e a versão do navegador, e o sistema operacional
- os passos para reproduzir, na mesma ordem dos números de passo na imagem
- o que você esperava e o que aconteceu
- o horário do problema, se a página mostra dados ao vivo

Mantenha um problema por captura. Um segundo bug na mesma imagem deixa pouco claro para qual deles a seta aponta.

## Limites

O desfoque e o mosaico suavizam os pixels, mas podem deixar pistas sobre textos curtos. **Sólido** cobre a área por completo na exportação; o [guia de ocultação](/pt-br/blog/redact-screenshot/) explica como conferir o resultado. Páginas internas do navegador e outras páginas protegidas bloqueiam a captura por extensões; veja [suporte e limitações conhecidas](/pt-br/support/).

A [referência de modos de captura](/pt-br/docs/#modes) cobre os controles de seleção, e a [referência de anotações](/pt-br/docs/#annotate) lista todas as ferramentas e atalhos. Para respostas a usuários que relatam um problema, veja [capturas de tela para suporte ao cliente](/pt-br/use-cases/customer-support/). Para mostrar o bug em movimento, veja [vídeos de demonstração de produto](/pt-br/use-cases/product-demos/).
