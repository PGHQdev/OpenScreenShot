---
title: 'Alternativa a GoFullPage: anotación gratuita y código abierto'
description: GoFullPage frente a OpenScreenShot. OpenScreenShot ofrece anotación, desenfoque, recorte y PDF dividido en páginas gratis, y su código es público.
order: 1
---

Cámbiate a OpenScreenShot si capturas páginas completas y después necesitas recortar, desenfocar, marcar o dividir un PDF en páginas: GoFullPage incluye esas funciones en su plan Premium de pago, y OpenScreenShot las incluye gratis. OpenScreenShot también tiene licencia MIT, así que puedes leer el código que se ejecuta en tus páginas. Quédate con GoFullPage si solo capturas y guardas páginas completas como imágenes o PDF sin editarlas. Su versión gratuita ya lo hace sin límite de capturas, y sus preguntas frecuentes enlazan una versión para Microsoft Edge Add-ons. OpenScreenShot no tiene ficha en Edge Add-ons, pero Edge puede instalarlo desde la Chrome Web Store. OpenScreenShot captura solo páginas web en el navegador; no captura ventanas del escritorio ni la pantalla entera.

OpenScreenShot es nuestro producto. Los datos sobre GoFullPage de esta página son del 9 de octubre de 2026 y proceden de su [ficha en la Chrome Web Store](https://chromewebstore.google.com/detail/fdpohaocaechififmbbbbbknoalclacl), sus [preguntas frecuentes](https://gofullpage.com/faq), su [página de Premium](https://gofullpage.com/premium) y su [página de complemento de Firefox](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/).

## GoFullPage y OpenScreenShot frente a frente

|                             | GoFullPage                                                                   | OpenScreenShot                                                         |
| --------------------------- | ---------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Precio                      | Gratis; Premium cuesta 12 $ al año (sin impuestos), con una prueba de 7 días | Gratis, sin plan de pago                                               |
| Código abierto              | No. Una bifurcación privada, desde 2018, de un proyecto MIT                  | Sí, MIT                                                                |
| Acceso a sitios al instalar | Ninguno. El acceso a todos los sitios es opcional                            | Ninguno. Acceso a la pestaña actual cuando inicias una captura         |
| Captura de página completa  | Sí                                                                           | Sí                                                                     |
| Anotación y desenfoque      | Solo Premium (desenfoque, texto, resaltado, recorte)                         | Gratis (formas, flechas, texto, números de paso, desenfoque, recorte)  |
| Exportación a PDF           | Gratis; la división inteligente del PDF en páginas es Premium                | Gratis, incluidas páginas A4 o Carta divididas con solapamiento        |
| Grabación de pestañas       | No                                                                           | Sí, en Chrome (la versión para Firefox solo hace capturas de pantalla) |
| Cuenta o nube               | Sin cuenta para la captura gratuita; Premium usa una cuenta                  | Sin cuenta, sin subidas                                                |
| Tiendas de navegador        | Chrome Web Store, Firefox Add-ons, Edge Add-ons                              | Chrome Web Store, Firefox Add-ons                                      |

La [comparativa completa](/es/compare/) añade FullPage Capture a la misma tabla.

## Lo que conservas

La costumbre principal no cambia. Con los ajustes por defecto, un clic en el icono de OpenScreenShot en la barra de herramientas inicia una captura de **Página completa**. Esto es el **Modo Express de un clic**. La extensión desplaza la página, une las partes en una imagen y abre el resultado en el **Editor**. Las cabeceras fijas aparecen una vez arriba, y las páginas que desplazan un elemento interno también funcionan.

Ninguna de las dos extensiones pide acceso a sitios al instalarse. OpenScreenShot usa `activeTab`, así que solo puede leer la pestaña que capturas, en el momento en que inicias la captura. Ambas guardan archivos PNG, JPEG y PDF. Ambas funcionan en Chrome y Firefox.

## Lo que cambia

Las herramientas del editor son gratis. **Recortar** (`C`) ajusta la imagen, **Desenfocar** (`B`) con el relleno **Sólido** cubre los datos privados, y **Flecha**, **Texto** y **Número de paso** marcan lo importante. **Cut** (`X`) elimina franjas horizontales de una captura larga. La [referencia de anotación](/es/docs/#annotate) enumera cada herramienta y cada atajo.

El diseño del PDF también es gratis. Haz clic en **Guardar imagen** para abrir el diálogo **Exportar**, elige **PDF** y selecciona **A4** o **Carta** con **Dividir en varias páginas**. Cada página se solapa 5 mm con la siguiente, así que el texto no se corta a mitad de línea. El botón **PDF**, junto a **Guardar imagen**, guarda un PDF con un clic. El PDF contiene la captura como imagen, así que su texto no se puede buscar ni seleccionar.

También tienes más modos de captura: **Área visible**, **Región** y **Capturar elemento**, que captura una tarjeta, una tabla o un gráfico con sus límites exactos. En Chrome, **Grabar** captura una pestaña como vídeo MP4 o WebM con zoom en cada clic. La primera grabación pide el permiso opcional de captura de pestañas.

OpenScreenShot no añade sello de fecha ni de URL. Usa la plantilla de nombre de **Ajustes** con `{date}` y `{domain}` para guardar esa información en el nombre del archivo.

## Cómo cambiar

1. Instala OpenScreenShot desde la [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) o desde [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fija el icono en la barra de herramientas. Si GoFullPage está fijado en el mismo sitio, desfíjalo para hacer clic en el icono correcto.
3. Abre una página larga y haz clic en el icono de OpenScreenShot. Revisa la parte superior, la parte inferior y cualquier cabecera fija en el **Editor**.
4. Configura **Tras capturar** en **Ajustes**. **Editor** abre cada captura para anotarla. **Descargar** guarda un PNG en tu carpeta de descargas sin abrir ninguna pestaña, algo parecido a la costumbre de capturar y guardar. **Portapapeles** copia la imagen.
5. Para marcar una imagen que guardaste con GoFullPage, suelta el archivo en el editor o pégala con `Ctrl+V` (`⌘V` en macOS).

Si un atajo de teclado no inicia una captura de OpenScreenShot, abre `chrome://extensions/shortcuts` y comprueba si otra extensión usa las mismas teclas.

Para guardar copias de páginas con nombres de archivo con fecha, consulta [guardar una copia visual de una página web](/es/use-cases/archive-web-pages/). Si quieres un PDF con enlaces en los que se puede hacer clic, compara la [alternativa a FireShot](/es/alternatives/fireshot/) y la [alternativa a FullPage Capture](/es/alternatives/fullpage-capture/).
