---
title: 'Alternativa a Lightshot: captura de página completa sin subidas públicas'
description: Lightshot frente a OpenScreenShot. Página completa, desenfoque y PDF en el navegador, con archivos en tu dispositivo y sin enlaces de prnt.sc.
order: 6
---

Cámbiate a OpenScreenShot si haces capturas de páginas web en Chrome o Firefox y quieres captura de página completa, desenfoque y exportación a PDF, con archivos que se quedan en tu dispositivo. Quédate con Lightshot si capturas otras aplicaciones o todo el escritorio: Lightshot tiene aplicaciones de escritorio para Windows y Mac, y OpenScreenShot captura solo páginas web en el navegador. Quédate también si dependes de sus enlaces cortos instantáneos. OpenScreenShot no tiene servicio de subida, así que compartes una captura pegándola o adjuntando el archivo.

OpenScreenShot es nuestro producto. Los datos sobre Lightshot de esta página son del 9 de octubre de 2026 y proceden de su [ficha en la Chrome Web Store](https://chromewebstore.google.com/detail/mbniclmhobmnbdlbpiphghaielnnpgdp), su [sitio web](https://app.prntscr.com/en/index.html), su [página de complemento de Firefox](https://addons.mozilla.org/firefox/addon/lightshot/) y el manifiesto de la versión 7.0.1 del servidor de actualizaciones de Google.

## Lightshot y OpenScreenShot frente a frente

|                             | Lightshot                                                                                | OpenScreenShot                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Precio                      | Gratis                                                                                   | Gratis                                                                 |
| Código abierto              | No (licencia propia)                                                                     | Sí, MIT                                                                |
| Acceso a sitios al instalar | Todos los sitios web (`*://*/*` obligatorio)                                             | Ninguno. Acceso a la pestaña actual cuando inicias una captura         |
| Captura de página completa  | No; la ficha describe la selección de un área                                            | Sí                                                                     |
| Anotación y desenfoque      | Edición en el sitio                                                                      | Formas, flechas, texto, números de paso, desenfoque, recorte           |
| Exportación a PDF           | No                                                                                       | Sí                                                                     |
| Grabación de pestañas       | No                                                                                       | Sí, en Chrome (la versión para Firefox solo hace capturas de pantalla) |
| Cuenta o nube               | Subida opcional a prnt.sc para obtener un enlace corto; también permite guardar en disco | Sin cuenta, sin subidas                                                |
| Captura del escritorio      | Sí, con las aplicaciones para Windows y Mac                                              | No                                                                     |

La extensión de Lightshot para Chrome se actualizó por última vez el 23 de julio de 2024.

## Subidas y enlaces para compartir

Lightshot puede subir una captura a prnt.sc y darte un enlace corto. No hace falta ninguna cuenta para ver una subida. En 2021, [Kaspersky informó](https://www.kaspersky.com/blog/cryptoscam-in-lightshot/39224/) de que las URL eran secuenciales, así que cambiar un carácter podía abrir otra imagen, y de que «Anyone can see published screenshots without authentication» (cualquiera puede ver las capturas publicadas sin autenticarse). [AIN.UA informó](https://en.ain.ua/2021/09/08/lightshot-allows-people-to-view-screenshots-of-other-users) del mismo problema ese año. No hemos comprobado si esto sigue ocurriendo en 2026.

OpenScreenShot no tiene ningún paso de subida. Procesa y guarda las capturas en tu navegador, y un archivo exportado va a tu carpeta de descargas. Nadie ve una captura hasta que la pegas o la adjuntas en algún sitio. La [sección de privacidad](/es/docs/#privacy) tiene los detalles.

## Lo que conservas

La captura rápida de una región se mantiene. Pulsa `Ctrl+Shift+E` (`⌘⇧E` en macOS) o haz clic derecho en la página y elige **Región**; después, arrastra un rectángulo y pulsa `Enter`. El editor se abre con flechas, texto, formas y un resaltador. **Copiar** pone la imagen en el portapapeles, lista para pegarla en un chat.

Para saltarte el editor, ajusta **Tras capturar** a **Portapapeles**. Cada captura va entonces directamente al portapapeles, algo parecido a la costumbre de capturar y pegar.

## Lo que cambia

Puedes capturar más partes de una página. **Página completa** desplaza la página entera y la une en una imagen. **Capturar elemento** captura una tarjeta, una tabla o un gráfico con sus límites exactos. **Área visible** captura lo que se ve en pantalla en la pestaña.

El editor añade **Desenfocar** (`B`) con un desenfoque suave, un mosaico o el relleno **Sólido**, que cubre por completo los datos privados. Las insignias de **Número de paso** cuentan solas. Haz clic en **Guardar imagen** para abrir el diálogo **Exportar** y guardar en PNG, JPEG, WebP o PDF.

El acceso al instalar es menor. OpenScreenShot usa `activeTab` para una pestaña cada vez, y no puede capturar las páginas de ajustes del navegador, las páginas de extensiones ni nada fuera del navegador. Para una aplicación de escritorio u otra ventana de programa, sigues necesitando una herramienta de escritorio.

## Cómo cambiar

1. Instala OpenScreenShot desde la [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) o desde [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).
2. Fija el icono en la barra de herramientas.
3. Prueba una primera captura. Un clic en el icono inicia una captura de **Página completa** con el **Modo Express de un clic** por defecto. Para un área, usa `Ctrl+Shift+E` o el menú del clic derecho.
4. Configura **Tras capturar** en **Ajustes**: **Portapapeles** para pegar al momento, **Editor** para anotar o **Descargar** para guardar un PNG.
5. Si mantienes una aplicación de capturas de escritorio para otros programas, comprueba que no usa las mismas teclas que OpenScreenShot. En Chrome, puedes cambiar las teclas de la extensión en `chrome://extensions/shortcuts`.

Para imágenes rápidas en respuestas de soporte, consulta [capturas para atención al cliente](/es/use-cases/customer-support/). Para publicaciones, consulta [capturas para redes sociales](/es/use-cases/social-media/). Si necesitas capturar el escritorio, consulta la página de la [alternativa a Snagit](/es/alternatives/snagit/) para ver lo que cubre una herramienta de escritorio.
