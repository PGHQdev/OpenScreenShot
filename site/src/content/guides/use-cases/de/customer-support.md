---
title: So beantwortest du Support-Tickets mit Screenshots
description: Kopiere einen Screenshot direkt in eine Ticket-Antwort, nummeriere die Schritte, verdecke Kundendaten und markiere ein Bild, das dir ein Kunde geschickt hat.
order: 7
---

Um ein Support-Ticket mit einem Screenshot zu beantworten, nimm den Bildschirm auf, den der Kunde sehen muss, nummeriere die Schritte, die er ausführen muss, verdecke Kundendaten und füge das Bild in deine Antwort ein. In OpenScreenShot kopiert die Aktion **Kopieren** eine Aufnahme, ohne den Editor zu öffnen, und **Schrittnummer**-Badges zeigen die Reihenfolge der Klicks. Um einen Screenshot zu markieren, den dir ein Kunde geschickt hat, füge ihn in den **Editor** ein oder ziehe ihn hinein.

## Mit einem kommentierten Screenshot antworten, Schritt für Schritt

1. Öffne den Bildschirm in deinem Produkt, der die Frage beantwortet, zum Beispiel eine Einstellungsseite.
2. Klicke mit der rechten Maustaste auf die Seite, öffne das Untermenü **OpenScreenShot** und wähle **Ausschnitt** oder **Element erfassen**. Behalte genug von der Oberfläche, damit der Kunde dieselbe Stelle findet.
3. Füge im **Editor** auf jedem Bedienelement eine **Schrittnummer** (`S`) hinzu, in der Reihenfolge, in der der Kunde klickt.
4. Wähle **Unschärfe** (`B`), wähle unter **Schwärzung** die Option **Deckend** und verdecke Namen, E-Mail-Adressen, Bestellnummern und Konto-IDs.
5. Klicke auf **Kopieren** oder drücke `Ctrl+C` (`⌘C` auf macOS).
6. Füge das Bild in die Ticket-Antwort ein und schreibe dieselben Schritte als nummerierte Liste darunter.

Die geschriebenen Schritte helfen Kunden, die einen Screenreader nutzen oder die Antwort in einem E-Mail-Programm lesen, das Bilder blockiert.

## Ohne Editor kopieren

Für eine schnelle Antwort ohne Markierungen setze **Nach Screenshot** im Popup oder in den **Einstellungen** auf **Kopieren**. Jede Aufnahme geht dann direkt in die Zwischenablage, und das Badge in der Symbolleiste bestätigt es. Füge sie mit `Ctrl+V` oder `⌘V` in die Antwort ein.

Die Einstellung gilt für die Schaltflächen im Popup, die Tastenkürzel und das Rechtsklick-Menü. Wechsle zurück zu **Editor**, wenn der Screenshot Kundendaten zeigt, die du erst verdecken musst. **Letzten öffnen** in der Popup-Fußzeile öffnet jederzeit die neueste Aufnahme im Editor.

## Die Schritte nummerieren

**Schrittnummer**-Badges zählen von selbst hoch: Der erste Klick setzt 1, der nächste 2. Löschst du ein Badge, werden die übrigen neu nummeriert. Halte die Nummern im Bild gleich mit den Nummern in deiner geschriebenen Antwort.

Füge einen **Pfeil** (`A`) hinzu, wenn ein Bedienelement klein oder schwer zu finden ist, und eine kurze **Text**-Notiz (`T`), wenn ein Schritt einen Wert braucht, etwa die auszuwählende Option. **Spotlight** (`O`) dunkelt den Rest des Bildschirms ab, wenn die Seite unübersichtlich ist.

## Kundendaten verdecken

Deine eigenen Admin-Ansichten zeigen oft Daten anderer Kunden: Namen in einer Liste, E-Mail-Adressen, Zahlungsdaten und interne Notizen. Prüfe das ganze Bild, auch die Ränder, bevor du es sendest.

Eine weiche Unschärfe oder ein Mosaik kann Hinweise auf kurzen Text übrig lassen. **Deckend** verdeckt den Bereich im Export vollständig. Verdecke jedes Element mit etwas Rand um die sichtbaren Zeichen. Die [Anleitung zum Schwärzen](/de/blog/redact-screenshot/) erklärt, wie du das Ergebnis prüfst.

## Einen Screenshot markieren, den ein Kunde geschickt hat

Kunden schicken oft einen Screenshot des Problems. So zeigst du auf das Detail, das sie übersehen haben:

1. Kopiere das Bild des Kunden oder speichere es auf deinem Computer.
2. Öffne einen Editor-Tab. Ist keiner offen, nimm eine beliebige Seite mit **Sichtbarer Bereich** auf; der Import ersetzt diese Aufnahme.
3. Drücke `Ctrl+V` oder `⌘V` außerhalb eines Textfelds, um das Bild einzufügen, oder ziehe die Bilddatei auf den Editor.
4. Füge Pfeile, Schrittnummern oder Text hinzu und verdecke alles, was der Kunde nicht teilen wollte.
5. Klicke auf **Kopieren** und füge das markierte Bild in deine Antwort ein.

Die obere Leiste zeigt **Importiert**, und jedes Werkzeug, der Rahmen und jedes Exportformat funktionieren mit dem Bild. Ein Import ersetzt die Arbeitsfläche, daher fragt der Editor vorher, wenn das aktuelle Bild Anmerkungen hat.

## Grenzen

Die Erweiterung nimmt nur den Seiteninhalt auf. Das Bild zeigt keine Adressleiste, schreibe also die URL in deine Antwort, wenn der Kunde eine bestimmte Seite öffnen muss. Browser-interne Seiten und andere geschützte Seiten blockieren die Aufnahme; siehe [Support und bekannte Einschränkungen](/de/support/).

Aufnahmen und Bearbeitungen bleiben auf deinem Computer. Das Helpdesk-Tool, in das du das Bild einfügst, speichert es nach eigenen Regeln. Die [Übersicht der Anmerkungen](/de/docs/#annotate) listet jedes Werkzeug auf. Für Screenshots an dein Entwicklungsteam siehe [Screenshots für Fehlerberichte](/de/use-cases/bug-reports/).
