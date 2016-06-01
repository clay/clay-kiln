var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  dom = require('@nymag/dom'),
  site = require('../services/site'),
  lib = require('./magic-button'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    before(function () {
      sandbox = sinon.sandbox.create();
      document.body.appendChild(dom.create('<input rv-field="magicTest1" value="Hello" />')); // field to put data into
      document.body.appendChild(dom.create('<input rv-field="magicTest2" />')); // field to grab data from
      document.body.appendChild(dom.create('<div data-uri="domain.com/components/clay-magic-field-test/instances/foo"></div>')); // component to grab data from
    });

    beforeEach(function () {
      site.set({ prefix: 'domain.com' });
      sandbox.stub(lib, 'getAPI').returns(Promise.resolve({ foo: { bar: 'baz' }}));
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('doMagic', function () {
      var fn = lib[this.title];

      it('does nothing if el doesn\'t have the magic button class', function () {
        expect(fn(null, {}, dom.create('<a></a>'))).to.equal(undefined);
      });

      it('grabs data from a field', function () {
        var bindings = { magicTest1: { data: { value: '' }}};

        function expectData() {
          expect(bindings.magicTest1.data.value).to.equal('Hello');
        }

        fn(null, bindings, dom.create('<a class="magic-button" data-magic-currentField="magicTest1" data-magic-field="magicTest2"></a>'))
          .then(expectData);
      });

      it('grabs data from a component', function () {
        var bindings = { magicTest1: { data: { value: '' }}};

        function expectData() {
          expect(bindings.magicTest1.data.value).to.equal('domain.com/components/clay-magic-field-test/instances/foo');
        }

        fn(null, bindings, dom.create('<a class="magic-button" data-magic-currentField="magicTest1" data-magic-component="clay-magic-field-test"></a>'))
          .then(expectData);
      });

      it('grabs empty data', function () {
        var bindings = { magicTest1: { data: { value: '' }}};

        function expectData() {
          expect(bindings.magicTest1.data.value).to.equal('');
        }

        fn(null, bindings, dom.create('<a class="magic-button" data-magic-currentField="magicTest1"></a>'))
          .then(expectData);
      });

      it('uses a single transform on the data', function () {
        var bindings = { magicTest1: { data: { value: '' }}};

        function expectData() {
          expect(bindings.magicTest1.data.value).to.equal('hello');
        }

        fn(null, bindings, dom.create('<a class="magic-button" data-magic-currentField="magicTest1" data-magic-field="magicTest2" data-magic-transform="toSlug"></a>'))
          .then(expectData);
      });

      it('calls a url', function () {
        var bindings = { magicTest1: { data: { value: '' }}};

        function expectData() {
          expect(bindings.magicTest1.data.value).to.equal('baz');
        }

        fn(null, bindings, dom.create('<a class="magic-button" data-magic-currentField="magicTest1" data-magic-field="magicTest2" data-magic-transform="toSlug" data-magic-url="http://place.com/" data-magic-property="foo.bar"></a>'))
          .then(expectData);
      });
    });

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
