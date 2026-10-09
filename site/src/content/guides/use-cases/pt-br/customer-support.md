---
title: Como usar capturas de tela para responder a tickets de suporte
description: Copie uma captura direto para a resposta do ticket, numere os passos, oculte os dados do cliente e marque uma imagem que um cliente enviou para você.
order: 7
---

Para responder a um ticket de suporte com uma captura de tela, capture a tela que o cliente precisa ver, numere os passos que ele deve seguir, oculte qualquer dado do cliente e cole a imagem na sua resposta. No OpenScreenShot, a ação **Copiar** copia uma captura sem abrir o editor, e os selos de **Número do passo** mostram a ordem dos cliques. Para marcar uma captura que um cliente enviou para você, cole ou solte a imagem no **Editor**.

## Responder com uma captura anotada passo a passo

1. Abra a tela do seu produto que responde à pergunta, por exemplo uma página de configurações.
2. Clique com o botão direito na página, abra o submenu **OpenScreenShot** e escolha **Região selecionada** ou **Capturar elemento**. Mantenha interface suficiente para que o cliente encontre o mesmo lugar.
3. No **Editor**, adicione um **Número do passo** (`S`) em cada controle, na ordem em que o cliente clica neles.
4. Selecione **Desfoque** (`B`), escolha **Sólido** em **Ocultação** e cubra nomes, endereços de e-mail, números de pedido e IDs de conta.
5. Clique em **Copiar**, ou pressione `Ctrl+C` (`⌘C` no macOS).
6. Cole a imagem na resposta do ticket e escreva os mesmos passos como uma lista numerada abaixo dela.

Os passos escritos ajudam clientes que usam leitor de tela ou que leem a resposta em um cliente de e-mail que bloqueia imagens.

## Copiar sem o editor

Para uma resposta rápida que não precisa de marcações, defina **Após capturar** como **Copiar** no popup ou em **Configurações**. Cada captura vai direto para a área de transferência, e o selo na barra de ferramentas confirma. Cole-a na resposta com `Ctrl+V` ou `⌘V`.

A configuração vale para os botões do popup, os atalhos de teclado e o menu do botão direito. Volte para **Editor** quando a captura mostrar dados do cliente que você precisa ocultar antes. **Reabrir última** no rodapé do popup abre a captura mais recente no editor a qualquer momento.

## Numerar os passos

Os selos de **Número do passo** contam sozinhos: o primeiro clique coloca o 1, o seguinte coloca o 2. Quando você exclui um selo, os selos restantes são renumerados. Mantenha os números na imagem iguais aos números da sua resposta escrita.

Adicione uma **Seta** (`A`) quando um controle é pequeno ou difícil de encontrar, e uma nota curta de **Texto** (`T`) quando um passo precisa de um valor, como a opção a selecionar. **Spotlight** (`O`) escurece o resto da tela quando a página tem muitos elementos.

## Ocultar os dados do cliente

As suas próprias telas de administração muitas vezes mostram dados de outros clientes: nomes em uma lista, endereços de e-mail, dados de pagamento e notas internas. Confira a imagem inteira, incluindo as bordas, antes de enviá-la.

Um desfoque suave ou um mosaico pode deixar pistas sobre textos curtos. **Sólido** cobre a área por completo na exportação. Cubra cada item com uma pequena margem em volta dos caracteres visíveis. O [guia de ocultação](/pt-br/blog/redact-screenshot/) explica como conferir o resultado.

## Marcar uma captura que um cliente enviou

Os clientes muitas vezes enviam uma captura do problema. Para apontar o detalhe que eles não viram:

1. Copie a imagem do cliente ou salve-a no seu computador.
2. Abra uma aba do editor. Se nenhuma estiver aberta, capture qualquer página com **Área visível**; a importação substitui essa captura.
3. Pressione `Ctrl+V` ou `⌘V` fora de um campo de texto para colar a imagem, ou solte o arquivo de imagem no editor.
4. Adicione setas, números de passo ou texto, e oculte tudo o que o cliente não pretendia compartilhar.
5. Clique em **Copiar** e cole a imagem marcada na sua resposta.

A barra superior mostra **Importada**, e todas as ferramentas, a moldura e todos os formatos de exportação funcionam com a imagem. Uma importação substitui a tela de edição, então o editor pergunta antes quando a imagem atual tem anotações.

## Limites

A extensão captura só o conteúdo da página. A imagem não mostra a barra de endereços, então coloque a URL na sua resposta quando o cliente precisar abrir uma página específica. Páginas internas do navegador e outras páginas protegidas bloqueiam a captura; veja [suporte e limitações conhecidas](/pt-br/support/).

As capturas e as edições ficam no seu computador. A ferramenta de help desk em que você cola a imagem a guarda conforme as próprias regras. A [referência de anotações](/pt-br/docs/#annotate) lista todas as ferramentas. Para capturas que vão para a sua equipe de desenvolvimento, veja [capturas de tela para relatórios de bugs](/pt-br/use-cases/bug-reports/).
