import type { Env } from './types';
import { ATTEMPTS } from './types';
import { Store } from './store';
import { browserUsage, render, RenderError } from './render';

export async function processJob(id: string, env: Env): Promise<void> {
  const store = new Store(env);
  let job = await store.claim(id);
  if (!job) return;
  // A previous invocation may have uploaded successfully and crashed before its D1 commit.
  if (job.attempts > 0) {
    const key = `${job.id}/${job.attempts}.png`,
      stored = await env.ARTIFACTS.head(key);
    if (stored) {
      await store.complete(job, key, {
        width: Number(stored.customMetadata?.width),
        height: Number(stored.customMetadata?.height),
        bytes: stored.size,
        browserMs: browserUsage(stored.customMetadata?.browserMs),
      });
      return;
    }
  }
  if (job.attempts >= ATTEMPTS) {
    await store.fail(job, 'attempts_exhausted', false);
    return;
  }
  job = await store.begin(job);
  if (!job) return;
  let image: Awaited<ReturnType<typeof render>>;
  try {
    image = await render(env, JSON.parse(job.input_json));
  } catch (error) {
    if (!(error instanceof RenderError)) throw error;
    await store.fail(job, error.code, error.retry, error.diagnostics);
    console.log(
      JSON.stringify({
        event: 'capture_attempt_failed',
        id: job.id,
        attempt: job.attempts,
        code: error.code,
        diagnostics: error.diagnostics,
      }),
    );
    return;
  }
  const key = `${job.id}/${job.attempts}.png`;
  await env.ARTIFACTS.put(key, image.data, {
    httpMetadata: { contentType: 'image/png' },
    customMetadata: {
      width: String(image.width),
      height: String(image.height),
      browserMs: image.browserMs === null ? '' : String(image.browserMs),
    },
  });
  if (!(await store.complete(job, key, image))) {
    // This attempt lost its lease. Never overwrite another attempt's artifact.
    // Leave its immutable object for expiry cleanup; a new owner may be recovering it.
    console.log(JSON.stringify({ event: 'capture_lease_lost', id: job.id, attempt: job.attempts }));
    return;
  }
  console.log(
    JSON.stringify({
      event: 'capture_succeeded',
      id: job.id,
      attempt: job.attempts,
      browserMs: image.browserMs,
      bytes: image.bytes,
    }),
  );
}
export async function recover(env: Env): Promise<void> {
  await new Store(env).recover();
}
