import * as lib from './urls';

const domain = 'domain.com',
  path = '/thing';

describe('site', () => {
  describe('addPort', () => {
    const fn = lib.addPort;

    test('adds port to uris', () => {
      expect(fn(`${domain}${path}`, { hostname: domain, host: `${domain}:3000` })).toBe(`${domain}:3000${path}`);
    });

    test('does not add port to uris on port 80', () => {
      expect(fn(`${domain}${path}`, { hostname: domain, host: domain })).toBe(`${domain}${path}`);
    });

    test('does not add port to uris that already have a port', () => {
      expect(fn(`${domain}:3000${path}`, { hostname: domain, host: `${domain}:3000` })).toBe(`${domain}:3000${path}`);
    });
  });

  describe('addProtocol', () => {
    const fn = lib.addProtocol;

    test('adds protocol to uris', () => {
      expect(fn(`${domain}${path}`, { protocol: 'http:' })).toBe(`http://${domain}${path}`);
    });

    test('does not add protocol to uris that already have a protocol', () => {
      expect(fn(`https://${domain}${path}`, { protocol: 'https:' })).toBe(`https://${domain}${path}`);
    });
  });

  describe('isUri', () => {
    const fn = lib.isUri;

    test('returns true when uri', () => {
      expect(fn(domain + path)).toBe(true);
    });

    test('returns false when uri has a protocol', () => {
      expect(fn(`http://${domain}${path}`)).toBe(false);
    });

    test('returns false when uri has a port', () => {
      expect(fn(`${domain}:3000${path}`)).toBe(false);
    });
  });

  describe('isUrl', () => {
    const fn = lib.isUrl;

    test('returns true if it has a hostname, protocol, and path', () => {
      expect(fn(`http://${domain}${path}`)).toBe(true);
    });

    test('returns false if no hostname', () => {
      expect(fn(`http://${path}`)).toBe(false);
    });

    test('returns false if no protocol', () => {
      expect(fn(`${domain}${path}`)).toBe(false);
    });
  });

  describe('assertUri', () => {
    const fn = lib.assertUri;

    test('throws if not a uri', () => {
      const result = () => fn(`http://${domain}`);

      expect(result).toThrow(`Not a valid uri: http://${domain}`);
    });

    test('returns if uri', () => {
      expect(fn(domain)).toBe(undefined);
    });
  });

  describe('assertUrl', () => {
    const fn = lib.assertUrl;

    test('throws if not a url', () => {
      const result = () => fn(domain);

      expect(result).toThrow(`Not a valid url: ${domain}`);
    });

    test('returns if url', () => {
      expect(fn(`http://${domain}`)).toBe(undefined);
    });
  });

  describe('uriToUrl', () => {
    const fn = lib.uriToUrl;

    test('adds protocol and port', () => {
      expect(fn(`${domain}${path}`, { protocol: 'http:', port: '80' })).toBe(`http://${domain}${path}`);
    });
  });

  describe('urlToUri', () => {
    const fn = lib.urlToUri;

    test('removes protocol and port', () => {
      expect(fn(`http://${domain}${path}`)).toBe(domain + path);
    });

    test('throws if not a url', () => {
      const result = () => fn(domain);

      expect(result).toThrow(`Not a valid url: ${domain}`);
    });
  });
});
