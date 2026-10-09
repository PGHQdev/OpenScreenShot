---
title: Como salvar uma cópia visual de uma página web
description: Capture uma página web inteira em PNG ou PDF, nomeie os arquivos por data e domínio e lide com páginas muito longas que são salvas em várias imagens.
order: 5
---

Para guardar uma cópia visual de uma página web, capture-a com **Página inteira** e salve-a como PNG ou PDF com a data e o site no nome do arquivo. O OpenScreenShot rola a página, costura as partes em uma única imagem e salva o arquivo no seu computador. Uma captura de tela registra como a página apareceu na sua tela; ela não prova que a página era autêntica ou que não foi alterada.

## Salvar uma cópia de uma página passo a passo

1. Abra **Configurações** pelo popup ou pelo menu do botão direito do ícone na barra de ferramentas. Defina o **Nome do arquivo** com um padrão que tenha `{date}` e `{domain}`, por exemplo `Archive/{domain}/{date}_{title}`.
2. Abra a página. Role por ela uma vez para que as imagens com carregamento lento e os comentários carreguem, depois volte ao topo.
3. Clique no ícone do OpenScreenShot. Com as configurações padrão, isso inicia uma captura de **Página inteira** e abre o resultado no **Editor**.
4. Confira o topo, o fim e qualquer seção que carrega conforme você rola.
5. Clique em **Salvar imagem**. No diálogo **Exportar**, escolha **PNG** ou **PDF**, confira o nome do arquivo e clique em **Exportar**.

Para salvar sem o editor, defina **Após capturar** como **Baixar** em **Configurações**. Cada captura vai direto para a sua pasta de downloads como PNG, com o nome definido pelo seu modelo.

## PNG ou PDF?

Escolha **PNG** para manter cada pixel da captura. É um formato sem perdas, então o texto da interface fica nítido, e qualquer visualizador de imagens consegue abri-lo.

Escolha **PDF** quando a cópia vai para uma pasta de documentos ou precisa ser impressa. Em **Tamanho da página**, **Inteira** gera uma página do tamanho da imagem. **A4** ou **Carta** com **Dividir em várias páginas** divide uma captura longa em páginas com 5 mm de sobreposição. O PDF guarda a captura como imagem, então o texto não pode ser pesquisado nem selecionado. O [guia de captura para PDF](/pt-br/blog/save-screenshot-as-pdf/) compara os layouts.

## Nomear os arquivos para encontrá-los depois

O modelo de nome de arquivo aceita estes tokens:

- `{date}`: a data no formato AAAA-MM-DD, pelo relógio do seu computador
- `{time}`: o horário no formato HHMMSS
- `{domain}`: o nome do host do site, sem `www.`
- `{title}`: o título da página, com a troca dos caracteres que nomes de arquivo não aceitam
- `{w}` e `{h}`: a largura e a altura da imagem em pixels

Uma `/` no modelo salva em uma pasta dentro de Downloads, então `Archive/{domain}/{date}_{title}` organiza as cópias por site e depois por data. A prévia ao vivo em **Configurações** mostra o resultado antes de você capturar.

## Páginas muito longas

Uma imagem comporta uma página de até 32.000 pixels de dispositivo de altura. Uma página mais alta é salva em até seis imagens. Com **Baixar**, cada parte recebe o nome do seu modelo e um sufixo como `_part1of3`. Com **Editor** ou **Copiar**, cada parte abre na própria aba do editor, onde você a exporta separadamente.

Uma página alta demais para seis imagens é recusada com um erro. Nesse caso, capture as seções de que você precisa com **Área visível** ou **Região selecionada**. O [guia de captura de página inteira](/pt-br/blog/full-page-screenshot-chrome/) cobre outros casos, como áreas de rolagem aninhadas e cabeçalhos fixos.

## O que uma captura pode e não pode mostrar

Uma captura de tela é um registro visual do que o seu navegador mostrou em um momento. Ela não tem assinatura nem verificação contra adulteração, e qualquer pessoa pode editar um arquivo de imagem. O token `{date}` vem do relógio do seu computador no momento em que o arquivo recebe o nome. Quando você precisa de uma prova de que uma página existiu de certa forma, use um serviço feito para isso e guarde a captura como referência pessoal.

Uma captura de página inteira também deixa de fora o conteúdo que a página nunca renderizou: seções recolhidas, outras abas de uma página, feeds infinitos além do ponto até onde você rolou e conteúdo atrás de um login que você não abriu.

## Onde as cópias ficam guardadas

O OpenScreenShot processa as capturas no seu navegador e as guarda no armazenamento local do seu dispositivo. Ele não faz upload delas para um servidor. Os arquivos exportados vão para a sua pasta de downloads. Eles ficam no seu computador até você compartilhá-los ou fazer upload, e o serviço para onde você faz upload tem as próprias regras de armazenamento. Veja a [política de privacidade](/pt-br/privacy/) para mais detalhes.

A [referência de configurações](/pt-br/docs/#settings) cobre o modelo de nome de arquivo. Para marcar uma captura para colegas, veja [como capturar uma página para revisão de design](/pt-br/use-cases/design-review/).
