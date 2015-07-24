var _ = require('lodash'),
  lib = require('./model-text'),
  dom = require('./dom');

// defaults for chai
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

    it('finds full text', function () {
      var el = dom.create('<i>Hello <b>there person</b>!</i>'),
        result = {
          text: 'Hello there person!',
          blocks: { bold: [ 6, 18 ], italic: [ 0, 19 ] }
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('finds text even with whitespace', function () {
      var el = dom.create('<b>Hello </b>there <b>person</b> <b>there!</b>'),
        result = {
          text: 'Hello there person there!',
          blocks: { bold: [ 0, 6, 12, 18, 19, 25 ] }
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

    it('nests when different continuous blocks are on the same space', function () {
      var model = {
        text: 'Hello there person!',
        blocks: { bold: [ 6, 11 ], italic: [ 6, 11 ] }
      }, result = 'Hello <b><i>there</i></b> person!';

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
      }, result = 'Hello <i>there <b>person</b></i>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('overlaps when continuous blocks regardless of order', function () {
      var model = {
        text: 'Hello there person!',
        blocks: { bold: [ 0, 12 ], italic: [ 6, 18 ] }
      }, result = '<b>Hello <i>there </i></b><i>person</i>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('converts propertied blocks', function () {
      var model = {
        text: 'Hello there person!',
        blocks: { link: [{ start: 6, end: 18, alt: 'Good day!' }] }
      }, result = 'Hello <a alt="Good day!">there person</a>!';

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

  describe('split', function () {
    var fn = lib[this.title];

    it('splits text', function () {
      var num = 8,
        el = dom.create('Hello there person!'),
        result,
        expectedResult = ['Hello th', 'ere person!'];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (model) { return documentToString(lib.toElement(model)); });
      expect(result).to.deep.equal(expectedResult);
    });

    it('splits continuous blocks to each side', function () {
      var num = 8,
        el = dom.create('<b>Hello </b>there <b>person</b>!'),
        result,
        expectedResult = [ '<b>Hello </b>th', 'ere <b>person</b>!' ];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) { return documentToString(lib.toElement(modelResult)); });
      expect(result).to.deep.equal(expectedResult);
    });

    it('splits continuous blocks at middle', function () {
      var num = 8,
        el = dom.create('Hello <b>there </b>person!'),
        result,
        expectedResult = [ 'Hello <b>th</b>', '<b>ere </b>person!' ];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) { return documentToString(lib.toElement(modelResult)); });
      expect(result).to.deep.equal(expectedResult);
    });

    it('splits continuous blocks to each side and middle', function () {
      var num = 8,
        el = dom.create('<b>Hello</b> <b>there</b> <b>person</b>!'),
        result,
        expectedResult = [ '<b>Hello</b> <b>th</b>', '<b>ere</b> <b>person</b>!' ];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) { return documentToString(lib.toElement(modelResult)); });
      expect(result).to.deep.equal(expectedResult);
    });

    it('splits propertied blocks to each side', function () {
      var num = 8,
        el = dom.create('<a>Hello </a>there <a>person</a>!'),
        result,
        expectedResult = [ '<a>Hello </a>th', 'ere <a>person</a>!' ];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) { return documentToString(lib.toElement(modelResult)); });
      expect(result).to.deep.equal(expectedResult);
    });

    it('removes propertied blocks at middle', function () {
      var num = 8,
        el = dom.create('Hello <a>there </a>person!'),
        result,
        expectedResult = [ 'Hello th', 'ere person!' ];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) { return documentToString(lib.toElement(modelResult)); });
      expect(result).to.deep.equal(expectedResult);
    });

    it('splits propertied blocks to each side and removes middle', function () {
      var num = 8,
        el = dom.create('<a>Hello</a> <a>there</a> <a>person</a>!'),
        result,
        expectedResult = [ '<a>Hello</a> th', 'ere <a>person</a>!' ];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) { return documentToString(lib.toElement(modelResult)); });
      expect(result).to.deep.equal(expectedResult);
    });
  });

  describe('concat', function () {
    var fn = lib[this.title];

    it('concats continuous', function () {
      var result,
        before = lib.fromElement(dom.create('Hello <b>th</b>')),
        after = lib.fromElement(dom.create('<b>ere</b> person!')),
        expectedResult = 'Hello <b>there</b> person!';

      result = fn(before, after);

      expect(documentToString(lib.toElement(result))).to.deep.equal(expectedResult);
    });

    it('concats nested continuous', function () {
      var result,
        before = lib.fromElement(dom.create('Hello <b><i>th</i></b>')),
        after = lib.fromElement(dom.create('<b><i>ere</i></b> person!')),
        expectedResult = 'Hello <b><i>there</i></b> person!';

      result = fn(before, after);

      expect(documentToString(lib.toElement(result))).to.deep.equal(expectedResult);
    });

    it('concats nested continuous (complex)', function () {
      var result,
        before = lib.fromElement(dom.create('<i>Hello <b>t</b>h</i>')),
        after = lib.fromElement(dom.create('<b><i>ere</i></b> person!')),
        expectedResult = '<i>Hello <b>t</b>h<b>ere</b></i> person!';

      result = fn(before, after);

      expect(documentToString(lib.toElement(result))).to.deep.equal(expectedResult);
    });
  });
});
