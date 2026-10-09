---
title: So nimmst du in Microsoft Edge einen Ganzseiten-Screenshot auf
description: Nimm eine ganze Seite mit dem Screenshot-Tool von Edge oder dem DevTools-Befehl auf, kenne die Grenzen und nutze OpenScreenShot aus dem Chrome Web Store.
order: 2
---

Microsoft Edge hat ein integriertes Screenshot-Tool, das früher Web capture hieß. Drücke `Ctrl+Shift+S`, wähle **Capture full page** („Ganze Seite erfassen“) und kopiere dann die Aufnahme oder speichere sie auf deinem Gerät. OpenScreenShot funktioniert auch in Edge: Edge ist ein Chromium-Browser und installiert die Erweiterung aus dem Chrome Web Store, sobald du Erweiterungen aus anderen Stores erlaubst.

## Integrierte Methode

Microsoft beschreibt das Tool in seiner [Anleitung zu Screenshots in Edge](https://www.microsoft.com/en-us/edge/learning-center/screenshot-webpage).

1. Öffne die Seite, die du aufnehmen willst.
2. Drücke `Ctrl+Shift+S`. Du kannst auch mit der rechten Maustaste auf die Seite klicken und **Screenshot** wählen, oder **Settings and more** („Einstellungen und mehr“, **...**) öffnen und **Screenshot** wählen.
3. Wähle **Capture full page** („Ganze Seite erfassen“), die mittlere Option.
4. Markiere die Aufnahme in der Vorschau bei Bedarf mit den Zeichenwerkzeugen.
5. Kopiere die Aufnahme oder speichere sie auf deinem Gerät.

Laut Microsoft kann die Verfügbarkeit der Funktion je nach Gerätetyp, Markt und Browserversion variieren. Administratoren können das Tool außerdem mit der [Richtlinie WebCaptureEnabled](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled) ausschalten. Fehlt auf einem Arbeitscomputer der Eintrag **Screenshot**, kann diese Richtlinie gesetzt sein.

Edge hat auch die Chromium-DevTools-Aufnahme. Öffne die DevTools, schalte die Geräteemulation ein, öffne **More options** („Weitere Optionen“) und wähle **Capture a full size screenshot**. Microsoft dokumentiert das in seinem [Artikel zum Gerätemodus](https://learn.microsoft.com/en-us/microsoft-edge/devtools/device-mode/). Die [Chrome-Anleitung](/de/full-page-screenshot/chrome/) vergleicht diesen Weg mit einer Erweiterung.

## Grenzen

- **Nicht dokumentiertes Verhalten.** Microsoft dokumentiert nicht, wie das Screenshot-Tool ein Ganzseiten-Bild erstellt, wie lang eine Seite höchstens sein darf und wie es mit fixierten Kopfzeilen, Lazy Loading und inneren Scroll-Containern umgeht. Prüfe jede Aufnahme, bevor du sie teilst.
- **Innere Scroll-Container.** Nutzer auf Microsoft Q&A berichten, dass die Ganzseiten-Aufnahme auf Seiten fehlschlug, die in einem inneren Element scrollen, zum Beispiel in einer Web-App mit scrollendem Inhaltsbereich. Microsoft hat das nicht bestätigt.
- **Seitengröße in den DevTools.** Die DevTools-Aufnahme nutzt den Screenshot-Befehl von Chromium. Er lehnt eine Seite ab, die 131.072 CSS-Pixel oder mehr breit oder hoch ist, mit dem Fehler „Page is too large.“
- **Lazy Loading.** Bilder mit `loading="lazy"` laden erst, wenn du in ihre Nähe scrollst. Scrolle vor der Aufnahme durch die Seite, sonst können Teile des Bildes leer bleiben.
- **Fixierte Kopfzeilen.** Ein Aufnahme-Tool, das scrollt und mehrere Teile zusammenfügt, wiederholt jedes Element, das auf dem Bildschirm stehen bleibt. Achte auf eine Kopfzeile, die weiter unten im Bild mehr als einmal erscheint.

## Mit OpenScreenShot

OpenScreenShot scrollt die Seite, nimmt sie in Teilen auf und setzt die Teile zu einem Bild zusammen. Fixierte Kopfzeilen werden einmal oben aufgenommen, und Seiten, die ein inneres Element scrollen, funktionieren auch. Eine Seite, die höher als 32.000 Gerätepixel ist, wird als bis zu sechs Bilder gespeichert.

1. Öffne den [OpenScreenShot-Eintrag](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) in Edge. Wenn Edge fragt, wähle **Allow extensions from other stores** („Erweiterungen aus anderen Stores zulassen“) und füge dann die Erweiterung hinzu. Microsoft erklärt diesen Schritt in seiner [Hilfe zu Erweiterungen](https://support.microsoft.com/en-us/edge/add-turn-off-or-remove-extensions-in-microsoft-edge).
2. Hefte das OpenScreenShot-Symbol an die Symbolleiste an.
3. Öffne die Seite und klicke auf das Symbol. Mit den Standardeinstellungen startet eine Ganzseiten-Aufnahme, und das Ergebnis öffnet sich im Editor.
4. Prüfe den Anfang, das Ende und jeden Abschnitt, der beim Scrollen lädt.
5. Klicke auf **Bild speichern** und wähle PNG, JPEG, WebP oder PDF, oder klicke auf **Kopieren**.

Das Ganzseiten-Kürzel von OpenScreenShot ist `Ctrl+Shift+S`, dieselbe Tastenkombination wie beim Screenshot-Tool von Edge. Öffnen die Tasten das Tool von Edge, klicke stattdessen auf das Symbol oder lege mit dem Link **Kürzel** im Aufnahmemenü eine andere Taste fest. Die [Übersicht der Aufnahmemodi](/de/docs/#modes) listet die anderen Modi auf.

## Was du nutzen solltest

- Nutze das Screenshot-Tool von Edge für eine schnelle Aufnahme mit ein paar Stiftmarkierungen auf einer Seite, die das ganze Fenster scrollt.
- Nutze OpenScreenShot, wenn eine Seite einen inneren Bereich scrollt, wenn du PDF-, JPEG- oder WebP-Export brauchst oder wenn du Schrittnummern und deckende Schwärzung brauchst, wie in [Hilfedokumenten und Tutorials](/de/use-cases/documentation/) oder [Support-Antworten](/de/use-cases/customer-support/).
- Nutze die DevTools-Aufnahme, wenn dein Administrator das Screenshot-Tool ausgeschaltet hat und du keine Erweiterungen installieren kannst.

Die [Export-Übersicht](/de/docs/#export) behandelt Dateiformate und Skalierung. Für Seiten, die OpenScreenShot nicht aufnehmen kann, etwa Browsereinstellungen, siehe [Support und bekannte Einschränkungen](/de/support/).
