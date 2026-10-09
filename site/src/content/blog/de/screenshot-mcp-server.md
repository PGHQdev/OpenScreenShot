---
title: Einen lokalen Screenshot-MCP-Server für einen KI-Agenten einrichten
description: Verbinde OpenScreenShot mit einem stdio-MCP-Client und fordere PNG-Screenshots mit ausdrücklicher URL, Viewport und Ganzseiten-Option an.
audience: developers
order: 5
---

OpenScreenShot bietet einen lokalen MCP-Server mit einem Tool: `capture_screenshot`. Ein MCP-Client kann es mit der URL einer Webseite aufrufen und bekommt PNG-Bildinhalt zurück. Der Server startet einen separaten Chrome-kompatiblen Headless-Browser auf deinem Gerät; die Browsererweiterung ist nicht nötig.

## Den Server zu deinem MCP-Client hinzufügen

Installiere zuerst Node.js, pnpm und einen Chrome-kompatiblen Browser. Füge einen Server-Eintrag im Konfigurationsformat deines Clients hinzu. Clients, die ein `mcpServers`-Objekt akzeptieren, können Folgendes nutzen:

```json
{
  "mcpServers": {
    "openscreenshot": {
      "command": "pnpm",
      "args": ["dlx", "openscreenshot", "serve"]
    }
  }
}
```

Der Client muss `pnpm` in seinem Suchpfad für ausführbare Dateien finden können. Starte seine MCP-Verbindungen nach dem Speichern der Konfiguration neu oder lade sie neu. Der Server nutzt stdio, der Client startet also einen lokalen Prozess; es gibt keine gehostete MCP-URL einzugeben.

Ist Chrome an einem ungewöhnlichen Ort installiert, gib `CHROME_PATH` über die Umgebungskonfiguration des Clients weiter. Nutze den vollständigen Pfad zur ausführbaren Datei und nicht den Ordner, der die Anwendung enthält.

## capture_screenshot aufrufen

Eine minimale Tool-Eingabe ist:

```json
{ "url": "https://example.com" }
```

Das ergibt eine Viewport-Aufnahme in der Standardgröße 1280 × 800. Setze Viewport und Ganzseiten-Option ausdrücklich für eine reproduzierbare Anfrage:

```json
{
  "url": "https://example.com",
  "fullPage": true,
  "width": 1440,
  "height": 900
}
```

`width` akzeptiert Ganzzahlen von 200 bis 3840 und `height` von 200 bis 2160. Das Tool gibt MCP-Bildinhalt mit dem MIME-Typ `image/png` zurück. Für dieses Tool gibt es kein Argument für einen Ausgabepfad. Ob das Ergebnis angezeigt oder gespeichert wird, hängt vom Client ab; nutze die [CLI](/de/blog/screenshot-cli/), wenn du direkt eine benannte Datei brauchst.

## Was der Agent sehen kann und was nicht

Die Aufnahme startet in einem frischen Headless-Browser. Sie übernimmt weder die Cookies noch die angemeldete Sitzung aus deinem normalen Chrome-Fenster. Eine Seite hinter einer Anmeldung kann daher einen Login-Bildschirm ergeben. Das aktuelle Tool bietet keine Login-Schritte, kein Einschleusen von Cookies, kein Warten auf Selektoren und keine interaktiven Klicks.

Bitte den Agenten, zu benennen, was im zurückgegebenen Bild tatsächlich sichtbar ist, bevor er Schlüsse zieht. Ein Screenshot hilft, Layout, Abstände und sichtbare Fehler zu prüfen; er kann nicht belegen, dass ein Formular richtig absendet oder dass die Tastaturnavigation funktioniert.

## Wohin geht der Screenshot?

Der Screenshot wird lokal erzeugt und an den MCP-Client zurückgegeben. Nutzt dieser Client ein gehostetes Modell, kann er das zurückgegebene Bild gemäß seinen eigenen Einstellungen an den Modellanbieter übertragen. Eine lokale Aufnahme heißt nicht, dass die ganze Unterhaltung mit dem Agenten auf dem Gerät bleibt.

Für automatisierte Aufnahmen mit vorhersehbaren Maßen siehe [Screenshots für CI](/de/blog/screenshots-for-ci/). Der [Agent-Skill zur Aufnahme](/skills/capture-screenshot.md) und der [Server-Quellcode](https://github.com/pghqdev/OpenScreenShot/blob/main/mcp/src/serve.ts) liefern die maschinenorientierten Anweisungen und die Tool-Definition.
