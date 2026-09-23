-- Explicitly submitted capture diagnostics. No screenshot, cookie, IP, or
-- request metadata is stored; the optional page fields are supplied by the
-- user through the extension's review form.
CREATE TABLE IF NOT EXISTS capture_error_reports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  version TEXT NOT NULL,
  locale TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT ''
);

CREATE INDEX IF NOT EXISTS capture_error_reports_created_at ON capture_error_reports (created_at DESC);
CREATE INDEX IF NOT EXISTS capture_error_reports_code ON capture_error_reports (code);
CREATE INDEX IF NOT EXISTS capture_error_reports_version ON capture_error_reports (version);
