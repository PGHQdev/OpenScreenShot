---
title: 'Alternativa a Nimbus Screenshot: captura local tras el paso a FuseBase'
description: Nimbus Screenshot ahora es FuseBase Pro. OpenScreenShot es una opción gratuita y de código abierto para capturar, anotar y grabar pestañas en tu dispositivo.
order: 5
---

Nimbus Screenshot se distribuye ahora en Chrome como FuseBase Pro, de Nimbus Web. Cámbiate a OpenScreenShot si usabas Nimbus para capturar, anotar y grabar páginas web y quieres una herramienta gratuita que mantenga los archivos en tu dispositivo, sin cuenta y sin espacio de trabajo en la nube. Quédate con FuseBase Pro si necesitas lo que OpenScreenShot no tiene: grabación de pantalla más allá de una pestaña, y subidas a FuseBase, Google Drive, Dropbox o Slack. OpenScreenShot graba una pestaña del navegador, solo en Chrome. No captura ventanas del escritorio ni la pantalla entera.

OpenScreenShot es nuestro producto. Los datos sobre FuseBase Pro de esta página son del 9 de octubre de 2026 y proceden de su [ficha en la Chrome Web Store](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn), la [página de capturas](https://thefusebase.com/screenshot/) y la [página de precios](https://thefusebase.com/pricing/) de FuseBase, la antigua [página del complemento Nimbus para Firefox](https://addons.mozilla.org/en-US/firefox/addon/nimbus-screenshot/) y el manifiesto de la versión 3.6.19 del servidor de actualizaciones de Google.

## Qué pasó con Nimbus Screenshot

La ficha original de Nimbus Screenshot & Screen Video Recorder ya no está en la Chrome Web Store. La antigua página de capturas de Nimbus, nimbusweb.me/screenshot.php, ahora redirige a la página de capturas de FuseBase. La extensión actual para Chrome es «FuseBase Pro - Capture screenshots and Video record», ofrecida por Nimbus Web, Inc. El antiguo complemento de Nimbus sigue disponible para Firefox. Se actualizó por última vez el 31 de julio de 2020.

## FuseBase Pro y OpenScreenShot frente a frente

|                             | FuseBase Pro (antes Nimbus)                                                                  | OpenScreenShot                                                 |
| --------------------------- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Precio                      | Plan gratuito con grabaciones de hasta 5 minutos; plan Pro con grabaciones de hasta 10 horas | Gratis, sin plan de pago                                       |
| Código abierto              | No                                                                                           | Sí, MIT                                                        |
| Acceso a sitios al instalar | Todos los sitios web (`<all_urls>` obligatorio, scripts de contenido en cada página)         | Ninguno. Acceso a la pestaña actual cuando inicias una captura |
| Captura de página completa  | Sí                                                                                           | Sí                                                             |
| Anotación y desenfoque      | Sí                                                                                           | Sí, todas las herramientas gratis                              |
| Exportación a PDF           | Sí, según su ficha                                                                           | Sí                                                             |
| Grabación de pestañas       | Sí, pantalla y webcam; la conversión a GIF y MP4 es premium                                  | Sí, solo la pestaña, en Chrome; MP4 y WebM gratis              |
| Cuenta o nube               | Subidas a FuseBase, Google Drive, Dropbox y Slack                                            | Sin cuenta, sin subidas                                        |

La página de capturas de FuseBase no muestra ningún precio para el plan Pro de captura. La página de precios de FuseBase enumera planes de espacio de trabajo, empezando por Solo a 32 $ o 39 $ al mes según la facturación, y no menciona la extensión de captura.

## Lo que conservas

Conservas la captura de página completa, un editor con herramientas de anotación y desenfoque, y la exportación a PDF. En Chrome, conservas la grabación con webcam, y OpenScreenShot también graba el micrófono y el audio de la pestaña. Las exportaciones no llevan marca de agua.

## Lo que cambia

Los archivos se quedan en tu dispositivo. OpenScreenShot guarda las capturas en el almacenamiento local del navegador y las grabaciones en IndexedDB hasta que las eliminas, y no tiene analíticas ni telemetría. La sección de privacidad de FuseBase Pro en la Chrome Web Store declara la recopilación de información de identificación personal, información de autenticación y contenido de sitios web. Para compartir una captura de OpenScreenShot, haz clic en **Copiar** y pégala, o haz clic en **Guardar imagen** y adjunta el archivo.

El acceso al instalar es menor. OpenScreenShot usa `activeTab`, que cubre una pestaña cuando inicias una captura. Chrome pide el permiso opcional de captura de pestañas la primera vez que haces clic en **Grabar**, y el acceso a todos los sitios solo si activas **Grabar entre sitios**.

La grabación cubre una pestaña. Haz clic en **Grabar** en el menú, elige **Mic**, **Audio** o **Webcam**, y graba la pestaña entera o un área que arrastres. El editor de grabaciones añade un zoom de 2x en cada clic, y puedes recortar segmentos y colocar la burbuja de la webcam. La exportación a MP4 y WebM es gratis. OpenScreenShot no exporta a GIF. Consulta la [referencia de grabación](/es/docs/#record).

## Cómo cambiar

1. Instala OpenScreenShot desde la [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) o desde [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/). La versión para Firefox solo hace capturas de pantalla.
2. Fija el icono en la barra de herramientas.
3. Haz clic en el icono en una página. Con el **Modo Express de un clic** por defecto, esto inicia una captura de **Página completa** y abre el **Editor**. Haz clic derecho en la página para **Área visible**, **Región** y **Capturar elemento**.
4. Configura **Tras capturar** en **Ajustes**: **Editor**, **Portapapeles** o **Descargar**.
5. Descarga los archivos que quieras conservar de FuseBase o de tu almacenamiento en la nube. Para anotar una captura antigua, suelta la imagen en el editor de OpenScreenShot.
6. Revisa `chrome://extensions` y quita la extensión de Nimbus o de FuseBase si ya no la usas.

Para vídeos cortos de funciones, consulta [vídeos de demostración de producto](/es/use-cases/product-demos/). Para capturas marcadas para un equipo, consulta [capturar una página para una revisión de diseño](/es/use-cases/design-review/). Para otras grabadoras, consulta la [alternativa a Awesome Screenshot](/es/alternatives/awesome-screenshot/) y la [alternativa a Screenity](/es/alternatives/screenity/).
