/**
 * GitHub avatars default to ~460 px; the `s` parameter asks the server for the
 * size we draw, which is about 90% smaller for a list row (ADR-0009).
 * `sizePx` is physical pixels: display size × pixel ratio.
 */
export function sizedAvatarUrl(url: string, sizePx: number): string {
  const size = `s=${String(Math.max(1, Math.round(sizePx)))}`;
  if (/[?&]s=\d+/.test(url)) return url.replace(/([?&])s=\d+/, `$1${size}`);
  return `${url}${url.includes('?') ? '&' : '?'}${size}`;
}
