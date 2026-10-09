---
title: So erstellst du Screenshots für Hilfedokumente und Tutorials
description: Halte Tutorial-Screenshots gleich groß, nummeriere die Schritte, hebe das richtige Bedienelement hervor und speichere jede Datei in einen Docs-Ordner.
order: 3
---

Für Hilfedokumente und Tutorials nimmst du jeden Bildschirm auf dieselbe Weise auf, nummerierst die Aktionen und exportierst jedes Bild in derselben Breite. Lege in OpenScreenShot im Dialog **Exportieren** unter **Skalierung** eine exakte Pixelbreite fest, füge für jede Aktion **Schrittnummer**-Badges hinzu und nutze **Spotlight**, um Leser auf das richtige Bedienelement zu lenken. Eine Dateinamen-Vorlage wie `Docs/{title}` speichert jedes Bild in einen Ordner innerhalb von Downloads.

## Einen Tutorial-Screenshot erstellen, Schritt für Schritt

1. Stelle das Browserfenster für jede Aufnahme im Artikel auf dieselbe Größe ein. Nutze jedes Mal dasselbe Design und dieselbe Zoomstufe.
2. Nimm den Bildschirm auf. **Ausschnitt** oder **Element erfassen** im Rechtsklick-Menü beschränkt das Bild auf den Teil der Oberfläche, um den es im Schritt geht.
3. Füge im **Editor** auf jedem Bedienelement eine **Schrittnummer** (`S`) hinzu, in der Reihenfolge, in der der Leser sie nutzt.
4. Füge **Spotlight** (`O`) über dem wichtigen Bereich hinzu, wenn der Bildschirm viel anderen Inhalt hat.
5. Verdecke Beispiel-Kundendaten, echte E-Mail-Adressen und API-Schlüssel mit **Unschärfe** (`B`) und der Füllung **Deckend**.
6. Öffne bei Bedarf **Beautify** in der oberen Leiste, um Abstand, abgerundete Ecken und einen Schatten hinzuzufügen.
7. Klicke auf **Bild speichern**. Wähle im Dialog **Exportieren** **PNG**, gib unter **Skalierung** die Breite deiner Seite ein, prüfe den Dateinamen und klicke auf **Exportieren**.

## Jedes Bild gleich groß halten

Leser merken, wenn Screenshots in einem Artikel von Schritt zu Schritt ihre Größe ändern. Wähle unter **Skalierung** 25, 50, 100 oder 200 % oder tippe eine exakte Pixelbreite ein. Mit einer festen Breite passt jedes Bild in einem Artikel zur Inhaltsspalte deiner Dokumentationsseite.

Schalte im Dialog **Exportieren** **Diese Einstellungen merken** ein, um Format und Qualität als neue Standardwerte zu behalten. Die Breite gehört nicht zu diesen Standardwerten, gib sie also für jeden Export neu ein. Eine Breite über der Canvas-Grenze von Chrome wird abgelehnt, sodass die Erweiterung nie eine leere Datei schreibt.

PNG hält Text der Oberfläche scharf, weil es verlustfrei ist. Nutze JPEG oder WebP nur, wenn deine Dokumentationsplattform die Dateigröße begrenzt.

## Schritte nummerieren, die in Reihenfolge bleiben

**Schrittnummer**-Badges zählen von selbst hoch: Der erste Klick setzt 1, der nächste 2. Löschst du ein Badge, werden die übrigen neu nummeriert, sodass du einen Schritt entfernen kannst, ohne jede folgende Nummer zu bearbeiten. Gleiche die Nummern im Bild mit der nummerierten Liste in deinem Artikel ab.

Nutze die Palette mit acht Farben auf den Tasten `1`–`8`. Der Editor merkt sich Farbe, Linienstärke und Schriftgröße über Sitzungen hinweg, sodass Screenshots für einen Artikel denselben Stil behalten.

## Hervorheben und rahmen

**Spotlight** lässt einen oder mehrere Bereiche hell und dunkelt den Rest ab. Die Ausschnitte können ein Rechteck, ein abgerundetes Rechteck oder eine Ellipse sein. Für eine lange Einstellungsseite entfernt das Werkzeug **Cut** (`X`) horizontale Streifen, die der Leser nicht braucht, mit einer Live-Vorschau, bevor du es anwendest.

Der Bereich **Beautify**, den die [Dokumentation](/de/docs/#annotate) unter demselben Namen beschreibt, fügt Abstand, Eckenradius, einen Schlagschatten und einen Hintergrund um den Screenshot hinzu. Der Rahmen geht in jeden Export und in die Zwischenablage mit ein. Wähle einen Look und nutze ihn für jedes Bild in der Dokumentation.

## Die Bilder benennen und ablegen

Öffne die **Einstellungen** über das Popup oder das Rechtsklick-Menü des Symbols in der Symbolleiste und bearbeite dann die **Dateinamen-Vorlage**. Klicke auf einen Platzhalter, um `{date}`, `{time}`, `{title}`, `{domain}`, `{w}` oder `{h}` einzufügen, und prüfe die Live-Vorschau.

Füge `/` hinzu, um in einen Ordner innerhalb von Downloads zu speichern. Zum Beispiel speichert `Docs/{title}` jedes Bild in einen Ordner `Docs`, benannt nach dem Seitentitel. Der Platzhalter `{title}` ersetzt Zeichen, die in Dateinamen nicht erlaubt sind, ein `/` im Seitentitel erzeugt also keinen weiteren Ordner. Der Dialog **Exportieren** zeigt den Dateinamen vor dem Speichern, und du kannst ihn dort bearbeiten.

## Grenzen

Screenshots der Oberfläche veralten, wenn sich das Produkt ändert. Behalte den Seitentitel oder die URL im Dateinamen, damit du alte Bilder finden und ersetzen kannst. Ein Browser-Screenshot zeigt nur den Seiteninhalt; er enthält weder die Adressleiste noch die Symbolleiste des Browsers.

Die [Export-Übersicht](/de/docs/#export) und die [Übersicht der Einstellungen](/de/docs/#settings) listen alle Optionen auf. Um ein Bild für einen Beitrag vorzubereiten, siehe [Screenshots in sozialen Medien teilen](/de/use-cases/social-media/).
