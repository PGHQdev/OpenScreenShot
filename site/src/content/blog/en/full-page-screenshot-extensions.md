---
title: Full-page screenshot extensions compared (2026)
description: OpenScreenShot, GoFullPage, FullPage Capture, Awesome Screenshot, FireShot, and Nimbus/FuseBase compared by price, source code, install permissions, annotation, PDF, and recording, plus the no-install tools built into browsers.
audience: everyday
order: 7
---

If you need a full-page screenshot only now and then, the tools built into Chrome DevTools, Microsoft Edge, and Firefox capture a whole page with no install. If you capture pages often, the extensions below differ in what is free, what site access they ask for at install, whether they record video, and whether their source is public. Each section says who the tool suits.

OpenScreenShot is our product, and we list the cases where another tool fits better. All facts are as of 9 October 2026 and come from store listings, extension manifests, and vendor pages, linked in each section. This page compares features and does not rank the tools.

## The tools at a glance

| Tool                  | Price                                  | Open source                      | All-sites access at install | Annotation free?                         | PDF                                  | Recording              |
| --------------------- | -------------------------------------- | -------------------------------- | --------------------------- | ---------------------------------------- | ------------------------------------ | ---------------------- |
| OpenScreenShot        | Free                                   | Yes, MIT                         | No                          | Yes                                      | Yes                                  | Tab only, Chrome build |
| GoFullPage            | Free; Premium $12 a year               | No                               | No                          | No, Premium                              | Yes; smart page splitting is Premium | No                     |
| FullPage Capture      | Free; Pro $19 a year                   | No                               | Yes                         | Yes                                      | Yes; searchable PDF is Pro           | No                     |
| Awesome Screenshot    | Free plan; paid from $5 a month        | No public source                 | Yes                         | Basic tools; all tools on paid plans     | Yes                                  | Desktop, tab, camera   |
| FireShot              | Free; Pro $39.95 a year or $99.95 once | No                               | No                          | Text, arrows, blur per listing           | Yes, with links; advanced PDF is Pro | No                     |
| FuseBase Pro (Nimbus) | Free plan; Pro price not published     | No                               | Yes                         | Annotation and blur; split not published | Yes                                  | Screen and webcam      |
| Chrome DevTools       | Free, built in                         | DevTools front end, BSD-3-Clause | No install                  | No editor documented                     | Not documented                       | Not documented         |
| Edge Screenshot       | Free, built in                         | No                               | No install                  | Pen and touch markup                     | Not documented                       | Not documented         |
| Firefox Screenshots   | Free, built in                         | Part of Firefox                  | No install                  | Not documented                           | Not documented                       | Not documented         |

“All-sites access at install” means the extension asks for host access to every website when you add it. Chrome shows that request as “Read and change all your data on all websites.”

## OpenScreenShot

[OpenScreenShot](https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp) is free, has no paid tier, and publishes its [source on GitHub](https://github.com/pghqdev/OpenScreenShot) under the MIT license. It is in the Chrome Web Store and [Firefox Add-ons](https://addons.mozilla.org/firefox/addon/openscreenshot/). One click on the toolbar icon starts a full-page capture; visible area, selected region, and element modes are on the right-click menu and keyboard shortcuts. See the [capture modes](/docs/#modes).

The editor includes shapes, arrows, text, step numbers, blur with an opaque fill, spotlight, crop, and cut. Export is PNG, JPEG, WebP, or PDF as one page, fit to A4 or Letter, or split across pages. It asks for no host access at install. The Chrome build can [record a tab](/docs/#record) to MP4 or WebM; Chrome asks for tab capture the first time you record. The Firefox build takes screenshots only.

Where it fits less well:

- It captures web pages in a browser tab. It cannot capture your desktop or other apps, and it records a tab only.
- It has no cloud storage or share links. You share the exported file yourself.
- Its PDF holds the screenshot as an image, so the text is not searchable.
- Browser pages such as `chrome://` settings and the browser stores cannot be captured.

## GoFullPage

[GoFullPage](https://gofullpage.com/) captures a page in one click and exports PNG, JPEG, or PDF. Its [FAQ](https://gofullpage.com/faq) says the free version has no limit on screenshots or image and PDF export. [Premium](https://gofullpage.com/premium) costs $12 a year after a 7-day trial and adds cropping, annotations (blur, text, highlight), a URL and timestamp, and smart PDF page splitting.

The code is closed. The FAQ says the developer made a private fork of the original MIT project in 2018. GoFullPage was removed from the Chrome Web Store in August 2026 over what its [blog](https://blog.gofullpage.com/2026/08/11/gofullpage-chrome-update/) calls “a copyright-related issue,” and the main listing came back on 10 September 2026. An official [Firefox version](https://addons.mozilla.org/en-US/firefox/addon/gofullpage-screenshot/) arrived on 7 September 2026. It asks for no host access at install.

GoFullPage suits people who want one-click capture and PDF export without markup, or who will pay for markup. See [GoFullPage alternatives](/alternatives/gofullpage/).

## FullPage Capture

[FullPage Capture](https://fullpagecapture.net/) says capture, saving, copying, and printing are free, with no watermark and no usage limit. Its [Chrome listing](https://chromewebstore.google.com/detail/ggacghlcchiiejclfdajbpkbjfgjhfol) describes a free editor with arrows, shapes, text, a highlighter, numbered badges, and blur, plus PDF with clickable links. Pro costs $19 a year after a 7-day trial and adds searchable PDF, evidence mode, batch capture, and cloud upload.

The code is closed, and we found a Chrome listing only. Its manifest requires access to all websites, so Chrome shows the all-sites warning at install. It suits people who need searchable PDFs or batch capture and accept that permission. See [FullPage Capture alternatives](/alternatives/fullpage-capture/).

## Awesome Screenshot

[Awesome Screenshot](https://chromewebstore.google.com/detail/nlipoenfbbikpbjkfpfillcgkoblgpmj), from Diigo, combines screenshots with a recorder for the desktop, a tab, or a camera. Its [pricing page](https://www.awesomescreenshot.com/pricing) lists a free plan with up to 100 screenshots, basic annotation, and 720p recordings. Basic costs $5 a month billed yearly, and Professional costs $6 a month billed yearly with recording up to 4K. It offers cloud storage with share links, and local saving.

It asks for access to all websites at install, and its Chrome privacy section discloses collection of “Website content.” Its [Firefox listing](https://addons.mozilla.org/en-US/firefox/addon/screenshot-capture-annotate/) names the Mozilla Public License 2.0, but we found no public source repository. It suits teams that want share links and a screen recorder in one tool. See [Awesome Screenshot alternatives](/alternatives/awesome-screenshot/).

## FireShot

[FireShot](https://getfireshot.com/) saves a full page as PDF with links, PNG, or JPEG. FireShot Pro costs $39.95 a year or $99.95 once for two devices, per its [buy page](https://getfireshot.com/buy.php). Pro adds advanced PDF export, an editor with smart annotations on Windows, capture history, and batch capture. We did not confirm which editing tools the free Chrome version includes.

The code is closed. FireShot asks for no host access at install, but it requests native messaging, which Chrome shows as a separate warning. Its [Firefox add-on](https://addons.mozilla.org/en-US/firefox/addon/fireshot/) was last updated on 5 June 2023. FireShot suits Windows users who want batch capture or a one-time license. See [FireShot alternatives](/alternatives/fireshot/).

## Nimbus and FuseBase Pro

The original Nimbus Screenshot Chrome listing now shows “This item is not available,” and the Nimbus capture page redirects to [FuseBase](https://thefusebase.com/screenshot/). Nimbus Web now publishes [FuseBase Pro](https://chromewebstore.google.com/detail/fddbloohgcjopkmnjdeodjcfbgiimpcn) for screenshots, screen and webcam recording, annotation, blur, and PDF saving. It uploads to FuseBase, Google Drive, Dropbox, and Slack.

The free plan records up to 5 minutes and Pro up to 10 hours. The [FuseBase pricing page](https://thefusebase.com/pricing/) lists platform plans and does not name a price for the extension. FuseBase Pro asks for access to all websites at install. It suits people who already work in FuseBase. See [Nimbus alternatives](/alternatives/nimbus/).

## No install: tools built into the browser

### Chrome DevTools

Open DevTools, press Ctrl+Shift+P (Cmd+Shift+P on macOS), type “screenshot,” and choose **Capture full size screenshot**. Chrome saves a PNG. The docs describe no editor; the [Command Menu docs](https://developer.chrome.com/docs/devtools/command-menu) list the other screenshot commands. See [the Chrome guide](/full-page-screenshot/chrome/).

### Microsoft Edge Screenshot

Edge renamed Web Capture to Screenshot, and Ctrl+Shift+S opens it, per Microsoft’s [policy page](https://learn.microsoft.com/en-us/deployedge/microsoft-edge-policies/webcaptureenabled). It captures a full page or an area, and you can mark it up with pen or touch. See [the Edge guide](/full-page-screenshot/edge/).

### Firefox Screenshots

Right-click a page, choose **Take Screenshot**, then **Save full page**, per [Mozilla’s guide](https://blog.mozilla.org/en/firefox/how-to-capture-screenshots-with-firefox/). You copy or download the result. Uploads to a Mozilla server ended with Firefox 67 in May 2019. See [the Firefox guide](/full-page-screenshot/firefox/).

For Safari, Brave, Opera, Vivaldi, and Arc, see the [per-browser guides](/full-page-screenshot/).

## Which one to pick

- **One page, today, no install:** the built-in tool in your browser.
- **Free markup and PDF, no all-sites access at install, readable source:** OpenScreenShot.
- **One-click capture with no markup:** GoFullPage’s free version.
- **Searchable PDF or batch capture:** FullPage Capture Pro or FireShot Pro.
- **Share links and desktop recording for a team:** Awesome Screenshot or FuseBase Pro.
- **Screenshots of desktop apps:** a desktop tool; see [open-source screenshot tools for every platform](/blog/open-source-screenshot-tools/).
- **Screenshots from a script or CI:** see [website screenshot tools for developers](/blog/website-screenshot-tools-for-developers/).

All these tools can struggle with infinite feeds and lazy-loaded images; the [Chrome full-page guide](/blog/full-page-screenshot-chrome/) explains how to check a capture. For a side-by-side of OpenScreenShot, GoFullPage, and FullPage Capture, see the [comparison page](/compare/).
