# OpenScreenShot — Claude Code implementation brief

Hand this file to Claude Code in the PGHQdev/OpenScreenShot repo. Do the work in this order. Do not skip P0. Do not invent a subscription, a cloud account, standing host permissions, or a rename of the GitHub/brand.

- Repo: https://github.com/PGHQdev/OpenScreenShot
- Store: https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp (hdabbojjccojlapnfjpdppcpfcnhgmdp)
- Site: https://openscreenshot.app/ (Astro app in site/)
- Date of brief: 2026-08-31

---

## 0. How to use this file

You are implementing a positioning and packaging change, not a new product.

1. Read sections 1-3 so you do not helpfully add features to the store title or request extra permissions.
2. Ship P0 as one PR (extension UX + locale strings + listing copy file + screenshot pipeline + review prompt + extra locales).
3. Ship P1 as a second PR (site compare page, README, homepage copy).
4. Leave P2 and Human / CWS console as a checklist at the end of the PR description. The founder uploads screenshots and pastes store copy in the Chrome Web Store dashboard. You cannot publish the store listing from git.

If a path in this brief is slightly off, search the repo. The flags and files named below were confirmed on main at v1.5.0.

---

## 1. What we are trying to win

Three scoreboards, in this order:

1. Chrome Web Store installs + reviews, low churn. This is the emergency. 1,000 users and 4 ratings vs FullPage Capture at 100,000 users / 860 ratings / Featured, and a second clone at number 1 in CWS search.
2. GitHub stars, talk, backlinks, domain rating. Currently about 67 stars, a 14-point Show HN, absent from 2026 best-screenshot-extension roundups.
3. Later: a paid enterprise version. Modelled on GoFullPage (free capture forever, $12/yr consumer editor, custom enterprise for legal/gov/finance). Do not put a paywall on capture, annotate, blur, or PDF. Nimbus died that way. FullPage Capture's own reviews already say "don't add a subscription."

### Position (memorize this)

OpenScreenShot is the one-click full page screenshot you can actually audit.

Same job as GoFullPage. The only listing still in the store that is really open source (MIT, public, linked) and really permissionless (host_permissions empty at install). FullPage Capture says the same privacy words while requesting standing access to every website and shipping a closed binary.

CWS search is one query: full page screenshot. One-click is the product. Annotate is why they stay. Source plus zero host permissions is why they trust you over the clone. Recording, CLI, and MCP are GitHub and the website, not the store hero.

### What happened in the market (do not recode this, just do not fight it)

- GoFullPage (11M users) was removed from CWS on 11 Aug 2026 for a copyright dispute, not malware. Chrome still showed "might be unsafe." Refugees grabbed whatever ranked for "full page screenshot."
- FullPage Capture (fullpagecapture.net) is a rename of an old listing (previously Screenshot Master), not a 13-day-old startup. Featured. 100k users. Privacy policy dated 18 Aug 2026. Standing access to every site. Not open source. Uninstall survey can send the last 5 page URLs.
- A second clone titled "Full Page Screenshot - Screen Capture and Editor" is number 1 in CWS search. OpenScreenShot is not on page 1.
- GoFullPage BETA is live at 100k users. Homepage still claims 11M.
- Winning tiles in search are saturated color blocks with "one click" in huge type. Ours are grey editor UI screenshots. Invisible at thumbnail size.
- GoFullPage privately forked in 2018 and still links the old MIT repo. We are the only one whose OSS claim is true.

Search the repo for expressMode. It already exists and defaults to false. Popup is src/popup. Capture is src/background. Settings types are src/shared/types.ts.

---

## 4. P0 — ship this week (one PR)

### P0.1 Default toolbar click = full page capture

Goal: first click after install behaves like GoFullPage and FullPage Capture. Click the icon, full page starts. No mode menu.

1. Set DEFAULT_SETTINGS.expressMode to true for new installs.
2. Migrate existing installs to expressMode true once. Stored settings already persist false. If you only change the default, current users keep the picker. Bump a settings version or a one-shot migrated flag. On first run after this version, turn expressMode on unless you can prove the user toggled it themselves. Keep the settings toggle so they can go back.
3. When expressMode is true, a toolbar click captures full page (same pipeline as the popup Full Page item). Do not show the mode-picker popup. Reuse existing capture progress so the click does not feel dead. After capture, honor captureAction (editor / clipboard / download). Default stays editor.
4. When expressMode is false, current popup behavior, unchanged.
5. Other modes stay obvious: page right-click menu (full, visible, region, record, settings), existing keyboard shortcuts. Add a menu item that opens the picker/settings when the default popup is gone.
6. Settings label in plain language: "Clicking the toolbar icon captures the full page." Help text: "Turn off to choose Full page, Visible, or Region each time."
7. First capture after the migration: one dismissible note, once. "Toolbar click now captures the full page. Right-click for other modes." Never show again after dismiss.

Tests: default true, migration, and toolbar-click branching. Manual: fresh profile captures on click; upgraded profile migrates; toggle off restores picker; shortcuts and context menu still work.

Do not make region or visible the default. Full page is the CWS job.

### P0.2 Locale plus store name and short description

Chrome listing name max 45 characters. Short description max 132 characters.

Update the English messages (and every other locale):

- extName: Full Page Screenshot - OpenScreenShot
  (38 characters, fits)
- extDesc: Full page screenshot in one click. Open source, 100% private, no account, no uploads.

Also put these exact strings in store/STORE_LISTING.md (create that file) so the founder can paste them into the Chrome Web Store dashboard, which does not always take extName as the visible title.

Translate extName and extDesc in every locale. Keep the English keyword "Full Page Screenshot" in the English name. In other languages, use the natural equivalent of "full page screenshot" first, then OpenScreenShot.

Leave the manifest name and description pointing at those message keys. The toolbar tooltip can stay OpenScreenShot.

### P0.3 Store long description (paste-ready)

Create store/STORE_LISTING.md with the block below. This is the Chrome Web Store detailed description. First screen (before see-more) must sell one-click plus auditability. Features go below the fold. Use this English text unless a character limit forces a trim. Do not add an emoji wall.

Title: Full Page Screenshot - OpenScreenShot

Short description: Full page screenshot in one click. Open source, 100% private, no account, no uploads.

Detailed description:

The full page screenshot you can actually audit.

Click the icon. Get the entire scrolling page. Annotate, export PNG or PDF, done.

OpenScreenShot is MIT-licensed, 100 percent private, and asks for no standing access to the sites you visit. No account, no watermark, no uploads, no telemetry. It works with Wi-Fi off. Read the source: https://github.com/pghqdev/OpenScreenShot

HOW IT WORKS

- Click the OpenScreenShot icon. The page scrolls and stitches itself into one image.
- Annotate with arrows, boxes, text, numbered steps, blur, and crop. All free.
- Export PNG, JPEG, WebP, or PDF, or copy to the clipboard.
- Right-click the page for visible-area or region capture, or to record the tab.

WHY THIS ONE

- One click. No mode menu in the way of a full page screenshot.
- Open source (MIT). You can read every line.
- No standing site access at install. Access is only the tab you just captured.
- No account, no cloud, no watermark. Captures never leave your machine.
- Sticky headers appear once. Nested scrollers and long pages are handled.
- Annotate, blur, crop, and PDF are free.

MORE (when you need it)

- Visible area and selected-region capture from the right-click menu or shortcuts.
- Tab recording with auto-zoom, trim, and WebM export. Optional, local, no account.
- Keyboard: Ctrl or Cmd Shift S full page. Other shortcuts stay as they are today.

OpenScreenShot is free and open source.
Website: https://openscreenshot.app
Source: https://github.com/pghqdev/OpenScreenShot
Privacy: https://openscreenshot.app/privacy/

Do not put CLI, MCP, a who-it-is-for list, or sister-product cross-promos in the first screen.

### P0.4 Store gallery slides

Five marketing slides, not raw UI captures. Extend the existing shots script. Put the PNGs in store/screenshots.

1. Red: THE WHOLE PAGE. ONE CLICK.
2. Cyan: SCROLLS. STITCHES. DONE.
3. Black: ANNOTATE. NO PAYWALL.
4. Green: WI-FI OFF. STILL WORKS.
5. Orange: MIT. READ THE SOURCE.

Huge type on a saturated field. Founder uploads them in that order.

### P0.5 Review prompt

We have four ratings. That is why the listing looks empty next to hundreds of reviews.

After a successful export or copy, not after every capture and not on first run, show one dismissible local prompt:

If OpenScreenShot saved you a minute, a rating on the Chrome Web Store helps other people find a private tool.
Buttons: Rate on Chrome Web Store. Not now.

Rules:

- Only after 3 successful exports or copies on that install.
- Once per install. If they click either button, never show again (a storage flag).
- Link the official listing reviews tab.
- No blocking the export, no fake stars, no network call, no uninstall survey.

### P0.6 More languages

Winners ship dozens of locales. We ship about 11. Add at least: Spanish, Latin American Spanish, Brazilian Portuguese, German, French, Italian, Japanese, Korean, Simplified Chinese, Traditional Chinese, Russian, Polish, Dutch, Turkish, Vietnamese, Indonesian, Arabic, Hindi.

Minimum for each: extName, extDesc, popup mode labels, the express-mode settings string, context menu labels, review-prompt strings, and the errors a user sees on first capture.

Do not machine-translate the privacy policy in this PR.

### P0.7 Icon

Lower priority than the gallery. Only if time: a mark that reads at 16 pixels. The search tile matters more.

---

## 5. P1 — this month (second PR)

### P1.1 Homepage copy

Files: the Astro homepage plus site i18n strings.

Keep the H1 energy. Put "one click" in the subhead so it matches the store query.

English:

- Eyebrow: Free · Open source · MIT licensed
- H1: Click. Captured. Done.
- Subhead: Full page screenshot in one click. So private it works with Wi-Fi off. No account, no watermark, no cloud.
- Primary CTA: Add to Chrome
- Secondary: View on GitHub

Move CLI, MCP, and Record below the privacy/trust grid. Do not delete them. Demote them.

Update the capture feature tile so the first sentence is: Click the icon. Get the whole page.

### P1.2 Comparison page

Add a page at openscreenshot.app/compare/

Title: OpenScreenShot vs GoFullPage vs FullPage Capture

Intro:
GoFullPage was removed from the Chrome Web Store in August 2026. OpenScreenShot is the open-source full page screenshot you can actually audit. FullPage Capture is a closed extension that says local while asking for access to every website.

Table, facts only, no insults.

- In the Chrome Web Store as of 31 Aug 2026: OpenScreenShot yes. FullPage Capture yes. GoFullPage main listing removed, BETA only.
- Open source: OpenScreenShot yes, MIT, public. FullPage Capture no. GoFullPage ancestor repo, product privately forked since 2018.
- Standing site access: OpenScreenShot none. FullPage Capture every site. GoFullPage none at install.
- One-click full page: all three yes.
- Annotate, blur, crop: OpenScreenShot free. FullPage Capture free. GoFullPage paid.
- PDF extras: OpenScreenShot free. FullPage Capture free. GoFullPage paid.
- Tab recording: OpenScreenShot free. The other two no.
- Readable source: github.com/pghqdev/OpenScreenShot. FullPage Capture none. GoFullPage old GitHub, not the shipping binary.

CTA: Add to Chrome. Secondary: Star on GitHub.

Legal: facts only. Private fork since 2018 is from GoFullPage's own FAQ. Do not say malware, stole, or scam.

Link it from the homepage once. Add it to the sitemap and footer.

### P1.3 README

New lede:

OpenScreenShot. One-click full page screenshots for Chrome. MIT licensed. Nothing leaves your machine.

Most screenshot extensions want an account, every site you visit, or money to draw an arrow. This one captures the whole scrolling page when you click the icon, lets you annotate for free, and publishes every line.

Keep badges, install, the permissions table, and dev docs. Add a short compare table and a link to the compare page. Mention toolbar click equals full page. Keep CLI and MCP below Features.

### P1.4 Docs

First recipe: click the icon to capture the full page. Document the settings toggle.

---

## 6. P2 — do not implement now

Leave these in the PR description as not in this change:

- No consumer paid plan. Capture, annotate, blur, crop, and PDF stay free forever.
- Enterprise later: seats, signed builds, security questionnaire, guaranteed capture, support. Sold to legal, government, and finance. The audit is the public source. Do not stub a paywall.
- Ko-fi stays.
- Product Hunt, Show HN, and pitching 2026 roundups are founder tasks. The compare page is the asset they need.

---

## 7. Human checklist after the PR (founder)

Claude Code cannot publish the store.

1. Paste title, short description, and detailed description from store/STORE_LISTING.md.
2. Upload the five slides in order. Replace every current UI screenshot.
3. Confirm the privacy declarations still say the extension does not collect data.
4. Submit for review.
5. After it is live: install on a clean Chrome profile and time click-icon-to-full-page. If a picker appears, P0.1 failed.
6. Ask current users for a store review. Four ratings is the social-proof bug.

---

## 8. Acceptance criteria

Extension:

- Fresh install: toolbar click starts a full-page capture. No mode menu.
- Upgraded install: same, unless the user turned the setting off.
- Setting off: popup picker restored.
- Right-click menu still has full, visible, region, record, settings.
- Shortcuts unchanged.
- No new install-time site access. No new network calls.
- Review prompt appears once after 3 exports, never again after dismiss.
- Unit tests cover expressMode default, migration, and toolbar-click branching.

Listing assets:

- extName is Full Page Screenshot - OpenScreenShot (45 character max).
- extDesc is the one-click / open source / private line (132 character max).
- store/STORE_LISTING.md exists with paste-ready copy.
- Five billboard PNGs in store/screenshots. Headlines match P0.4.
- New locales exist with name, short desc, and UI chrome.

Site / GitHub if P1 is included:

- Homepage subhead contains "one click" and still says Wi-Fi off / MIT.
- /compare/ renders the table and does not accuse anyone of malware.
- README lede is one-click plus MIT, not a feature dump.

---

## 9. Suggested PRs

PR 1: Make toolbar click capture the full page, and package the store for one-click search.

PR 2: Add /compare, retarget homepage and README at one-click plus auditability.

Do not mix a recorder rewrite, a new capture engine, or a rebrand into these PRs.

---

## 10. Copy deck

- CWS title: Full Page Screenshot - OpenScreenShot
- CWS short: Full page screenshot in one click. Open source, 100% private, no account, no uploads.
- Position: The one-click full page screenshot you can actually audit.
- Settings toggle: Clicking the toolbar icon captures the full page
- Site H1: Click. Captured. Done.
- Site subhead: Full page screenshot in one click. So private it works with Wi-Fi off. No account, no watermark, no cloud.

That is the whole job. Default the icon. Billboards not UI shots. Tell the truth they cannot copy: MIT, no extra site access, Wi-Fi off.

---

## 11. Rating funnel (added 2026-08-31, replaces the old P0.5 "no uninstall" line)

Intentional, not dark. FullPage Capture puts Rate in the capture chrome, opens a welcome page that makes you try a shot immediately, and catches uninstalls. Do that. Do not send the last pages they visited. Do not attach any captured URL to the uninstall form. Version and locale only.

CWS review URL:
https://chromewebstore.google.com/detail/hdabbojjccojlapnfjpdppcpfcnhgmdp/reviews

### Surface A — Welcome page on first install

On chrome.runtime.onInstalled with reason install, open a bundled welcome page (same idea as their welcome/welcome.html).

Headline: You're in. Click the icon.

Body: OpenScreenShot captures the whole page in one click. No account. Nothing leaves this machine. Try it on this page right now.

Primary line: Click the OpenScreenShot icon in the toolbar.

Secondary: Or press Ctrl+Shift+S (Cmd+Shift+S on Mac).

The welcome page itself should be a tall, colorful dummy article so a full-page capture looks good. After they capture, the editor/result chrome is the next surface.

Do not open welcome on update, only on fresh install.

### Surface B — Rate is always in the capture chrome

On the result page and the editor header, add a star control labeled Rate, next to Save / PDF / Copy. Always visible. Not a modal. One click opens the CWS reviews tab.

Tooltip: 30 seconds. It is how other people find a private screenshot tool.

If they click it, set a local flag ratedOrDismissed so Surface C never nags.

### Surface C — One post-success prompt

After 3 successful exports or copies, if they have not used the Rate star, show a non-blocking banner or modal:

Headline: Is this saving you time?

Body: A short rating on the Chrome Web Store is the main reason a private tool gets found. Four reviews looks like nobody uses this. You can change that.

Buttons: Rate on Chrome Web Store. Not now.

Once per install. Never blocks save. No network call.

### Surface D — Uninstall page (this is the one they asked for)

Chrome cannot show an extension page after uninstall. Use chrome.runtime.setUninstallURL pointing at a page we host:

https://openscreenshot.app/uninstall

Set it on startup. Query allowed: extension version, locale. Query forbidden: any page URL, any capture, any title.

Add site/src/pages/[...lang]/uninstall as an Astro page. No analytics. No cookies. Optional typed feedback only if they hit Send.

Layout:

Eyebrow: OpenScreenShot
Headline: Before you go.
Subhead: If it worked, a rating is the whole growth engine. If it failed, tell us. We read it.

Two paths, not one dump form:

Card 1 (happy / it was fine)
Headline: It worked, I just don't need it.
Body: Then a public rating is the highest-leverage thing you can do for an open-source tool. It takes 30 seconds.
Button: Rate OpenScreenShot (opens CWS reviews, new tab)

Card 2 (broken / missing)
Headline: Something was wrong.
Body: What happened? What did you expect?
Textarea placeholder: Example: full page missed the footer on a dashboard. Or: I wanted region capture on first click.
Button: Send feedback
After send: Thanks. If you are willing, a rating still helps people who need a private option. [Rate anyway]

Do not ask for email. Do not pre-fill the URL they were on. Do not list "last pages." If you need a backend for the textarea, use a simple form endpoint the founder already has, or GitHub issue create with a template. If neither exists, mailto:support@minimalistprojects.com with subject Uninstall feedback.

Footer: Source is still public. github.com/pghqdev/OpenScreenShot

Uninstall copy must not guilt, dark-pattern, or claim they will lose files (captures are already local).

### What not to copy from FullPage Capture

- Do not ship the last N page addresses on uninstall.
- Do not put Rate behind a "we read every report" issue modal only. The star lives in the header.
- Welcome page is for trying a capture, not for a feature tour.

### Acceptance add-ons

- Fresh install opens welcome. Update does not.
- Welcome page can be captured with the toolbar icon (one-click).
- Rate star is visible on result and editor.
- Uninstall of a loaded unpacked or store build opens openscreenshot.app/uninstall.
- The uninstall URL contains no page URLs.
- Privacy page mentions: uninstall opens a local-to-us feedback page. We do not receive your browsing history.
