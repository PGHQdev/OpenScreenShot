---
title: Cómo grabar un vídeo de demostración de producto en Chrome
description: Graba una pestaña del navegador con webcam y voz, añade zoom en cada clic, recorta la toma y exporta un MP4, todo en Chrome en tu ordenador.
order: 6
---

Para grabar una demostración breve de un producto desde una pestaña del navegador, usa **Grabar** en la extensión de OpenScreenShot para Chrome. Elige la pestaña entera o una parte, activa el micrófono, el audio de la pestaña o la webcam, y graba la demostración. Después, el editor añade un zoom en cada clic, te permite recortar la toma y exporta un MP4. La versión para Firefox solo admite capturas de pantalla y no tiene grabadora.

## Grabar una demostración paso a paso

1. Prepara la demostración en una pestaña normal del navegador: inicia sesión, carga datos de ejemplo y cierra las notificaciones. Las páginas internas del navegador no se pueden grabar.
2. Con los ajustes por defecto, un clic en el icono de la barra de herramientas hace una captura de pantalla. Haz clic derecho en el icono y desmarca **Modo Express de un clic**, para que el siguiente clic abra el menú.
3. Haz clic en **Grabar** en el menú. La pestaña de grabación se abre junto a tu página. La primera vez, Chrome pide una sola vez permiso para capturar la pestaña.
4. Activa **Mic**, **Audio** o **Webcam** según lo necesites, y acepta la solicitud de permiso de tu navegador.
5. Deja **Pestaña completa**, o arrastra sobre la imagen de tu página para grabar solo una parte.
6. Haz clic en **Empezar a grabar**. OpenScreenShot cambia a tu página. Haz la demostración a un ritmo constante, con clics deliberados.
7. Pulsa `Alt+Shift+X` para detener la grabación, o vuelve a la pestaña de grabación y haz clic en **Detener**. El editor de grabaciones se abre en la misma pestaña.
8. Ajusta los zooms, recorta el inicio y el final, y haz clic en **Exportar MP4**.

La pestaña de grabación también tiene los botones Pausar/Reanudar y Cancelar. No se añade nada a la página que grabas, así que no aparece ningún control en el vídeo.

## Zoom en los clics

El editor añade un zoom suave de 2x en cada clic que hizo tu cursor. En la línea de tiempo, puedes ajustar o eliminar cada bloque de zoom. Haz clic en **Añadir zoom** para colocar tu propio bloque a 1,5x, 2x o 3x, por ejemplo sobre un número que cambia sin un clic.

Unas ondas marcan dónde hiciste clic. El ajuste del cursor puede mostrar un puntero suave que sigue el recorrido grabado, mostrar solo los clics u ocultar el puntero.

Si la demostración pasa a otro sitio, el seguimiento de clics necesita el permiso opcional **Grabar entre sitios** en **Ajustes**. Sin él, la insignia de la barra de herramientas se vuelve ámbar, y el zoom y los efectos de clic se detienen durante el resto del vídeo. El vídeo en sí se sigue grabando.

## Webcam, voz y audio de la pestaña

La webcam se incluye en la exportación como una burbuja redonda. En el editor, colócala en cualquier esquina, cambia su tamaño u ocúltala. Controles deslizantes separados ajustan el volumen del micrófono y el de la pestaña, así que puedes mantener tu voz por encima de los sonidos del propio producto.

Graba primero una toma de prueba corta para comprobar los niveles y la posición de la burbuja.

## Recortar y enmarcar la toma

Arrastra los tiradores del inicio o del final de un segmento para recortarlo. Deshacer y rehacer funcionan en la línea de tiempo. El panel **Beautify** del panel lateral añade relleno, esquinas, una sombra y un fondo alrededor del vídeo, el mismo marco que ofrece el editor de capturas.

## Exportar el vídeo

**Exportar MP4** genera la toma con tus zooms, las pistas de audio, la burbuja de la webcam y el marco, y descarga un archivo MP4 con vídeo H.264 y audio AAC. Elige WebM en el selector junto al botón para obtener un archivo WebM. Mantén visible la pestaña del editor mientras se genera, porque la generación se pausa cuando la pestaña queda oculta.

MP4 está limitado a 4096×2304 píxeles, así que una pestaña más grande se reduce para caber. Un navegador sin grabación MP4 exporta solo WebM. El archivo recibe el nombre de tu **Plantilla de nombre** de **Ajustes**.

## Límites y almacenamiento

La grabadora captura una pestaña del navegador. No graba otras ventanas, otras aplicaciones ni tu escritorio. Una página interna del navegador o una página protegida no se puede grabar.

Las grabaciones, los registros del cursor y las señales de la webcam y del micrófono se quedan en el almacenamiento del navegador de tu dispositivo hasta que los eliminas. Activa **Eliminar la grabación tras exportar** para borrar la toma una vez guardado el archivo. No se sube nada salvo que compartas el archivo exportado.

La [referencia de grabación](/es/docs/#record) incluye todos los controles. Para imágenes fijas del mismo error o de la misma función, consulta [capturas para informes de errores](/es/use-cases/bug-reports/).
