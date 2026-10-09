---
title: 'Alternativa a FullPage Capture: código abierto y sin acceso a todos los sitios al instalar'
description: FullPage Capture frente a OpenScreenShot. Ambos capturan y anotan páginas completas gratis. OpenScreenShot es de código abierto y no pide acceso a todo.
order: 2
---

Cámbiate a OpenScreenShot si quieres una extensión de capturas de página completa cuyo código puedas leer y que no pida acceso a todos los sitios web al instalarse. Quédate con FullPage Capture si necesitas lo que ofrece su exportación a PDF: su ficha describe PDF con enlaces en los que se puede hacer clic y saltos de página inteligentes, y su plan Pro añade PDF con texto buscable. OpenScreenShot guarda un PDF como imagen, así que su texto no se puede buscar ni seleccionar y sus enlaces no funcionan. OpenScreenShot captura solo páginas web en el navegador; no captura ventanas del escritorio ni la pantalla entera.

OpenScreenShot es nuestro producto. Los datos sobre FullPage Capture de esta página son del 9 de octubre de 2026 y proceden de su [ficha en la Chrome Web Store](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol), su [sitio web](https://fullpagecapture.net/) y el manifiesto de la versión 1.19.67 del servidor de actualizaciones de Google.

## FullPage Capture y OpenScreenShot frente a frente

|                             | FullPage Capture                                                                                          | OpenScreenShot                                                                                           |
| --------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Precio                      | Gratis; Pro cuesta 19 $ al año tras una prueba de 7 días                                                  | Gratis, sin plan de pago                                                                                 |
| Código abierto              | No                                                                                                        | Sí, MIT                                                                                                  |
| Acceso a sitios al instalar | Todos los sitios web (`<all_urls>` obligatorio)                                                           | Ninguno. Acceso a la pestaña actual cuando inicias una captura                                           |
| Captura de página completa  | Sí, gratis y sin marca de agua                                                                            | Sí, gratis y sin marca de agua                                                                           |
| Anotación y desenfoque      | Gratis (flechas, formas, texto, resaltador, lápiz, insignias numeradas, desenfoque y pixelado)            | Gratis (formas, flechas, texto, resaltador, lápiz, números de paso, desenfoque, mosaico, relleno Sólido) |
| Exportación a PDF           | Sí, con enlaces en los que se puede hacer clic y saltos de página inteligentes; el PDF buscable es de Pro | Sí, como imagen: una página, o páginas A4 o Carta con solapamiento                                       |
| Grabación de pestañas       | No                                                                                                        | Sí, en Chrome (la versión para Firefox solo hace capturas de pantalla)                                   |
| Cuenta o nube               | La ficha dice que no hay cuenta; Pro usa una cuenta y «Send to your cloud» (enviar a tu nube)             | Sin cuenta, sin subidas                                                                                  |

La [comparativa completa](/es/compare/) añade GoFullPage a la misma tabla.

## Acceso al instalar

El manifiesto de FullPage Capture exige el permiso de host `<all_urls>`. Chrome muestra la advertencia «Read and change all your data on all websites» (leer y cambiar todos tus datos en todos los sitios web) cuando instalas una extensión con ese permiso. La ficha dice «No account, no analytics, no network requests. Files stay on your device» (sin cuenta, sin analíticas, sin solicitudes de red; los archivos se quedan en tu dispositivo), y el sitio web dice «The extension makes zero network requests» (la extensión no hace ninguna solicitud de red). No hemos probado su comportamiento de red, y esta página no afirma nada sobre él.

OpenScreenShot no exige ningún permiso de host. Usa `activeTab`, que da acceso a una pestaña en el momento en que haces clic en el icono, pulsas un atajo o eliges una captura en el menú del clic derecho. Chrome pide el permiso opcional de captura de pestañas solo la primera vez que haces clic en **Grabar**. El acceso a todos los sitios solo se solicita si activas **Grabar entre sitios**. La [sección de privacidad](/es/docs/#privacy) explica cómo las capturas se quedan en tu dispositivo.

## Lo que conservas

El flujo de trabajo es parecido. Un clic en el icono de la barra de herramientas inicia una captura de **Página completa** con el **Modo Express de un clic** por defecto, y el resultado se abre en el **Editor**. Las flechas, las formas, el texto, las insignias numeradas y el desenfoque son gratis. Guardar, copiar y exportar a PDF también es gratis, y ninguna exportación lleva marca de agua.

## Lo que cambia

Para ocultar datos, elige **Desenfocar** (`B`) y, después, el relleno **Sólido** en **Ocultación**. Sólido cubre el área por completo en la exportación. La [guía de ocultación de datos](/es/blog/redact-screenshot/) muestra cómo comprobar el archivo guardado.

El PDF funciona de otra forma. Haz clic en **Guardar imagen** para abrir el diálogo **Exportar**, elige **PDF** y selecciona **Completa** para una sola página del tamaño de la imagen, o **A4** o **Carta** con **Dividir en varias páginas**. Las páginas se solapan 5 mm para que el texto no se corte a mitad de línea. La [guía de captura a PDF](/es/blog/save-screenshot-as-pdf/) compara los diseños.

OpenScreenShot no tiene captura por lotes ni subida a la nube. Añade **Capturar elemento** para una tarjeta o una tabla, el panel **Beautify** para el relleno, las esquinas, la sombra y el fondo, y grabación de pestañas a MP4 o WebM en Chrome. También funciona en Firefox para capturas de pantalla.

## Cómo cambiar

1. Instala OpenScreenShot desde la [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) o desde [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fija el icono en la barra de herramientas, y desfija FullPage Capture si está en el mismo sitio.
3. Abre una página larga y haz clic en el icono. Revisa el resultado en el **Editor**.
4. Configura **Tras capturar** en **Ajustes**: **Editor** para anotar, **Portapapeles** para pegar la imagen al momento o **Descargar** para guardar un PNG sin abrir ninguna pestaña.
5. Configura una **Plantilla de nombre** en **Ajustes**, por ejemplo `{date}_{domain}`, para que los archivos guardados se ordenen por fecha y sitio.
6. Quita FullPage Capture desde `chrome://extensions` cuando ya no lo uses.

Para capturas anotadas en gestores de incidencias, consulta [capturas para informes de errores](/es/use-cases/bug-reports/). La [referencia de modos de captura](/es/docs/#modes) explica todos los modos. Para otras herramientas de página completa, consulta la [alternativa a GoFullPage](/es/alternatives/gofullpage/) y la [alternativa a FireShot](/es/alternatives/fireshot/).
