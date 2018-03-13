import lib from './magic-button-transformers';

describe('magic-button transformers', () => {
  describe('mediaplayUrl', () => {
    const fn = lib.mediaplayUrl;

    it('gets path from full url', () => {
      expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.jpg')).to.equal('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
    });

    it('removes width', () => {
      expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.w500.jpg')).to.equal('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
    });

    it('removes height', () => {
      expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.h500.jpg')).to.equal('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
    });

    it('removes resolution', () => {
      expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.2x.jpg')).to.equal('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
    });

    it('removes nocrop value', () => {
      expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.nocrop.jpg')).to.equal('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
    });
  });

  describe('getComponentInstance', () => {
    const fn = lib.getComponentInstance;

    it('gets default component ref', () => {
      expect(fn('nymag.com/scienceofus/_components/article')).to.equal('/_components/article');
    });

    it('gets instance component ref', () => {
      expect(fn('nymag.com/scienceofus/_components/article/instances/ciovznh8t004jyjy76b897d7k')).to.equal('/_components/article/instances/ciovznh8t004jyjy76b897d7k');
    });

    it('gets instance with version', () => {
      expect(fn('nymag.com/scienceofus/_components/article/instances/ciovznh8t004jyjy76b897d7k@published')).to.equal('/_components/article/instances/ciovznh8t004jyjy76b897d7k@published');
    });
  });

  describe('toSlug', () => {
    const fn = lib.toSlug;

    it('removes unicode', () => {
      expect(fn('Foo » Bar')).to.equal('foo-bar');
    });

    it('removes nonbreaking spaces', () => {
      expect(fn('Foo&nbsp;Bar')).to.equal('foo-bar');
    });

    it('removes html tags', () => {
      expect(fn('Foo<br /> <h1>Bar</h1>')).to.equal('foo-bar');
    });

    it('decodes entities', () => {
      expect(fn('Foo &amp; Bar')).to.equal('foo-and-bar');
    });

    it('passes through speakingurl', () => {
      expect(fn('Don\'t Blink')).to.equal('dont-blink');
    });
  });

  describe('formatUrl', () => {
    const fn = lib.formatUrl;

    let format = 'http://pixel.nymag.com/imgs/custom/tvrecaps/recaps-$DATAFIELD-160x160.png';

    it('returns an empty string if no format is provided', () => {
      expect(fn('TV Show')).to.equal('');
    });

    it('replaces placeholder with data field', () => {
      expect(fn('TV Show', format)).to.equal('http://pixel.nymag.com/imgs/custom/tvrecaps/recaps-tv-show-160x160.png');
    });

    it('removes html tags', () => {
      expect(fn('Foo<br /> <h1>Bar</h1>', format)).to.equal('http://pixel.nymag.com/imgs/custom/tvrecaps/recaps-foo-bar-160x160.png');
    });
  });
});
