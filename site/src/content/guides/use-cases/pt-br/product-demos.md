---
title: Como gravar um vídeo de demonstração de produto no Chrome
description: Grave uma aba do navegador com webcam e voz, adicione zoom em cada clique, apare a gravação e exporte um MP4, tudo no Chrome, no seu computador.
order: 6
---

Para gravar uma demonstração curta de produto a partir de uma aba do navegador, use **Gravar** na extensão do OpenScreenShot para Chrome. Escolha a aba inteira ou parte dela, ative o microfone, o som da aba ou a webcam e grave a demonstração. Depois, o editor adiciona um zoom em cada clique, permite aparar a gravação e exporta um MP4. A versão para Firefox só faz capturas de tela e não tem gravador.

## Gravar uma demonstração passo a passo

1. Prepare a demonstração em uma aba normal do navegador: faça login, carregue dados de exemplo e feche as notificações. Páginas internas do navegador não podem ser gravadas.
2. Com as configurações padrão, um clique no ícone da barra de ferramentas faz uma captura de tela. Clique com o botão direito no ícone e desmarque **Modo Express de um clique**, para que o próximo clique abra o popup.
3. Clique em **Gravar** no popup. A aba de gravação abre ao lado da sua página. Na primeira vez, o Chrome pede uma vez permissão para capturar a aba.
4. Ative **Mic**, **Som da aba** ou **Webcam** conforme necessário e aceite o pedido de permissão do navegador.
5. Mantenha **Aba inteira** ou arraste sobre a imagem da sua página para gravar só uma parte.
6. Clique em **Iniciar gravação**. O OpenScreenShot muda para a sua página. Faça a demonstração em ritmo constante, com cliques deliberados.
7. Pressione `Alt+Shift+X` para parar, ou volte à aba de gravação e clique em **Parar**. O editor de gravação abre na mesma aba.
8. Ajuste os zooms, apare o início e o fim e clique em **Exportar MP4**.

A aba de gravação também tem os botões Pausar/Retomar e Cancelar. Nada é adicionado à página que você grava, então nenhum controle aparece no vídeo.

## Zoom nos cliques

O editor adiciona um zoom suave de 2x em cada clique do seu cursor. Na linha do tempo, você pode ajustar ou excluir cada bloco de zoom. Clique em **Adicionar zoom** para colocar o seu próprio bloco em 1,5x, 2x ou 3x, por exemplo sobre um número que muda sem clique.

As ondas de clique marcam onde você clicou. A configuração do cursor pode mostrar um ponteiro suave que segue o trajeto gravado, mostrar só os cliques ou ocultar o ponteiro.

Se a demonstração for para outro site, o rastreamento de cliques precisa da permissão opcional **Gravar em todos os sites** em **Configurações**. Sem ela, o selo na barra de ferramentas fica âmbar, e o zoom e os efeitos de clique param no resto do vídeo. O vídeo em si continua gravando.

## Webcam, voz e som da aba

A webcam entra na exportação como uma bolha redonda. No editor, coloque-a em qualquer canto, mude o tamanho dela ou oculte-a. Controles deslizantes separados definem o volume do microfone e o volume da aba, para que a sua voz fique acima dos sons do próprio produto.

Grave antes um trecho curto de teste para conferir os níveis e a posição da bolha.

## Aparar e emoldurar a gravação

Arraste as alças no início ou no fim de um segmento para apará-lo. Desfazer e refazer funcionam na linha do tempo. O painel **Beautify**, no painel lateral, adiciona margem, cantos, uma sombra e um fundo em volta do vídeo, a mesma moldura que o editor de capturas oferece.

## Exportar o vídeo

**Exportar MP4** renderiza a gravação com os seus zooms, faixas de áudio, bolha da webcam e moldura, e baixa um arquivo MP4 com vídeo H.264 e áudio AAC. Escolha WebM no seletor ao lado do botão para um arquivo WebM. Mantenha a aba do editor visível enquanto ela renderiza, porque a renderização pausa quando a aba fica oculta.

O MP4 tem limite de 4096×2304 pixels, então uma aba maior é reduzida para caber. Um navegador sem gravação em MP4 exporta só em WebM. O nome do arquivo segue o modelo definido em **Nome do arquivo**, em **Configurações**.

## Limites e armazenamento

O gravador captura uma aba do navegador. Ele não grava outras janelas, outros aplicativos nem o seu desktop. Uma página interna do navegador ou uma página protegida não pode ser gravada.

As gravações, os registros do cursor e os fluxos da webcam e do microfone ficam no armazenamento do navegador no seu dispositivo até você excluí-los. Ative **Excluir gravação após exportar** para remover a gravação assim que o arquivo for salvo. Nada é enviado, a menos que você compartilhe o arquivo exportado.

A [referência de gravação](/pt-br/docs/#record) tem todos os controles. Para imagens estáticas do mesmo bug ou recurso, veja [capturas de tela para relatórios de bugs](/pt-br/use-cases/bug-reports/).
