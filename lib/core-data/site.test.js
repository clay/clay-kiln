import * as lib from './site';

const domain = 'domain.com',
  path = '/thing';

describe('site', () => {
  describe('normalizeSiteData', () => {
    const fn = lib.normalizeSiteData;

    it('normalizes site path', () => {
      expect(fn({ host: domain, path: path }, { port: '80', protocol: 'http:' }).path).to.equal(path);
      expect(fn({ host: domain, path: '/' }, { port: '80', protocol: 'http:' }).path).to.equal('');
    });

    it('adds site prefix', () => {
      expect(fn({ host: domain, path: path }, { port: '80', protocol: 'http:' }).prefix).to.equal(`${domain}${path}`);
      expect(fn({ host: domain, path: '/' }, { port: '80', protocol: 'http:' }).prefix).to.equal(domain);
    });
  });
});
