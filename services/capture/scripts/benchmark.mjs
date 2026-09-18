import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';
// Retry transport failures with the same idempotency key; never retry HTTP errors here.
async function request(url, init) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url, { ...init, signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      if (attempt >= 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    }
  }
}
const base = process.env.CAPTURE_BASE_URL;
if (!base || new URL(base).protocol !== 'https:')
  throw Error('Set CAPTURE_BASE_URL to the HTTPS pilot URL');
const vars = await readFile(new URL('../.dev.vars', import.meta.url), 'utf8');
const token = /^CAPTURE_API_KEY="?([^"\n]+)"?$/m.exec(vars)?.[1];
if (!token) throw Error('Missing local operator key');
const auth = { Authorization: `Bearer ${token}` };
const output = new URL('../benchmark-output/', import.meta.url);
await mkdir(output, { recursive: true });
const checks = {};
checks.unauthorized = (await request(base + '/v1/captures/unknown')).status === 401;
checks.schema = (await request(base + '/openapi.json')).status === 200;
const results = [];
const cases = process.env.CAPTURE_CASES_FILE
  ? JSON.parse(await readFile(process.env.CAPTURE_CASES_FILE, 'utf8'))
  : [
      ['https://example.com/', 1440, 900],
      ['https://openscreenshot.app/', 1440, 900],
      ['https://openscreenshot.app/', 390, 844],
    ];
if (!Array.isArray(cases) || cases.length < 1 || cases.length > 10)
  throw Error('Use 1–10 benchmark cases');
for (const [url, width, height] of cases) {
  const start = performance.now();
  const headers = { ...auth, 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() };
  const init = { method: 'POST', headers, body: JSON.stringify({ url, width, height }) };
  const response = await request(base + '/v1/captures', init);
  if (response.status !== 202) throw Error(`Admission failed: ${response.status}`);
  let job = await response.json();
  const acceptedMs = performance.now() - start;
  await writeFile(
    new URL('in-progress.json', output),
    JSON.stringify({ url, job, admittedAt: new Date().toISOString() }, null, 2),
  );
  const replay = await request(base + '/v1/captures', init);
  checks[`idempotency-${results.length}`] =
    replay.status === 202 && (await replay.json()).id === job.id;
  while (['queued', 'running'].includes(job.status) && performance.now() - start < 600_000) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const status = await request(base + job.statusUrl, { headers: auth });
    if (!status.ok) throw Error(`Polling failed: ${status.status}`);
    job = await status.json();
  }
  const readyMs = performance.now() - start;
  let downloadMs = null;
  if (job.status === 'succeeded') {
    checks[`private-${results.length}`] = (await request(base + job.artifactUrl)).status === 401;
    const downloadStart = performance.now();
    const artifact = await request(base + job.artifactUrl, { headers: auth });
    if (!artifact.ok) throw Error(`Artifact failed: ${artifact.status}`);
    const bytes = Buffer.from(await artifact.arrayBuffer());
    downloadMs = performance.now() - downloadStart;
    checks[`png-${results.length}`] =
      bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
      bytes.length === job.bytes;
    await writeFile(new URL(`${results.length}.png`, output), bytes);
  }
  const result = {
    url,
    requestedWidth: width,
    requestedHeight: height,
    acceptedMs,
    readyMs,
    downloadMs,
    endToEndMs: performance.now() - start,
    ...job,
  };
  results.push(result);
  console.log(JSON.stringify(result));
  await writeFile(
    new URL('results.json', output),
    JSON.stringify({ date: new Date().toISOString(), base, checks, results }, null, 2),
  );
}
if (Object.values(checks).some((v) => !v) || results.some((r) => r.status !== 'succeeded'))
  process.exitCode = 1;
