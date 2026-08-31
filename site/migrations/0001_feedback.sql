-- Uninstall feedback (rating funnel Surface D).
--
-- One row per submission, and only what the sender typed plus the two values
-- the uninstall URL already carried. No IP, no user agent, no referrer, no
-- cookie, no id that survives across submissions: the point of this table is
-- "what broke, grouped by version", and nothing here is meant to identify who
-- said it. `contact` is optional and only ever holds what someone chose to
-- type into a box labelled as optional.
--
-- `version` and `locale` are stored as the page received them, but bounded and
-- shape-checked at the route before they get here.
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
  -- Extension version from ?v, 'unknown' when the page was opened directly.
  version TEXT NOT NULL,
  -- Site locale the page was rendered in: en, de, ja, pt-br, ...
  locale TEXT NOT NULL,
  -- What they wrote. Capped at the route; the column is the same story.
  message TEXT NOT NULL,
  -- Optional reply address. Blank unless they asked to be written back to.
  contact TEXT NOT NULL DEFAULT ''
);

-- The two questions this table exists to answer: what came in lately, and
-- which versions the complaints cluster on.
CREATE INDEX IF NOT EXISTS feedback_created_at ON feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS feedback_version ON feedback (version);
