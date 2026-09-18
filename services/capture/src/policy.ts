import type { Input } from './types';

export class Problem extends Error {
  constructor(
    public status: 400 | 401 | 409 | 413 | 429 | 503,
    public code: string,
  ) {
    super(code);
  }
}
export async function digest(text: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), (b) => b.toString(16).padStart(2, '0')).join('');
}
export async function authorized(header: string | undefined, secret: string): Promise<boolean> {
  if (!secret || secret.length < 32) throw new Problem(503, 'not_configured');
  if (!header || header.length > 512 || !header.startsWith('Bearer ')) return false;
  const [a, b] = await Promise.all([digest(header.slice(7)), digest(secret)]);
  let difference = 0;
  for (let i = 0; i < a.length; i++) difference |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return difference === 0;
}
export function allowedHosts(value: string): string[] {
  const hosts = (value ?? '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  if (
    !hosts.length ||
    hosts.length > 30 ||
    hosts.some((h) => !/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,63}$/.test(h))
  ) {
    throw new Problem(503, 'invalid_host_configuration');
  }
  return [...new Set(hosts)];
}
export function parseInput(value: unknown, hosts: string[]): Input {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Problem(400, 'invalid_input');
  const obj = value as Record<string, unknown>;
  if (
    Object.keys(obj).some((k) => !['url', 'width', 'height'].includes(k)) ||
    typeof obj.url !== 'string' ||
    obj.url.length > 2048
  )
    throw new Problem(400, 'invalid_input');
  let url: URL;
  try {
    const raw = obj.url.trim();
    const normalized = raw.startsWith('//')
      ? `https:${raw}`
      : /^[a-z][a-z0-9+.-]*:/i.test(raw)
        ? raw
        : `https://${raw}`;
    url = new URL(normalized);
  } catch {
    throw new Problem(400, 'invalid_url');
  }
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.port ||
    !hosts.includes(url.hostname)
  )
    throw new Problem(400, 'url_not_allowed');
  url.hash = '';
  const width = obj.width ?? 1440,
    height = obj.height ?? 900;
  if (
    typeof width !== 'number' ||
    !Number.isInteger(width) ||
    width < 320 ||
    width > 1920 ||
    typeof height !== 'number' ||
    !Number.isInteger(height) ||
    height < 480 ||
    height > 1080
  )
    throw new Problem(400, 'invalid_viewport');
  return { url: url.href, width, height };
}
/** Only approved HTTPS hosts may be fetched, including redirects and page resources. */
export function blockedRequestPattern(hosts: string[]): string {
  const escaped = hosts.map((h) => h.replaceAll('.', '\\.')).join('|');
  return `^(?!https:\\/\\/(?:${escaped})(?::443)?(?:[/?#]|$)).*`;
}
export async function readBounded(
  stream: ReadableStream<Uint8Array> | null,
  maximum: number,
): Promise<Uint8Array> {
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > maximum) {
        await reader.cancel();
        throw new Problem(413, 'body_too_large');
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}
export function positiveLimit(value: string, max: number): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1 || n > max)
    throw new Problem(503, 'invalid_limit_configuration');
  return n;
}
