---
title: Cómo usar capturas de pantalla para responder tickets de soporte
description: Copia una captura directamente en la respuesta a un ticket, numera los pasos, oculta los datos del cliente y marca una imagen que te envió un cliente.
order: 7
---

Para responder un ticket de soporte con una captura, captura la pantalla que el cliente necesita ver, numera los pasos que debe seguir, oculta los datos del cliente y pega la imagen en tu respuesta. En OpenScreenShot, la acción **Portapapeles** copia una captura sin abrir el editor, y las insignias de **Número de paso** muestran el orden de los clics. Para marcar una captura que te envió un cliente, pégala o suéltala en el **Editor**.

## Responder con una captura anotada paso a paso

1. Abre la pantalla de tu producto que responde a la pregunta, por ejemplo una página de ajustes.
2. Haz clic derecho en la página, abre el submenú **OpenScreenShot** y elige **Región** o **Capturar elemento**. Deja suficiente interfaz para que el cliente encuentre el mismo sitio.
3. En el **Editor**, añade un **Número de paso** (`S`) en cada control, en el orden en que el cliente hace clic en ellos.
4. Selecciona **Desenfocar** (`B`), elige **Sólido** en **Ocultación** y cubre los nombres, las direcciones de correo, los números de pedido y los ID de cuenta.
5. Haz clic en **Copiar**, o pulsa `Ctrl+C` (`⌘C` en macOS).
6. Pega la imagen en la respuesta al ticket y escribe los mismos pasos como lista numerada debajo.

Los pasos escritos ayudan a los clientes que usan un lector de pantalla o que leen la respuesta en un cliente de correo que bloquea las imágenes.

## Copiar sin el editor

Para una respuesta rápida que no necesita marcas, ajusta **Tras capturar** a **Portapapeles** en el menú o en **Ajustes**. Cada captura va entonces directamente al portapapeles, y la insignia de la barra de herramientas lo confirma. Pégala en la respuesta con `Ctrl+V` o `⌘V`.

El ajuste se aplica a los botones del menú, a los atajos de teclado y al menú del clic derecho. Vuelve a **Editor** cuando la captura muestre datos del cliente que debes ocultar antes. **Reabrir última**, en el pie del menú, abre la captura más reciente en el editor en cualquier momento.

## Numerar los pasos

Las insignias de **Número de paso** cuentan solas: el primer clic coloca el 1 y el siguiente el 2. Cuando eliminas una insignia, las demás se renumeran. Mantén los números de la imagen iguales a los números de tu respuesta escrita.

Añade una **Flecha** (`A`) cuando un control sea pequeño o difícil de encontrar, y una nota breve de **Texto** (`T`) cuando un paso necesite un valor, como la opción que hay que seleccionar. **Spotlight** (`O`) oscurece el resto de la pantalla cuando la página está muy cargada.

## Ocultar los datos del cliente

Tus propias vistas de administración suelen mostrar datos de otros clientes: nombres en una lista, direcciones de correo, datos de pago y notas internas. Revisa la imagen entera, bordes incluidos, antes de enviarla.

Un desenfoque suave o un mosaico pueden dejar pistas sobre un texto corto. **Sólido** cubre el área por completo en la exportación. Cubre cada elemento con un pequeño margen alrededor de los caracteres visibles. La [guía de ocultación de datos](/es/blog/redact-screenshot/) explica cómo comprobar el resultado.

## Marcar una captura que te envió un cliente

Los clientes suelen enviar una captura del problema. Para señalar el detalle que se les pasó:

1. Copia la imagen del cliente o guárdala en tu ordenador.
2. Abre una pestaña del editor. Si no hay ninguna abierta, captura cualquier página con **Área visible**; la importación sustituye esa captura.
3. Pulsa `Ctrl+V` o `⌘V` fuera de un campo de texto para pegar la imagen, o suelta el archivo de imagen en el editor.
4. Añade flechas, números de paso o texto, y oculta todo lo que el cliente no quería compartir.
5. Haz clic en **Copiar** y pega la imagen marcada en tu respuesta.

La barra superior indica **Importada**, y todas las herramientas, el marco y todos los formatos de exportación funcionan con la imagen. Una importación sustituye el lienzo, así que el editor pregunta antes cuando la imagen actual tiene anotaciones.

## Límites

La extensión captura solo el contenido de la página. La imagen no muestra la barra de direcciones, así que escribe la URL en tu respuesta cuando el cliente necesite abrir una página concreta. Las páginas internas del navegador y otras páginas protegidas bloquean la captura; consulta [soporte y limitaciones conocidas](/es/support/).

Las capturas y las ediciones se quedan en tu ordenador. La herramienta de soporte en la que pegas la imagen la guarda según sus propias normas. La [referencia de anotación](/es/docs/#annotate) enumera cada herramienta. Para capturas que van a tu equipo de desarrollo, consulta [capturas para informes de errores](/es/use-cases/bug-reports/).
