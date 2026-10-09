---
title: 'Alternativa ao Lightshot: captura de página inteira sem upload público'
description: Lightshot vs. OpenScreenShot. Captura de página inteira, desfoque e exportação em PDF no navegador, com arquivos no seu dispositivo e sem links prnt.sc.
order: 6
---

Mude para o OpenScreenShot se você faz capturas de tela de páginas web no Chrome ou no Firefox e quer captura de página inteira, desfoque e exportação em PDF, com arquivos que ficam no seu dispositivo. Fique com o Lightshot se você captura outros aplicativos ou o desktop inteiro: o Lightshot tem aplicativos para Windows e Mac, e o OpenScreenShot captura apenas páginas web no navegador. Fique também se você depende dos links curtos instantâneos dele. O OpenScreenShot não tem serviço de upload, então você compartilha uma captura colando a imagem ou anexando o arquivo.

O OpenScreenShot é o nosso produto. As informações sobre o Lightshot nesta página são de 9 de outubro de 2026 e vêm da [página na Chrome Web Store](https://chromewebstore.google.com/detail/mbniclmhobmnbdlbpiphghaielnnpgdp), do [site](https://app.prntscr.com/en/index.html), da [página do complemento para Firefox](https://addons.mozilla.org/firefox/addon/lightshot/) e do manifesto da versão 7.0.1 obtido no servidor de atualizações do Google.

## Lightshot e OpenScreenShot lado a lado

|                              | Lightshot                                                                     | OpenScreenShot                                                 |
| ---------------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Preço                        | Grátis                                                                        | Grátis                                                         |
| Código aberto                | Não (licença própria)                                                         | Sim, MIT                                                       |
| Acesso a sites na instalação | Todos os sites (`*://*/*` obrigatório)                                        | Nenhum. Acesso à aba atual quando você inicia uma captura      |
| Captura de página inteira    | Não; a página na loja descreve seleção de área                                | Sim                                                            |
| Anotações e desfoque         | Edição no próprio lugar                                                       | Formas, setas, texto, números de passo, desfoque, recorte      |
| Exportação em PDF            | Não                                                                           | Sim                                                            |
| Gravação de abas             | Não                                                                           | Sim, no Chrome (a versão para Firefox só faz capturas de tela) |
| Conta ou nuvem               | Upload opcional para o prnt.sc com link curto; salvamento em disco disponível | Sem conta, sem uploads                                         |
| Captura do desktop           | Sim, com os aplicativos para Windows e Mac                                    | Não                                                            |

A extensão do Lightshot para Chrome teve a última atualização em 23 de julho de 2024.

## Uploads e links de compartilhamento

O Lightshot pode fazer upload de uma captura para o prnt.sc e dar a você um link curto. Não é preciso conta para ver um upload. Em 2021, a [Kaspersky relatou](https://www.kaspersky.com/blog/cryptoscam-in-lightshot/39224/) que as URLs eram sequenciais, então trocar um caractere podia abrir outra imagem, e que “Anyone can see published screenshots without authentication” (qualquer pessoa pode ver as capturas publicadas sem autenticação). O [AIN.UA relatou](https://en.ain.ua/2021/09/08/lightshot-allows-people-to-view-screenshots-of-other-users) o mesmo problema naquele ano. Não verificamos se isso ainda vale em 2026.

O OpenScreenShot não tem etapa de upload. Ele processa e guarda as capturas no seu navegador, e um arquivo exportado vai para a sua pasta de downloads. Ninguém vê uma captura até você colá-la ou anexá-la em algum lugar. A [seção de privacidade](/pt-br/docs/#privacy) tem os detalhes.

## O que continua igual

A captura rápida de região continua. Pressione `Ctrl+Shift+E` (`⌘⇧E` no macOS) ou clique com o botão direito na página e escolha **Região selecionada**, depois arraste um retângulo e pressione `Enter`. O editor abre com setas, texto, formas e marca-texto. **Copiar** coloca a imagem na área de transferência, pronta para colar em um chat.

Para pular o editor, defina **Após capturar** como **Copiar**. Cada captura vai direto para a área de transferência, o que se aproxima do hábito de capturar e colar.

## O que muda

Você pode capturar uma parte maior da página. **Página inteira** rola e costura a página toda em uma única imagem. **Capturar elemento** captura um cartão, uma tabela ou um gráfico nos limites exatos dele. **Área visível** captura o que está na tela na aba.

O editor adiciona **Desfoque** (`B`) com desfoque suave, mosaico ou o preenchimento **Sólido**, que cobre dados privados por completo. Os selos de **Número do passo** contam sozinhos. Clique em **Salvar imagem** para abrir o diálogo **Exportar** e salvar em PNG, JPEG, WebP ou PDF.

O acesso na instalação é menor. O OpenScreenShot usa `activeTab` para uma aba por vez, e não pode capturar páginas de configurações do navegador, páginas de extensões nem nada fora do navegador. Para um aplicativo de desktop ou a janela de outro programa, você ainda precisa de uma ferramenta de desktop.

## Como mudar

1. Instale o OpenScreenShot pela [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ou pelo [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fixe o ícone na barra de ferramentas.
3. Faça uma primeira captura. Um clique no ícone inicia uma captura de **Página inteira** com o **Modo Express de um clique** padrão. Para uma área, use `Ctrl+Shift+E` ou o menu do botão direito.
4. Defina **Após capturar** em **Configurações**: **Copiar** para colar na hora, **Editor** para anotar ou **Baixar** para salvar um PNG.
5. Se você mantém um aplicativo de captura de tela no desktop para outros programas, confira se ele não usa as mesmas teclas que o OpenScreenShot. No Chrome, você pode mudar as teclas da extensão em `chrome://extensions/shortcuts`.

Para imagens rápidas em respostas de suporte, veja [capturas de tela para suporte ao cliente](/pt-br/use-cases/customer-support/). Para posts, veja [capturas de tela para redes sociais](/pt-br/use-cases/social-media/). Se você precisa de captura do desktop, veja a página [alternativa ao Snagit](/pt-br/alternatives/snagit/) para saber o que uma ferramenta de desktop cobre.
