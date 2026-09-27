const ALPHABET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/*
 * Plain base64, written out: Hermes and Node both have `btoa`, but React
 * Native's types don't declare it, and a few lines beat an undeclared global.
 */
const toBase64 = (bytes: Uint8Array): string => {
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i] ?? 0;
    const b = bytes[i + 1] ?? 0;
    const c = bytes[i + 2] ?? 0;
    const triple = (a << 16) | (b << 8) | c;
    out += ALPHABET.charAt((triple >> 18) & 63);
    out += ALPHABET.charAt((triple >> 12) & 63);
    out += i + 1 < bytes.length ? ALPHABET.charAt((triple >> 6) & 63) : '=';
    out += i + 2 < bytes.length ? ALPHABET.charAt(triple & 63) : '=';
  }
  return out;
};

/**
 * Downloads a file into a `data:` URI, so it can be stored and shown offline
 * (saved repos' avatars, ADR-0020). Lives in `shared/api` because `fetch` is
 * only allowed here (ADR-0015). Avatar CDN requests don't count against the
 * GitHub API rate limits.
 */
export async function fetchAsDataUri(
  url: string,
  signal?: AbortSignal,
): Promise<string> {
  const response = await globalThis.fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Download failed with HTTP ${String(response.status)}`);
  }
  const type =
    response.headers.get('content-type') ?? 'application/octet-stream';
  const bytes = new Uint8Array(await response.arrayBuffer());
  return `data:${type};base64,${toBase64(bytes)}`;
}
