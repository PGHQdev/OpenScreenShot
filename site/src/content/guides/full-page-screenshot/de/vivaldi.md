---
title: So nimmst du in Vivaldi einen Ganzseiten-Screenshot auf
description: Nimm mit dem Capture-Tool von Vivaldi eine ganze Seite als PNG oder JPEG auf, kenne die 30.000-Pixel-Grenze und nutze OpenScreenShot aus dem Chrome Web Store.
order: 7
---

Vivaldi hat ein integriertes Capture-Tool. Klicke auf das Kamerasymbol in der Statusleiste, wähle **Full Page** („Ganze Seite“), wähle PNG, JPEG oder die Zwischenablage und klicke auf **Capture** („Aufnehmen“). Full-Page-Aufnahmen enden bei 30.000 Pixeln. OpenScreenShot funktioniert auch in Vivaldi: Vivaldi ist ein Chromium-Browser und installiert Erweiterungen aus dem Chrome Web Store.

## Integrierte Methode

Vivaldi beschreibt das Tool in [Capture a screenshot](https://help.vivaldi.com/desktop/tools/capture-a-screenshot/).

1. Öffne die Seite, die du aufnehmen willst.
2. Klicke auf das Kamerasymbol in der Statusleiste. Du kannst auch die Schnellbefehle mit `F2` unter Windows und Linux oder `Cmd+E` auf macOS öffnen und `Capture` tippen.
3. Wähle **Full Page** („Ganze Seite“).
4. Wähle die Ausgabe: **Save as PNG** („Als PNG speichern“), **Save as JPEG** („Als JPEG speichern“) oder **Copy to Clipboard** („In die Zwischenablage kopieren“).
5. Klicke auf **Capture** („Aufnehmen“). Gespeicherte Dateien landen in dem Ordner, der unter **Settings** („Einstellungen“) > **Webpages** („Webseiten“) > **Image Capture** („Bildaufnahme“) > **Capture Storage Folder** („Speicherordner für Aufnahmen“) eingestellt ist.

Vivaldi kann eine Aufnahme auch in eine neue Notiz im Notizen-Panel umwandeln, mit dem Aufnahmedatum und der URL der Seite.

[Die Liste der Tastenkürzel von Vivaldi](https://help.vivaldi.com/desktop/shortcuts/keyboard-shortcuts/) zeigt keine Standardtaste für die Seitenaufnahme. Um eine zu bekommen, öffne **Settings** („Einstellungen“) > **Keyboard** („Tastatur“) und lege eine Taste für **Capture Page to disk** („Seite auf Festplatte aufnehmen“) oder **Capture Page to Clipboard** („Seite in die Zwischenablage aufnehmen“) fest.

## Grenzen

- **Größe.** Full-Page-Aufnahmen reichen höchstens bis 30.000 Pixel. Auf einer längeren Seite nimmst du die Abschnitte auf, die du brauchst.
- **Nicht dokumentiertes Verhalten.** Vivaldi dokumentiert nicht, wie es das Ganzseiten-Bild erstellt oder wie es mit fixierten Kopfzeilen umgeht. Prüfe den Anfang und die Mitte des Bildes auf eine Kopfzeile, die fehlt oder sich wiederholt.
- **Lazy Loading.** Bilder mit `loading="lazy"` laden erst, wenn du in ihre Nähe scrollst. Scrolle vor der Aufnahme durch die Seite, sonst können Teile des Bildes leer bleiben.
- **Innere Scroll-Container.** Entwickler berichten, dass Ganzseiten-Aufnahmen in Chromium, Firefox und WebKit nur eine Bildschirmhöhe eines Bereichs zeigen, der in einer Hülle mit fester Höhe scrollt. Vivaldi dokumentiert sein Verhalten hier nicht, also prüfe Web-Apps und Dokumentationsseiten mit scrollendem Inhaltsbereich.
- **Anmerkungen.** Vivaldi dokumentiert keine Zeichen- oder Anmerkungswerkzeuge für Aufnahmen. Um Pfeile oder Text hinzuzufügen, öffne die Datei in einer anderen App.

## Mit OpenScreenShot

OpenScreenShot scrollt die Seite Viewport für Viewport und setzt die Teile zu einem Bild zusammen. Fixierte Kopfzeilen werden einmal oben aufgenommen, und Seiten, die ein inneres Element scrollen, funktionieren auch. Eine Seite, die höher als 32.000 Gerätepixel ist, wird als bis zu sechs Bilder gespeichert.

1. Öffne den [OpenScreenShot-Eintrag](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Vivaldi und füge die Erweiterung hinzu. Vivaldi beschreibt Installationen aus dem Chrome Web Store in seiner [Hilfe zu Erweiterungen](https://help.vivaldi.com/desktop/appearance-customization/extensions/).
2. Hefte das OpenScreenShot-Symbol an die Symbolleiste an.
3. Öffne die Seite und klicke auf das Symbol oder drücke `Ctrl+Shift+S` (`⌘⇧S` auf macOS). Mit den Standardeinstellungen startet eine Ganzseiten-Aufnahme, und das Ergebnis öffnet sich im Editor.
4. Prüfe den Anfang, das Ende und jede fixierte Navigation.
5. Klicke auf **Bild speichern** und wähle PNG, JPEG, WebP oder PDF, oder klicke auf **Kopieren**.

Öffnet das Symbol ein Menü, wähle **Ganze Seite**; die Einstellung **Ein-Klick-Express-Modus** steuert das. Der Editor fügt vor dem Export Pfeile, Text, Schrittnummern, Unschärfe und Zuschneiden hinzu. Die [Übersicht der Aufnahmemodi](/de/docs/#modes) und die [Export-Übersicht](/de/docs/#export) listen alle Optionen auf.

## Was du nutzen solltest

- Nutze das Capture-Tool von Vivaldi für ein PNG oder JPEG einer Seite unter 30.000 Pixeln, besonders wenn du die Aufnahme mit ihrer URL in einer Notiz haben willst.
- Nutze OpenScreenShot für längere Seiten, Seiten, die einen inneren Bereich scrollen, oder Aufnahmen, die du markieren oder als PDF speichern willst, wie bei [Hilfedokumenten und Tutorials](/de/use-cases/documentation/) oder beim [Design-Review](/de/use-cases/design-review/).
- Lege ein Vivaldi-Tastenkürzel fest, wenn du oft aufnimmst und keine Anmerkungen brauchst.

Die [Opera-Anleitung](/de/full-page-screenshot/opera/) und die [Brave-Anleitung](/de/full-page-screenshot/brave/) behandeln andere Chromium-Browser mit eigenen Aufnahme-Tools. Für Seiten, die Erweiterungen blockieren, etwa Browsereinstellungen, siehe [Support und bekannte Einschränkungen](/de/support/).
