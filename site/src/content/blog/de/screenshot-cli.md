---
title: Website-Screenshots über die Kommandozeile aufnehmen
description: Speichere PNG-Screenshots mit der OpenScreenShot-CLI mit festem Viewport, als Ganzseiten-Aufnahme oder als Binärausgabe nach stdout.
audience: developers
order: 4
---

Die OpenScreenShot-CLI nimmt eine Webseite als PNG auf und nutzt dafür einen lokal installierten Chrome-kompatiblen Browser. Sie ist ein von der Browsererweiterung getrenntes Paket. Wenn Node.js, pnpm und Chrome installiert sind, führe aus:

```sh
pnpm dlx openscreenshot shot https://example.com --out screenshot.png --full
```

Der Befehl startet einen separaten Headless-Browser, ruft die URL auf, schreibt das Bild und schließt den Browser. Er hängt sich nicht an die Tabs oder das angemeldete Profil deines alltäglichen Browsers.

## Den Viewport ausdrücklich festlegen

Für einen Viewport-Screenshot lässt du `--full` weg. Die Breite ist standardmäßig 1280 Pixel, die Höhe 800 Pixel. Setze beide, wenn ein Layout eine bestimmte Größe braucht:

```sh
pnpm dlx openscreenshot shot https://example.com --out desktop.png --width 1440 --height 900
pnpm dlx openscreenshot shot https://example.com --out narrow.png --width 390 --height 844
```

Die Breite akzeptiert Ganzzahlen von 200 bis 3840, die Höhe Ganzzahlen von 200 bis 2160. Ein schmaler Viewport testet das responsive Layout bei dieser Breite. Er emuliert weder die Touch-Eingabe noch das Pixelverhältnis oder den mobilen Browser eines Smartphones: Die CLI nutzt einen Desktop-User-Agent.

Füge `--full` hinzu, um über den Viewport hinaus aufzunehmen. Die Ganzseiten-Aufnahme des Headless-Browsers unterscheidet sich von der Scroll-und-Zusammensetzen-Methode der Erweiterung; geh nicht davon aus, dass jede dynamische Seite in beiden gleich aussieht.

## In eine Datei speichern oder nach stdout schreiben

Ohne `--out` schreibt der Befehl `screenshot.png` ins aktuelle Verzeichnis. Nutze einen ausdrücklichen Dateinamen, damit Artefakte leicht zu erkennen sind. Lege übergeordnete Ausgabeverzeichnisse an, bevor du den Befehl ausführst.

`--out -` schreibt PNG-Bytes nach stdout:

```sh
pnpm dlx openscreenshot shot https://example.com --out - > screenshot.png
```

Nutze eine binärsichere Umleitung. Die CLI erzeugt immer PNG; die Ausgabe `capture.jpg` oder `capture.pdf` zu nennen, wandelt sie nicht um. Für kommentierte Bilder oder PDF-Ausgabe nutze den [Editor der Erweiterung](/de/docs/#export).

## Häufige Fehler beheben

Wird Chrome nicht gefunden, installiere es oder setze `CHROME_PATH` auf die ausführbare Datei des Browsers. Zum Beispiel auf einem Linux-System, auf dem Chromium unter diesem Pfad installiert ist:

```sh
CHROME_PATH=/usr/bin/chromium pnpm dlx openscreenshot shot https://example.com --out screenshot.png
```

Die Navigation wartet auf `networkidle2` mit einem Timeout von 30 Sekunden. Der aktuelle Befehl hat keine Optionen für eigene Wartezeiten, Selektoren, Cookies oder Logins. Eine erfolgreiche Aufnahme beweist auch nicht, dass die Anwendung richtig geladen hat: Prüfe das PNG auf Fehlerseiten, Ladezustände und fehlende Assets.

Exit-Code 0 bedeutet, dass der Aufnahmebefehl durchgelaufen ist, 1 bedeutet einen Aufnahmefehler und 2 eine ungültige Verwendung oder ungültige Argumente nach der Prüfung. Nutze diese Codes beim Verketten von Befehlen und prüfe danach das Bild selbst.

Für wiederholbare Artefakte lies [die Anleitung zu Aufnahmen in CI](/de/blog/screenshots-for-ci/). Für einen agentengesteuerten Ablauf siehe [die Anleitung zur MCP-Einrichtung](/de/blog/screenshot-mcp-server/). Der [CLI-Quellcode](https://github.com/pghqdev/OpenScreenShot/tree/main/mcp/src) ist die Referenz für die verfügbaren Flags.
