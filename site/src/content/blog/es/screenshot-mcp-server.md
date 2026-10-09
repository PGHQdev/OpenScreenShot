---
title: Configura un servidor MCP local de capturas para un agente de IA
description: Conecta OpenScreenShot a un cliente MCP por stdio y pide capturas PNG con opciones explícitas de URL, viewport y página completa.
audience: developers
order: 5
---

OpenScreenShot ofrece un servidor MCP local con una sola herramienta: `capture_screenshot`. Un cliente MCP puede llamarla con la URL de una página web y recibir contenido de imagen PNG. El servidor lanza un navegador headless aparte compatible con Chrome en tu equipo; no necesitas la extensión del navegador.

## Añade el servidor a tu cliente MCP

Instala primero Node.js, pnpm y un navegador compatible con Chrome. Añade una entrada de servidor con el formato de configuración de tu cliente. Los clientes que aceptan un objeto `mcpServers` pueden usar:

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

El cliente tiene que poder encontrar `pnpm` en su ruta de ejecutables. Reinicia o recarga sus conexiones MCP después de guardar la configuración. El servidor usa stdio, así que el cliente inicia un proceso local; no hay ninguna URL de MCP alojada que introducir.

Si Chrome está instalado en un lugar poco habitual, pasa `CHROME_PATH` mediante la configuración de entorno del cliente. Usa la ruta completa al ejecutable, no la carpeta que contiene la aplicación.

## Llama a capture_screenshot

Una entrada mínima de la herramienta es:

```json
{ "url": "https://example.com" }
```

Esto produce una captura del viewport con el tamaño por defecto de 1280 × 800. Define el viewport y la opción de página completa de forma explícita para una petición reproducible:

```json
{
  "url": "https://example.com",
  "fullPage": true,
  "width": 1440,
  "height": 900
}
```

`width` acepta enteros de 200 a 3840 y `height` de 200 a 2160. La herramienta devuelve contenido de imagen MCP con el tipo MIME `image/png`. Esta herramienta no tiene ningún argumento de ruta de salida. Que el resultado se muestre o se guarde depende del cliente; usa la [CLI](/es/blog/screenshot-cli/) cuando necesites directamente un archivo con nombre.

## Qué puede ver el agente y qué no

La captura empieza en un navegador headless nuevo. No hereda las cookies ni la sesión iniciada de tu ventana normal de Chrome. Por eso, una página que requiere autenticación puede mostrar una pantalla de inicio de sesión. La herramienta actual no ofrece pasos de inicio de sesión, inyección de cookies, esperas por selector ni clics interactivos.

Pide al agente que identifique qué se ve de verdad en la imagen devuelta antes de sacar conclusiones. Una captura ayuda a revisar el diseño, los espaciados y los errores visibles; no puede demostrar que un formulario se envía bien ni que la navegación por teclado funciona.

## ¿Adónde va la captura?

La captura se genera localmente y se devuelve al cliente MCP. Si ese cliente usa un modelo alojado, puede transmitir la imagen devuelta al proveedor del modelo según su propia configuración. Que la captura sea local no implica que toda la conversación con el agente se quede en el dispositivo.

Para capturas automatizadas con dimensiones predecibles, consulta [capturas para CI](/es/blog/screenshots-for-ci/). La [skill de captura para agentes](/skills/capture-screenshot.md) y el [código fuente del servidor](https://github.com/pghqdev/OpenScreenShot/blob/main/mcp/src/serve.ts) contienen las instrucciones orientadas a máquinas y la definición de la herramienta.
