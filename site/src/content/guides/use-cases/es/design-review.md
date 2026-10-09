---
title: Cómo capturar una página web para una revisión de diseño
description: Captura una página completa o un componente, guía a los revisores hacia los detalles con Spotlight y notas de texto, y comparte un PDF de varias páginas.
order: 2
---

Para una revisión de diseño, captura la página entera con **Página completa**, marca los puntos sobre los que quieres opiniones y comparte un PDF que los revisores puedan leer página a página. En OpenScreenShot, **Spotlight** oscurece todo lo que queda fuera del área en discusión, y **Texto** y **Flecha** añaden notas. Usa **Capturar elemento** cuando la revisión trata de un componente, como una tarjeta, un gráfico o una tabla.

## Preparar una página para la revisión paso a paso

1. Abre la página con el ancho de ventana que quieres revisar. La captura muestra el diseño con el ancho actual, así que redimensiona primero la ventana para revisar otro punto de corte.
2. Desplázate por la página una vez para que se carguen las imágenes con carga diferida, y vuelve arriba. Cierra los banners de cookies y los widgets de chat que no forman parte de la revisión.
3. Haz clic en el icono de OpenScreenShot. Con los ajustes por defecto, esto inicia una captura de **Página completa**. No cambies de pestaña hasta que se abra el editor.
4. Revisa la primera y la última sección, la cabecera y cualquier área con movimiento, como un carrusel.
5. Selecciona **Spotlight** (`O`) y arrastra sobre cada área que quieres que miren los revisores. Varios recortes se unen en una sola capa oscurecida.
6. Añade una nota de **Texto** (`T`) junto a cada área, y una **Flecha** (`A`) donde una nota tenga que señalar un detalle pequeño.
7. Haz clic en **Guardar imagen** para abrir el diálogo **Exportar**. Elige **PDF** y sigue los pasos de exportación de más abajo.

## Capturar un componente

Haz clic derecho en la página, abre el submenú **OpenScreenShot** y elige **Capturar elemento**. Pasa el cursor sobre el componente hasta que se resalte y, después, haz clic o pulsa `Enter` para capturar sus límites. Pulsa `↑` para seleccionar el elemento padre, por ejemplo la sección que contiene una tarjeta, y `←` o `→` para pasar a un elemento vecino.

Una captura de elemento da una imagen ajustada sin recortar a mano, lo que resulta útil para comparar dos versiones del mismo componente. Si el elemento no se ve entero en pantalla, el selector ofrece una captura de página completa.

## Marcar las opiniones para que los revisores puedan seguirlas

Los recortes de Spotlight pueden ser un rectángulo, un rectángulo redondeado o una elipse. Usa una imagen con Spotlight por tema: una imagen con muchas áreas iluminadas obliga a los revisores a adivinar qué nota va con qué área. Para comentarios numerados, añade un **Número de paso** (`S`) en cada punto y menciona los números en el hilo de la revisión. Los números cuentan solos y se renumeran cuando eliminas uno.

La herramienta **Forma** (`R`) dibuja un contorno alrededor de un área sin oscurecer el resto de la página. La herramienta **Flecha** ofrece puntas rellenas, abiertas, dobles y de punto, y puedes arrastrar su tirador central para curvarla alrededor de otro contenido.

## Compartir la revisión como PDF

En el diálogo **Exportar**, elige **PDF**, selecciona **A4** o **Carta** en **Tamaño de página** y activa **Dividir en varias páginas**. Las páginas consecutivas se solapan 5 mm, así que una línea de texto en un salto de página aparece en ambas páginas. Elige **Completa** en **Tamaño de página** para mantener la página en una sola página alta del PDF, para leerla en pantalla.

El PDF contiene la captura como imagen, con tus anotaciones. No tiene texto seleccionable. La [guía de captura a PDF](/es/blog/save-screenshot-as-pdf/) compara los diseños, y la [referencia de exportación](/es/docs/#export) enumera los demás formatos.

## Límites de una captura de página completa

Una captura de página completa registra la página tal como se muestra mientras la extensión la desplaza. Parte del contenido cambia durante ese desplazamiento:

- Una cabecera fija se captura en el primer fragmento y se añade una vez arriba. Comprueba que otros elementos fijos, como barras laterales o barras inferiores, aparecen donde esperas.
- Las imágenes que solo se cargan al entrar en la vista pueden aparecer como recuadros vacíos si la captura llega antes a ellas. Desplázate por la página antes de capturar.
- Los carruseles, las animaciones, los contadores en directo y los feeds infinitos pueden cambiar entre fragmentos. Detenlos, o captura solo la región importante.

Una página de más de 32.000 píxeles de dispositivo de alto se guarda en hasta seis imágenes, cada una en su propia pestaña del editor. La [guía de capturas de página completa](/es/blog/full-page-screenshot-chrome/) trata más soluciones a problemas. Para capturas que van en artículos de ayuda, consulta [capturas para documentación](/es/use-cases/documentation/).
