---
title: So nimmst du in Firefox einen Ganzseiten-Screenshot auf
description: Nimm eine ganze Seite mit dem Screenshot-Tool von Firefox oder dem Befehl :screenshot auf, prüfe die Größengrenzen und nutze das Add-on OpenScreenShot.
order: 3
---

Firefox hat ein integriertes Screenshot-Tool. Drücke `Ctrl+Shift+S` (`Cmd+Shift+S` auf macOS), wähle **Save full page** („Ganze Seite speichern“) und dann **Download**, um ein PNG zu speichern, oder **Copy** („Kopieren“), um das Bild in die Zwischenablage zu legen. Das Add-on OpenScreenShot für Firefox ergänzt einen Editor für Pfeile, Text und Schwärzung und exportiert als PNG, JPEG, WebP oder PDF.

## Integrierte Methode

Mozilla beschreibt das Tool in [Take screenshots in Firefox](https://support.mozilla.org/en-US/kb/take-screenshots-firefox).

1. Öffne die Seite, die du aufnehmen willst.
2. Drücke `Ctrl+Shift+S` unter Windows und Linux oder `Cmd+Shift+S` auf macOS. Du kannst auch mit der rechten Maustaste auf eine leere Stelle der Seite klicken und **Take Screenshot** („Bildschirmfoto aufnehmen“) wählen.
3. Wähle oben rechts **Save full page** („Ganze Seite speichern“).
4. Wähle in der Vorschau **Download**, um ein PNG in deinem Firefox-Download-Ordner zu speichern, oder wähle **Copy** („Kopieren“).

Die Vorschau bietet **Copy** und **Download**. Um Pfeile oder Text hinzuzufügen, öffne das PNG in einer anderen App.

Die Firefox-DevTools bieten einen zweiten Weg. Öffne die Web-Konsole und tippe `:screenshot --fullpage`, dann speichert Firefox ein PNG der ganzen Seite. Du kannst auch in den DevTools-Einstellungen unter **Available Toolbox Buttons** („Verfügbare Werkzeugkasten-Schaltflächen“) die Schaltfläche **Take a screenshot of the entire page** („Bildschirmfoto der ganzen Seite aufnehmen“) einschalten. Mozilla dokumentiert beides in seiner [DevTools-Anleitung zu Screenshots](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html).

## Grenzen

- **Größe.** Firefox beschneidet eine Aufnahme, die an einer Seite größer als 32.766 Pixel oder in der Fläche größer als 472.907.776 Pixel ist, und zeigt „Your screenshot was cropped because it was too large.“ Die Fehlermeldung von Firefox für eine zu große Aufnahme nennt andere Zahlen: kleiner als 32.700 Pixel an der längsten Seite oder 124.900.000 Pixel Gesamtfläche.
- **Anzeigeskalierung.** Firefox zählt diese Grenzen in Gerätepixeln: Seitenbreite und -höhe mal Pixelverhältnis des Displays. Auf einem 2x-Display liegt die Grenze für die Seitenhöhe in CSS-Pixeln bei der Hälfte, etwa 16.383.
- **Innere Scroll-Container.** Firefox nimmt die Grenzen der ganzen Seite aus Scrollbreite und Scrollhöhe des Fensters. Scrollt eine Seite einen Bereich in einer Hülle mit fester Höhe, dehnt sich der Inhalt in diesem Bereich nicht aus, und die Aufnahme zeigt nur eine Bildschirmhöhe davon.
- **Lazy Loading.** Bilder mit `loading="lazy"` laden erst, wenn du in ihre Nähe scrollst. Scrolle vor der Aufnahme durch die Seite, sonst können Teile des Bildes leer bleiben.
- **Infinite Scroll.** Ein Feed, der beim Scrollen mehr lädt, hat kein echtes Ende. Die Aufnahme enthält nur, was vor dem Start geladen war.
- **Fixierte Kopfzeilen.** Prüfe vor dem Teilen den Anfang und die Mitte des Bildes auf eine Kopfzeile, die fehlt, sich wiederholt oder an der falschen Stelle steht.

## Mit OpenScreenShot

Die Firefox-Version von OpenScreenShot nimmt nur Screenshots auf. Tab-Aufnahmen gibt es in der Chrome-Version. Ihr Ganzseiten-Modus scrollt die Seite, nimmt sie in Teilen auf und setzt die Teile zu einem Bild zusammen, mit fixierten Kopfzeilen einmal oben. Seiten, die ein inneres Element statt des Fensters scrollen, funktionieren auch.

1. Installiere [OpenScreenShot aus Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/) und hefte das Symbol an die Symbolleiste an.
2. Öffne die Seite und scrolle einmal durch, damit Bilder mit Lazy Loading laden, und kehre dann zum Anfang zurück.
3. Klicke auf das OpenScreenShot-Symbol und wähle **Ganze Seite**, falls sich das Modusmenü öffnet.
4. Prüfe das Ergebnis im Editor, besonders den Anfang, das Ende und jede fixierte Navigation.
5. Klicke auf **Bild speichern** und wähle PNG, JPEG, WebP oder PDF, oder klicke auf **Kopieren**.

Firefox nutzt `Ctrl+Shift+S` für sein eigenes Screenshot-Tool, klicke also auf das Symbol in der Symbolleiste, wenn du OpenScreenShot willst. Die [Übersicht der Aufnahmemodi](/de/docs/#modes) beschreibt jeden Modus, und die [Export-Übersicht](/de/docs/#export) behandelt Formate und Skalierung.

## Was du nutzen solltest

- Nutze das Screenshot-Tool von Firefox für ein schnelles PNG einer Seite, die das ganze Fenster scrollt und in die Größengrenze passt.
- Nutze den Befehl `:screenshot --fullpage`, wenn du ohnehin in der Web-Konsole arbeitest.
- Nutze OpenScreenShot für Seiten, die einen inneren Bereich scrollen, und für Aufnahmen, die du markieren oder als PDF speichern willst, wie bei [Fehlerberichten](/de/use-cases/bug-reports/) oder einer [gespeicherten Kopie einer Seite](/de/use-cases/archive-web-pages/).

Die [Chrome-Anleitung](/de/full-page-screenshot/chrome/) und die [Edge-Anleitung](/de/full-page-screenshot/edge/) behandeln dieselbe Aufgabe in Chromium-Browsern, in denen OpenScreenShot auch Tabs aufnehmen kann. Für Seiten, die Erweiterungen blockieren, etwa die Firefox-Einstellungen, siehe [Support und bekannte Einschränkungen](/de/support/).
