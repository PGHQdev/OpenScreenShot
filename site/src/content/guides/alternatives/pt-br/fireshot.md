---
title: 'Alternativa ao FireShot: editor grátis no navegador e código aberto'
description: FireShot vs. OpenScreenShot. Os dois capturam páginas inteiras localmente. O OpenScreenShot tem código aberto, um editor grátis no navegador e gravação de abas.
order: 4
---

Mude para o OpenScreenShot se você quer anotar e desfocar capturas de página inteira no navegador de graça, em qualquer sistema operacional que rode o Chrome ou o Firefox, com um código que você pode ler. Fique com o FireShot se você precisa de PDFs com links que funcionam, capturas em lote ou automatizadas, ou dos extras do FireShot Pro, como a exportação avançada em PDF e um histórico de capturas. O OpenScreenShot salva o PDF como imagem, então o texto não pode ser pesquisado e os links não funcionam. Ele captura apenas páginas web e não captura janelas do desktop nem a tela inteira.

O OpenScreenShot é o nosso produto. As informações sobre o FireShot nesta página são de 9 de outubro de 2026 e vêm da [página na Chrome Web Store](https://chromewebstore.google.com/detail/mcbpblocgmgfnpjjppndjkmgjaogfceg), do [site](https://getfireshot.com/), da [página de compra](https://getfireshot.com/buy.php), da [página do complemento para Firefox](https://addons.mozilla.org/en-US/firefox/addon/fireshot/) e do manifesto da versão 2.1.4.18 obtido no servidor de atualizações do Google.

## FireShot e OpenScreenShot lado a lado

|                              | FireShot                                                                                                     | OpenScreenShot                                                        |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Preço                        | Grátis (Lite); o Pro custa $39,95 por ano ou $99,95 uma vez por uma licença vitalícia para dois dispositivos | Grátis, sem plano pago                                                |
| Código aberto                | Não (licença própria)                                                                                        | Sim, MIT                                                              |
| Acesso a sites na instalação | Nenhum no Chrome; o acesso a todos os sites é opcional. `nativeMessaging` é obrigatório                      | Nenhum. Acesso à aba atual quando você inicia uma captura             |
| Captura de página inteira    | Sim                                                                                                          | Sim                                                                   |
| Anotações e desfoque         | A página na loja cita texto, setas e desfoque; o Pro lista “Editor & smart annotations (on Windows)”         | Grátis, no navegador                                                  |
| Exportação em PDF            | Sim, com links; o PDF avançado é Pro                                                                         | Sim, como imagem: uma página, ou páginas A4 ou Carta com sobreposição |
| Gravação de abas             | Não                                                                                                          | Sim, no Chrome (a versão para Firefox só faz capturas de tela)        |
| Conta ou nuvem               | Captura local; uploads e compartilhamento opcionais                                                          | Sem conta, sem uploads                                                |

## O que continua igual

As capturas ficam no dispositivo nas duas ferramentas. O site do FireShot diz “100% local captures keep your work private and offline-safe” (capturas 100% locais mantêm seu trabalho privado e seguro offline). O OpenScreenShot processa as capturas no seu navegador e não faz upload delas. Nenhuma das duas pede acesso a todos os sites na instalação no Chrome.

Você continua com a captura de página inteira de páginas longas e a exportação em PNG, JPEG e PDF. O OpenScreenShot também salva em WebP.

## O que muda

O editor roda em uma aba do navegador, então funciona da mesma forma em todos os sistemas operacionais, e todas as ferramentas são grátis. Use **Seta**, **Texto**, **Número do passo** e **Spotlight** para apontar detalhes, e **Desfoque** (`B`) com o preenchimento **Sólido** para ocultar dados privados. **Recortar** e **Cut** aparam uma captura longa. A [referência de anotações](/pt-br/docs/#annotate) lista as ferramentas.

O PDF funciona de outra forma. Clique em **Salvar imagem** para abrir o diálogo **Exportar** e escolha **PDF**. **Inteira** gera uma página do tamanho da imagem. **A4** ou **Carta** com **Dividir em várias páginas** divide uma captura longa com 5 mm de sobreposição. O PDF guarda a captura como imagem, então não tem links clicáveis nem texto selecionável. Se você envia PDFs em que os leitores seguem links, o FireShot atende melhor a essa tarefa.

O OpenScreenShot não tem captura em lote, histórico de capturas nem upload para e-mail ou OneNote. Ele tem **Capturar elemento**, o painel **Beautify** para uma imagem com moldura e, no Chrome, gravação de abas com zoom nos cliques e exportação em MP4.

O manifesto do FireShot para Chrome exige `nativeMessaging`, que permite à extensão falar com um programa instalado no seu computador. O OpenScreenShot não usa programa nativo. O Chrome pede a permissão opcional de captura de aba só na primeira vez que você clica em **Gravar**.

O complemento do FireShot para Firefox teve a última atualização em 5 de junho de 2023 e pede acesso aos seus dados em todos os sites. A versão do OpenScreenShot para Firefox não pede acesso a sites na instalação e só faz capturas de tela.

## Como mudar

1. Instale o OpenScreenShot pela [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ou pelo [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fixe o ícone na barra de ferramentas.
3. Clique no ícone em uma página longa. Com o **Modo Express de um clique** padrão, isso inicia uma captura de **Página inteira** e abre o **Editor**.
4. Defina **Após capturar** em **Configurações**. Escolha **Baixar** para salvar cada captura direto na sua pasta de downloads como PNG, ou **Copiar** para colá-la na hora.
5. Defina um **Nome do arquivo** com tokens como `{date}`, `{domain}` e `{title}`. Uma `/` salva em uma pasta dentro de Downloads.

Se um atalho de teclado não iniciar uma captura, abra `chrome://extensions/shortcuts` e veja se outra extensão usa as mesmas teclas.

Para cópias datadas de páginas, veja [como salvar uma cópia visual de uma página web](/pt-br/use-cases/archive-web-pages/). Para páginas de ajuda com capturas anotadas, veja [capturas de tela para documentação](/pt-br/use-cases/documentation/). A [referência de exportação](/pt-br/docs/#export) cobre formatos e escala. Para outras ferramentas de página inteira, veja a [alternativa ao GoFullPage](/pt-br/alternatives/gofullpage/) e a [alternativa ao FullPage Capture](/pt-br/alternatives/fullpage-capture/).
