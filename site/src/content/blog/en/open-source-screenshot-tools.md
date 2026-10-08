---
title: Open-source screenshot tools for every platform
description: Open-source screenshot tools sorted by where they run, from OpenScreenShot and Screenity in the browser to ShareX on Windows, Flameshot on Linux, macOS, and Windows, Firefox Screenshots, and shot-scraper, Playwright, and Puppeteer for scripts.
audience: everyday
order: 8
---

Pick an open-source screenshot tool by where the thing you capture lives. For anything on a Windows screen, use ShareX. For Linux, macOS, or Windows desktops, use Flameshot. For web pages, use a browser tool such as OpenScreenShot or the Screenshots tool built into Firefox, and for screenshots from a script, use shot-scraper, Playwright, or Puppeteer.

OpenScreenShot is our product. This page says where it does not fit, and it does not rank the tools. All facts are as of 9 October 2026 and come from each project’s repository, store listing, or official site, linked below.

## Which tool covers which platform

| Tool                | Runs on                                                    | Captures                                                  | License         | Full page         | Video                            |
| ------------------- | ---------------------------------------------------------- | --------------------------------------------------------- | --------------- | ----------------- | -------------------------------- |
| OpenScreenShot      | Chrome, Firefox                                            | Web pages in a tab                                        | MIT             | Yes               | Tab recording, Chrome build only |
| Screenity           | Chrome and Chromium browsers that use the Chrome Web Store | Recordings of a tab, area, desktop, app window, or camera | GPL-3.0         | Not documented    | Yes                              |
| ShareX              | Windows                                                    | Anything on screen                                        | GPL-3.0         | Scrolling capture | Video and GIF                    |
| Flameshot           | Linux, macOS, Windows                                      | A screen area                                             | GPL-3.0         | No                | Not documented                   |
| Firefox Screenshots | Firefox desktop                                            | Web pages                                                 | Part of Firefox | Yes               | Not documented                   |
| shot-scraper        | Python 3.10 or newer                                       | Web pages, from a command                                 | Apache-2.0      | Yes, by default   | Yes, from a script file          |
| Playwright          | Node.js, Python, Java, .NET                                | Web pages, from code                                      | Apache-2.0      | Yes               | Yes                              |
| Puppeteer           | Node.js                                                    | Web pages, from code                                      | Apache-2.0      | Yes               | Yes, Chrome                      |

None of these tools runs on Android or iOS. A browser extension sees only the web page in its tab. A desktop app sees the whole screen but does not know where a web page ends.

## In the browser: OpenScreenShot

[OpenScreenShot](https://github.com/pghqdev/OpenScreenShot) is an MIT-licensed extension for [Chrome](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) and [Firefox](https://addons.mozilla.org/firefox/addon/openscreenshot/). It captures a full page, the visible area, a selected region, or one element. It then opens an editor with arrows, shapes, text, step numbers, blur, and crop, and exports PNG, JPEG, WebP, or PDF. Capture and editing run in your browser, and the extension does not upload your screenshots or recordings. The [documentation](/docs/) covers each mode.

The Chrome build also [records a tab](/docs/#record) with optional microphone, tab audio, and webcam, and exports MP4 or WebM. The Firefox build takes screenshots only.

OpenScreenShot is the wrong tool when the thing you need is outside a browser tab. It cannot capture the desktop, another app, or a browser settings page, and it does not record the whole screen.

## Browser recording: Screenity

[Screenity](https://github.com/alyssaxuu/screenity) is a screen recorder and annotation extension for Chrome. It records a tab, an area, the desktop, any app window, or the camera, with microphone and internal audio. It exports MP4, GIF, or WebM, or saves to Google Drive. You can draw, add text, arrows, and shapes, and blur sensitive page content.

The license is [GPL-3.0](https://github.com/alyssaxuu/screenity/blob/master/LICENSE). The README says the license changed to GPLv3 for the Manifest V3 version, from version 3.0.0. The extension is free and needs no sign-in for local recordings. [Screenity Pro](https://screenity.io/pro) costs $10 a month or $120 a year after a 7-day trial and adds an editor, link sharing, and cloud hosting on EU servers, with an account. The README says some code paths connect to Screenity Pro, and that they are active only in the Chrome Web Store version.

Screenity asks for access to all websites at install. Its docs do not describe full-page screenshots. Pick it over OpenScreenShot when you need to record the desktop or another app; see [Screenity alternatives](/alternatives/screenity/).

## Windows: ShareX

[ShareX](https://getsharex.com/) is a free Windows app with no ads, licensed under [GPL-3.0](https://github.com/ShareX/ShareX). It captures the screen, a window, or a region, and its [scrolling capture](https://getsharex.com/docs/scrolling-screenshot) compares successive screenshots and appends the changed sections, so one image can hold content that scrolls past the screen. It also records video and GIFs, and its README lists OCR and QR code scanning.

The image editor has shapes, arrows, text, speech balloons, blur, pixelate, highlight, and spotlight. ShareX can upload to many services, and after-capture tasks can upload automatically if you configure them. Check those settings before you capture private content. You can get it as an installer, a portable build, or from the Microsoft Store or Steam. The latest release, v21.0.0, came out on 3 July 2026.

ShareX does not run on macOS or Linux.

## Linux, macOS, and Windows: Flameshot

[Flameshot](https://flameshot.org/) is a free screenshot tool for Linux, macOS, and Windows, licensed under [GPL-3.0](https://github.com/flameshot-org/flameshot). You select an area and annotate it in place with arrows, highlights, blur or pixelate, text, freehand lines, boxes, and counter numbers. It also has a command-line interface. Its README lists an optional upload to Imgur, which the Return key starts, so learn that key before you capture private content.

[Version 14.0.0](https://github.com/flameshot-org/flameshot/releases/tag/v14.0.0) (June 2026) asks which monitor to capture and uses xdg-desktop-portal as its main capture path on Linux. The README calls GNOME and Plasma Wayland support experimental.

Flameshot has no scrolling capture. The [feature request](https://github.com/flameshot-org/flameshot/issues/1130) is still open. We found no recording feature in its docs. For a full web page on Linux, combine Flameshot with a browser tool.

## Built in: Firefox Screenshots

Firefox is open source, and its Screenshots tool needs no install. Right-click a page, choose **Take Screenshot**, and pick a region, the visible area, or **Save full page**, per [Mozilla’s guide](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/). You copy or download the result. Mozilla [ended uploads](https://blog.mozilla.org/futurereleases/2019/01/24/clarifying-the-future-of-firefox-screenshots/) to its Screenshots server in Firefox 67 (May 2019), so captures stay local.

For a command, the Firefox DevTools console accepts `:screenshot --fullpage`, which saves a PNG to Downloads, per the [DevTools docs](https://firefox-source-docs.mozilla.org/devtools-user/taking_screenshots/index.html). Chrome’s DevTools front end is also open source, under [BSD-3-Clause](https://github.com/ChromeDevTools/devtools-frontend), and its **Capture full size screenshot** command saves a PNG. The [full-page screenshot guides](/full-page-screenshot/) cover each browser.

## From a script: shot-scraper, Playwright, Puppeteer

These tools capture web pages from a command or from code, for repeat work and CI. They load the page in their own browser, so they do not see your signed-in tabs.

- [shot-scraper](https://github.com/simonw/shot-scraper) is a Python command-line tool built on Playwright. It takes full-page screenshots by default and also saves PDFs and records videos from a YAML script.
- [Playwright](https://github.com/microsoft/playwright) is Microsoft’s browser automation and test framework for Chromium, Firefox, and WebKit, with screenshot, PDF, and video APIs.
- [Puppeteer](https://github.com/puppeteer/puppeteer) is Google’s Node.js library for Chrome and Firefox, with screenshot, PDF, and MP4 recording APIs.

Our own MIT-licensed `openscreenshot` package adds a command-line tool and an MCP server for AI agents. The [developer comparison](/blog/website-screenshot-tools-for-developers/) covers all of these with commands.

## Which one to pick

- **Anything on a Windows screen, with scrolling capture:** ShareX.
- **A screen area on Linux or macOS:** Flameshot.
- **A full web page with markup and PDF export:** OpenScreenShot, or Firefox Screenshots for a quick capture with no install.
- **A recording of the desktop or another app:** Screenity, or ShareX on Windows.
- **Screenshots from a script or CI:** shot-scraper, Playwright, or Puppeteer.

If the tool does not need to be open source, the [full-page extension comparison](/blog/full-page-screenshot-extensions/) adds GoFullPage, FireShot, and others. The [comparison page](/compare/) puts OpenScreenShot, GoFullPage, and FullPage Capture side by side.
