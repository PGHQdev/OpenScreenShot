ALTER TABLE jobs ADD COLUMN owner_hash TEXT;
ALTER TABLE jobs ADD COLUMN network_hash TEXT;
ALTER TABLE jobs ADD COLUMN downloaded_at INTEGER;
CREATE INDEX jobs_owner ON jobs(owner_hash,created_at);
CREATE INDEX jobs_network ON jobs(network_hash,created_at);
CREATE TABLE beta_activity (
 owner_hash TEXT PRIMARY KEY,
 first_seen INTEGER NOT NULL,
 last_seen INTEGER NOT NULL,
 days_active INTEGER NOT NULL DEFAULT 1,
 captures INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE beta_daily (
 day INTEGER PRIMARY KEY,
 started INTEGER NOT NULL DEFAULT 0,
 succeeded INTEGER NOT NULL DEFAULT 0,
 failed INTEGER NOT NULL DEFAULT 0,
 downloads INTEGER NOT NULL DEFAULT 0
);
CREATE TRIGGER beta_admitted AFTER INSERT ON jobs WHEN NEW.owner_hash IS NOT NULL BEGIN
 INSERT INTO beta_daily(day,started) VALUES(CAST(NEW.created_at/86400000 AS INTEGER),1)
 ON CONFLICT(day) DO UPDATE SET started=started+1;
 INSERT INTO beta_activity(owner_hash,first_seen,last_seen,captures) VALUES(NEW.owner_hash,NEW.created_at,NEW.created_at,1)
 ON CONFLICT(owner_hash) DO UPDATE SET last_seen=excluded.last_seen,days_active=days_active+(CAST(excluded.last_seen/86400000 AS INTEGER)>CAST(last_seen/86400000 AS INTEGER)),captures=captures+1;
END;
CREATE TRIGGER beta_completed AFTER UPDATE OF status ON jobs
 WHEN NEW.owner_hash IS NOT NULL AND OLD.status NOT IN ('succeeded','failed') AND NEW.status IN ('succeeded','failed') BEGIN
 INSERT INTO beta_daily(day,succeeded,failed) VALUES(CAST(NEW.updated_at/86400000 AS INTEGER),NEW.status='succeeded',NEW.status='failed')
 ON CONFLICT(day) DO UPDATE SET succeeded=succeeded+excluded.succeeded,failed=failed+excluded.failed;
END;
CREATE TRIGGER beta_downloaded AFTER UPDATE OF downloaded_at ON jobs
 WHEN NEW.owner_hash IS NOT NULL AND OLD.downloaded_at IS NULL AND NEW.downloaded_at IS NOT NULL BEGIN
 INSERT INTO beta_daily(day,downloads) VALUES(CAST(NEW.downloaded_at/86400000 AS INTEGER),1)
 ON CONFLICT(day) DO UPDATE SET downloads=downloads+1;
END;
