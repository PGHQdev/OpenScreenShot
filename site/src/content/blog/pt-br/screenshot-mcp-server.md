---
title: Configure um servidor MCP local de capturas de tela para um agente de IA
description: Conecte o OpenScreenShot a um cliente MCP via stdio e peça capturas PNG com opções explícitas de URL, área de visualização e página inteira.
audience: developers
order: 5
---

O OpenScreenShot oferece um servidor MCP local com uma ferramenta: `capture_screenshot`. Um cliente MCP pode chamá-la com a URL de uma página web e receber o conteúdo de uma imagem PNG. O servidor inicia um navegador headless separado, compatível com Chrome, no seu computador; a extensão de navegador não é necessária.

## Adicione o servidor ao seu cliente MCP

Primeiro instale Node.js, pnpm e um navegador compatível com Chrome. Adicione uma entrada de servidor no formato de configuração do seu cliente. Clientes que aceitam um objeto `mcpServers` podem usar:

```json
{
  "mcpServers": {
    "openscreenshot": {
      "command": "pnpm",
      "args": ["dlx", "openscreenshot", "serve"]
    }
  }
}
```

O cliente precisa encontrar o `pnpm` no caminho de executáveis dele. Reinicie ou recarregue as conexões MCP do cliente depois de salvar a configuração. O servidor usa stdio, então o cliente inicia um processo local; não há uma URL de MCP hospedada para informar.

Se o Chrome estiver instalado em um lugar incomum, passe `CHROME_PATH` pela configuração de ambiente do cliente. Use o caminho completo do executável, e não a pasta que contém o aplicativo.

## Chame capture_screenshot

Uma entrada mínima para a ferramenta é:

```json
{ "url": "https://example.com" }
```

Isso gera uma captura da área de visualização no tamanho padrão de 1280 × 800. Defina explicitamente a área de visualização e a opção de página inteira para um pedido reproduzível:

```json
{
  "url": "https://example.com",
  "fullPage": true,
  "width": 1440,
  "height": 900
}
```

`width` aceita inteiros de 200 a 3840 e `height` de 200 a 2160. A ferramenta retorna conteúdo de imagem MCP com o tipo MIME `image/png`. Esta ferramenta não tem um argumento de caminho de saída. O cliente decide se o resultado é exibido ou salvo; use a [CLI](/pt-br/blog/screenshot-cli/) quando você precisar de um arquivo com nome definido.

## O que o agente vê e o que não vê

A captura começa em um navegador headless novo. Ela não herda os cookies nem a sessão conectada da sua janela comum do Chrome. Por isso, uma página que exige autenticação pode gerar uma tela de login. A ferramenta atual não oferece passos de login, injeção de cookies, espera por seletores nem cliques interativos.

Peça ao agente para identificar o que está visível de fato na imagem retornada antes de tirar conclusões. Uma captura de tela ajuda a inspecionar layout, espaçamento e erros visíveis; ela não comprova que um formulário é enviado corretamente nem que a navegação por teclado funciona.

## Para onde vai a captura de tela?

A captura é gerada localmente e retornada ao cliente MCP. Se esse cliente usar um modelo hospedado, ele pode transmitir a imagem retornada ao provedor do modelo, de acordo com as configurações dele. A captura local não significa que toda a conversa com o agente fica no dispositivo.

Para capturas automatizadas com dimensões previsíveis, veja [capturas de tela para CI](/pt-br/blog/screenshots-for-ci/). A [skill de captura para agentes](/skills/capture-screenshot.md) e o [código-fonte do servidor](https://github.com/pghqdev/OpenScreenShot/blob/main/mcp/src/serve.ts) trazem as instruções para máquinas e a definição da ferramenta.
