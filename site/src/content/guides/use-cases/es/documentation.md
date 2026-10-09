---
title: Cómo hacer capturas de pantalla para documentación de ayuda y tutoriales
description: Mantén las capturas de un tutorial del mismo tamaño, numera los pasos, resalta el control correcto y guarda cada archivo en una carpeta de documentación.
order: 3
---

Para documentación de ayuda y tutoriales, captura cada pantalla de la misma forma, numera las acciones y exporta todas las imágenes con el mismo ancho. En OpenScreenShot, fija un ancho exacto en píxeles en **Escala** dentro del diálogo **Exportar**, añade insignias de **Número de paso** para cada acción y usa **Spotlight** para guiar a los lectores hacia el control correcto. Una plantilla de nombre como `Docs/{title}` guarda cada imagen en una carpeta dentro de Descargas.

## Hacer una captura para un tutorial paso a paso

1. Pon la ventana del navegador al mismo tamaño en todas las capturas del artículo. Usa el mismo tema y el mismo nivel de zoom cada vez.
2. Captura la pantalla. **Región** o **Capturar elemento**, en el menú del clic derecho, limitan la imagen a la parte de la interfaz de la que trata el paso.
3. En el **Editor**, añade un **Número de paso** (`S`) en cada control, en el orden en que el lector los usa.
4. Añade **Spotlight** (`O`) sobre el área importante cuando la pantalla tiene mucho otro contenido.
5. Cubre los datos de clientes de ejemplo, las direcciones de correo reales y las claves de API con **Desenfocar** (`B`) y el relleno **Sólido**.
6. Si quieres, abre **Beautify** en la barra superior para añadir relleno, esquinas redondeadas y una sombra.
7. Haz clic en **Guardar imagen**. En el diálogo **Exportar**, elige **PNG**, escribe el ancho de tu página en **Escala**, revisa el nombre del archivo y haz clic en **Exportar**.

## Mantener todas las imágenes del mismo tamaño

Los lectores notan cuando las capturas de un artículo cambian de tamaño de un paso a otro. En **Escala**, elige 25, 50, 100 o 200 %, o escribe un ancho exacto en píxeles. Un ancho fijo hace que todas las imágenes de un artículo encajen con la columna de contenido de tu sitio de documentación.

Activa **Recordar estos ajustes** en el diálogo **Exportar** para conservar el formato y la calidad como tus nuevos valores por defecto. El ancho no forma parte de esos valores, así que vuelve a escribirlo en cada exportación. Un ancho que supera el límite del lienzo de Chrome se rechaza, así que la extensión nunca escribe un archivo vacío.

PNG mantiene nítido el texto de la interfaz porque es sin pérdida. Usa JPEG o WebP solo cuando tu plataforma de documentación limite el tamaño de los archivos.

## Numerar pasos que se mantienen en orden

Las insignias de **Número de paso** cuentan solas: el primer clic coloca el 1 y el siguiente el 2. Cuando eliminas una insignia, las demás se renumeran, así que puedes quitar un paso sin editar todos los números posteriores. Haz que los números de la imagen coincidan con la lista numerada de tu artículo.

Usa la paleta de ocho colores con las teclas `1`–`8`. El editor recuerda tu color, tu grosor de trazo y tu tamaño de letra entre sesiones, así que las capturas de un mismo artículo mantienen el mismo estilo.

## Resaltar y enmarcar

**Spotlight** mantiene iluminadas una o varias áreas y oscurece el resto. Los recortes pueden ser un rectángulo, un rectángulo redondeado o una elipse. Para una página de ajustes larga, la herramienta **Cut** (`X`) elimina las franjas horizontales que el lector no necesita, con una vista previa en directo antes de aplicarla.

El panel **Beautify**, con el mismo nombre en la [documentación](/es/docs/#annotate), añade relleno, radio de esquina, una sombra y un fondo alrededor de la captura. El marco se incluye en cada exportación y en el portapapeles. Elige un estilo y úsalo en todas las imágenes de la documentación.

## Nombrar y archivar las imágenes

Abre **Ajustes** desde el menú o desde el menú del clic derecho del icono de la barra de herramientas y edita **Plantilla de nombre**. Haz clic en un token para insertar `{date}`, `{time}`, `{title}`, `{domain}`, `{w}` o `{h}`, y revisa la vista previa en directo.

Añade `/` para guardar en una carpeta dentro de Descargas. Por ejemplo, `Docs/{title}` guarda cada imagen en una carpeta `Docs`, con el título de la página como nombre. El token `{title}` sustituye los caracteres que no admiten los nombres de archivo, así que una `/` en el título de una página no crea otra carpeta. El diálogo **Exportar** muestra el nombre del archivo antes de guardar, y puedes editarlo allí.

## Límites

Las capturas de la interfaz se quedan anticuadas cuando el producto cambia. Incluye el título de la página o la URL en el nombre del archivo para poder encontrar y sustituir las imágenes antiguas. Una captura del navegador muestra solo el contenido de la página; no incluye la barra de direcciones ni la barra de herramientas del navegador.

La [referencia de exportación](/es/docs/#export) y la [referencia de ajustes](/es/docs/#settings) enumeran todas las opciones. Para preparar una imagen para una publicación, consulta [compartir capturas en redes sociales](/es/use-cases/social-media/).
