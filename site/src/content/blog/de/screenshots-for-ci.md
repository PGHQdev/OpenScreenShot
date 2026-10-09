---
title: Website-Screenshots für CI und Release-Reviews aufnehmen
description: Erzeuge wiederholbare PNG-Artefakte mit der OpenScreenShot-CLI und verstehe, was eine Screenshot-Aufnahme in einer Build-Pipeline prüfen kann.
audience: developers
order: 6
---

Nutze die OpenScreenShot-CLI in CI, um ein PNG einer laufenden Anwendung zur Review zu speichern. Stelle einen Chrome-kompatiblen Browser bereit, starte die Anwendung, warte, bis sie bereit ist, und nimm dann eine feste URL mit festem Viewport auf. Lade die entstandene Datei über den Artefakt-Mechanismus deines CI-Anbieters hoch.

## Die Umgebung wiederholbar machen

In einem Projekt, das schon pnpm nutzt, füge die CLI als Entwicklungsabhängigkeit hinzu und committe die daraus entstehenden Änderungen an Manifest und Lockfile:

```sh
pnpm add -D -E openscreenshot
```

Installiere die Abhängigkeiten in CI mit dem eingefrorenen Lockfile des Projekts. Das Paket nutzt `puppeteer-core` und lädt keinen Browser herunter, daher braucht der Runner zusätzlich Chrome oder Chromium. Setze `CHROME_PATH`, wenn die ausführbare Datei nicht an einem unterstützten Standardort liegt.

Halte Browserversion, Schriften, Viewport, Anwendungsdaten und Paketversion stabil, wenn du Aufnahmen vergleichst. Eine geänderte Schrift oder ein anderer Browser-Renderer kann ein Bild verändern, auch wenn sich der Anwendungscode nicht geändert hat.

## Aufnehmen, wenn die Anwendung bereit ist

Starte deinen Entwicklungs- oder Vorschauserver mit dem eigenen Befehl des Projekts. Warte, bis die Route und ihre Abhängigkeiten bereit sind, bevor du dieses Beispiel ausführst; Port 4321 ist nur ein Beispiel und muss zu deiner Anwendung passen:

```sh
mkdir -p artifacts
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/desktop.png --width 1440 --height 900
pnpm exec openscreenshot shot http://127.0.0.1:4321 --out artifacts/narrow.png --width 390 --height 844
```

Diese Befehle erzeugen Viewport-Aufnahmen. Füge `--full` für eine Review der ganzen Seite hinzu. Gib dem Artefakt-Upload-Schritt deiner CI das Verzeichnis `artifacts/`, damit Reviewer die Dateien neben einem Pull Request oder Release öffnen können.

Die CLI wartet während der Navigation auf Netzwerkruhe, doch das garantiert nicht, dass anwendungsspezifische Arbeit abgeschlossen ist. Sie hat kein konfigurierbares Warten auf Selektoren und kein eingeschleustes Setup-Skript. Nutze eine eigene, stabile Review-Route mit deterministischen Daten, wenn die normale Route Animationen, wechselnde Inhalte oder eine Anmeldung enthält.

## Ein aufgenommenes Bild ist kein bestandener visueller Test

Der Befehl kann erfolgreich beendet werden, nachdem er einen Screenshot eines Serverfehlers oder eines Ladebildschirms aufgenommen hat. Behandle das PNG als Review-Artefakt. Ein System für visuelle Regressionstests braucht außerdem eine Baseline, eine Methode zum Bildvergleich, Schwellenwerte und einen Prozess, um beabsichtigte Änderungen zu akzeptieren; die CLI von OpenScreenShot liefert diese Teile nicht.

Ein schmaler Screenshot ist eine nützliche Prüfung des responsiven Layouts, aber keine Emulation eines Mobilgeräts. Ebenso prüft ein Screenshot weder Interaktionen noch Barrierefreiheit noch API-Verhalten. Behalte die relevanten Prüfungen der Anwendung neben dem Aufnahmeschritt.

## Fehler in der Pipeline beheben

**Chrome nicht gefunden:** Prüfe, ob das Runner-Image einen Browser enthält und `CHROME_PATH` auf dessen ausführbare Datei zeigt.

**Navigation fehlgeschlagen oder Timeout:** Prüfe, ob der Server vom Aufnahmeprozess aus erreichbar ist, den erwarteten Port nutzt und bereit ist, bevor die Aufnahme startet. Die Navigation hat ein Timeout von 30 Sekunden.

**Eine unerwartete Login-Seite erscheint:** Die CLI startet eine frische Browsersitzung. Sie nutzt dein lokales Profil nicht wieder und bietet kein Einschleusen von Cookies.

**Die Ausgabedatei fehlt:** Lege das Ausgabeverzeichnis an, prüfe den Exit-Status des Befehls und kontrolliere den Artefaktpfad relativ zum Arbeitsverzeichnis der CI.

Die [Referenzanleitung zur CLI](/de/blog/screenshot-cli/) behandelt Flags und Exit-Codes. Soll ein Mensch oder ein Agent entscheiden, welche Seite als Nächstes zu prüfen ist, nutze den [MCP-Screenshot-Ablauf](/de/blog/screenshot-mcp-server/).
