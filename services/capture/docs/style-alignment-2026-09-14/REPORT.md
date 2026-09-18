# Capture page alignment

Live: https://openscreenshot.app/capture/

Worker version: `53334fa6-ad94-4690-b6f5-c8cc3694eff2`.

The capture Worker imports the main site's actual design tokens, font definitions, base primitives, font files and brand SVG. Page-specific CSS follows the site's header, black pill buttons, card edges, heading weights, spacing and muted footer. The hosted capture privacy explanation remains distinct from the local extension's privacy claims.

Fixed the URL field's obsolete `type=url` CSS selector. The capture button keeps its label and decorative indicator separate, and the empty preview now explains progress while a capture is running. Bare-domain normalization remains in place.

Verification:

- TypeScript, lint, Worker dry build and all 44 service tests passed.
- Live `example.com` bare-domain submission completed; preview loaded at 1440 × 900; authenticated download returned HTTP 200, image/png, 19,628 bytes.
- 320, 375, 414 and 768 CSS pixel widths had no horizontal document overflow. Desktop and 320px screenshots inspected.
- All five font faces loaded successfully through the capture origin.
- Unsupported domain submission showed an inline error and re-enabled submission.
- axe found zero violations. The decorative arrow required manual contrast inspection: it inherits the white-on-ink button colors.
- Live mobile Lighthouse: performance 100, accessibility 100, best practices 92, SEO 63, agentic browsing 100. SEO remains limited by intentional noindex. Best-practices findings concern an existing injected Ahrefs analytics script blocked by CSP, not the capture UI. CSP was not weakened to permit analytics.

Files outside the capture service are unchanged by this styling update. The preview still uses the existing two-host allowlist.
