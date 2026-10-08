---
title: How to record a product demo video in Chrome
description: Record a browser tab with webcam and voice, add zoom at each click, trim the take, and export an MP4, all in Chrome on your computer.
order: 6
---

To record a short product demo from a browser tab, use **Record** in OpenScreenShot’s Chrome extension. Choose the whole tab or part of it, turn on the mic, tab audio, or webcam, and record the demo. The editor then adds a zoom at each click, lets you trim the take, and exports an MP4. The Firefox build supports screenshots only and has no recorder.

## Record a demo step by step

1. Prepare the demo in a normal browser tab: sign in, load sample data, and close notifications. Browser-internal pages cannot be recorded.
2. With the default settings, a click on the toolbar icon takes a screenshot. Right-click the icon and clear **One-click Express mode**, so the next click opens the popup.
3. Click **Record** in the popup. The recording tab opens beside your page. The first time, Chrome asks once for permission to capture the tab.
4. Turn on **Mic**, **Tab audio**, or **Webcam** as needed, and allow your browser’s permission prompt.
5. Keep **Whole tab**, or drag across the picture of your page to record only part of it.
6. Click **Start recording**. OpenScreenShot switches to your page. Do the demo at a steady pace, with deliberate clicks.
7. Press `Alt+Shift+X` to stop, or go back to the recording tab and click **Stop**. The recording editor opens in the same tab.
8. Adjust the zooms, trim the start and end, and click **Export MP4**.

The recording tab also has Pause/Resume and Cancel buttons. Nothing is added to the page you record, so no controls show in the video.

## Zoom at clicks

The editor adds a smooth 2x zoom at every click your cursor made. On the timeline, you can adjust or delete each zoom block. Click **Add zoom** to place your own block at 1.5x, 2x, or 3x, for example on a number that changes without a click.

Click ripples mark where you clicked. The cursor setting can show a smooth pointer that follows your recorded path, show only the clicks, or hide the pointer.

If the demo moves to a different site, click tracking needs the optional **Record across sites** permission in **Settings**. Without it, the toolbar badge turns amber, and zoom and click effects stop for the rest of the video. The video itself keeps recording.

## Webcam, voice, and tab audio

The webcam joins the export as a round bubble. In the editor, put it in any corner, change its size, or hide it. Separate sliders set the mic volume and the tab volume, so you can keep your voice above the product’s own sounds.

Record a short test take first to check the levels and the bubble position.

## Trim and frame the take

Drag the handles at the start or end of a segment to trim it. Undo and redo work on the timeline. The **Frame** panel in the side panel adds spacing, corners, a shadow, and a background around the video, the same frame the screenshot editor offers.

## Export the video

**Export MP4** renders the take with your zooms, audio tracks, webcam bubble, and frame, and downloads an MP4 file with H.264 video and AAC audio. Choose WebM from the picker beside the button for a WebM file. Keep the editor tab visible while it renders, because the render pauses when the tab is hidden.

MP4 is limited to 4096×2304 pixels, so a larger tab is scaled down to fit. A browser without MP4 recording exports WebM only. The file is named with your **Filename template** from **Settings**.

## Limits and storage

The recorder captures one browser tab. It does not record other windows, other apps, or your desktop. A browser-internal page or a protected page cannot be recorded.

Recordings, cursor logs, and webcam and mic streams stay in your browser’s storage on your device until you delete them. Turn on **Delete recording after export** to remove the take once the file is saved. Nothing is uploaded unless you share the exported file.

The [recording reference](/docs/#record) has every control. For still images of the same bug or feature, see [screenshots for bug reports](/use-cases/bug-reports/).
