import { isValid } from './link';

describe('SafeLink', () => {
  describe('isValid', () => {
    test('allows anchor links', () => {
      expect(isValid('#anchor-link')).toEqual(true);
    });

    test('allows links relative to the site root', () => {
      expect(isValid('/section')).toEqual(true);
    });

    test('allows mailto links', () => {
      expect(isValid('mailto:test@example.com')).toEqual(true);
    });

    test('allows ftp links', () => {
      expect(isValid('ftp://example.com/file')).toEqual(true);
    });

    test('allows http links', () => {
      expect(isValid('http://example.com/foo')).toEqual(true);
    });

    test('allows https links', () => {
      expect(isValid('https://example.com/foo')).toEqual(true);
    });

    test('allows links without path', () => {
      expect(isValid('https://example.com')).toEqual(true);
    });

    test('rejects anchor links with spaces', () => {
      expect(isValid('#anchor link')).toEqual(false);
    });

    test('rejects links relative to current page', () => {
      expect(isValid('section')).toEqual(false);
    });

    test('rejects mailto links without @', () => {
      expect(isValid('mailto:example')).toEqual(false);
    });

    test('rejects links without a protocol', () => {
      expect(isValid('example.com/foo')).toEqual(false);
    });

    test('rejects https links with spaces', () => {
      expect(isValid('https://example.com/foo oops')).toEqual(false);
    });
  });
});
