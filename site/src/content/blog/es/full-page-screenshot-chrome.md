---
title: Cómo hacer una captura de página completa en Chrome
description: Captura una página web entera con scroll con OpenScreenShot, revisa el resultado y expórtalo como imagen o PDF.
audience: everyday
order: 1
---

Para hacer una captura de página completa con OpenScreenShot, abre la página web y haz clic en el icono de la extensión en la barra de herramientas. Con los ajustes por defecto, la captura empieza al instante y la imagen terminada se abre en el editor. La extensión desplaza la página y une las secciones capturadas en una sola imagen.

## Captura la página paso a paso

1. Instala [OpenScreenShot desde la Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) y fija su icono en la barra de herramientas.
2. Abre la página que quieres capturar. Cierra los banners o diálogos que no quieras en la imagen.
3. Espera a que cargue el contenido que necesitas. En páginas con imágenes de carga diferida, desplázate por el contenido relevante antes de empezar.
4. Haz clic en el icono de OpenScreenShot. No cambies de pestaña mientras termina la captura.
5. Revisa la imagen en el editor, sobre todo la primera y la última sección y cualquier navegación fija.
6. Haz clic en **Guardar imagen** y elige PNG, JPEG, WebP o PDF en el diálogo **Exportar**.

Si al hacer clic en el icono se abre el selector de modos, elige **Página completa**. El ajuste **Modo Express de un clic** controla qué comportamiento obtienes. Si el editor no se abre, revisa **Tras capturar**: Portapapeles y Descargar envían el resultado directamente a su destino.

## ¿Página completa, área visible o región?

**Página completa** sirve para revisar una landing page, guardar una copia visual de un artículo o mostrar una pantalla de ajustes larga. Incluye el contenido que queda fuera del viewport actual.

**Área visible** captura lo que se ve ahora mismo, sin scroll. Úsala cuando la interfaz de alrededor aporta contexto útil pero el resto de la página no importa.

**Región** captura un rectángulo que eliges tú. Suele ser la opción más clara para un informe de error: captura el componente roto y el contenido de alrededor suficiente para identificarlo. Consulta la [referencia de modos de captura](/es/docs/#modes) para ver los controles de selección y los atajos.

## ¿Por qué falta o se repite parte de la página?

Una captura de página completa registra la página tal como se renderiza. No es una exportación de todo lo que un sitio web podría llegar a cargar. Los feeds infinitos, las listas virtualizadas, el contenido en movimiento y las áreas de scroll incrustadas pueden hacer visible esa diferencia.

OpenScreenShot gestiona las cabeceras fijas y los elementos con scroll anidados, pero una página que sustituye su contenido al desplazarse puede dar un resultado incompleto. Deja que la página se estabilice, carga la sección relevante y vuelve a intentarlo. Para un feed que crece sin fin, captura mejor la región importante. Las páginas internas del navegador y otras superficies protegidas pueden bloquear la captura desde extensiones; consulta [soporte y limitaciones conocidas](/es/support/).

## Elige una exportación que encaje con el destino

Usa PNG para texto de interfaz y diagramas cuando importa una salida sin pérdida. JPEG y WebP ofrecen control de calidad cuando el tamaño del archivo importa más. Para adjuntarla a un documento, sigue la [guía para pasar una captura a PDF](/es/blog/save-screenshot-as-pdf/).

Antes de compartir, quita la información que tu lector no necesita. La [guía para ocultar datos](/es/blog/redact-screenshot/) explica cómo tapar contenido sensible y revisar el archivo exportado. La captura y la edición en la extensión ocurren localmente; subir la captura exportada a otro sitio es una acción aparte que controlas tú.
