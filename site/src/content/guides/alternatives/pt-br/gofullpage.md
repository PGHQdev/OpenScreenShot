---
title: 'Alternativa ao GoFullPage: anotações grátis e código aberto'
description: GoFullPage vs. OpenScreenShot para capturas de página inteira. O OpenScreenShot tem anotações, desfoque, recorte e PDF em páginas grátis, e código público.
order: 1
---

Mude para o OpenScreenShot se você captura páginas inteiras e depois precisa recortar, desfocar, fazer marcações ou dividir um PDF em páginas: o GoFullPage coloca esses recursos no plano pago Premium, e o OpenScreenShot os inclui de graça. O OpenScreenShot também usa a licença MIT, então você pode ler o código que roda nas suas páginas. Fique com o GoFullPage se você só captura e salva páginas inteiras como imagens ou PDFs, sem edições. A versão gratuita dele já faz isso sem limite de capturas, e o FAQ dele indica uma versão no Microsoft Edge Add-ons. O OpenScreenShot não está no Edge Add-ons, mas o Edge pode instalá-lo pela Chrome Web Store. O OpenScreenShot captura apenas páginas web no navegador; ele não captura janelas do desktop nem a tela inteira.

O OpenScreenShot é o nosso produto. As informações sobre o GoFullPage nesta página são de 9 de outubro de 2026 e vêm da [página na Chrome Web Store](https://chromewebstore.google.com/detail/fdpohaocaechififmbbbbbknoalclacl), do [FAQ](https://gofullpage.com/faq), da [página do Premium](https://gofullpage.com/premium) e da [página do complemento para Firefox](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/).

## GoFullPage e OpenScreenShot lado a lado

|                              | GoFullPage                                                              | OpenScreenShot                                                     |
| ---------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Preço                        | Grátis; o Premium custa $12 por ano (sem impostos), com 7 dias de teste | Grátis, sem plano pago                                             |
| Código aberto                | Não. Um fork privado, desde 2018, de um projeto MIT                     | Sim, MIT                                                           |
| Acesso a sites na instalação | Nenhum. O acesso a todos os sites é opcional                            | Nenhum. Acesso à aba atual quando você inicia uma captura          |
| Captura de página inteira    | Sim                                                                     | Sim                                                                |
| Anotações e desfoque         | Só no Premium (desfoque, texto, destaque, recorte)                      | Grátis (formas, setas, texto, números de passo, desfoque, recorte) |
| Exportação em PDF            | Grátis; a divisão inteligente em páginas é Premium                      | Grátis, incluindo páginas A4 ou Carta divididas com sobreposição   |
| Gravação de abas             | Não                                                                     | Sim, no Chrome (a versão para Firefox só faz capturas de tela)     |
| Conta ou nuvem               | Sem conta para a captura grátis; o Premium usa uma conta                | Sem conta, sem uploads                                             |
| Lojas de navegador           | Chrome Web Store, Firefox Add-ons, Edge Add-ons                         | Chrome Web Store, Firefox Add-ons                                  |

A [comparação completa](/pt-br/compare/) adiciona o FullPage Capture à mesma tabela.

## O que continua igual

O hábito principal não muda. Com as configurações padrão, um clique no ícone do OpenScreenShot na barra de ferramentas inicia uma captura de **Página inteira**. Este é o **Modo Express de um clique**. A extensão rola a página, costura as partes em uma única imagem e abre o resultado no **Editor**. Cabeçalhos fixos aparecem uma vez no topo, e páginas que rolam um elemento interno também funcionam.

As duas extensões não pedem acesso a sites na instalação. O OpenScreenShot usa `activeTab`, então ele só pode ler a aba que você captura, no momento em que você inicia a captura. As duas salvam arquivos PNG, JPEG e PDF. As duas funcionam no Chrome e no Firefox.

## O que muda

As ferramentas do editor são grátis. **Recortar** (`C`) apara a imagem, **Desfoque** (`B`) com o preenchimento **Sólido** cobre dados privados, e **Seta**, **Texto** e **Número do passo** marcam o que importa. **Cut** (`X`) remove faixas horizontais de uma captura longa. A [referência de anotações](/pt-br/docs/#annotate) lista todas as ferramentas e atalhos.

O layout de PDF também é grátis. Clique em **Salvar imagem** para abrir o diálogo **Exportar**, escolha **PDF** e selecione **A4** ou **Carta** com **Dividir em várias páginas**. Cada página se sobrepõe à seguinte em 5 mm, então o texto não é cortado no meio da linha. O botão **PDF** ao lado de **Salvar imagem** salva um PDF com um clique. O PDF guarda a captura como imagem, então o texto dele não pode ser pesquisado nem selecionado.

Você também tem mais modos de captura: **Área visível**, **Região selecionada** e **Capturar elemento**, que captura um cartão, uma tabela ou um gráfico nos limites exatos dele. No Chrome, **Gravar** captura uma aba como vídeo MP4 ou WebM com zoom em cada clique. A primeira gravação pede a permissão opcional de captura de aba.

O OpenScreenShot não tem carimbo de data ou URL. Use o modelo de nome de arquivo em **Configurações** com `{date}` e `{domain}` para manter essa informação no nome do arquivo.

## Como mudar

1. Instale o OpenScreenShot pela [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ou pelo [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fixe o ícone na barra de ferramentas. Se o GoFullPage estiver fixado no mesmo lugar, desafixe-o para clicar no ícone certo.
3. Abra uma página longa e clique no ícone do OpenScreenShot. Confira o topo, o fim e qualquer cabeçalho fixo no **Editor**.
4. Defina **Após capturar** em **Configurações**. **Editor** abre cada captura para anotação. **Baixar** salva um PNG na sua pasta de downloads sem abrir aba, o que se aproxima do hábito de capturar e salvar. **Copiar** copia a imagem.
5. Para fazer marcações em uma imagem que você salvou com o GoFullPage, solte o arquivo no editor ou cole-o com `Ctrl+V` (`⌘V` no macOS).

Se um atalho de teclado não iniciar uma captura do OpenScreenShot, abra `chrome://extensions/shortcuts` e veja se outra extensão usa as mesmas teclas.

Para guardar cópias de páginas com nomes de arquivo datados, veja [como salvar uma cópia visual de uma página web](/pt-br/use-cases/archive-web-pages/). Se você quer PDF com links clicáveis, compare a [alternativa ao FireShot](/pt-br/alternatives/fireshot/) e a [alternativa ao FullPage Capture](/pt-br/alternatives/fullpage-capture/).
