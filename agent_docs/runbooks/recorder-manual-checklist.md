# Runbook: Recorder manual checklist

Manual pass for the screen recorder, before each release. Use a packed `dist/` build, not `npm run dev` — some of these only fail packed.

- [ ] Record 10s with mic, tab audio, and webcam all on.
- [ ] Fresh profile, first-ever recording: camera/mic prompts appear from the webcam bubble iframe _before_ capture starts (the frame-ready handshake).
- [ ] Pause, then resume — timer and control bar re-sync.
- [ ] Stop with `Alt+Shift+X` from a tab with no popup or editor open.
- [ ] Navigate to a different origin without "Record across sites" on — toolbar badge turns amber, clears after a click on the toolbar icon.
- [ ] Kill the offscreen document from `chrome://extensions` mid-recording, then recover the session from the popup.
- [ ] Continue recording from the editor — confirm it appends a new segment, not an overwrite.
- [ ] Export with webcam bubble + Beautify frame on; play the WebM back and confirm mic and tab audio are both present.
- [ ] Confirm exported/preview video autoplay works packed (Task 12 only verified this on localhost).
- [ ] Fresh profile: install opens the setup tab; grant tab recording there; Record then starts with no inline prompt. Deny camera in site settings and confirm the setup row shows the recovery path and the popup shows the blocked chip when webcam is toggled on.
