---
title: Haz capturas de sitios web desde la línea de comandos
description: Usa la CLI de OpenScreenShot para guardar capturas PNG con un viewport fijo, de página completa o como salida binaria a stdout.
audience: developers
order: 4
---

La CLI de OpenScreenShot captura una página web como PNG con un navegador compatible con Chrome instalado en tu equipo. Es un paquete aparte de la extensión del navegador. Con Node.js, pnpm y Chrome instalados, ejecuta:

```sh
pnpm dlx openscreenshot shot https://example.com --out screenshot.png --full
```

El comando inicia un navegador headless aparte, navega a la URL, escribe la imagen y cierra el navegador. No se conecta a las pestañas ni al perfil con sesión iniciada de tu navegador habitual.

## Define el viewport de forma explícita

Para una captura del viewport, omite `--full`. El ancho por defecto es de 1280 píxeles y el alto, de 800 píxeles. Define ambos cuando un diseño necesita un tamaño concreto:

```sh
pnpm dlx openscreenshot shot https://example.com --out desktop.png --width 1440 --height 900
pnpm dlx openscreenshot shot https://example.com --out narrow.png --width 390 --height 844
```

El ancho acepta enteros de 200 a 3840; el alto acepta enteros de 200 a 2160. Un viewport estrecho prueba el diseño responsive a ese ancho. No emula la entrada táctil, la proporción de píxeles del dispositivo ni el navegador móvil de un teléfono: la CLI usa un user agent de escritorio.

Añade `--full` para capturar más allá del viewport. La captura de página completa del navegador headless es distinta de la implementación de la extensión, que desplaza y une; no des por hecho que todas las páginas dinámicas se verán igual en ambas.

## Guarda un archivo o escribe a stdout

Sin `--out`, el comando escribe `screenshot.png` en el directorio actual. Usa un nombre de archivo explícito para que los artefactos sean fáciles de identificar. Crea el directorio de salida antes de ejecutar el comando.

`--out -` escribe los bytes PNG a stdout:

```sh
pnpm dlx openscreenshot shot https://example.com --out - > screenshot.png
```

Usa una redirección segura para datos binarios. La CLI siempre produce PNG; llamar a la salida `capture.jpg` o `capture.pdf` no la convierte. Para imágenes anotadas o salida PDF, usa el [editor de la extensión](/es/docs/#export).

## Resuelve los fallos más comunes

Si no se encuentra Chrome, instálalo o define `CHROME_PATH` con el ejecutable del navegador. Por ejemplo, en un sistema Linux con Chromium instalado en esa ruta:

```sh
CHROME_PATH=/usr/bin/chromium pnpm dlx openscreenshot shot https://example.com --out screenshot.png
```

La navegación espera a `networkidle2` con un tiempo límite de 30 segundos. El comando actual no tiene opciones de espera personalizada, selector, cookies ni inicio de sesión. Una captura correcta tampoco demuestra que la aplicación cargara bien: revisa el PNG en busca de páginas de error, estados de carga y recursos que faltan.

El código de salida 0 indica que el comando de captura terminó, 1 indica un fallo de captura y 2 indica un uso no válido o argumentos validados. Usa esos códigos al encadenar comandos y luego revisa la propia imagen.

Para artefactos repetibles, lee [la guía de capturas en CI](/es/blog/screenshots-for-ci/). Para un flujo dirigido por un agente, consulta [la guía de configuración de MCP](/es/blog/screenshot-mcp-server/). El [código fuente de la CLI](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) es la referencia de las opciones disponibles.
