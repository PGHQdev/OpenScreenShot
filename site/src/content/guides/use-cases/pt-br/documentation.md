---
title: Como fazer capturas de tela para documentação de ajuda e tutoriais
description: Mantenha as capturas de um tutorial do mesmo tamanho, numere os passos, destaque o controle certo e salve cada arquivo em uma pasta de documentação.
order: 3
---

Para documentação de ajuda e tutoriais, capture cada tela da mesma forma, numere as ações e exporte todas as imagens na mesma largura. No OpenScreenShot, defina uma largura exata em pixels em **Escala** no diálogo **Exportar**, adicione selos de **Número do passo** para cada ação e use **Spotlight** para mostrar ao leitor o controle certo. Um modelo de nome de arquivo como `Docs/{title}` salva cada imagem em uma pasta dentro de Downloads.

## Fazer uma captura para um tutorial passo a passo

1. Deixe a janela do navegador do mesmo tamanho em todas as capturas do artigo. Use o mesmo tema e o mesmo nível de zoom todas as vezes.
2. Capture a tela. **Região selecionada** ou **Capturar elemento** no menu do botão direito limita a imagem à parte da interface de que o passo trata.
3. No **Editor**, adicione um **Número do passo** (`S`) em cada controle, na ordem em que o leitor os usa.
4. Adicione **Spotlight** (`O`) sobre a área que importa quando a tela tem muito outro conteúdo.
5. Cubra dados de clientes de exemplo, endereços de e-mail reais e chaves de API com **Desfoque** (`B`) e o preenchimento **Sólido**.
6. Se quiser, abra **Beautify** na barra superior para adicionar margem, cantos arredondados e uma sombra.
7. Clique em **Salvar imagem**. No diálogo **Exportar**, escolha **PNG**, digite a largura da sua página em **Escala**, confira o nome do arquivo e clique em **Exportar**.

## Manter todas as imagens do mesmo tamanho

Os leitores percebem quando as capturas de um artigo mudam de tamanho de um passo para outro. Em **Escala**, escolha 25, 50, 100 ou 200%, ou digite uma largura exata em pixels. Uma largura fixa faz todas as imagens de um artigo combinarem com a coluna de conteúdo do seu site de documentação.

Ative **Lembrar estas configurações** no diálogo **Exportar** para manter o formato e a qualidade como os seus novos padrões. A largura não faz parte desses padrões, então digite-a de novo a cada exportação. Uma largura acima do limite de canvas do Chrome é recusada, então a extensão nunca grava um arquivo vazio.

O PNG mantém o texto da interface nítido porque é sem perdas. Use JPEG ou WebP só quando a sua plataforma de documentação limita o tamanho dos arquivos.

## Numerar passos que ficam em ordem

Os selos de **Número do passo** contam sozinhos: o primeiro clique coloca o 1, o seguinte coloca o 2. Quando você exclui um selo, os selos restantes são renumerados, então você pode remover um passo sem editar todos os números depois dele. Faça os números na imagem combinarem com a lista numerada do seu artigo.

Use a paleta de oito cores nas teclas `1`–`8`. O editor lembra a sua cor, a espessura do traço e o tamanho da fonte entre sessões, então as capturas de um artigo mantêm o mesmo estilo.

## Destacar e emoldurar

**Spotlight** mantém uma ou mais áreas iluminadas e escurece o resto. Os recortes podem ser um retângulo, um retângulo arredondado ou uma elipse. Para uma página de configurações longa, a ferramenta **Cut** (`X`) remove faixas horizontais de que o leitor não precisa, com uma prévia ao vivo antes de você aplicar.

O painel **Beautify**, com o mesmo nome na [documentação](/pt-br/docs/#annotate), adiciona margem, raio dos cantos, sombra projetada e um fundo em volta da captura. A moldura vai para todas as exportações e para a área de transferência. Escolha um estilo e use-o em todas as imagens da documentação.

## Nomear e arquivar as imagens

Abra **Configurações** pelo popup ou pelo menu do botão direito do ícone na barra de ferramentas e edite o **Nome do arquivo**. Clique em um token para inserir `{date}`, `{time}`, `{title}`, `{domain}`, `{w}` ou `{h}`, e confira a prévia ao vivo.

Adicione `/` para salvar em uma pasta dentro de Downloads. Por exemplo, `Docs/{title}` salva cada imagem em uma pasta `Docs`, com o nome do título da página. O token `{title}` troca os caracteres que nomes de arquivo não aceitam, então uma `/` no título de uma página não cria outra pasta. O diálogo **Exportar** mostra o nome do arquivo antes de você salvar, e você pode editá-lo ali.

## Limites

As capturas de interface ficam desatualizadas quando o produto muda. Mantenha o título da página ou a URL no nome do arquivo, para encontrar e substituir imagens antigas. Uma captura do navegador mostra só o conteúdo da página; ela não inclui a barra de endereços nem a barra de ferramentas do navegador.

A [referência de exportação](/pt-br/docs/#export) e a [referência de configurações](/pt-br/docs/#settings) listam todas as opções. Para preparar uma imagem para um post, veja [como compartilhar capturas de tela nas redes sociais](/pt-br/use-cases/social-media/).
