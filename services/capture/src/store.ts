import type { FailureDiagnostics } from './render';
import type { Env, Input, Job } from './types';
import { ATTEMPTS, LEASE_MS, TTL_MS } from './types';
import { digest, positiveLimit, Problem } from './policy';

export class Store {
  constructor(private env: Env) {}
  get(id: string) {
    return this.env.DB.prepare('SELECT * FROM jobs WHERE id=?').bind(id).first<Job>();
  }
  async submit(
    key: string,
    input: Input,
    owner?: { ownerHash: string; networkHash: string },
  ): Promise<Job> {
    const now = Date.now(),
      dayStart = Math.floor(now / TTL_MS) * TTL_MS;
    const requestKey = await digest(key),
      json = JSON.stringify(input),
      hash = await digest(json);
    await this.env.DB.prepare(
      `INSERT INTO jobs
      (id,request_key,request_hash,input_json,status,created_at,updated_at,expires_at,next_attempt_at,owner_hash,network_hash)
      SELECT ?,?,?,?,'queued',?,?,?,?,?,?
      WHERE (SELECT COUNT(*) FROM jobs WHERE created_at>=?) < ?
        AND (SELECT COUNT(*) FROM jobs WHERE status IN ('queued','running') AND expires_at>?) < ?
        AND (? IS NULL OR ((SELECT COUNT(*) FROM jobs WHERE owner_hash=? AND created_at>=?) < 5
          AND (SELECT COUNT(*) FROM jobs WHERE network_hash=? AND created_at>=?) < 5))
      ON CONFLICT(request_key) DO NOTHING`,
    )
      .bind(
        crypto.randomUUID(),
        requestKey,
        hash,
        json,
        now,
        now,
        now + TTL_MS,
        now,
        owner?.ownerHash ?? null,
        owner?.networkHash ?? null,
        dayStart,
        positiveLimit(this.env.DAILY_JOB_LIMIT, 1000),
        now,
        positiveLimit(this.env.ACTIVE_JOB_LIMIT, 20),
        owner?.ownerHash ?? null,
        owner?.ownerHash ?? null,
        dayStart,
        owner?.networkHash ?? null,
        dayStart,
      )
      .run();
    const job = await this.env.DB.prepare('SELECT * FROM jobs WHERE request_key=?')
      .bind(requestKey)
      .first<Job>();
    if (!job) throw new Problem(429, 'job_limit');
    if (job.request_hash !== hash) throw new Problem(409, 'idempotency_conflict');
    if (job.expires_at <= now) throw new Problem(409, 'idempotency_expired');
    return job;
  }
  async enqueue(job: Job): Promise<void> {
    await this.env.CAPTURE_QUEUE.send({ id: job.id });
    await this.env.DB.prepare('UPDATE jobs SET enqueued_at=? WHERE id=?')
      .bind(Date.now(), job.id)
      .run();
  }
  claim(id: string): Promise<Job | null> {
    const now = Date.now();
    return this.env.DB.prepare(
      `UPDATE jobs SET status='running', lease_token=?, lease_until=?, updated_at=?
      WHERE id=? AND expires_at>? AND
      ((status='queued' AND next_attempt_at<=?) OR (status='running' AND lease_until<=?)) RETURNING *`,
    )
      .bind(crypto.randomUUID(), now + LEASE_MS, now, id, now, now, now)
      .first<Job>();
  }
  begin(job: Job): Promise<Job | null> {
    return this.env.DB.prepare(
      `UPDATE jobs SET attempts=attempts+1, updated_at=?
      WHERE id=? AND lease_token=? AND status='running' AND lease_until>? AND attempts<? RETURNING *`,
    )
      .bind(Date.now(), job.id, job.lease_token, Date.now(), ATTEMPTS)
      .first<Job>();
  }
  async complete(
    job: Job,
    key: string,
    artifact: { width: number; height: number; bytes: number; browserMs: number | null },
  ): Promise<boolean> {
    const result = await this.env.DB.prepare(
      `UPDATE jobs SET status='succeeded',artifact_key=?,width=?,height=?,bytes=?,browser_ms=?,error_code=NULL,updated_at=?,lease_until=0
      WHERE id=? AND lease_token=? AND status='running' AND lease_until>? AND expires_at>?`,
    )
      .bind(
        key,
        artifact.width,
        artifact.height,
        artifact.bytes,
        artifact.browserMs,
        Date.now(),
        job.id,
        job.lease_token,
        Date.now(),
        Date.now(),
      )
      .run();
    return result.meta.changes === 1;
  }
  async fail(
    job: Job,
    code: string,
    retry: boolean,
    diagnostics?: FailureDiagnostics,
  ): Promise<void> {
    const again = retry && job.attempts < ATTEMPTS;
    await this.env.DB.prepare(
      `UPDATE jobs SET status=?, error_code=?, next_attempt_at=?,updated_at=?,lease_until=0,enqueued_at=0,last_failure_json=?
      WHERE id=? AND lease_token=? AND status='running' AND lease_until>?`,
    )
      .bind(
        again ? 'queued' : 'failed',
        code,
        Date.now() + 30_000 * 2 ** Math.max(0, job.attempts - 1),
        Date.now(),
        diagnostics
          ? JSON.stringify({ ...diagnostics, attempt: job.attempts, code })
          : job.last_failure_json,
        job.id,
        job.lease_token,
        Date.now(),
      )
      .run();
  }
  async recover(): Promise<void> {
    const now = Date.now();
    await this.env.DB.prepare('DELETE FROM beta_activity WHERE last_seen<?')
      .bind(now - 30 * TTL_MS)
      .run();
    await this.env.DB.prepare('DELETE FROM beta_daily WHERE day<?')
      .bind(Math.floor(now / TTL_MS) - 90)
      .run();
    const expired = await this.env.DB.prepare(
      'SELECT id FROM jobs WHERE expires_at<=? AND lease_until<=? LIMIT 25',
    )
      .bind(now, now)
      .all<{ id: string }>();
    for (const { id } of expired.results) {
      await this.env.ARTIFACTS.delete(
        Array.from({ length: ATTEMPTS }, (_, i) => `${id}/${i + 1}.png`),
      );
      await this.env.DB.prepare('DELETE FROM jobs WHERE id=? AND expires_at<=? AND lease_until<=?')
        .bind(id, now, now)
        .run();
    }
    const pending = await this.env.DB.prepare(
      `SELECT * FROM jobs WHERE expires_at>? AND
      ((status='queued' AND next_attempt_at<=? AND enqueued_at<?) OR (status='running' AND lease_until<=? AND enqueued_at<?))
      ORDER BY created_at LIMIT 10`,
    )
      .bind(now, now, now - 120_000, now, now - 120_000)
      .all<Job>();
    for (const job of pending.results) await this.enqueue(job);
  }
}
