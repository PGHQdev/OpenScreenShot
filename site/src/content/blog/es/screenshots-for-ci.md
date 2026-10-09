---
title: Captura sitios web para CI y revisiones de versión
description: Crea artefactos PNG repetibles con la CLI de OpenScreenShot y entiende qué puede verificar una captura en un pipeline de compilación.
audience: developers
order: 6
---

Usa la CLI de OpenScreenShot en CI para guardar un PNG de una aplicación en ejecución y revisarlo. Prepara un navegador compatible con Chrome, inicia la aplicación, espera a que esté lista y luego captura una URL y un viewport fijos. Sube el archivo resultante con el mecanismo de artefactos de tu proveedor de CI.

## Haz que el entorno sea repetible

En un proyecto que ya usa pnpm, añade la CLI como dependencia de desarrollo y haz commit de los cambios resultantes en el manifiesto y el lockfile:

```sh
pnpm add -D -E openscreenshot
```

Instala las dependencias en CI con el lockfile congelado del proyecto. El paquete usa `puppeteer-core` y no descarga ningún navegador, así que el runner también necesita Chrome o Chromium. Define `CHROME_PATH` si el ejecutable no está en una ubicación por defecto admitida.

Mantén estables la versión del navegador, las fuentes, el viewport, los datos de la aplicación y la versión del paquete cuando compares capturas. Un cambio de fuente o del motor de renderizado del navegador puede alterar una imagen aunque el código de la aplicación no haya cambiado.

## Captura cuando la aplicación esté lista

Inicia tu servidor de desarrollo o de vista previa con el comando propio del proyecto. Espera a que la ruta y sus dependencias estén listas antes de ejecutar este ejemplo; el puerto 4321 es solo un ejemplo y debe coincidir con tu aplicación:

```sh
mkdir -p artifacts
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/desktop.png --width 1440 --height 900
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/narrow.png --width 390 --height 844
```

Estos comandos producen capturas del viewport. Añade `--full` para revisar la página entera. Pasa el directorio `artifacts/` al paso de subida de artefactos de tu CI para que un revisor pueda abrir los archivos junto a una pull request o una versión.

La CLI espera a que la red esté inactiva durante la navegación, pero eso no garantiza que el trabajo propio de la aplicación haya terminado. No tiene una espera por selector configurable ni un script de preparación inyectado. Usa una ruta de revisión dedicada y estable con datos deterministas cuando la ruta normal contiene animaciones, contenido variable o autenticación.

## Una imagen capturada no es una prueba visual superada

El comando puede terminar con éxito después de capturar un error del servidor o una pantalla de carga. Trata el PNG como un artefacto de revisión. Un sistema de regresión visual también necesita una referencia base, un método de comparación de imágenes, umbrales y un proceso para aceptar los cambios intencionados; la CLI de OpenScreenShot no ofrece esas piezas.

Una captura estrecha es una comprobación útil del diseño responsive, pero no es emulación de dispositivos móviles. Del mismo modo, una captura no verifica interacciones, accesibilidad ni el comportamiento de una API. Mantén las comprobaciones relevantes de la aplicación junto al paso de captura.

## Resuelve problemas del pipeline

**No se encuentra Chrome:** comprueba que la imagen del runner incluye un navegador y que `CHROME_PATH` apunta a su ejecutable.

**La navegación falló o superó el tiempo límite:** comprueba que el servidor es accesible desde el proceso de captura, usa el puerto esperado y está listo antes de que empiece la captura. La navegación tiene un tiempo límite de 30 segundos.

**Aparece una página de inicio de sesión inesperada:** la CLI inicia una sesión de navegador nueva. No reutiliza tu perfil local ni ofrece inyección de cookies.

**Falta el archivo de salida:** crea el directorio de salida, revisa el código de salida del comando y comprueba la ruta del artefacto respecto al directorio de trabajo de la CI.

La [guía de referencia de la CLI](/es/blog/screenshot-cli/) cubre las opciones y los códigos de salida. Si una persona o un agente debe decidir qué página revisar después, usa el [flujo de capturas con MCP](/es/blog/screenshot-mcp-server/).
