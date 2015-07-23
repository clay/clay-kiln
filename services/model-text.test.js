var _ = require('lodash'),
  lib = require('./model-text'),
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
    var parent = document.createElement('DIV');

    parent.appendChild(el.cloneNode(true));
    return parent.innerHTML;
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

      expect(fn(el)).to.deep.equal(result);
    });
  });

  describe('toElement', function () {
    var fn = lib[this.title];

    it('converts continuous blocks', function () {
      var model = {
        text: 'Hello there person!',
        blocks: { bold: [ 0, 6, 12, 18 ] }
      }, result = '<b>Hello </b>there <b>person</b>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('nests when continuous blocks are already in order', function () {
      var model = {
        text: 'Hello there person!',
        blocks: { bold: [ 6, 18 ], italic: [ 12, 18 ] }
      }, result = 'Hello <b>there <i>person</i></b>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('nests when continuous blocks are not already in order', function () {
      var model = {
        text: 'Hello there person!',
        blocks: { bold: [ 12, 18 ], italic: [ 6, 18 ] }
      }, result = 'Hello <i>there </i><b><i>person</i></b>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('overlaps when continuous blocks regardless of order', function () {
      var model = {
        text: 'Hello there person!',
        blocks: { bold: [ 0, 12 ], italic: [ 6, 18 ] }
      }, result = '<b>Hello <i>there </i></b><i>person</i>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('nests when continuous blocks applied within propertied blocks', function () {
      var model = {
        text: 'Hello there person!',
        blocks: { bold: [ 6, 12 ], link: [{ start: 0, end: 18 }] }
      }, result = '<a>Hello <b>there </b>person</a>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('nests when continuous blocks applied outside propertied blocks', function () {
      var model = {
        text: 'Hello there person!',
        blocks: { bold: [ 0, 18 ], link: [{ start: 6, end: 12 }] }
      }, result = '<b>Hello </b><a><b>there </b></a><b>person</b>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('overlaps when continuous blocks applied to propertied blocks', function () {
      var model = {
        text: 'Hello there person!',
        blocks: { bold: [ 0, 12 ], link: [{ start: 6, end: 18 }] }
      }, result = '<b>Hello </b><a><b>there </b>person</a>!';

      expect(documentToString(fn(model))).to.equal(result);
    });
  });
});
