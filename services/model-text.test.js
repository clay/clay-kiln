var lib = require('./model-text'),
  dom = require('./dom');

//defaults for chai
chai.config.showDiff = true;
chai.config.truncateThreshold = 0;

describe('model-text service', function () {
  var sandbox;

  /**
   * Converts a document or document fragment to a compressed html string (no extra whitespace)
   * @param {Element} el
   * @returns {string}
   */
  function documentToString(el) {

  }

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('fromElement', function () {
    var fn = lib[this.title];

    it('finds text', function () {
      var el = dom.create('Hello <b>there <i>person</i></b>!'),
        result = {
          text: 'Hello there person!',
          blocks: { bold: [ 6, 18 ], italic: [ 12, 18 ] }
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('ignores scripts', function () {
      var el = dom.create('Hello <script>jfkdslajfkdsal</script>there <b>person</b>!'),
        result = {
          text: 'Hello there person!',
          blocks: { bold: [ 12, 18 ] }
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('merges nested continuous blocks (i.e., bold in bold)', function () {
      var el = dom.create('Hello <b>there <b>person</b></b>!'),
        result = {
          text: 'Hello there person!',
          blocks: { bold: [ 6, 18 ] }
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('merges congruent continuous blocks (i.e., bold in bold)', function () {
      var el = dom.create('Hello <b>there </b><b>person</b>!'),
        result = {
          text: 'Hello there person!',
          blocks: { bold: [ 6, 18 ] }
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('merges nested congruent continuous blocks (i.e., bold in italics in bold)', function () {
      var el = dom.create('Hello <b>the<i>re </i></b><i><b>person</b></i>!'),
        result = {
          text: 'Hello there person!',
          blocks: { bold: [ 6, 18 ], italic: [ 9, 18 ] }
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('finds propertied blocks (i.e., links)', function () {
      var el = dom.create('Hello <a href="place" alt="hey">there</a> <u>person</u>!'),
        result = {
          text: 'Hello there person!',
          blocks: {
            link: [ { start: 6, end: 11, href: 'place', alt: 'hey' } ],
            underline: [ 12, 18 ] }
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('does not merge propertied blocks (i.e., links in links)', function () {
      var el = dom.create('Hello <a href="outer place"><a href="place" alt="hey">there</a> person</a>!'),
        result = {
          text: 'Hello there person!',
          blocks: {
            link: [
              { start: 6, end: 6, href: 'outer place' },
              { start: 6, end: 11, href: 'place', alt: 'hey' }
            ]
          }
        };

      console.log(require('util').inspect(fn(el), {depth: 5}));

      expect(fn(el)).to.deep.equal(result);
    });
  });

  describe('toElement', function () {
    var fn = lib[this.title];

    it('nests when continuous blocks are already in order', function () {
      expect(documentToString(fn())).to.equal(' ');
    });

    it('nests when continuous blocks are not already in order', function () {
      expect(documentToString(fn())).to.equal(' ');
    });

    it('overlaps when continuous blocks are already in order', function () {
      expect(documentToString(fn())).to.equal(' ');
    });

    it('overlaps when continuous blocks are not already in order', function () {
      expect(documentToString(fn())).to.equal(' ');
    });

    it('nests when continuous blocks applied to propertied blocks', function () {
      expect(documentToString(fn())).to.equal(' ');
    });

    it('overlaps when continuous blocks applied to propertied blocks', function () {
      expect(documentToString(fn())).to.equal(' ');
    });
  });
});
