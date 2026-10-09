---
title: Ferramentas de captura de sites para desenvolvedores, CI e agentes de IA
description: 'openscreenshot, shot-scraper, capture-website-cli, pageres-cli, Playwright, Puppeteer, Playwright MCP: runtime, página inteira, CLI, MCP, vídeo, licença.'
audience: developers
order: 9
---

Para um PNG de uma página pública a partir de um script de shell ou de um job de CI, uma ferramenta de linha de comando basta: openscreenshot, shot-scraper, capture-website-cli ou pageres-cli. Quando a captura precisa de login, cliques, asserções ou vídeo, escreva-a com Playwright ou Puppeteer. Para um agente de IA, um servidor MCP local retorna capturas de tela ao modelo: `openscreenshot serve` faz uma captura por chamada, e o Playwright MCP controla uma sessão inteira do navegador.

O pacote `openscreenshot` é nosso produto, e esta página diz onde ele é a opção mais fraca. Ela compara recursos e não classifica as ferramentas. Todos os fatos são de 9 de outubro de 2026 e vêm do repositório, do registro de pacotes ou da documentação oficial de cada projeto, com links abaixo.

## As ferramentas em resumo

| Ferramenta          | Linguagem / runtime                                | Página inteira       | CLI                | MCP                 | Vídeo              | Licença    |
| ------------------- | -------------------------------------------------- | -------------------- | ------------------ | ------------------- | ------------------ | ---------- |
| openscreenshot      | Node.js 22.12+, Chrome, Chromium ou Edge instalado | `--full`             | Sim                | Sim, stdio          | Não                | MIT        |
| shot-scraper        | Python 3.10+, navegadores do Playwright            | Padrão               | Sim                | Não listado         | Sim, WebM ou MP4   | Apache-2.0 |
| capture-website-cli | Node.js 20+, Chrome do Puppeteer                   | `--full-page`        | Sim                | Não listado         | Não                | MIT        |
| pageres-cli         | Node.js 20+, Chrome do Puppeteer                   | Padrão               | Sim                | Não listado         | Não                | MIT        |
| Playwright          | Node.js, Python, Java, .NET                        | `fullPage: true`     | Executor de testes | Pelo Playwright MCP | Sim                | Apache-2.0 |
| Puppeteer           | Node.js 22.12+                                     | `fullPage: true`     | Não listado        | Não listado         | Sim, MP4 no Chrome | Apache-2.0 |
| Playwright MCP      | Node.js via `npx`, ou Docker                       | Parâmetro `fullPage` | Só servidor        | Sim, stdio ou HTTP  | Sim, opcional      | Apache-2.0 |

“Não listado” significa que a documentação do próprio projeto que consultamos não descreve o recurso.

## openscreenshot (CLI e servidor MCP)

O [openscreenshot](https://www.npmjs.com/package/openscreenshot) controla o Chrome, Chromium ou Edge que já está no seu computador por meio do `puppeteer-core`, então ele não baixa nenhum navegador. Um comando salva um PNG de página inteira:

```sh
npx openscreenshot shot https://example.com --out example.png --full
```

As flags são `--out` (um arquivo, ou `-` para stdout), `--full`, `--width` (de 200 a 3840, padrão 1280) e `--height` (de 200 a 2160, padrão 800). O código de saída 0 significa que um PNG foi gravado, 1 significa que a captura falhou e 2 significa uso incorreto. `openscreenshot serve` inicia um servidor MCP via stdio com uma ferramenta, `capture_screenshot`, que recebe `url`, `fullPage`, `width` e `height` e retorna o conteúdo de uma imagem PNG. O [guia da CLI](/pt-br/blog/screenshot-cli/), o [guia do MCP](/pt-br/blog/screenshot-mcp-server/) e o [guia de CI](/pt-br/blog/screenshots-for-ci/) explicam a configuração, e o [código-fonte](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) é a referência.

Onde ele é a opção mais fraca:

- Cada captura inicia um navegador novo com um perfil vazio. Ele não tem cookies, login, cliques nem espera por seletores, então uma página que exige login mostra a tela de login.
- A navegação espera por `networkidle2` por até 30 segundos, sem opção de espera extra. Páginas que renderizam depois que a rede fica ociosa podem sair carregadas pela metade.
- A saída é só PNG, sem PDF nem vídeo.
- O servidor MCP é só local via stdio, sem URL hospedada nem transporte HTTP. A ferramenta retorna uma imagem e não grava um arquivo.
- O navegador é executado com `--no-sandbox` para funcionar em contêineres. Capture só URLs em que você confia.
- No Windows, o Edge e as instalações do Chrome por usuário não são detectados; defina `CHROME_PATH`.

Para páginas com sessão iniciada, anotações ou exportação manual em PDF, use a [extensão de navegador](/pt-br/docs/).

## shot-scraper

O [shot-scraper](https://github.com/simonw/shot-scraper) é uma ferramenta em Python baseada no Playwright. Instale-o, baixe o navegador dele e faça uma captura, segundo a [documentação de capturas](https://github.com/simonw/shot-scraper/blob/main/docs/screenshots.md) dele:

```sh
pip install shot-scraper
shot-scraper install
shot-scraper https://example.com -o example.png
```

Quando você omite `--height`, a captura é de página inteira. `--selector` captura um elemento, `shot-scraper pdf` salva um PDF e `multi` executa uma lista YAML de capturas. O comando `video`, adicionado na [1.10](https://github.com/simonw/shot-scraper/releases/tag/1.10), grava WebM a partir de um roteiro em YAML, e `--mp4` converte o vídeo com o ffmpeg. O Chromium é o navegador padrão, e o Firefox e o WebKit podem ser instalados. Escolha-o quando sua equipe trabalha em Python ou quando você quer capturas de tela, PDFs e vídeos de demonstração roteirizados em uma só ferramenta.

## capture-website-cli

O [capture-website-cli](https://github.com/sindresorhus/capture-website-cli) é uma ferramenta Node.js de Sindre Sorhus que captura páginas com o Puppeteer. O padrão é a área de visualização; `--full-page` captura toda a página com rolagem:

```sh
npm install --global capture-website-cli
capture-website https://example.com --output=screenshot.png --full-page
```

Sem `--output`, ele grava a imagem no stdout. Ele gera PNG, JPEG ou WebP. Flags como `--element`, `--hide-elements`, `--remove-elements`, `--click-element`, `--dark-mode`, `--style` e `--script` preparam a página antes da captura, o que o openscreenshot não faz. Escolha-o quando você precisa ocultar banners de cookies ou injetar CSS antes de uma captura.

## pageres-cli

O [pageres-cli](https://github.com/sindresorhus/pageres-cli) captura várias URLs em várias resoluções em uma única execução:

```sh
pageres https://example.com 1366x768 1600x900
```

Ele captura cada par de URL e resolução, em página inteira por padrão; `--crop` limita cada imagem à altura definida. A saída é PNG ou JPEG, e o tamanho padrão é 1366x768. Palavras-chave de dispositivo como `iphone5s` não são mais compatíveis. A atividade é baixa: a última versão, v9.0.0, de 9 de setembro de 2025, aumentou o requisito do Node.js para 20 e adicionou três flags. Escolha-o para uma verificação responsiva rápida em várias larguras.

## Playwright

O [Playwright](https://github.com/microsoft/playwright) é o framework de automação e testes da Microsoft para Chromium, Firefox e WebKit, com bindings para Node.js, Python, Java e .NET. Uma captura de página inteira é uma opção de [`page.screenshot`](https://playwright.dev/docs/api/class-page#page-screenshot):

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://playwright.dev/docs/api/class-page#page-pdf) funciona só no Chromium headless. A [gravação de vídeo](https://playwright.dev/docs/videos) é uma opção do contexto, e o executor de testes pode guardar o vídeo só dos testes que falharam. Escolha o Playwright quando a captura é uma etapa de um teste que faz login, clica e faz asserções.

## Puppeteer

O [Puppeteer](https://github.com/puppeteer/puppeteer) é a biblioteca Node.js do Google para Chrome e Firefox. `npm i puppeteer` baixa o Chrome for Testing. As [opções de captura](https://pptr.dev/api/puppeteer.screenshotoptions) usam o mesmo formato:

```js
await page.screenshot({ path: 'page.png', fullPage: true });
```

[`page.pdf()`](https://pptr.dev/api/puppeteer.page.pdf) gera um PDF com CSS de impressão. [`page.record()`](https://pptr.dev/api/puppeteer.page.record), adicionado no puppeteer-core 25.10.0, grava MP4 no Chrome. O Firefox é executado via WebDriver BiDi, onde alguns recursos não são compatíveis. O openscreenshot é uma camada fina sobre o `puppeteer-core`, então use o Puppeteer diretamente quando você precisar de mais do que as quatro opções de captura dele.

## Playwright MCP

O [Playwright MCP](https://github.com/microsoft/playwright-mcp) permite que um agente controle um navegador por meio de snapshots de acessibilidade, então ele não precisa de um modelo de visão. O [README](https://github.com/microsoft/playwright-mcp/blob/v0.0.83/README.md) dele traz esta configuração padrão:

```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp@latest"]
    }
  }
}
```

A ferramenta `browser_take_screenshot` recebe um parâmetro `fullPage` e retorna PNG, JPEG ou WebP. As ferramentas de PDF e vídeo são opcionais e ativadas por `--caps`. O navegador é executado com interface visível por padrão e mantém um perfil persistente, então os logins podem continuar ativos; `--isolated`, `--storage-state` e `--extension` (para se conectar a um Chrome ou Edge em execução) mudam isso. `--port` serve HTTP em vez de stdio. Ele ainda está em uma versão 0.0.x (v0.0.83). Escolha-o em vez de `openscreenshot serve` quando o agente precisa fazer login, clicar ou preencher formulários.

## Qual escolher

- **Um PNG de uma página pública em um script ou artefato de CI:** openscreenshot, shot-scraper ou capture-website-cli.
- **A mesma página em várias larguras:** pageres-cli.
- **Ocultar elementos ou injetar CSS antes:** capture-website-cli ou shot-scraper.
- **PDF ou um vídeo de demonstração roteirizado pela linha de comando:** shot-scraper.
- **Login, cliques e asserções em uma suíte de testes:** Playwright ou Puppeteer.
- **Um agente que só precisa olhar uma página:** `openscreenshot serve`.
- **Um agente que precisa interagir com a página ou fazer login:** Playwright MCP.
- **Uma pessoa que captura e anota páginas com sessão iniciada:** uma extensão; veja a [comparação de extensões de página inteira](/pt-br/blog/full-page-screenshot-extensions/).
