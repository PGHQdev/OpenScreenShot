---
title: So nimmst du in Chrome ein Produktdemo-Video auf
description: Nimm einen Browser-Tab mit Webcam und Stimme auf, füge bei jedem Klick einen Zoom hinzu, kürze die Aufnahme und exportiere ein MP4, alles lokal in Chrome.
order: 6
---

Um eine kurze Produktdemo aus einem Browser-Tab aufzunehmen, nutze **Aufnehmen** in der Chrome-Erweiterung von OpenScreenShot. Wähle den ganzen Tab oder einen Teil davon, schalte Mikrofon, Tab-Audio oder Webcam ein und nimm die Demo auf. Der Editor fügt dann bei jedem Klick einen Zoom hinzu, lässt dich die Aufnahme kürzen und exportiert ein MP4. Die Firefox-Version unterstützt nur Screenshots und hat keinen Rekorder.

## Eine Demo aufnehmen, Schritt für Schritt

1. Bereite die Demo in einem normalen Browser-Tab vor: Melde dich an, lade Beispieldaten und schließe Benachrichtigungen. Browser-interne Seiten lassen sich nicht aufnehmen.
2. Mit den Standardeinstellungen nimmt ein Klick auf das Symbol in der Symbolleiste einen Screenshot auf. Klicke mit der rechten Maustaste auf das Symbol und schalte **Ein-Klick-Express-Modus** aus, damit der nächste Klick das Popup öffnet.
3. Klicke im Popup auf **Aufnehmen**. Der Aufnahme-Tab öffnet sich neben deiner Seite. Beim ersten Mal fragt Chrome einmal nach der Erlaubnis, den Tab aufzunehmen.
4. Schalte bei Bedarf **Mikro**, **Tab-Audio** oder **Webcam** ein und erlaube die Berechtigungsabfrage deines Browsers.
5. Behalte **Ganzer Tab** oder ziehe über das Bild deiner Seite, um nur einen Teil davon aufzunehmen.
6. Klicke auf **Aufnahme starten**. OpenScreenShot wechselt zu deiner Seite. Führe die Demo in gleichmäßigem Tempo mit bewussten Klicks vor.
7. Drücke `Alt+Shift+X` zum Beenden oder gehe zurück zum Aufnahme-Tab und klicke auf **Stopp**. Der Aufnahme-Editor öffnet sich im selben Tab.
8. Passe die Zooms an, kürze Anfang und Ende und klicke auf **MP4 exportieren**.

Der Aufnahme-Tab hat außerdem Schaltflächen für Pause/Weiter und Abbrechen. Der aufgenommenen Seite wird nichts hinzugefügt, im Video erscheinen also keine Bedienelemente.

## Zoom bei Klicks

Der Editor fügt bei jedem Klick deines Cursors einen weichen 2x-Zoom hinzu. Auf der Zeitleiste kannst du jeden Zoom-Block anpassen oder löschen. Klicke auf **Zoom hinzufügen**, um einen eigenen Block mit 1,5x, 2x oder 3x zu setzen, zum Beispiel auf eine Zahl, die sich ohne Klick ändert.

Klick-Wellen markieren, wo du geklickt hast. Die Cursor-Einstellung kann einen weichen Zeiger zeigen, der deinem aufgenommenen Pfad folgt, nur die Klicks zeigen oder den Zeiger ausblenden.

Wechselt die Demo zu einer anderen Website, braucht die Klick-Erfassung die optionale Berechtigung **Auf allen Websites** in den **Einstellungen**. Ohne sie wird das Badge in der Symbolleiste bernsteinfarben, und Zoom- und Klick-Effekte stoppen für den Rest des Videos. Das Video selbst wird weiter aufgenommen.

## Webcam, Stimme und Tab-Audio

Die Webcam kommt als runde Blase in den Export. Im Editor setzt du sie in eine beliebige Ecke, änderst ihre Größe oder blendest sie aus. Getrennte Regler stellen die Lautstärke von Mikrofon und Tab ein, sodass deine Stimme über den eigenen Tönen des Produkts bleibt.

Nimm zuerst einen kurzen Test auf, um die Pegel und die Position der Blase zu prüfen.

## Die Aufnahme kürzen und rahmen

Ziehe die Griffe am Anfang oder Ende eines Segments, um es zu kürzen. Rückgängig und Wiederholen funktionieren auf der Zeitleiste. Der Bereich **Beautify** in der Seitenleiste fügt Abstand, Ecken, einen Schatten und einen Hintergrund um das Video hinzu, denselben Rahmen, den der Screenshot-Editor bietet.

## Das Video exportieren

**MP4 exportieren** rendert die Aufnahme mit deinen Zooms, Audiospuren, der Webcam-Blase und dem Rahmen und lädt eine MP4-Datei mit H.264-Video und AAC-Audio herunter. Wähle WebM in der Auswahl neben der Schaltfläche für eine WebM-Datei. Lass den Editor-Tab während des Renderns sichtbar, denn das Rendern pausiert, wenn der Tab verborgen ist.

MP4 ist auf 4096×2304 Pixel begrenzt, ein größerer Tab wird also passend verkleinert. Ein Browser ohne MP4-Aufnahme exportiert nur WebM. Die Datei wird nach deiner **Dateinamen-Vorlage** aus den **Einstellungen** benannt.

## Grenzen und Speicherung

Der Rekorder nimmt einen Browser-Tab auf. Er nimmt keine anderen Fenster, anderen Apps oder deinen Desktop auf. Eine Browser-interne Seite oder eine geschützte Seite lässt sich nicht aufnehmen.

Aufnahmen, Cursor-Protokolle sowie Webcam- und Mikrofon-Streams bleiben im Speicher deines Browsers auf deinem Gerät, bis du sie löschst. Schalte **Aufnahme nach dem Export löschen** ein, um die Aufnahme zu entfernen, sobald die Datei gespeichert ist. Nichts wird hochgeladen, außer du teilst die exportierte Datei.

Die [Übersicht der Aufnahme](/de/docs/#record) enthält jedes Bedienelement. Für Standbilder desselben Fehlers oder derselben Funktion siehe [Screenshots für Fehlerberichte](/de/use-cases/bug-reports/).
