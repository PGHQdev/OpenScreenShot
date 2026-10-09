---
title: So nimmst du Screenshots für Fehlerberichte auf
description: Nimm den fehlerhaften Teil einer Seite auf, markiere ihn mit Pfeilen und Schrittnummern, verdecke Tokens und E-Mails und füge das Bild in ein Issue ein.
order: 1
---

Für einen Fehlerbericht nimmst du nur den Teil der Seite auf, der das Problem zeigt, markierst, was falsch ist, und verdeckst alles Private, bevor du das Bild in das Issue einfügst. Nutze in OpenScreenShot **Ausschnitt** oder **Element erfassen** für die Aufnahme, die Werkzeuge **Pfeil** und **Schrittnummer** für die Markierungen und **Unschärfe** mit der Füllung **Deckend** für die Schwärzung. Schreibe URL, Browser und Schritte zum Nachstellen in den Text des Issues, denn der Screenshot zeigt den Seiteninhalt ohne Adressleiste.

## Einen Fehler aufnehmen und markieren, Schritt für Schritt

1. Öffne die Seite und bringe sie in den fehlerhaften Zustand. Schließe Banner, die das Problem verdecken.
2. Klicke mit der rechten Maustaste auf die Seite, öffne das Untermenü **OpenScreenShot** und wähle **Ausschnitt** oder **Element erfassen**. Mit den Standardeinstellungen nimmt ein Klick auf das Symbol in der Symbolleiste stattdessen die ganze Seite auf.
3. Ziehe für einen Ausschnitt ein Rechteck um das Problem, mit genug umgebender Oberfläche, damit erkennbar ist, wo es liegt. Drücke `Enter` zum Bestätigen. Für ein Element bewegst du den Mauszeiger darüber, bis die gewünschte Karte, Tabelle oder das Formular umrandet ist, und klickst dann oder drückst `Enter`.
4. Füge im **Editor** einen **Pfeil** (`A`) am fehlerhaften Detail hinzu. Füge für jede Aktion eine **Schrittnummer** (`S`) hinzu, wenn der Fehler mehrere Klicks zum Nachstellen braucht.
5. Wähle **Unschärfe** (`B`), wähle unter **Schwärzung** die Option **Deckend** und verdecke Zugriffstokens, E-Mail-Adressen, Kontonamen und interne Hostnamen.
6. Klicke auf **Kopieren** oder drücke `Ctrl+C` (`⌘C` auf macOS) und füge das Bild in das Issue ein.

Im Element-Modus wählt `↑` das übergeordnete Element und `↓` das untergeordnete. Das hilft, wenn die Umrandung auf einem Container landet, der zu klein oder zu groß ist. Ist das Element nicht vollständig sichtbar, bietet die Auswahl stattdessen eine Ganzseiten-Aufnahme an.

## Hover-Zustände, Dropdowns und Tooltips aufnehmen

Ein Menü oder Tooltip schließt sich oft, wenn du woanders klickst. Setze den **Timer** im Popup oder in den **Einstellungen** auf 3, 5 oder 10 Sekunden, starte die Aufnahme und öffne dann das Menü, bevor das Badge in der Symbolleiste fertig heruntergezählt hat.

Der Timer läuft, bevor eine Ausschnittsauswahl startet, ein Ziehen kann das Menü also trotzdem schließen. Für einen Hover-Zustand nutzt du **Sichtbarer Bereich** mit Timer und schneidest danach mit **Zuschneiden** (`C`) zu. Du kannst den Ausschnitt auch einmal auswählen und dann **Ausschnitt erneut** aus dem Rechtsklick-Menü mit Timer nutzen: Es nimmt dasselbe Rechteck ohne erneutes Ziehen auf.

## Den Editor mit der Aktion Kopieren überspringen

Braucht ein Screenshot keine Markierungen, setze **Nach Screenshot** im Popup oder in den **Einstellungen** auf **Kopieren**. Jede Aufnahme geht dann direkt in die Zwischenablage, und das Badge in der Symbolleiste bestätigt es. Füge das Bild mit `Ctrl+V` oder `⌘V` in das Issue ein.

Diese Einstellung gilt auch für die Tastenkürzel und das Rechtsklick-Menü. Setze sie zurück auf **Editor**, wenn du anmerken oder schwärzen musst. Eine Aufnahme in die Zwischenablage überspringt die Schwärzung, prüfe die Seite also vor der Aufnahme auf private Daten.

## Was du neben den Screenshot schreibst

Ein Screenshot zeigt, was schiefging. Der Text des Issues liefert den Kontext, den ein Entwickler zum Nachstellen braucht:

- die URL der Seite, ohne private Query-Parameter
- Name und Version des Browsers sowie das Betriebssystem
- die Schritte zum Nachstellen, in derselben Reihenfolge wie die Schrittnummern im Bild
- was du erwartet hast und was stattdessen passiert ist
- den Zeitpunkt des Problems, wenn die Seite Live-Daten zeigt

Halte dich an ein Problem pro Screenshot. Ein zweiter Fehler im selben Bild macht unklar, auf welchen der Pfeil zeigt.

## Grenzen

Unschärfe und Mosaik machen Pixel weicher, können aber Hinweise auf kurzen Text übrig lassen. **Deckend** verdeckt den Bereich im Export vollständig; die [Anleitung zum Schwärzen](/de/blog/redact-screenshot/) erklärt, wie du das Ergebnis prüfst. Browser-interne Seiten und andere geschützte Seiten blockieren Aufnahmen durch Erweiterungen; siehe [Support und bekannte Einschränkungen](/de/support/).

Die [Übersicht der Aufnahmemodi](/de/docs/#modes) behandelt die Auswahl-Steuerung, und die [Übersicht der Anmerkungen](/de/docs/#annotate) listet jedes Werkzeug und Tastenkürzel auf. Für Antworten an Nutzer, die ein Problem melden, siehe [Screenshots für den Kundensupport](/de/use-cases/customer-support/). Um den Fehler in Bewegung zu zeigen, siehe [Produktdemo-Videos](/de/use-cases/product-demos/).
