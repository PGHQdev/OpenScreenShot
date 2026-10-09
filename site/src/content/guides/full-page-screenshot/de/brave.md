---
title: So nimmst du in Brave einen Ganzseiten-Screenshot auf
description: Schalte die Screenshot-Schaltfläche von Brave ein, nimm eine ganze Seite als PNG auf, prüfe die Grenzen und nutze OpenScreenShot aus dem Chrome Web Store.
order: 5
---

Brave 1.94 und neuer hat ein integriertes Screenshot-Tool. Schalte die Screenshot-Schaltfläche unter `brave://settings/appearance` ein, klicke darauf und wähle **Full page** („Ganze Seite“). Ab Brave 1.96 öffnet sich eine Vorschau, in der du ein PNG herunterlädst oder das Bild kopierst. OpenScreenShot funktioniert auch in Brave: Brave ist ein Chromium-Browser und installiert Erweiterungen aus dem Chrome Web Store.

## Integrierte Methode

Brave hat keinen Hilfe-Artikel zu dem Tool. Die folgenden Schritte stützen sich auf die [Versionshinweise](https://brave.com/latest/) von Brave und den [Issue-Tracker](https://github.com/brave/brave-browser/issues/57937).

1. Gehe zu `brave://settings/appearance` und schalte im Abschnitt zur Symbolleiste die Screenshot-Schaltfläche ein.
2. Öffne die Seite, die du aufnehmen willst.
3. Klicke in der Symbolleiste auf die Schaltfläche **Take a screenshot** („Screenshot aufnehmen“).
4. Wähle in der Sprechblase **Capture screenshot** („Screenshot aufnehmen“) die Option **Full page** („Ganze Seite“). Die Sprechblase bietet außerdem **Selected area** („Ausgewählter Bereich“) und **Visible area** („Sichtbarer Bereich“).
5. Wähle im Dialog **Screenshot preview** („Screenshot-Vorschau“) **Download**, um ein PNG zu speichern, oder **Copy to clipboard** („In die Zwischenablage kopieren“).

`Ctrl+Shift+S` (`Shift+Cmd+S` auf macOS) öffnet ab Brave 1.75 das Screenshot-Tool von Brave. Der Issue-Tracker von Brave beschreibt dieses Kürzel als Aufnahme mit Auswahl, nutze also für **Full page** die Schaltfläche in der Symbolleiste. In Brave 1.96 ist der Screenshot-Eintrag im App-Menü in den Speichern-Abschnitt von **Save and share** („Speichern und teilen“) gewandert.

Die Vorschau bietet **Download** und **Copy to clipboard**. Um Pfeile oder Text hinzuzufügen, öffne das PNG in einer anderen App.

## Grenzen

- **Seitengröße.** Die Option **Full page** nutzt den DevTools-Screenshot-Befehl von Chromium. Dieser Befehl lehnt eine Seite ab, die 131.072 CSS-Pixel oder mehr breit oder hoch ist, mit dem Fehler „Page is too large.“
- **Fixierte und feste Elemente.** Für diesen Befehl ändert Chromium die Größe der Ansicht auf die volle Seitengröße. Abschnitte mit Fensterhöhe (`100vh`) und fixierte Kopf- oder Fußzeilen können sich dann an dieser hohen Ansicht ausrichten, sodass eine fixierte Fußzeile einmal am unteren Ende des Bildes erscheinen kann.
- **Lazy Loading.** Bilder mit `loading="lazy"` laden erst, wenn du in ihre Nähe scrollst. Scrolle vor der Aufnahme durch die Seite, sonst können Teile des Bildes leer bleiben.
- **Innere Scroll-Container.** Chromium bemisst die Aufnahme nach der eigenen Scrollgröße der Seite. Scrollt eine Seite einen Bereich in einer Hülle mit fester Höhe, zeigt die Aufnahme nur eine Bildschirmhöhe dieses Bereichs.
- **Infinite Scroll.** Ein Feed, der immer weiter lädt, hat kein echtes Ende. Die Aufnahme enthält nur, was vor dem Start geladen war.

## Mit OpenScreenShot

OpenScreenShot scrollt die Seite Viewport für Viewport und setzt die Teile zu einem Bild zusammen. Fixierte Kopfzeilen werden einmal oben aufgenommen, und Seiten, die ein inneres Element scrollen, funktionieren auch. Eine Seite, die höher als 32.000 Gerätepixel ist, wird als bis zu sechs Bilder gespeichert.

1. Öffne den [OpenScreenShot-Eintrag](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Brave und füge die Erweiterung hinzu. Brave erklärt Installationen aus dem Chrome Web Store in [Using Chrome extensions in Brave](https://brave.com/learn/using-chrome-extensions-in-brave/).
2. Hefte das OpenScreenShot-Symbol an die Symbolleiste an.
3. Öffne die Seite und klicke auf das Symbol. Mit den Standardeinstellungen startet eine Ganzseiten-Aufnahme, und das Ergebnis öffnet sich im Editor.
4. Prüfe den Anfang, das Ende und jede fixierte Navigation.
5. Klicke auf **Bild speichern** und wähle PNG, JPEG, WebP oder PDF, oder klicke auf **Kopieren**.

Das Ganzseiten-Kürzel von OpenScreenShot ist `Ctrl+Shift+S` (`⌘⇧S` auf macOS), dieselbe Tastenkombination wie beim Screenshot-Tool von Brave. Öffnen die Tasten das Tool von Brave, klicke stattdessen auf das Symbol oder lege mit dem Link **Kürzel** im Aufnahmemenü eine andere Taste fest. Öffnet das Symbol ein Menü, wähle **Ganze Seite**; die Einstellung **Ein-Klick-Express-Modus** steuert das.

## Was du nutzen solltest

- Nutze die Schaltfläche **Full page** von Brave für ein schnelles PNG einer Seite, die das ganze Fenster scrollt.
- Nutze OpenScreenShot für Seiten, die einen inneren Bereich scrollen, für PDF-, JPEG- oder WebP-Export oder für Anmerkungen und Schwärzung vor dem Teilen, wie bei [Fehlerberichten](/de/use-cases/bug-reports/).
- Nutze den Bereich **Beautify** von OpenScreenShot, wenn die Aufnahme in einen Beitrag kommt: Er fügt Abstand, abgerundete Ecken, einen Schatten und einen Hintergrund hinzu. Siehe [Screenshots für Social Media](/de/use-cases/social-media/).

Die [Übersicht der Aufnahmemodi](/de/docs/#modes) und die [Export-Übersicht](/de/docs/#export) listen alle Optionen auf. Die [Chrome-Anleitung](/de/full-page-screenshot/chrome/) behandelt die DevTools-Aufnahme, die Brave ebenfalls hat. Für Seiten, die Erweiterungen blockieren, etwa Browsereinstellungen, siehe [Support und bekannte Einschränkungen](/de/support/).
