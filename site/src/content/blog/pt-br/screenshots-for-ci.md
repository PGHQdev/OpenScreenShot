---
title: Capture sites para CI e revisões de versão
description: Crie artefatos PNG repetíveis com a CLI do OpenScreenShot e entenda o que uma captura de tela consegue verificar em um pipeline de build.
audience: developers
order: 6
---

Use a CLI do OpenScreenShot na CI para salvar um PNG de um aplicativo em execução para revisão. Prepare um navegador compatível com Chrome, inicie o aplicativo, espere ele ficar pronto e depois capture uma URL e uma área de visualização fixas. Envie o arquivo gerado pelo mecanismo de artefatos do seu provedor de CI.

## Torne o ambiente repetível

Em um projeto que já usa pnpm, adicione a CLI como dependência de desenvolvimento e faça commit das alterações no manifesto e no lockfile:

```sh
pnpm add -D -E openscreenshot
```

Instale as dependências na CI com o lockfile congelado do projeto. O pacote usa `puppeteer-core` e não baixa um navegador, então o runner também precisa do Chrome ou do Chromium. Defina `CHROME_PATH` se o executável não estiver em um local padrão compatível.

Mantenha estáveis a versão do navegador, as fontes, a área de visualização, os dados do aplicativo e a versão do pacote quando for comparar capturas. Uma fonte ou um renderizador de navegador diferente pode alterar uma imagem mesmo quando o código do aplicativo não mudou.

## Capture depois que o aplicativo estiver pronto

Inicie o servidor de desenvolvimento ou de prévia com o comando do próprio projeto. Espere a rota e as dependências dela ficarem prontas antes de executar este exemplo; a porta 4321 é só um exemplo e precisa corresponder ao seu aplicativo:

```sh
mkdir -p artifacts
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/desktop.png --width 1440 --height 900
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/narrow.png --width 390 --height 844
```

Esses comandos geram capturas da área de visualização. Adicione `--full` para revisar a página inteira. Passe o diretório `artifacts/` para a etapa de envio de artefatos da sua CI, para que um revisor possa abrir os arquivos junto com um pull request ou uma versão.

A CLI espera a rede ficar ociosa durante a navegação, mas isso não garante que o trabalho específico do aplicativo terminou. Ela não tem espera configurável por seletor nem script de preparação injetado. Use uma rota de revisão dedicada e estável, com dados determinísticos, quando a rota comum tiver animações, conteúdo variável ou autenticação.

## Uma imagem capturada não é um teste visual aprovado

O comando pode terminar com sucesso depois de capturar um erro do servidor ou uma tela de carregamento. Trate o PNG como um artefato de revisão. Um sistema de regressão visual também precisa de uma referência, um método de comparação de imagens, limites de tolerância e um processo para aceitar as mudanças intencionais; a CLI do OpenScreenShot não oferece essas partes.

Uma captura estreita é uma verificação útil de layout responsivo, mas não é uma emulação de dispositivo móvel. Da mesma forma, uma captura de tela não verifica interações, acessibilidade nem o comportamento de APIs. Mantenha as verificações relevantes do aplicativo junto com a etapa de captura.

## Resolva problemas no pipeline

**Chrome não encontrado:** confirme que a imagem do runner inclui um navegador e que `CHROME_PATH` aponta para o executável dele.

**A navegação falhou ou excedeu o tempo limite:** confirme que o servidor é acessível a partir do processo de captura, usa a porta esperada e está pronto antes de a captura começar. A navegação tem um tempo limite de 30 segundos.

**Uma página de login inesperada aparece:** a CLI inicia uma sessão de navegador nova. Ela não reutiliza seu perfil local nem oferece injeção de cookies.

**O arquivo de saída não existe:** crie o diretório de saída, inspecione o status de saída do comando e confira o caminho do artefato em relação ao diretório de trabalho da CI.

O [guia de referência da CLI](/pt-br/blog/screenshot-cli/) explica as flags e os códigos de saída. Se uma pessoa ou um agente deve decidir qual página inspecionar em seguida, use o [fluxo de capturas com MCP](/pt-br/blog/screenshot-mcp-server/).
