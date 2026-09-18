CREATE TABLE jobs (
  id TEXT PRIMARY KEY,
  request_key TEXT NOT NULL UNIQUE,
  request_hash TEXT NOT NULL,
  input_json TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('queued', 'running', 'succeeded', 'failed')),
  attempts INTEGER NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 3),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  next_attempt_at INTEGER NOT NULL,
  enqueued_at INTEGER NOT NULL DEFAULT 0,
  lease_token TEXT,
  lease_until INTEGER NOT NULL DEFAULT 0,
  artifact_key TEXT,
  width INTEGER,
  height INTEGER,
  bytes INTEGER,
  browser_ms REAL,
  error_code TEXT
);
CREATE INDEX jobs_recovery ON jobs(status, next_attempt_at, lease_until);
CREATE INDEX jobs_expiry ON jobs(expires_at);
CREATE INDEX jobs_created ON jobs(created_at);
