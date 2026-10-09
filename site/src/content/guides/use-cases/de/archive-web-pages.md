---
title: So speicherst du eine visuelle Kopie einer Webseite
description: Nimm eine ganze Webseite als PNG oder PDF auf, benenne Dateien nach Datum und Domain und speichere sehr lange Seiten als mehrere Bilder.
order: 5
---

Um eine visuelle Kopie einer Webseite zu behalten, nimm sie mit **Ganze Seite** auf und speichere sie als PNG oder PDF mit Datum und Website im Dateinamen. OpenScreenShot scrollt die Seite, setzt die Teile zu einem Bild zusammen und speichert die Datei auf deinem Computer. Ein Screenshot hält fest, wie die Seite auf deinem Bildschirm aussah; er ist kein Beweis dafür, dass die Seite echt oder unverändert war.

## Eine Kopie einer Seite speichern, Schritt für Schritt

1. Öffne die **Einstellungen** über das Popup oder das Rechtsklick-Menü des Symbols in der Symbolleiste. Setze die **Dateinamen-Vorlage** auf ein Muster mit `{date}` und `{domain}`, zum Beispiel `Archive/{domain}/{date}_{title}`.
2. Öffne die Seite. Scrolle einmal durch, damit Bilder mit Lazy Loading und Kommentare laden, und kehre dann zum Anfang zurück.
3. Klicke auf das OpenScreenShot-Symbol. Mit den Standardeinstellungen startet das eine Aufnahme mit **Ganze Seite** und öffnet das Ergebnis im **Editor**.
4. Prüfe den Anfang, das Ende und jeden Abschnitt, der beim Scrollen lädt.
5. Klicke auf **Bild speichern**. Wähle im Dialog **Exportieren** **PNG** oder **PDF**, prüfe den Dateinamen und klicke auf **Exportieren**.

Um ohne Editor zu speichern, setze **Nach Screenshot** in den **Einstellungen** auf **Speichern**. Jede Aufnahme geht dann direkt als PNG in deinen Download-Ordner, benannt nach deiner Vorlage.

## PNG oder PDF?

Wähle **PNG**, um jedes Pixel der Aufnahme zu behalten. Das Format ist verlustfrei, Text der Oberfläche bleibt also scharf, und jeder Bildbetrachter kann es öffnen.

Wähle **PDF**, wenn die Kopie in einen Dokumentordner kommt oder gedruckt werden soll. Unter **Seitenformat** erzeugt **Bildgröße** eine Seite in der Größe des Bildes. **A4** oder **Letter** mit **Auf mehrere Seiten aufteilen** teilt eine lange Aufnahme in Seiten mit 5 mm Überlappung. Das PDF enthält den Screenshot als Bild, sein Text ist also nicht durchsuchbar oder markierbar. Die [Anleitung für Screenshots als PDF](/de/blog/save-screenshot-as-pdf/) vergleicht die Layouts.

## Dateien so benennen, dass du sie später findest

Die Dateinamen-Vorlage akzeptiert diese Platzhalter:

- `{date}`: das Datum als JJJJ-MM-TT, aus der Uhr deines Computers
- `{time}`: die Uhrzeit als HHMMSS
- `{domain}`: der Hostname der Website, ohne `www.`
- `{title}`: der Seitentitel, wobei Zeichen ersetzt werden, die in Dateinamen nicht erlaubt sind
- `{w}` und `{h}`: Breite und Höhe des Bildes in Pixeln

Ein `/` in der Vorlage speichert in einen Ordner innerhalb von Downloads, sodass `Archive/{domain}/{date}_{title}` die Kopien erst nach Website und dann nach Datum sortiert. Die Live-Vorschau in den **Einstellungen** zeigt das Ergebnis vor der Aufnahme.

## Sehr lange Seiten

Ein Bild fasst eine Seite mit bis zu 32.000 Gerätepixeln Höhe. Eine höhere Seite wird als bis zu sechs Bilder gespeichert. Mit **Speichern** wird jeder Teil nach deiner Vorlage mit einem Suffix wie `_part1of3` benannt. Mit **Editor** oder **Kopieren** öffnet sich jeder Teil in einem eigenen Editor-Tab, wo du ihn einzeln exportierst.

Eine Seite, die selbst für sechs Bilder zu hoch ist, wird mit einer Fehlermeldung abgelehnt. Nimm die benötigten Abschnitte stattdessen mit **Sichtbarer Bereich** oder **Ausschnitt** auf. Die [Anleitung für Ganzseiten-Screenshots](/de/blog/full-page-screenshot-chrome/) behandelt weitere Fälle, etwa verschachtelte Scrollbereiche und fixierte Kopfzeilen.

## Was ein Screenshot zeigen kann und was nicht

Ein Screenshot ist eine visuelle Aufzeichnung dessen, was dein Browser in einem Moment gezeigt hat. Er hat keine Signatur und keine Prüfung auf Manipulation, und jeder kann eine Bilddatei bearbeiten. Der Platzhalter `{date}` stammt aus der Uhr deines Computers zum Zeitpunkt der Benennung. Brauchst du einen Nachweis, dass eine Seite in einer bestimmten Form existiert hat, nutze einen Dienst, der für diesen Zweck gebaut ist, und behalte den Screenshot als persönliche Referenz.

Eine Ganzseiten-Aufnahme verpasst auch Inhalte, die die Seite nie dargestellt hat: eingeklappte Abschnitte, andere Tabs einer Seite, endlose Feeds über die Stelle hinaus, bis zu der du gescrollt hast, und Inhalte hinter einem Login, den du nicht geöffnet hast.

## Wo die Kopien gespeichert werden

OpenScreenShot verarbeitet Aufnahmen in deinem Browser und speichert sie im lokalen Speicher auf deinem Gerät. Es lädt sie nicht auf einen Server hoch. Exportierte Dateien landen in deinem Download-Ordner. Sie bleiben auf deinem Computer, bis du sie teilst oder hochlädst, und der Dienst, auf den du hochlädst, hat eigene Speicherregeln. Details findest du in der [Datenschutzerklärung](/de/privacy/).

Die [Übersicht der Einstellungen](/de/docs/#settings) behandelt die Dateinamen-Vorlage. Um eine Aufnahme für Kollegen zu markieren, siehe [eine Seite für das Design-Review aufnehmen](/de/use-cases/design-review/).
