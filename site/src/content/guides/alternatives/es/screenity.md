---
title: 'Alternativa a Screenity: capturas de pantalla y grabación de pestañas en una extensión'
description: Screenity frente a OpenScreenShot. Ambos son de código abierto. OpenScreenShot añade capturas de página completa y PDF, y no pide acceso a todos los sitios.
order: 7
---

Cámbiate a OpenScreenShot si grabas pestañas del navegador y también haces capturas de página completa, y quieres una sola extensión de código abierto que haga ambas cosas sin acceso a todos los sitios web al instalarse. Quédate con Screenity si grabas algo más que una pestaña: graba un área, el escritorio, cualquier ventana de aplicación o la cámara, y exporta a GIF o guarda en Google Drive. OpenScreenShot graba una pestaña del navegador y no captura ventanas del escritorio ni la pantalla entera. El plan Pro de pago de Screenity también añade enlaces para compartir y alojamiento en la nube, que OpenScreenShot no ofrece.

OpenScreenShot es nuestro producto. Los datos sobre Screenity de esta página son del 9 de octubre de 2026 y proceden de su [repositorio de GitHub](https://github.com/alyssaxuu/screenity) y su [manifiesto](https://github.com/alyssaxuu/screenity/blob/master/src/manifest.json), su [ficha en la Chrome Web Store](https://chromewebstore.google.com/detail/screenity-screen-recorder/kbbdabhdfibnancpjfhlkhafgdilcnji), su [página de Pro](https://screenity.io/pro) y la [lista de advertencias de permisos](https://developer.chrome.com/docs/extensions/reference/permissions-list) de Chrome.

## Screenity y OpenScreenShot frente a frente

|                             | Screenity                                                                                       | OpenScreenShot                                                                                       |
| --------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Precio                      | Extensión gratuita; Pro cuesta 10 $ al mes o 120 $ al año, con una prueba de 7 días             | Gratis, sin plan de pago                                                                             |
| Código abierto              | Sí, GPL-3.0                                                                                     | Sí, MIT                                                                                              |
| Acceso a sitios al instalar | Todos los sitios web (`<all_urls>` obligatorio, además de `tabs` y `tabCapture`)                | Ninguno. La captura de pestañas es opcional y se pide en la primera grabación                        |
| Captura de página completa  | Las fuentes que consultamos no lo indican                                                       | Sí                                                                                                   |
| Anotación y desenfoque      | Dibujo, texto, flechas, formas; desenfoque del contenido de la página                           | Formas, flechas, texto, números de paso, desenfoque, Spotlight y recorte en las capturas de pantalla |
| Exportación a PDF           | Las fuentes que consultamos no lo indican                                                       | Sí                                                                                                   |
| Grabación de pestañas       | Sí, además de área, escritorio, ventana de aplicación y cámara                                  | Sí, solo la pestaña, en Chrome (la versión para Firefox solo hace capturas de pantalla)              |
| Exportación de vídeo        | MP4, GIF, WebM o Google Drive                                                                   | MP4 o WebM                                                                                           |
| Cuenta o nube               | Sin inicio de sesión para la extensión gratuita; Pro usa una cuenta y una nube alojada en la UE | Sin cuenta, sin subidas                                                                              |

## Lo que conservas

Ambas extensiones son de código abierto, y ambas guardan las grabaciones gratuitas en tu dispositivo sin inicio de sesión. En OpenScreenShot, haz clic en **Grabar** en el menú y elige **Mic**, **Audio** o **Webcam**. Deja **Pestaña completa** o arrastra sobre la vista previa para grabar una parte de la página. La pestaña de grabación contiene el temporizador y los botones **Pausar**, **Detener** y **Cancelar**, así que no aparece ningún control en el vídeo. Pulsa `Alt+Shift+X` para detener la grabación desde cualquier pestaña.

## Lo que cambia

El editor de grabaciones añade un zoom de 2x en cada clic que hizo tu cursor. Puedes mover o eliminar esos zooms, añadir zooms manuales a 1,5x, 2x o 3x, y recortar cada segmento. La webcam se incluye en la exportación como una burbuja redonda que colocas donde quieras, y el panel **Beautify** añade relleno y un fondo. La exportación genera un MP4 (H.264 y AAC) por defecto, o un WebM. La [referencia de grabación](/es/docs/#record) explica cada control.

Las capturas de pantalla forman parte de la misma extensión. Un clic en el icono de la barra de herramientas inicia una captura de **Página completa** con el **Modo Express de un clic** por defecto. El editor de capturas tiene **Desenfocar** con un relleno **Sólido** para ocultar datos, y **Guardar imagen** abre el diálogo **Exportar** para PNG, JPEG, WebP o PDF. OpenScreenShot no añade nada a la página durante una grabación, así que no puedes dibujar en la página mientras grabas. La anotación funciona en las capturas de pantalla.

El acceso al instalar es menor. El manifiesto de Screenity exige `<all_urls>`, y la lista de Chrome muestra «Read and change all your data on all websites» (leer y cambiar todos tus datos en todos los sitios web) para `tabCapture` y «Read your browsing history» (leer tu historial de navegación) para `tabs`. OpenScreenShot se instala con `activeTab` y pide la captura de pestañas solo la primera vez que haces clic en **Grabar**. Pide acceso a todos los sitios solo si activas **Grabar entre sitios**, que permite que el seguimiento de clics siga a una pestaña a otro sitio.

## Cómo cambiar

1. Instala OpenScreenShot desde la [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). La [versión para Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/) solo hace capturas de pantalla.
2. Fija el icono en la barra de herramientas.
3. Haz una primera captura: haz clic en el icono en una página y revisa el resultado en el **Editor**.
4. Haz clic en **Grabar** en el menú y acepta la solicitud de captura de pestañas de Chrome. Graba una toma corta y expórtala.
5. Configura **Tras capturar** en **Ajustes** para las capturas de pantalla: **Editor**, **Portapapeles** o **Descargar**.
6. Exporta las grabaciones de Screenity que quieras conservar antes de quitarlo.

Para recorridos por funciones, consulta [vídeos de demostración de producto](/es/use-cases/product-demos/). Para mostrar un error en una incidencia, consulta [capturas para informes de errores](/es/use-cases/bug-reports/). Si compartes vídeos mediante enlaces con un equipo, compara con la [alternativa a Loom](/es/alternatives/loom/). Para una grabadora con subida a la nube, consulta la [alternativa a Nimbus](/es/alternatives/nimbus/).
