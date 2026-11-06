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

    // these used to be decided by url-parse 1.4; the results are kept
    test.each([
      ['https://domain.com:3001/a/b?c=d#e', true],
      ['HTTP://DOMAIN.COM/PATH', true],
      ['https://user:pw@domain.com/x', true],
      ['http://[::1]:3001/x', true],
      ['http://domain.com', true],
      ['http:///thing', false],
      ['http:////thing', false],
      ['http:/domain.com/x', false],
      ['http:domain.com/x', false],
      ['//domain.com/x', false],
      [' http://domain.com/x', false],
      ['\thttp://domain.com/x', false],
      ['', false]
    ])('%j is a url: %s', (str, expected) => {
      expect(fn(str)).toBe(expected);
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

    // these used to come from url-parse 1.4; the results are kept
    test.each([
      ['https://domain.com:3001/_pages/abc@published', 'domain.com/_pages/abc@published'],
      ['http://localhost.nymag.com/intelligencer/_pages/x?edit=true#top', 'localhost.nymag.com/intelligencer/_pages/x'],
      ['HTTP://DOMAIN.COM/PATH', 'domain.com/PATH'],
      ['https://user:pw@domain.com/x', 'domain.com/x'],
      ['http://[::1]:3001/x', '[::1]/x'],
      ['http://domain.com', 'domain.com'],
      ['http://domain.com?x=1', 'domain.com'],
      ['http://domain.com/a b/c', 'domain.com/a b/c'],
      ['http://domain.com/a%20b/c', 'domain.com/a%20b/c'],
      ['http://domain.com/x/../y', 'domain.com/x/../y'],
      ['http://domain.com/é', 'domain.com/é'],
      ['http://domain.com\\x\\y', 'domain.com/x/y']
    ])('%j becomes %j', (url, expected) => {
      expect(fn(url)).toBe(expected);
    });

    test.each(['http:///thing', 'http:/domain.com/x', ' http://domain.com/x', 'domain.com/x'])('throws for %j', (url) => {
      expect(() => fn(url)).toThrow(`Not a valid url: ${url}`);
    });

    test('throws if not a url', () => {
      const result = () => fn(domain);

      expect(result).toThrow(`Not a valid url: ${domain}`);
    });
  });
});
