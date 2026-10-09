---
title: 'So nimmst du in Chrome einen Ganzseiten-Screenshot auf: DevTools oder Erweiterung'
description: Nutze den Befehl Capture full size screenshot in den Chrome DevTools, kenne seine Grenzen und vergleiche ihn mit einer Ganzseiten-Aufnahme in OpenScreenShot.
order: 1
---

Chrome kann ohne Erweiterung einen Ganzseiten-Screenshot aufnehmen, aber nur über die DevTools. Öffne die DevTools, öffne das Befehlsmenü, tippe `screenshot` und führe **Capture full size screenshot** aus. Chrome speichert die ganze Seite als PNG-Datei. Die normalen Chrome-Menüs haben keinen Screenshot-Eintrag: Die Hilfe von Google listet unter **Cast, save, and share** („Streamen, speichern und teilen“) nur Teilen, An deine Geräte senden und QR-Code erstellen auf. Für eine Aufnahme, die du markieren, als PDF exportieren oder auf einer Seite machen kannst, die in einem Bereich scrollt, installiere OpenScreenShot und klicke auf das Symbol.

## Integrierte Methode

1. Öffne die Seite, die du aufnehmen willst.
2. [Öffne die DevTools](https://developer.chrome.com/docs/devtools/open): Drücke `F12` oder `Ctrl+Shift+I` unter Windows und Linux oder `Cmd+Option+I` auf macOS.
3. Öffne das [Befehlsmenü](https://developer.chrome.com/docs/devtools/command-menu): Drücke `Ctrl+Shift+P` oder `Cmd+Shift+P` auf macOS.
4. Tippe `screenshot` und wähle **Capture full size screenshot**.
5. Chrome speichert eine PNG-Datei der ganzen Seite.

Dieselbe Aufnahme gibt es im Gerätemodus. Schalte die Gerätesymbolleiste ein, öffne ihr Menü **More options** („Weitere Optionen“) und wähle den Eintrag für den Screenshot in voller Größe. Die [Dokumentation zum Gerätemodus](https://developer.chrome.com/docs/devtools/device-mode) von Google nennt ihn **Capture a full size screenshot**.

Für den ganzen Ablauf gibt es kein einzelnes Tastenkürzel. Google dokumentiert keine Anmerkungswerkzeuge für die Aufnahme, also entstehen Pfeile, Text und Schwärzung in einer anderen App.

## Grenzen

- **Die DevTools müssen geöffnet sein.** Der Befehl steht nur im Befehlsmenü und im Menü des Gerätemodus.
- **Seitengröße.** Chromium lehnt eine Seite ab, die 131.072 CSS-Pixel oder mehr breit oder hoch ist, mit dem Fehler „Page is too large.“
- **Fixierte und feste Elemente.** Für die Aufnahme ändert Chromium die Größe der Ansicht auf die volle Seitengröße und blendet die Scrollleisten aus. Abschnitte mit Fensterhöhe (`100vh`) und fixierte Kopf- oder Fußzeilen können sich dann an dieser hohen Ansicht ausrichten. Eine fixierte Fußzeile kann einmal am unteren Ende des Bildes erscheinen, und ein Hero-Bereich mit voller Höhe kann sich strecken.
- **Lazy Loading.** Bilder und Frames mit `loading="lazy"` laden erst, wenn du in ihre Nähe scrollst. Scrolle durch die Seite, bevor du den Befehl ausführst, sonst können Teile des Bildes leer bleiben.
- **Innere Scroll-Container.** Chromium bemisst die Aufnahme nach der eigenen Scrollgröße der Seite. Scrollt eine Seite einen Bereich in einer Hülle mit fester Höhe, zum Beispiel eine Web-App oder eine Dokumentationsseite mit scrollendem Inhaltsbereich, zeigt die Aufnahme nur eine Bildschirmhöhe dieses Bereichs.

## Mit OpenScreenShot

OpenScreenShot scrollt die Seite Viewport für Viewport, nimmt jeden Teil auf und setzt die Teile zu einem Bild zusammen. Fixierte Kopfzeilen nimmt es auf dem ersten Teil auf und setzt sie einmal oben ein. Seiten, die ein inneres Element statt des Fensters scrollen, funktionieren auch. Eine Seite, die höher als 32.000 Gerätepixel ist, wird als bis zu sechs Bilder gespeichert.

1. Installiere [OpenScreenShot aus dem Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) und hefte das Symbol an die Symbolleiste an.
2. Öffne die Seite und klicke auf das Symbol oder drücke `Ctrl+Shift+S` (`⌘⇧S` auf macOS).
3. Prüfe das Ergebnis im Editor, besonders den Anfang, das Ende und jede fixierte Navigation.
4. Klicke auf **Bild speichern** und wähle PNG, JPEG, WebP oder PDF. **Kopieren** und **PDF** daneben erledigen es mit einem Klick.

Öffnet sich statt einer Aufnahme ein Menü, wähle **Ganze Seite**. Die Einstellung **Ein-Klick-Express-Modus** steuert das. Die [Anleitung für Ganzseiten-Screenshots in Chrome](/de/blog/full-page-screenshot-chrome/) führt Schritt für Schritt durch die Erweiterung, auch bei fehlenden oder wiederholten Abschnitten. Die [Übersicht der Aufnahmemodi](/de/docs/#modes) und die [Export-Übersicht](/de/docs/#export) listen alle Optionen auf.

## DevTools und OpenScreenShot im Vergleich

- **Start:** Die DevTools brauchen zwei Tastenkürzel und einen getippten Befehl. OpenScreenShot braucht einen Klick oder ein Tastenkürzel.
- **Ergebnis:** Die DevTools speichern ein PNG. OpenScreenShot exportiert PNG, JPEG, WebP oder PDF oder kopiert das Bild.
- **Bearbeitung:** Die DevTools haben keine. OpenScreenShot öffnet einen Editor mit Pfeilen, Text, Schrittnummern, Unschärfe und Zuschneiden.
- **Installation:** Die DevTools sind schon in Chrome enthalten. OpenScreenShot ist eine MIT-lizenzierte Erweiterung, die Aufnahmen lokal verarbeitet.

## Was du nutzen solltest

- Nutze die DevTools für ein einmaliges PNG einer normalen Seite auf einem Computer, auf dem du keine Erweiterungen hinzufügen kannst.
- Nutze OpenScreenShot für Seiten, die einen inneren Bereich scrollen, Seiten mit fixierten Kopfzeilen und Aufnahmen, die du vor dem Teilen markieren willst, wie bei [Fehlerberichten](/de/use-cases/bug-reports/) oder beim [Design-Review](/de/use-cases/design-review/).
- Beide funktionieren auch in Microsoft Edge; die [Edge-Anleitung](/de/full-page-screenshot/edge/) behandelt das eigene Screenshot-Tool von Edge.

Schlägt eine Aufnahme auf einer Browserseite wie `chrome://settings` fehl, siehe [Support und bekannte Einschränkungen](/de/support/).
