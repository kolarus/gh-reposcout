import { http, HttpResponse } from 'msw';

import { server } from './server';

describe('test network (MSW)', () => {
  it('intercepts fetch in the React Native Jest environment', async () => {
    server.use(
      http.get('https://api.github.com/rate_limit', () =>
        HttpResponse.json(
          { ok: true },
          { headers: { 'x-ratelimit-resource': 'core' } },
        ),
      ),
    );

    const response = await fetch('https://api.github.com/rate_limit');

    expect(response.headers.get('x-ratelimit-resource')).toBe('core');
    await expect(response.json()).resolves.toEqual({ ok: true });
  });

  it('fails requests that have no handler', async () => {
    // MSW reports the unhandled request on console.error; assert it instead of printing it.
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    await expect(fetch('https://api.github.com/unhandled')).rejects.toThrow();
    expect(consoleError).toHaveBeenCalledWith(
      expect.stringContaining('https://api.github.com/unhandled'),
    );

    consoleError.mockRestore();
  });
});
