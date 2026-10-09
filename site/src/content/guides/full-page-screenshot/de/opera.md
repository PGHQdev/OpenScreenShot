---
title: So nimmst du in Opera einen Ganzseiten-Screenshot auf
description: Das Snapshot-Tool von Opera speichert eine ganze Seite nur als PDF. Lerne Schritte und Grenzen kennen und nimm mit OpenScreenShot ein Ganzseiten-Bild auf.
order: 6
---

Das integrierte Snapshot-Tool von Opera nimmt eine Auswahl oder den sichtbaren Bereich als Bild auf, die ganze Seite aber nur als PDF. Drücke `Shift+Ctrl+5` (`Shift+Cmd+2` auf macOS) und wähle **Save page as PDF** („Seite als PDF speichern“). Für eine Ganzseiten-Bilddatei installiere OpenScreenShot. Opera ist ein Chromium-Browser und installiert die Erweiterung aus dem Chrome Web Store, nachdem du das Opera-Add-on **Install Chrome Extensions** hinzugefügt hast.

## Integrierte Methode

Opera beschreibt Snapshot auf seiner [Hilfeseite zu den Funktionen](https://help.opera.com/en/latest/features/) und seiner [Snapshot-Seite](https://www.opera.com/features/snapshot).

1. Öffne die Seite, die du aufnehmen willst.
2. Drücke `Shift+Ctrl+5` unter Windows und Linux oder `Shift+Cmd+2` auf macOS. Du kannst auch auf das Kamerasymbol rechts in der Symbolleiste klicken.
3. Wähle **Save page as PDF** („Seite als PDF speichern“). Opera speichert die ganze Seite von oben bis unten als PDF.

Snapshot hat zwei Bildoptionen. **Capture Full Screen** („Vollbild aufnehmen“) nimmt nur den sichtbaren Bereich der Seite auf, und **Capture** („Aufnehmen“) nimmt einen Rahmen auf, den du anpasst. Beide liefern ein Bild, das du mit Zoom, Pfeil, Unschärfe, Hervorheben, Stift, Selfie-Kamera, Emojis und Text markieren und dann mit **Save Image** („Bild speichern“) als PNG speichern oder in die Zwischenablage kopieren kannst.

## Grenzen

- **PDF nur für die ganze Seite.** Bildaufnahmen umfassen den sichtbaren Bereich oder eine Auswahl. Für die ganze Seite bekommst du ein PDF.
- **Nicht dokumentiertes Layout.** Opera dokumentiert nicht, ob das PDF eine lange Seite oder mehrere Seiten hat, wie es mit fixierten Kopfzeilen umgeht oder wie es eine Seite behandelt, die einen Bereich in einer Hülle mit fester Höhe scrollt. Öffne das PDF und prüfe es, bevor du es teilst.
- **Lazy Loading.** Bilder mit `loading="lazy"` laden erst, wenn du in ihre Nähe scrollst. Scrolle vor dem Speichern durch die Seite, sonst können Teile leer bleiben.
- **Infinite Scroll.** Ein Feed, der immer weiter lädt, hat kein echtes Ende. Jede Aufnahme enthält nur, was vor dem Start geladen war.

## Mit OpenScreenShot

OpenScreenShot scrollt die Seite, nimmt sie in Teilen auf und setzt die Teile zu einem Bild zusammen. Fixierte Kopfzeilen werden einmal oben aufgenommen, und Seiten, die ein inneres Element scrollen, funktionieren auch. Eine Seite, die höher als 32.000 Gerätepixel ist, wird als bis zu sechs Bilder gespeichert.

1. Füge das Add-on **Install Chrome Extensions** aus den Opera-Add-ons hinzu. Opera erklärt das in [Using add-ons from Chrome in Opera](https://blogs.opera.com/tips-and-tricks/2021/10/using-addons-from-chrome-in-opera/).
2. Öffne den [OpenScreenShot-Eintrag](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) und füge die Erweiterung hinzu.
3. Hefte das OpenScreenShot-Symbol an die Symbolleiste an.
4. Öffne die Seite und klicke auf das Symbol oder drücke `Ctrl+Shift+S` (`⌘⇧S` auf macOS). Mit den Standardeinstellungen startet eine Ganzseiten-Aufnahme, und das Ergebnis öffnet sich im Editor.
5. Prüfe den Anfang, das Ende und jede fixierte Navigation.
6. Klicke auf **Bild speichern** und wähle PNG, JPEG, WebP oder PDF, oder klicke auf **Kopieren**.

Öffnet das Symbol ein Menü, wähle **Ganze Seite**; die Einstellung **Ein-Klick-Express-Modus** steuert das. Ein PDF aus OpenScreenShot enthält den Screenshot als Bild. Es sieht also aus wie die Seite auf dem Bildschirm, aber sein Text ist nicht durchsuchbar oder markierbar. Unter **Seitenformat** erzeugt **Bildgröße** eine Seite in der Größe des Bildes, und **A4** oder **Letter** können eine lange Aufnahme auf mehrere Seiten aufteilen. Die [Anleitung für Screenshots als PDF](/de/blog/save-screenshot-as-pdf/) vergleicht diese Layouts.

## Was du nutzen solltest

- Nutze **Save page as PDF** in Snapshot für ein schnelles Ganzseiten-PDF ohne Installation.
- Nutze die Bildoptionen von Snapshot für den sichtbaren Bereich oder eine Auswahl mit ein paar Markierungen.
- Nutze OpenScreenShot für ein Ganzseiten-PNG, -JPEG oder -WebP, für Seiten, die einen inneren Bereich scrollen, oder für ein PDF, das dem Bildschirm entspricht, wie beim [Design-Review](/de/use-cases/design-review/) oder einer [gespeicherten Kopie einer Seite](/de/use-cases/archive-web-pages/).

Die [Übersicht der Aufnahmemodi](/de/docs/#modes) und die [Export-Übersicht](/de/docs/#export) listen alle Optionen auf. Die [Vivaldi-Anleitung](/de/full-page-screenshot/vivaldi/) behandelt einen weiteren Chromium-Browser mit eigenem Aufnahme-Tool. Für Seiten, die Erweiterungen blockieren, etwa Browsereinstellungen, siehe [Support und bekannte Einschränkungen](/de/support/).
