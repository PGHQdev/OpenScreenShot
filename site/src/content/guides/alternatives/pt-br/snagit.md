---
title: 'Alternativa ao Snagit: captura grátis de páginas web no navegador'
description: Snagit vs. OpenScreenShot. Se você só captura páginas web, o OpenScreenShot faz página inteira, marcações, desfoque, PDF e gravação de abas grátis no Chrome.
order: 9
---

Mude para o OpenScreenShot se a maior parte do que você captura com o Snagit são páginas web: ele faz captura de página inteira, marcações, ocultação de dados, exportação em PDF e gravação de abas no navegador, de graça e sem login. Fique com o Snagit se você captura aplicativos de desktop, janelas de programas ou a tela inteira. O Snagit é um aplicativo de desktop para Windows e macOS, e o OpenScreenShot captura apenas páginas web no navegador, por decisão de projeto. O Snagit também grava o som do sistema e a tela inteira, rola dentro de janelas de programas e oferece o Smart Redact, que pode desfocar ou bloquear e-mails, números de telefone e dados de cartão de crédito. O OpenScreenShot não tem nenhum desses recursos.

O OpenScreenShot é o nosso produto. As informações sobre o Snagit nesta página são de 9 de outubro de 2026 e vêm da [página do Snagit](https://www.techsmith.com/snagit/) da TechSmith, da [página da loja](https://www.techsmith.com/store/snagit) e do [artigo de suporte sobre preços de assinatura](https://support.techsmith.com/hc/en-us/articles/27009223314701-TechSmith-Transition-to-Annual-Subscription-Pricing-Model-in-2025).

## Snagit e OpenScreenShot lado a lado

|                              | Snagit                                                                         | OpenScreenShot                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Preço                        | Assinatura anual por usuário; sem novas licenças perpétuas desde o Snagit 2025 | Grátis, sem plano pago                                                                                              |
| Código aberto                | Não                                                                            | Sim, MIT                                                                                                            |
| Plataforma                   | Aplicativo de desktop para Windows 10 e 11, e macOS 14 ou posterior            | Extensão de navegador para Chrome e Firefox                                                                         |
| Acesso a sites na instalação | Não se aplica (aplicativo de desktop)                                          | Nenhum. Acesso à aba atual quando você inicia uma captura                                                           |
| Captura de página inteira    | Sim, janelas longas com rolagem e páginas web                                  | Sim, páginas web                                                                                                    |
| Anotações e desfoque         | Setas, balões, texto, marcações; Smart Redact                                  | Formas, setas, texto, números de passo, spotlight, desfoque com preenchimento Sólido                                |
| Exportação em PDF            | Sim                                                                            | Sim                                                                                                                 |
| Gravação de abas             | Tela, microfone, som do sistema e webcam                                       | Uma aba do navegador, com microfone, som da aba e webcam, no Chrome (a versão para Firefox só faz capturas de tela) |
| Conta ou nuvem               | Login para a assinatura; até 25 vídeos no TechSmith Screencast                 | Sem conta, sem uploads                                                                                              |

Não conseguimos carregar o preço em dólares americanos na página da loja da TechSmith a partir da nossa localização, então esta página não o informa. Consulte a [página da loja](https://www.techsmith.com/store/snagit) para a sua região.

## O que continua igual

Para páginas web, as tarefas principais continuam. **Página inteira** rola uma página e a costura em uma única imagem. **Região selecionada** captura um retângulo, e **Capturar elemento** captura um cartão, uma tabela ou um gráfico nos limites exatos dele. O **Editor** tem setas com trajetos curvos, formas, texto, selos de **Número do passo**, marca-texto e **Spotlight** para escurecer tudo, menos o que importa. **Recortar** e **Cut** aparam a imagem. A [referência de anotações](/pt-br/docs/#annotate) lista as ferramentas.

Você continua com a exportação em PDF e a cópia para a área de transferência. Clique em **Salvar imagem** para abrir o diálogo **Exportar** para PNG, JPEG, WebP ou PDF, ou clique em **Copiar** para colar a imagem em um documento. O painel **Beautify** adiciona margem, cantos arredondados, uma sombra e um fundo para uma imagem com moldura.

## O que muda

No OpenScreenShot, você cobre cada item privado por conta própria. Escolha **Desfoque** (`B`) e o preenchimento **Sólido** em **Ocultação**, depois arraste sobre cada item. O Sólido cobre a área por completo na exportação. O [guia de ocultação](/pt-br/blog/redact-screenshot/) mostra como conferir o arquivo salvo.

A gravação cobre uma aba do navegador no Chrome. Clique em **Gravar** no popup, ative **Mic**, **Som da aba** ou **Webcam** e grave a aba inteira ou uma área que você arrasta. O editor de gravação adiciona um zoom de 2x em cada clique e exporta em MP4 ou WebM. Não há som do sistema de outros aplicativos nem gravação da tela inteira. Veja a [referência de gravação](/pt-br/docs/#record).

As capturas ficam no seu dispositivo, e não há conta nem biblioteca na nuvem. Para anotar uma captura de outra ferramenta, solte a imagem no editor ou cole-a com `Ctrl+V` (`⌘V` no macOS). O editor funciona da mesma forma com uma imagem colada e com uma captura.

## Como mudar

1. Instale o OpenScreenShot pela [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) ou pelo [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fixe o ícone na barra de ferramentas.
3. Clique no ícone em uma página longa. Com o **Modo Express de um clique** padrão, isso inicia uma captura de **Página inteira** e abre o **Editor**.
4. Defina **Após capturar** em **Configurações**: **Editor** para anotar, **Copiar** para colar na hora ou **Baixar** para salvar um PNG.
5. Defina um **Nome do arquivo** com tokens como `{date}` e `{title}`.
6. Se você mantém o Snagit para o trabalho no desktop, confira se as teclas dele não entram em conflito com o OpenScreenShot. No Chrome, você pode mudar as teclas da extensão em `chrome://extensions/shortcuts`.

Para artigos de ajuda com números de passo, veja [capturas de tela para documentação](/pt-br/use-cases/documentation/). Para notas de revisão sobre uma página, veja [como capturar uma página para revisão de design](/pt-br/use-cases/design-review/). Para uma ferramenta grátis que também cobre a captura do desktop, veja a página [alternativa ao Lightshot](/pt-br/alternatives/lightshot/).
