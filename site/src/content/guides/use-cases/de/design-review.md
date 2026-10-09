---
title: So nimmst du eine Webseite für das Design-Review auf
description: Nimm eine ganze Seite oder eine Komponente auf, lenke Reviewer mit Spotlight und Textnotizen auf Details und teile ein mehrseitiges PDF.
order: 2
---

Für ein Design-Review nimmst du die ganze Seite mit **Ganze Seite** auf, markierst die Punkte, zu denen du Feedback willst, und teilst ein PDF, das Reviewer Seite für Seite lesen können. In OpenScreenShot dunkelt **Spotlight** alles außerhalb des besprochenen Bereichs ab, und **Text** und **Pfeil** fügen Hinweise hinzu. Nutze **Element erfassen**, wenn es im Review um eine Komponente geht, etwa eine Karte, ein Diagramm oder eine Tabelle.

## Eine Seite für das Review vorbereiten, Schritt für Schritt

1. Öffne die Seite in der Fensterbreite, die du prüfen willst. Die Aufnahme zeigt das Layout in der aktuellen Breite, ändere also zuerst die Fenstergröße, um einen anderen Breakpoint zu prüfen.
2. Scrolle einmal durch die Seite, damit Bilder mit Lazy Loading laden, und kehre dann zum Anfang zurück. Schließe Cookie-Banner und Chat-Widgets, die nicht zum Review gehören.
3. Klicke auf das OpenScreenShot-Symbol. Mit den Standardeinstellungen startet das eine Aufnahme mit **Ganze Seite**. Lass den Tab offen, bis sich der Editor öffnet.
4. Prüfe den ersten und letzten Abschnitt, die Kopfzeile und jeden Bereich mit Bewegung, etwa ein Karussell.
5. Wähle **Spotlight** (`O`) und ziehe über jeden Bereich, den sich die Reviewer ansehen sollen. Mehrere Ausschnitte verschmelzen zu einer abgedunkelten Ebene.
6. Füge neben jedem Bereich eine **Text**-Notiz (`T`) hinzu und einen **Pfeil** (`A`), wo eine Notiz auf ein kleines Detail zeigen muss.
7. Klicke auf **Bild speichern**, um den Dialog **Exportieren** zu öffnen. Wähle **PDF** und folge dann den Export-Schritten unten.

## Eine Komponente aufnehmen

Klicke mit der rechten Maustaste auf die Seite, öffne das Untermenü **OpenScreenShot** und wähle **Element erfassen**. Bewege den Mauszeiger über die Komponente, bis sie umrandet ist, und klicke dann oder drücke `Enter`, um ihre Grenzen aufzunehmen. Drücke `↑`, um das übergeordnete Element zu wählen, zum Beispiel den Abschnitt, der eine Karte enthält, und `←` oder `→`, um zu einem Nachbarelement zu wechseln.

Eine Element-Aufnahme liefert ein eng zugeschnittenes Bild ohne manuelles Zuschneiden. Das hilft beim Vergleich zweier Versionen derselben Komponente. Ist das Element auf dem Bildschirm nicht vollständig sichtbar, bietet die Auswahl stattdessen eine Ganzseiten-Aufnahme an.

## Feedback so markieren, dass Reviewer folgen können

Spotlight-Ausschnitte können ein Rechteck, ein abgerundetes Rechteck oder eine Ellipse sein. Nutze ein Spotlight-Bild pro Thema: Ein Bild mit vielen beleuchteten Bereichen lässt Reviewer raten, welche Notiz zu welchem Bereich gehört. Für nummeriertes Feedback fügst du an jedem Punkt eine **Schrittnummer** (`S`) hinzu und beziehst dich im Review-Thread auf die Nummern. Die Nummern zählen von selbst hoch und werden neu nummeriert, wenn du eine löschst.

Das Werkzeug **Form** (`R`) zeichnet einen Umriss um einen Bereich, ohne den Rest der Seite abzudunkeln. Das Werkzeug **Pfeil** bietet gefüllte, offene, doppelte und Punkt-Spitzen, und du kannst seinen mittleren Griff ziehen, um ihn um anderen Inhalt herum zu biegen.

## Das Review als PDF teilen

Wähle im Dialog **Exportieren** **PDF**, wähle unter **Seitenformat** **A4** oder **Letter** und schalte **Auf mehrere Seiten aufteilen** ein. Aufeinanderfolgende Seiten überlappen sich um 5 mm, sodass eine Textzeile an einem Seitenumbruch auf beiden Seiten erscheint. Wähle unter **Seitenformat** **Bildgröße**, um die Seite für das Lesen am Bildschirm auf einer hohen PDF-Seite zu behalten.

Das PDF enthält den Screenshot als Bild, mit deinen Anmerkungen. Es hat keinen markierbaren Text. Die [Anleitung für Screenshots als PDF](/de/blog/save-screenshot-as-pdf/) vergleicht die Layouts, und die [Export-Übersicht](/de/docs/#export) listet die anderen Formate auf.

## Grenzen einer Ganzseiten-Aufnahme

Eine Ganzseiten-Aufnahme hält die Seite so fest, wie sie dargestellt wird, während die Erweiterung scrollt. Manche Inhalte ändern sich während dieses Scrollens:

- Eine fixierte Kopfzeile wird auf der ersten Kachel aufgenommen und einmal oben eingefügt. Prüfe, ob andere fixierte Elemente, etwa Seitenleisten oder untere Leisten, dort erscheinen, wo du sie erwartest.
- Bilder, die erst laden, wenn sie sichtbar werden, können als leere Kästen erscheinen, wenn die Aufnahme sie zuerst erreicht. Scrolle vor der Aufnahme durch die Seite.
- Karussells, Animationen, Live-Zähler und endlose Feeds können sich zwischen den Kacheln ändern. Pausiere sie oder nimm stattdessen den wichtigen Bereich auf.

Eine Seite, die höher als 32.000 Gerätepixel ist, wird als bis zu sechs Bilder gespeichert, jedes in einem eigenen Editor-Tab. Die [Anleitung für Ganzseiten-Screenshots](/de/blog/full-page-screenshot-chrome/) behandelt weitere Fehlerbehebung. Für Screenshots in Hilfeartikeln siehe [Screenshots für Dokumentation](/de/use-cases/documentation/).
