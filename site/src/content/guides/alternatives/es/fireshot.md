---
title: 'Alternativa a FireShot: un editor gratuito en el navegador y de código abierto'
description: FireShot frente a OpenScreenShot. Ambos capturan páginas completas localmente. OpenScreenShot es de código abierto, con editor y grabación de pestañas gratis.
order: 4
---

Cámbiate a OpenScreenShot si quieres anotar y desenfocar capturas de página completa en el navegador de forma gratuita, en cualquier sistema operativo que ejecute Chrome o Firefox, con un código que puedes leer. Quédate con FireShot si necesitas PDF con enlaces que funcionan, capturas por lotes o automatizadas, o los extras de FireShot Pro, como la exportación avanzada a PDF y un historial de capturas. OpenScreenShot guarda un PDF como imagen, así que su texto no se puede buscar y sus enlaces no funcionan. Captura solo páginas web y no captura ventanas del escritorio ni la pantalla entera.

OpenScreenShot es nuestro producto. Los datos sobre FireShot de esta página son del 9 de octubre de 2026 y proceden de su [ficha en la Chrome Web Store](https://chromewebstore.google.com/detail/mcbpblocgmgfnpjjppndjkmgjaogfceg), su [sitio web](https://getfireshot.com/), su [página de compra](https://getfireshot.com/buy.php), su [página de complemento de Firefox](https://addons.mozilla.org/en-US/firefox/addon/fireshot/) y el manifiesto de la versión 2.1.4.18 del servidor de actualizaciones de Google.

## FireShot y OpenScreenShot frente a frente

|                             | FireShot                                                                                                          | OpenScreenShot                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Precio                      | Gratis (Lite); Pro cuesta 39,95 $ al año o 99,95 $ en un solo pago por una licencia vitalicia en dos dispositivos | Gratis, sin plan de pago                                               |
| Código abierto              | No (licencia propia)                                                                                              | Sí, MIT                                                                |
| Acceso a sitios al instalar | Ninguno en Chrome; el acceso a todos los sitios es opcional. `nativeMessaging` es obligatorio                     | Ninguno. Acceso a la pestaña actual cuando inicias una captura         |
| Captura de página completa  | Sí                                                                                                                | Sí                                                                     |
| Anotación y desenfoque      | La ficha menciona texto, flechas y desenfoque; Pro indica «Editor & smart annotations (on Windows)»               | Gratis, en el navegador                                                |
| Exportación a PDF           | Sí, con enlaces; el PDF avanzado es de Pro                                                                        | Sí, como imagen: una página, o páginas A4 o Carta con solapamiento     |
| Grabación de pestañas       | No                                                                                                                | Sí, en Chrome (la versión para Firefox solo hace capturas de pantalla) |
| Cuenta o nube               | Captura local; subidas y uso compartido opcionales                                                                | Sin cuenta, sin subidas                                                |

## Lo que conservas

Las capturas se quedan en local en ambas herramientas. El sitio de FireShot dice «100% local captures keep your work private and offline-safe» (las capturas 100 % locales mantienen tu trabajo privado y seguro sin conexión). OpenScreenShot procesa las capturas en tu navegador y no las sube. Ninguna de las dos pide acceso a todos los sitios al instalarse en Chrome.

Conservas la captura de página completa de páginas largas y la exportación a PNG, JPEG y PDF. OpenScreenShot también guarda en WebP.

## Lo que cambia

El editor se ejecuta en una pestaña del navegador, así que funciona igual en todos los sistemas operativos, y todas las herramientas son gratis. Usa **Flecha**, **Texto**, **Número de paso** y **Spotlight** para señalar detalles, y **Desenfocar** (`B`) con el relleno **Sólido** para ocultar datos privados. **Recortar** y **Cut** ajustan una captura larga. La [referencia de anotación](/es/docs/#annotate) enumera las herramientas.

El PDF funciona de otra forma. Haz clic en **Guardar imagen** para abrir el diálogo **Exportar** y elige **PDF**. **Completa** crea una sola página del tamaño de la imagen. **A4** o **Carta** con **Dividir en varias páginas** divide una captura larga con un solapamiento de 5 mm. El PDF contiene la captura como imagen, así que no tiene enlaces en los que hacer clic ni texto seleccionable. Si envías PDF en los que los lectores siguen enlaces, FireShot se adapta mejor a ese trabajo.

OpenScreenShot no tiene captura por lotes, historial de capturas ni subida por correo o a OneNote. Tiene **Capturar elemento**, el panel **Beautify** para una imagen enmarcada y grabación de pestañas en Chrome con zoom en los clics y exportación a MP4.

El manifiesto de FireShot para Chrome exige `nativeMessaging`, que permite a la extensión comunicarse con un programa instalado en tu ordenador. OpenScreenShot no usa ningún programa nativo. Chrome pide su permiso opcional de captura de pestañas solo la primera vez que haces clic en **Grabar**.

El complemento de FireShot para Firefox se actualizó por última vez el 5 de junio de 2023 y pide acceso a tus datos en todos los sitios web. La versión de OpenScreenShot para Firefox no pide acceso a ningún sitio al instalarse y solo hace capturas de pantalla.

## Cómo cambiar

1. Instala OpenScreenShot desde la [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) o desde [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fija el icono en la barra de herramientas.
3. Haz clic en el icono en una página larga. Con el **Modo Express de un clic** por defecto, esto inicia una captura de **Página completa** y abre el **Editor**.
4. Configura **Tras capturar** en **Ajustes**. Elige **Descargar** para guardar cada captura directamente en tu carpeta de descargas como PNG, o **Portapapeles** para pegarla al momento.
5. Configura una **Plantilla de nombre** con tokens como `{date}`, `{domain}` y `{title}`. Una `/` guarda en una carpeta dentro de Descargas.

Si un atajo de teclado no inicia una captura, abre `chrome://extensions/shortcuts` y comprueba si otra extensión usa las mismas teclas.

Para copias de páginas con fecha, consulta [guardar una copia visual de una página web](/es/use-cases/archive-web-pages/). Para páginas de ayuda con capturas anotadas, consulta [capturas para documentación](/es/use-cases/documentation/). La [referencia de exportación](/es/docs/#export) trata los formatos y la escala. Para otras herramientas de página completa, consulta la [alternativa a GoFullPage](/es/alternatives/gofullpage/) y la [alternativa a FullPage Capture](/es/alternatives/fullpage-capture/).
