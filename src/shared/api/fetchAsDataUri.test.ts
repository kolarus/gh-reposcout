import { http, HttpResponse } from 'msw';

import { server } from '@/test/server';

import { fetchAsDataUri } from './fetchAsDataUri';

const URL = 'https://cdn.test/avatar.png';

describe('fetchAsDataUri', () => {
  it('encodes the file with its content type', async () => {
    const bytes = Uint8Array.from('hello world!', char => char.charCodeAt(0));
    server.use(
      http.get(
        URL,
        () =>
          new HttpResponse(bytes, { headers: { 'content-type': 'image/png' } }),
      ),
    );

    expect(await fetchAsDataUri(URL)).toBe(
      'data:image/png;base64,aGVsbG8gd29ybGQh',
    );
  });

  it.each([
    [[0x4d], 'TQ=='],
    [[0x4d, 0x61], 'TWE='],
    [[0x4d, 0x61, 0x6e], 'TWFu'],
  ])('pads %j as %s', async (input, base64) => {
    server.use(
      http.get(
        URL,
        () =>
          new HttpResponse(new Uint8Array(input), {
            headers: { 'content-type': 'text/plain' },
          }),
      ),
    );
    expect(await fetchAsDataUri(URL)).toBe(`data:text/plain;base64,${base64}`);
  });

  it('fails on an HTTP error instead of storing an error page', async () => {
    server.use(http.get(URL, () => new HttpResponse(null, { status: 404 })));
    await expect(fetchAsDataUri(URL)).rejects.toThrow('HTTP 404');
  });
});
