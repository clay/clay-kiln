import * as lib from './magic-button-transformers';

describe('magic-button transformers', () => {
  describe('mediaplayUrl', () => {
    const fn = lib.mediaplayUrl;

    test('gets path from full url', () => {
      expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.jpg')).toBe('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
    });

    test('removes width', () => {
      expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.w500.jpg')).toBe('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
    });

    test('removes height', () => {
      expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.h500.jpg')).toBe('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
    });

    test('removes resolution', () => {
      expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.2x.jpg')).toBe('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
    });

    test('removes nocrop value', () => {
      expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.nocrop.jpg')).toBe('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
    });
  });

  describe('getComponentInstance', () => {
    const fn = lib.getComponentInstance;

    test('gets default component ref', () => {
      expect(fn('nymag.com/scienceofus/_components/article')).toBe('/_components/article');
    });

    test('gets instance component ref', () => {
      expect(fn('nymag.com/scienceofus/_components/article/instances/ciovznh8t004jyjy76b897d7k')).toBe('/_components/article/instances/ciovznh8t004jyjy76b897d7k');
    });

    test('gets instance with version', () => {
      expect(fn('nymag.com/scienceofus/_components/article/instances/ciovznh8t004jyjy76b897d7k@published')).toBe('/_components/article/instances/ciovznh8t004jyjy76b897d7k@published');
    });
  });

  describe('toSlug', () => {
    const fn = lib.toSlug;

    test('removes unicode', () => {
      expect(fn('Foo » Bar')).toBe('foo-bar');
    });

    test('removes nonbreaking spaces', () => {
      expect(fn('Foo&nbsp;Bar')).toBe('foo-bar');
    });

    test('removes html tags', () => {
      expect(fn('Foo<br /> <h1>Bar</h1>')).toBe('foo-bar');
    });

    test('decodes entities', () => {
      expect(fn('Foo &amp; Bar')).toBe('foo-and-bar');
    });

    test('passes through speakingurl', () => {
      expect(fn('Don\'t Blink')).toBe('dont-blink');
    });
  });

  describe('formatUrl', () => {
    const fn = lib.formatUrl;

    let format = 'http://pixel.nymag.com/imgs/custom/tvrecaps/recaps-$DATAFIELD-160x160.png';

    test('returns an empty string if no format is provided', () => {
      expect(fn('TV Show')).toBe('');
    });

    test('replaces placeholder with data field', () => {
      expect(fn('TV Show', format)).toBe('http://pixel.nymag.com/imgs/custom/tvrecaps/recaps-tv-show-160x160.png');
    });

    test('trims leading and trailing spaces', () => {
      expect(fn(' TV Show ', format)).toBe('http://pixel.nymag.com/imgs/custom/tvrecaps/recaps-tv-show-160x160.png');
    });

    test('removes html tags', () => {
      expect(fn('Foo<br /> <h1>Bar</h1>', format)).toBe('http://pixel.nymag.com/imgs/custom/tvrecaps/recaps-foo-bar-160x160.png');
    });
  });
});
