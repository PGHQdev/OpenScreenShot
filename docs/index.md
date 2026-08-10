# OpenScreenShot

Open-source screenshot tool for Chrome — full-page, region, and visible-area capture with annotation and PDF export. 100% local and private: works fully offline, screenshots never leave the device.

- Chrome Web Store: https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp
- Source: https://github.com/pghqdev/OpenScreenShot
- Docs: https://openscreenshot.app/docs/
- Support: https://openscreenshot.app/support/
- License: MIT

## Features

- Full Page — scroll-and-stitch capture of the entire page
- Visible Area — capture exactly what's on screen
- Selected Region — click & drag to grab an area
- Annotation editor — rectangle, arrow, pen, text, blur, crop
- Export — PNG, JPEG, WebP, PDF

## Agents & CLI

`openscreenshot` is a separate, optional, local CLI/MCP server for scripting screenshots. No account, no hosted service — it drives the Chrome already on your machine.

```bash
npx openscreenshot shot https://example.com --out shot.png --full
```

MCP server: `{ "command": "npx", "args": ["openscreenshot", "serve"] }`, tool `capture_screenshot`.

Skill: https://openscreenshot.app/skills/capture-screenshot.md
