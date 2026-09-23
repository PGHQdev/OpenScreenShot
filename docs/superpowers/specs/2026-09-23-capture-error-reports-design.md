# Capture Error Reports Design

## Goal

Let a user explicitly submit a capture failure from the extension popup so the maintainer can diagnose failures that are otherwise visible only in a service-worker console.

## Scope

The feature has three parts:

1. A Cloudflare D1 migration creates `capture_error_reports`.
2. The existing site Worker accepts validated `POST /api/capture-errors` requests and inserts rows through the existing `FEEDBACK_DB` binding.
3. The extension stores the latest capture failure in `chrome.storage.session` and exposes a popup action that opens a reviewable report form and submits only after the user confirms.

Reports contain a bounded error code, user-facing message, technical detail, extension version, locale, and optional page URL/title supplied by the user. They never contain screenshots, cookies, IP addresses, or automatic background telemetry.

## API contract

`POST /api/capture-errors`

Request JSON:

```json
{
  "code": "unknown",
  "message": "Capture failed unexpectedly.",
  "detail": "Cannot access contents of the page",
  "version": "2.1.4",
  "locale": "en",
  "url": "https://example.com/page",
  "title": "Example"
}
```

The route requires an object, rejects unknown or oversized values, caps message/detail at 4,000 characters, caps URL/title at 2,000/500 characters, and returns `201 {"ok":true}` on success. Invalid JSON or fields return `400 {"ok":false,"error":"..."}`; database failure returns `500`.

## Extension flow

When `CAPTURE_ERROR` is broadcast, the background worker writes a pending report to session storage and opens the existing error popup. The popup reads the pending report, displays a single “Send error report” action, and opens an inline form with the details prefilled. Submission posts to `https://openscreenshot.app/api/capture-errors`; success clears the pending report and shows confirmation. A failed request leaves the report available for retry.

## Privacy and abuse controls

Submission is always user initiated. The endpoint applies a small request-body limit, field limits, and origin handling. The database stores no request metadata beyond the submitted fields and its server timestamp.

## Verification

Unit tests cover request validation and insertion, storage of the pending report, and popup success/failure state. The site build, extension build, lint, and full test suite must pass.
