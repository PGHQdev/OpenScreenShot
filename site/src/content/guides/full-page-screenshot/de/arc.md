---
title: So nimmst du in Arc einen Ganzseiten-Screenshot auf
description: Nutze den Arc-Befehl Capture Full Page auf macOS für ein PNG, kenne die Lücken in Arcs Dokumentation und nutze OpenScreenShot aus dem Chrome Web Store.
order: 8
---

Arc für macOS hat einen Befehl **Capture Full Page**. Drücke `Cmd+T`, um die Command Bar zu öffnen, tippe `Capture Full Page` und wähle den Befehl aus. Arc lädt ein PNG der ganzen Seite in deinen Standard-Download-Ordner herunter. Die Arc-Hilfe dokumentiert diesen Befehl nur für macOS. OpenScreenShot funktioniert auch in Arc: Arc ist ein Chromium-Browser und installiert Erweiterungen aus dem Chrome Web Store.

## Integrierte Methode

Arc beschreibt den Befehl in [How to take full page screen captures in Arc](https://resources.arc.net/hc/en-us/articles/25481392111895-How-To-Take-Full-Page-Screen-Captures-in-Arc).

1. Öffne die Seite, die du aufnehmen willst.
2. Drücke `Cmd+T`, um die Command Bar zu öffnen, tippe `Capture Full Page` und wähle den Befehl aus. Du kannst auch **File** > **Capture Full Page** wählen.
3. Arc lädt ein PNG in deinen Standard-Download-Ordner herunter.

Der Befehl hat kein Standard-Tastenkürzel. Um eines hinzuzufügen, öffne **Arc** > **Settings** > **Shortcuts**, suche nach `capture` und lege eine Taste für **Capture Full Page** fest.

Für einen gestalteten Screenshot schalte den [Developer Mode](https://resources.arc.net/hc/en-us/articles/20468488031511-Developer-Mode-Instant-Dev-Tools) ein und nutze die Screenshot-Schaltfläche in der Symbolleiste, oder führe **Capture in Portrait Mode** aus der Command Bar aus. Das separate Capture-Tool von Arc nimmt eine Auswahl mit Bearbeitung und Easels auf und ist ebenfalls nur für macOS verfügbar.

## Grenzen

- **Nur macOS.** Arc dokumentiert keinen Ganzseiten-Befehl für Arc unter Windows.
- **Nicht dokumentiertes Verhalten.** Arc dokumentiert nicht, wie es das Bild erstellt, wo die Größengrenze liegt und wie es mit fixierten Kopfzeilen umgeht. Prüfe den Anfang und die Mitte des PNG auf eine Kopfzeile, die fehlt oder sich wiederholt.
- **Anmerkungen.** Arc dokumentiert keine Bearbeitung für Ganzseiten-Aufnahmen. Um Pfeile oder Text hinzuzufügen, öffne das PNG in einer anderen App.
- **Lazy Loading.** Bilder mit `loading="lazy"` laden erst, wenn du in ihre Nähe scrollst. Scrolle vor der Aufnahme durch die Seite, sonst können Teile des Bildes leer bleiben.
- **Innere Scroll-Container.** Entwickler berichten, dass Ganzseiten-Aufnahmen in Chromium, Firefox und WebKit nur eine Bildschirmhöhe eines Bereichs zeigen, der in einer Hülle mit fester Höhe scrollt. Prüfe Web-Apps und Dokumentationsseiten mit scrollendem Inhaltsbereich.
- **Infinite Scroll.** Ein Feed, der immer weiter lädt, hat kein echtes Ende. Die Aufnahme enthält nur, was vor dem Start geladen war.

## Mit OpenScreenShot

OpenScreenShot scrollt die Seite Viewport für Viewport und setzt die Teile zu einem Bild zusammen. Fixierte Kopfzeilen werden einmal oben aufgenommen, und Seiten, die ein inneres Element scrollen, funktionieren auch. Eine Seite, die höher als 32.000 Gerätepixel ist, wird als bis zu sechs Bilder gespeichert.

1. Öffne den [OpenScreenShot-Eintrag](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Arc und füge die Erweiterung hinzu. Arc beschreibt Installationen aus dem Chrome Web Store in [Extensions in Arc](https://resources.arc.net/hc/en-us/articles/19434259167767-Extensions-in-Arc-How-to-Import-Add-Open).
2. Hefte das OpenScreenShot-Symbol an.
3. Öffne die Seite und klicke auf das Symbol oder drücke `⌘⇧S`. Mit den Standardeinstellungen startet eine Ganzseiten-Aufnahme, und das Ergebnis öffnet sich im Editor.
4. Prüfe den Anfang, das Ende und jede fixierte Navigation.
5. Klicke auf **Bild speichern** und wähle PNG, JPEG, WebP oder PDF, oder klicke auf **Kopieren**.

Öffnet das Symbol ein Menü, wähle **Ganze Seite**; die Einstellung **Ein-Klick-Express-Modus** steuert das. Um die Aufnahme in OpenScreenShot zu gestalten, öffne im Editor den Bereich **Beautify**: Er fügt Abstand, abgerundete Ecken, einen Schatten und einen Verlaufs-, Vollfarb- oder transparenten Hintergrund hinzu, und der Rahmen geht in jeden Export mit ein. Die [Übersicht der Aufnahmemodi](/de/docs/#modes) und die [Export-Übersicht](/de/docs/#export) listen alle Optionen auf.

## Was du nutzen solltest

- Nutze **Capture Full Page** in Arc auf macOS für ein schnelles PNG einer Seite, die das ganze Fenster scrollt.
- Nutze OpenScreenShot auf Seiten, die einen inneren Bereich scrollen, oder wenn du die Aufnahme markieren, schwärzen oder als PDF speichern willst, wie beim [Design-Review](/de/use-cases/design-review/).
- Nutze den Bereich **Beautify** von OpenScreenShot für ein gestaltetes Bild mit eigenem Abstand und Hintergrund, wie bei [Screenshots für Social Media](/de/use-cases/social-media/).

Die [Chrome-Anleitung](/de/full-page-screenshot/chrome/) vergleicht die DevTools-Aufnahme von Chrome mit der Erweiterung, und die [Brave-Anleitung](/de/full-page-screenshot/brave/) behandelt einen weiteren Chromium-Browser mit integriertem Tool. Für Seiten, die Erweiterungen blockieren, etwa Browsereinstellungen, siehe [Support und bekannte Einschränkungen](/de/support/).
