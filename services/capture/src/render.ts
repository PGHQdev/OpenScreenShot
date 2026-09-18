import type { Env, Input } from './types';
import { MAX_IMAGE_BYTES } from './types';
import { allowedHosts, blockedRequestPattern, parseInput, Problem, readBounded } from './policy';

export interface FailureDiagnostics {
  httpStatus: number | null;
  providerCodes: number[];
  bodyState: 'json' | 'invalid_json' | 'too_large' | 'unreadable' | 'not_read';
  rayId: string | null;
  browserMs: number | null;
  elapsedMs: number;
}

export class RenderError extends Error {
  constructor(
    public code: string,
    public retry: boolean,
    public diagnostics?: FailureDiagnostics,
  ) {
    super(code);
  }
}
export function pngDimensions(bytes: Uint8Array): { width: number; height: number } {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  if (
    bytes.length < 33 ||
    signature.some((v, i) => bytes[i] !== v) ||
    new TextDecoder().decode(bytes.slice(12, 16)) !== 'IHDR'
  )
    throw new RenderError('invalid_image', false);
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (data.getUint32(8) !== 13) throw new RenderError('invalid_image', false);
  let offset = 8,
    hasData = false,
    ended = false;
  while (offset + 12 <= bytes.length) {
    const length = data.getUint32(offset),
      type = new TextDecoder().decode(bytes.slice(offset + 4, offset + 8));
    if (offset + 12 + length > bytes.length) throw new RenderError('invalid_image', false);
    if (type === 'IDAT' && length > 0) hasData = true;
    offset += 12 + length;
    if (type === 'IEND') {
      if (length !== 0 || offset !== bytes.length) throw new RenderError('invalid_image', false);
      ended = true;
      break;
    }
  }
  if (!hasData || !ended) throw new RenderError('invalid_image', false);
  const width = data.getUint32(16),
    height = data.getUint32(20);
  if (width === 0 || height === 0 || width > 1920 || height > 30000 || width * height > 40_000_000)
    throw new RenderError('image_too_large', false);
  return { width, height };
}
export function browserUsage(value: string | null | undefined): number | null {
  if (value == null || value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
async function responseFailure(response: Response, started: number): Promise<RenderError> {
  const ray = response.headers.get('cf-ray');
  const diagnostics: FailureDiagnostics = {
    httpStatus: response.status,
    providerCodes: [],
    bodyState: 'not_read',
    rayId: ray && /^[a-f0-9]{6,32}(?:-[A-Z]{3})?$/.test(ray) ? ray : null,
    browserMs: browserUsage(response.headers.get('x-browser-ms-used')),
    elapsedMs: 0,
  };
  try {
    const bytes = await readBounded(response.body, 8192);
    let body: unknown;
    try {
      body = JSON.parse(new TextDecoder().decode(bytes));
      diagnostics.bodyState = 'json';
    } catch {
      diagnostics.bodyState = 'invalid_json';
    }
    if (body && typeof body === 'object' && 'errors' in body && Array.isArray(body.errors)) {
      diagnostics.providerCodes = [
        ...new Set(
          body.errors.slice(0, 8).flatMap((error: unknown) => {
            if (!error || typeof error !== 'object' || !('code' in error)) return [];
            const code = error.code;
            return typeof code === 'number' &&
              Number.isSafeInteger(code) &&
              code >= 0 &&
              code <= 999999
              ? [code]
              : [];
          }),
        ),
      ];
    }
  } catch (error) {
    diagnostics.bodyState =
      error instanceof Problem && error.status === 413 ? 'too_large' : 'unreadable';
  }
  diagnostics.elapsedMs = Math.max(0, Date.now() - started);
  // Observed in a controlled Browser Run navigation timeout; unknown 422s
  // remain terminal rather than classifying untrusted free-form messages.
  const timeout =
    response.status === 408 ||
    (response.status === 422 && diagnostics.providerCodes.includes(6002));
  const retry = timeout || response.status === 429 || response.status >= 500;
  const code = timeout
    ? 'render_timeout'
    : response.status === 429
      ? 'render_rate_limited'
      : response.status >= 500
        ? 'render_unavailable'
        : 'render_rejected';
  return new RenderError(code, retry, diagnostics);
}

export async function render(env: Env, input: Input) {
  const started = Date.now();
  const hosts = allowedHosts(env.ALLOWED_HOSTS);
  try {
    parseInput(input, hosts);
  } catch {
    throw new RenderError('url_not_allowed', false);
  }
  let expired = false,
    timer: ReturnType<typeof setTimeout> | undefined;
  const operation = (async () => {
    const response = await env.BROWSER.quickAction('screenshot', {
      url: input.url,
      // Each admitted job requests a fresh render; API idempotency handles replays.
      cacheTTL: 0,
      viewport: { width: input.width, height: input.height, deviceScaleFactor: 1 },
      screenshotOptions: { fullPage: true, type: 'png' },
      scrollPage: true,
      // Smooth scrolling can leave the return-to-top animation running during
      // full-page capture, displacing sticky headers and blanking the page top.
      addStyleTag: [{ content: 'html, body, * { scroll-behavior: auto !important; }' }],
      gotoOptions: { waitUntil: 'networkidle2', timeout: 25_000 },
      rejectRequestPattern: [blockedRequestPattern(hosts)],
    });
    if (expired) {
      await response.body?.cancel();
      throw new RenderError('render_timeout', true);
    }
    if (!response.ok) throw await responseFailure(response, started);
    if (!response.headers.get('content-type')?.toLowerCase().startsWith('image/png')) {
      await response.body?.cancel();
      throw new RenderError('invalid_image', false);
    }
    const bytes = await readBounded(response.body, MAX_IMAGE_BYTES);
    return {
      data: bytes,
      ...pngDimensions(bytes),
      bytes: bytes.byteLength,
      browserMs: browserUsage(response.headers.get('x-browser-ms-used')),
    };
  })();
  try {
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          expired = true;
          reject(new RenderError('render_timeout', true));
        }, 45_000);
      }),
    ]);
  } catch (error) {
    const failure =
      error instanceof RenderError
        ? error
        : error instanceof Problem && error.status === 413
          ? new RenderError('image_too_large', false)
          : new RenderError('render_unavailable', true);
    failure.diagnostics ??= {
      httpStatus: null,
      providerCodes: [],
      bodyState: 'not_read',
      rayId: null,
      browserMs: null,
      elapsedMs: Math.max(0, Date.now() - started),
    };
    throw failure;
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
