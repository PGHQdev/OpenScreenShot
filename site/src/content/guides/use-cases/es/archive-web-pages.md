---
title: Cómo guardar una copia visual de una página web
description: Captura una página web entera como PNG o PDF, nombra los archivos por fecha y dominio, y gestiona páginas muy largas que se guardan en varias imágenes.
order: 5
---

Para guardar una copia visual de una página web, captúrala con **Página completa** y guárdala como PNG o PDF con la fecha y el sitio en el nombre del archivo. OpenScreenShot desplaza la página, une las partes en una imagen y guarda el archivo en tu ordenador. Una captura registra cómo se veía la página en tu pantalla; no prueba que la página fuera auténtica ni que no se hubiera modificado.

## Guardar una copia de una página paso a paso

1. Abre **Ajustes** desde el menú o desde el menú del clic derecho del icono de la barra de herramientas. Ajusta **Plantilla de nombre** a un patrón con `{date}` y `{domain}`, por ejemplo `Archive/{domain}/{date}_{title}`.
2. Abre la página. Desplázate por ella una vez para que se carguen las imágenes con carga diferida y los comentarios, y vuelve arriba.
3. Haz clic en el icono de OpenScreenShot. Con los ajustes por defecto, esto inicia una captura de **Página completa** y abre el resultado en el **Editor**.
4. Revisa la parte superior, la parte inferior y cualquier sección que se carga al desplazarte.
5. Haz clic en **Guardar imagen**. En el diálogo **Exportar**, elige **PNG** o **PDF**, revisa el nombre del archivo y haz clic en **Exportar**.

Para guardar sin el editor, ajusta **Tras capturar** a **Descargar** en **Ajustes**. Cada captura va entonces directamente a tu carpeta de descargas como PNG, con el nombre de tu plantilla.

## ¿PNG o PDF?

Elige **PNG** para conservar cada píxel de la captura. Es sin pérdida, así que el texto de la interfaz se mantiene nítido, y cualquier visor de imágenes puede abrirlo.

Elige **PDF** cuando la copia va a una carpeta de documentos o hay que imprimirla. En **Tamaño de página**, **Completa** crea una sola página del tamaño de la imagen. **A4** o **Carta** con **Dividir en varias páginas** divide una captura larga en páginas con un solapamiento de 5 mm. El PDF contiene la captura como imagen, así que su texto no se puede buscar ni seleccionar. La [guía de captura a PDF](/es/blog/save-screenshot-as-pdf/) compara los diseños.

## Nombrar los archivos para encontrarlos después

La plantilla de nombre acepta estos tokens:

- `{date}`: la fecha como YYYY-MM-DD, según el reloj de tu ordenador
- `{time}`: la hora como HHMMSS
- `{domain}`: el nombre de host del sitio, sin `www.`
- `{title}`: el título de la página, con los caracteres que no admiten los nombres de archivo sustituidos
- `{w}` y `{h}`: el ancho y el alto de la imagen en píxeles

Una `/` en la plantilla guarda en una carpeta dentro de Descargas, así que `Archive/{domain}/{date}_{title}` ordena las copias por sitio y después por fecha. La vista previa en directo de **Ajustes** muestra el resultado antes de capturar.

## Páginas muy largas

Una imagen admite una página de hasta 32.000 píxeles de dispositivo de alto. Una página más alta se guarda en hasta seis imágenes. Con **Descargar**, cada parte recibe el nombre de tu plantilla y un sufijo como `_part1of3`. Con **Editor** o **Portapapeles**, cada parte se abre en su propia pestaña del editor, donde la exportas por separado.

Una página demasiado alta para seis imágenes se rechaza con un error. En ese caso, captura las secciones que necesitas con **Área visible** o **Región**. La [guía de capturas de página completa](/es/blog/full-page-screenshot-chrome/) trata otros casos, como las áreas de desplazamiento anidadas y las cabeceras fijas.

## Qué puede mostrar una captura y qué no

Una captura es un registro visual de lo que tu navegador mostraba en un momento dado. No tiene firma ni comprobación contra manipulaciones, y cualquiera puede editar un archivo de imagen. El token `{date}` procede del reloj de tu ordenador en el momento de nombrar el archivo. Cuando necesites una prueba de que una página existía de cierta forma, usa un servicio creado para ese fin y guarda la captura como referencia personal.

Una captura de página completa tampoco incluye el contenido que la página nunca llegó a mostrar: secciones contraídas, otras pestañas de una página, feeds infinitos más allá del punto hasta el que te desplazaste y contenido tras un inicio de sesión que no abriste.

## Dónde se guardan las copias

OpenScreenShot procesa las capturas en tu navegador y las guarda en el almacenamiento local de tu dispositivo. No las sube a ningún servidor. Los archivos exportados van a tu carpeta de descargas. Se quedan en tu ordenador hasta que los compartes o los subes, y el servicio al que los subes tiene sus propias normas de almacenamiento. Consulta la [política de privacidad](/es/privacy/) para más detalles.

La [referencia de ajustes](/es/docs/#settings) explica la plantilla de nombre. Para marcar una captura para tus compañeros, consulta [capturar una página para una revisión de diseño](/es/use-cases/design-review/).
