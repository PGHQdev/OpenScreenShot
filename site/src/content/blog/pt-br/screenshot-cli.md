---
title: Faça capturas de sites pela linha de comando
description: Use a CLI do OpenScreenShot para salvar capturas PNG com área de visualização fixa, captura de página inteira ou saída binária no stdout.
audience: developers
order: 4
---

A CLI do OpenScreenShot captura uma página web como PNG usando um navegador compatível com Chrome instalado localmente. Ela é um pacote separado da extensão de navegador. Com Node.js, pnpm e Chrome instalados, execute:

```sh
pnpm dlx openscreenshot shot https://example.com --out screenshot.png --full
```

O comando inicia um navegador headless separado, navega até a URL, grava a imagem e fecha o navegador. Ele não se conecta às abas nem ao perfil conectado do seu navegador do dia a dia.

## Defina a área de visualização explicitamente

Para uma captura da área de visualização, omita `--full`. A largura padrão é 1280 pixels e a altura padrão é 800 pixels. Defina as duas quando um layout precisar de um tamanho específico:

```sh
pnpm dlx openscreenshot shot https://example.com --out desktop.png --width 1440 --height 900
pnpm dlx openscreenshot shot https://example.com --out narrow.png --width 390 --height 844
```

A largura aceita inteiros de 200 a 3840; a altura aceita inteiros de 200 a 2160. Uma área de visualização estreita testa o layout responsivo nessa largura. Ela não emula a entrada por toque, a proporção de pixels do dispositivo nem o navegador móvel de um celular: a CLI usa um user agent de desktop.

Adicione `--full` para capturar além da área de visualização. A captura de página inteira do navegador headless é diferente da implementação de rolar e juntar da extensão; não presuma que todas as páginas dinâmicas vão ficar idênticas nas duas.

## Salve um arquivo ou grave no stdout

Sem `--out`, o comando grava `screenshot.png` no diretório atual. Use um nome de arquivo explícito para identificar os artefatos com facilidade. Crie o diretório de saída pai antes de executar o comando.

`--out -` grava os bytes do PNG no stdout:

```sh
pnpm dlx openscreenshot shot https://example.com --out - > screenshot.png
```

Use um redirecionamento seguro para dados binários. A CLI sempre gera PNG; dar o nome `capture.jpg` ou `capture.pdf` à saída não a converte. Para imagens anotadas ou saída em PDF, use o [editor da extensão](/pt-br/docs/#export).

## Resolva falhas comuns

Se o Chrome não for encontrado, instale-o ou defina `CHROME_PATH` com o executável do navegador. Por exemplo, em um sistema Linux com o Chromium instalado neste caminho:

```sh
CHROME_PATH=/usr/bin/chromium pnpm dlx openscreenshot shot https://example.com --out screenshot.png
```

A navegação espera por `networkidle2` com um tempo limite de 30 segundos. O comando atual não tem opções personalizadas de espera, seletor, cookie ou login. Uma captura bem-sucedida também não prova que o aplicativo carregou corretamente: inspecione o PNG em busca de páginas de erro, estados de carregamento e recursos ausentes.

O código de saída 0 indica que o comando de captura terminou, 1 indica uma falha na captura e 2 indica uso inválido ou argumentos inválidos na validação. Use esses códigos ao encadear comandos e depois revise a própria imagem.

Para artefatos repetíveis, leia [o guia de capturas em CI](/pt-br/blog/screenshots-for-ci/). Para um fluxo conduzido por agentes, veja [o guia de configuração do MCP](/pt-br/blog/screenshot-mcp-server/). O [código-fonte da CLI](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) é a referência para as flags disponíveis.
