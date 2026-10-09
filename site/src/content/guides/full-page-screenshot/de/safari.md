---
title: So nimmst du in Safari einen Ganzseiten-Screenshot auf
description: Safari auf dem Mac hat keine Ganzseiten-Bildaufnahme. Speichere die Seite als PDF, nimm ein Element im Web-Inspektor auf oder nutze einen anderen Browser.
order: 4
---

Safari auf dem Mac hat keinen Befehl für Ganzseiten-Screenshots. Die nächstliegende integrierte Option ist ein PDF: Wähle **File** („Ablage“) > **Print** („Drucken“), klicke unten im Dialog auf **PDF** und speichere die Datei. Für eine Bilddatei kann der Web-Inspektor von Safari ein Element der Seite aufnehmen. OpenScreenShot hat keine Safari-Version. Safari installiert Safari-Web-Erweiterungen aus dem Mac App Store und kann keine Pakete aus dem Chrome Web Store oder von Firefox Add-ons installieren. Auf einem Mac können Chrome, Firefox, Edge und andere Browser OpenScreenShot ausführen.

## Integrierte Methode

### Die Seite als PDF speichern

Apple beschreibt diesen Weg in [Print or create a PDF of a webpage in Safari](https://support.apple.com/guide/safari/print-or-create-a-pdf-of-a-webpage-ibrw1060/18.0/mac/15.0).

1. Öffne die Seite, die du behalten willst.
2. Scrolle einmal durch die Seite, damit spät ladende Bilder geladen sind.
3. Wähle **File** („Ablage“) > **Print** („Drucken“).
4. Um die Farben der Seite zu behalten, schalte in den Druckoptionen das Drucken von Hintergrundbildern und -farben ein. Du kannst in Kopf- und Fußzeilen auch die Webadresse und das Datum hinzufügen.
5. Klicke unten im Dialog auf **PDF** und speichere die Datei.

### Ein Element im Web-Inspektor aufnehmen

1. Wähle **Safari** > **Settings** („Einstellungen“) > **Advanced** („Erweitert“) und wähle **Show features for web developers** („Funktionen für Webentwickler anzeigen“). WebKit erklärt das in [Enabling Web Inspector](https://webkit.org/web-inspector/enabling-web-inspector/).
2. Öffne die Seite und drücke `Option+Cmd+I`, um den Web-Inspektor zu öffnen.
3. Klicke im Tab **Elements** („Elemente“) mit der rechten Maustaste auf einen Knoten, zum Beispiel `<html>` oder `<body>`, und wähle **Capture Screenshot** („Bildschirmfoto aufnehmen“).
4. Safari speichert den Schnappschuss dieses Knotens in einer Datei.

Apple dokumentiert nicht, ob eine Aufnahme von `<html>` den Inhalt unterhalb des sichtbaren Teils der Seite enthält oder welches Bildformat sie schreibt. Prüfe die Datei, bevor du dich darauf verlässt.

## Grenzen

- **Kein Ganzseiten-Bild.** Keiner der beiden Wege liefert den Screenshot, den du mit einem Ganzseiten-Aufnahme-Tool bekämst. Das PDF ist eine Druckversion der Seite, und der Eintrag im Web-Inspektor nimmt einen Knoten auf.
- **Drucklayout.** Das PDF nutzt das Drucklayout, daher kann die Seite in der Datei anders aussehen als auf dem Bildschirm. Schalte Hintergrundbilder und -farben ein, wenn das Design davon abhängt.
- **Lazy Loading.** Bilder mit `loading="lazy"` laden erst, wenn du in ihre Nähe scrollst. Scrolle vor dem Drucken oder Aufnehmen durch die Seite, sonst können Teile leer bleiben.
- **Innere Scroll-Container.** Entwickler berichten, dass automatisierte Ganzseiten-Aufnahmen in WebKit, der Engine unter Safari, nur eine Bildschirmhöhe zeigen, wenn eine Seite einen Bereich in einer Hülle mit fester Höhe scrollt. Prüfe so gebaute Seiten sorgfältig.
- **Fixierte Kopfzeilen.** Prüfe das Ergebnis auf eine Kopfzeile, die fehlt, sich wiederholt oder an der falschen Stelle steht.

## Mit OpenScreenShot

OpenScreenShot ist für Safari nicht verfügbar. Hast du Chrome, Firefox, Edge, Brave, Opera, Vivaldi oder Arc auf demselben Mac, öffne die Seite dort und nutze die Erweiterung. Chrome und die anderen Chromium-Browser installieren sie aus dem [Chrome Web Store](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp). Firefox installiert sie von [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/).

1. Installiere OpenScreenShot im anderen Browser und hefte das Symbol an die Symbolleiste an.
2. Öffne die Seite und klicke auf das Symbol. In Chrome startet auch `⌘⇧S` eine Ganzseiten-Aufnahme.
3. Prüfe das Ergebnis im Editor.
4. Klicke auf **Bild speichern** und wähle PNG, JPEG, WebP oder PDF.

Die Erweiterung scrollt die Seite, setzt die Teile zu einem Bild zusammen und setzt fixierte Kopfzeilen einmal oben ein. Eine Seite, die höher als 32.000 Gerätepixel ist, wird als bis zu sechs Bilder gespeichert. Die [Chrome-Anleitung](/de/full-page-screenshot/chrome/) und die [Firefox-Anleitung](/de/full-page-screenshot/firefox/) zeigen die Schritte für jeden Browser, einschließlich der eigenen integrierten Tools.

## Was du nutzen solltest

- Nutze **File** > **Print** > **PDF** in Safari, um eine lesbare Kopie eines Artikels oder einer Belegseite zu behalten.
- Nutze **Capture Screenshot** im Web-Inspektor für ein Bild eines Teils einer Seite, etwa einer Karte oder eines Diagramms.
- Nutze OpenScreenShot in einem anderen Browser auf deinem Mac für ein Ganzseiten-Bild, das du markieren kannst, oder für ein PDF der Seite, wie sie auf dem Bildschirm aussieht. Die [Anleitung für Screenshots als PDF](/de/blog/save-screenshot-as-pdf/) vergleicht PDF-Layouts, und [eine visuelle Kopie einer Seite speichern](/de/use-cases/archive-web-pages/) behandelt Benennung und Ablage.

Für andere Fragen siehe [Support und bekannte Einschränkungen](/de/support/).
