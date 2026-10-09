---
title: 'Alternativa a Loom: grabaciones de pestañas que se quedan en tu dispositivo'
description: Loom frente a OpenScreenShot. Graba una pestaña del navegador con webcam, micrófono y zoom automático, y exporta un MP4 localmente, sin cuenta ni plan de pago.
order: 8
---

Cámbiate a OpenScreenShot si grabas recorridos por una aplicación web o una página en Chrome y quieres exportar un archivo MP4 en tu propio dispositivo, sin cuenta. Quédate con Loom si compartes vídeos mediante enlaces: Loom aloja cada vídeo, te da una biblioteca y un espacio de trabajo de equipo, y ofrece aplicaciones de escritorio y móviles. OpenScreenShot no tiene alojamiento ni enlaces para compartir, así que subes o adjuntas tú mismo el archivo exportado. Graba una pestaña del navegador, solo en Chrome, y no captura ventanas del escritorio ni la pantalla entera.

OpenScreenShot es nuestro producto. Los datos sobre Loom de esta página son del 9 de octubre de 2026 y proceden de su [página de precios](https://www.loom.com/pricing), su [ficha en la Chrome Web Store](https://chromewebstore.google.com/detail/loom-%E2%80%93-screen-recorder-sc/liecbddmkiiihnedobmlmillhodjkdmb), la [página de ayuda sobre cuentas](https://support.atlassian.com/loom/docs/use-loom-with-an-atlassian-account) de Atlassian y la [lista de advertencias de permisos](https://developer.chrome.com/docs/extensions/reference/permissions-list) de Chrome.

## Loom y OpenScreenShot frente a frente

|                             | Loom                                                                                                                                                                            | OpenScreenShot                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Precio                      | Starter 0 $ (25 vídeos, grabaciones de pantalla de hasta 5 minutos); Business 18 $ por usuario al mes; Business + AI figura a 24 $ por usuario al mes; Enterprise bajo petición | Gratis, sin plan de pago                                                                |
| Código abierto              | No                                                                                                                                                                              | Sí, MIT                                                                                 |
| Acceso a sitios al instalar | Todos los sitios web (`<all_urls>` obligatorio, scripts de contenido en cada página)                                                                                            | Ninguno. La captura de pestañas es opcional y se pide en la primera grabación           |
| Captura de página completa  | Las fuentes que consultamos no lo indican                                                                                                                                       | Sí                                                                                      |
| Anotación y desenfoque      | Las fuentes que consultamos no lo indican                                                                                                                                       | Sí, en las capturas de pantalla                                                         |
| Exportación a PDF           | Las fuentes que consultamos no lo indican                                                                                                                                       | Sí, para capturas de pantalla                                                           |
| Grabación de pestañas       | Grabación de pantalla, con límites según el plan                                                                                                                                | Sí, solo la pestaña, en Chrome (la versión para Firefox solo hace capturas de pantalla) |
| Cuenta o nube               | Cuenta obligatoria; Loom aloja los vídeos                                                                                                                                       | Sin cuenta, sin subidas                                                                 |

Loom forma parte de Atlassian desde noviembre de 2023, y una cuenta de Loom puede usar una cuenta de Atlassian.

## Lo que conservas

Conservas una grabadora que se inicia desde la barra de herramientas del navegador. Haz clic en **Grabar** en el menú de OpenScreenShot, activa **Mic** y **Webcam**, y haz clic en **Empezar a grabar**. Tu webcam aparece en la exportación como una burbuja redonda que colocas donde quieras. **Audio** añade el sonido de la página.

## Lo que cambia

El vídeo es un archivo. Cuando detienes la grabación, el editor de grabaciones se abre en la misma pestaña. Añade un zoom de 2x en cada clic, así que los espectadores ven dónde hiciste clic. Puedes ajustar o eliminar cada zoom, añadir los tuyos a 1,5x, 2x o 3x, y recortar segmentos. La exportación genera un archivo MP4 (H.264 y AAC) o WebM en tu carpeta de descargas. Súbelo a tu propio alojamiento de vídeo, a un chat o a un ticket. La [referencia de grabación](/es/docs/#record) explica cada control.

Las grabaciones se quedan en tu dispositivo. OpenScreenShot las guarda en IndexedDB mientras grabas y las conserva hasta que eliminas la sesión. No tiene analíticas ni telemetría. La [sección de privacidad](/es/docs/#privacy) tiene los detalles.

El alcance es una pestaña. Deja **Pestaña completa** o arrastra sobre la vista previa para grabar una parte de la página. Si la pestaña pasa a otro sitio durante una grabación, el seguimiento de clics necesita **Grabar entre sitios**, que pide acceso a todos los sitios. Sin él, el zoom y los efectos de clic se detienen durante el resto del vídeo, y el vídeo se sigue grabando.

El acceso al instalar es menor. El manifiesto de Loom exige `<all_urls>`, `tabCapture` y `desktopCapture`. La lista de Chrome muestra «Read and change all your data on all websites» (leer y cambiar todos tus datos en todos los sitios web) para `tabCapture` y «Capture content of your screen» (capturar el contenido de tu pantalla) para `desktopCapture`. OpenScreenShot se instala con `activeTab` y pide la captura de pestañas solo la primera vez que haces clic en **Grabar**.

OpenScreenShot también hace capturas de pantalla. Un clic en el icono de la barra de herramientas inicia una captura de **Página completa** con el **Modo Express de un clic** por defecto, y el editor tiene flechas, números de paso y **Desenfocar** con un relleno **Sólido**.

## Cómo cambiar

1. Instala OpenScreenShot desde la [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). La [versión para Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/) solo hace capturas de pantalla.
2. Fija el icono en la barra de herramientas.
3. Haz clic en **Grabar** en el menú y acepta la solicitud de captura de pestañas de Chrome. Graba una toma corta y, después, haz clic en **Exportar**.
4. Pulsa `Alt+Shift+X` para detener una grabación desde cualquier pestaña.
5. Para las capturas de pantalla, configura **Tras capturar** en **Ajustes**: **Editor**, **Portapapeles** o **Descargar**.
6. Descarga los vídeos de Loom que quieras conservar antes de cerrar tu cuenta o cambiar de plan.

Para recorridos por funciones, consulta [vídeos de demostración de producto](/es/use-cases/product-demos/). Para respuestas de soporte, consulta [capturas para atención al cliente](/es/use-cases/customer-support/). Para una grabadora de código abierto que también graba el escritorio, consulta la [alternativa a Screenity](/es/alternatives/screenity/). Para una grabadora con enlaces en la nube, consulta la [alternativa a Awesome Screenshot](/es/alternatives/awesome-screenshot/).
