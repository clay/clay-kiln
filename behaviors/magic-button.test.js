var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./magic-button'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {

    describe('transforms » mediaplayUrl', function () {
      var fn = lib.transformers.mediaplayUrl;

      it('gets path from full url', function () {
        expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.jpg')).to.equal('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
      });

      it('removes width', function () {
        expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.w500.jpg')).to.equal('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
      });

      it('removes height', function () {
        expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.h500.jpg')).to.equal('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
      });

      it('removes resolution', function () {
        expect(fn('http://pixel.nymag.com/imgs/daily/science/2016/05/27/27-toilet-paper-baby.2x.jpg')).to.equal('daily/science/2016/05/27/27-toilet-paper-baby.jpg');
      });
    });

    describe('transforms » getComponentInstance', function () {
      var fn = lib.transformers.getComponentInstance;

      it('gets default component ref', function () {
        expect(fn('nymag.com/scienceofus/components/article')).to.equal('/components/article');
      });

      it('gets instance component ref', function () {
        expect(fn('nymag.com/scienceofus/components/article/instances/ciovznh8t004jyjy76b897d7k')).to.equal('/components/article/instances/ciovznh8t004jyjy76b897d7k');
      });

      it('gets instance with version', function () {
        expect(fn('nymag.com/scienceofus/components/article/instances/ciovznh8t004jyjy76b897d7k@published')).to.equal('/components/article/instances/ciovznh8t004jyjy76b897d7k@published');
      });
    });

    describe('transforms » toSlug', function () {
      var fn = lib.transformers.toSlug;

      it('removes unicode', function () {
        expect(fn('Foo » Bar')).to.equal('foo-bar');
      });

      it('removes nonbreaking spaces', function () {
        expect(fn('Foo&nbsp;Bar')).to.equal('foo-bar');
      });

      it('removes html tags', function () {
        expect(fn('Foo<br /> <h1>Bar</h1>')).to.equal('foo-bar');
      });

      it('decodes entities', function () {
        expect(fn('Foo &amp; Bar')).to.equal('foo-and-bar');
      });

      it('passes through speakingurl', function () {
        expect(fn('Don\'t Blink')).to.equal('dont-blink');
      });
    });
  });
});
