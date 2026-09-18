export interface Input {
  url: string;
  width: number;
  height: number;
}
export interface Env {
  DB: D1Database;
  ARTIFACTS: R2Bucket;
  CAPTURE_QUEUE: { send(body: { id: string }): Promise<unknown> };
  BROWSER: {
    quickAction(action: 'screenshot', options: BrowserRunScreenshotOptions): Promise<Response>;
  };
  CAPTURE_API_KEY: string;
  BETA_ENABLED?: string;
  ALLOWED_HOSTS: string;
  DAILY_JOB_LIMIT: string;
  ACTIVE_JOB_LIMIT: string;
}
export interface Job {
  id: string;
  request_key: string;
  request_hash: string;
  input_json: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  attempts: number;
  created_at: number;
  updated_at: number;
  expires_at: number;
  next_attempt_at: number;
  enqueued_at: number;
  lease_token: string | null;
  lease_until: number;
  artifact_key: string | null;
  width: number | null;
  height: number | null;
  bytes: number | null;
  browser_ms: number | null;
  error_code: string | null;
  last_failure_json: string | null;
  owner_hash: string | null;
  network_hash: string | null;
  downloaded_at: number | null;
}
export const ATTEMPTS = 3;
export const LEASE_MS = 180_000;
export const TTL_MS = 86_400_000;
export const MAX_IMAGE_BYTES = 20 * 1024 * 1024;
