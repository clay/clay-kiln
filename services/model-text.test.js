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
      var el = dom.create('Hello <strong>there <em>person</em></strong>!'),
        result = {
          text: 'Hello there person!',
          blocks: {strong: [6, 18], emphasis: [12, 18]}
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('finds full text', function () {
      var el = dom.create('<em>Hello <strong>there person</strong>!</em>'),
        result = {
          text: 'Hello there person!',
          blocks: {strong: [6, 18], emphasis: [0, 19]}
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('finds text even with whitespace', function () {
      var el = dom.create('<strong>Hello </strong>there <strong>person</strong> <strong>there!</strong>'),
        result = {
          text: 'Hello there person there!',
          blocks: {strong: [0, 6, 12, 18, 19, 25]}
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('converts bold to strong and italics and underlines to emphasis', function () {
      var el = dom.create('<i>Hello</i> <b>there</b> <u>person!</u>'),
        result = {
          text: 'Hello there person!',
          blocks: {emphasis: [0, 5, 12, 19], strong: [6, 11]}
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('ignores scripts', function () {
      var el = dom.create('Hello <script>jfkdslajfkdsal</script>there <strong>person</strong>!'),
        result = {
          text: 'Hello there person!',
          blocks: {strong: [12, 18]}
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('merges nested continuous blocks (i.e., bold in bold)', function () {
      var el = dom.create('Hello <strong>there <strong>person</strong></strong>!'),
        result = {
          text: 'Hello there person!',
          blocks: {strong: [6, 18]}
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('merges congruent continuous blocks (i.e., bold in bold)', function () {
      var el = dom.create('Hello <strong>there </strong><strong>person</strong>!'),
        result = {
          text: 'Hello there person!',
          blocks: {strong: [6, 18]}
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('merges nested congruent continuous blocks (i.e., bold in italics in bold)', function () {
      var el = dom.create('Hello <strong>the<em>re </em></strong><em><strong>person</strong></em>!'),
        result = {
          text: 'Hello there person!',
          blocks: {strong: [6, 18], emphasis: [9, 18]}
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('finds propertied blocks (i.e., links)', function () {
      var el = dom.create('Hello <a href="place" alt="hey">there</a> <u>person</u>!'),
        result = {
          text: 'Hello there person!',
          blocks: {
            link: [{start: 6, end: 11, href: 'place', alt: 'hey'}],
            emphasis: [12, 18]
          }
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('finds singled blocks (i.e., line breaks)', function () {
      var el = dom.create('Hello<br>there<br />person!'),
        result = {
          text: 'Hellothereperson!',
          blocks: { 'soft return': [5, 10] }
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('allows multiple singled blocks (i.e., <br><br>)', function () {
      var el = dom.create('Hello<br><br />there person!'),
        result = {
          text: 'Hellothere person!',
          blocks: { 'soft return': [5, 5] }
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('does not merge propertied blocks (i.e., links in links)', function () {
      var el = dom.create('Hello <a href="outer place">there <a href="place" alt="hey">person</a> over there</a>!'),
        result = {
          text: 'Hello there person over there!',
          blocks: {
            link: [
              {start: 6, end: 12, href: 'outer place'},
              {start: 12, end: 18, href: 'place', alt: 'hey'}
            ]
          }
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('removes empty continuous blocks (does not add block name either)', function () {
      var el = dom.create('Hello <strong></strong>there person!'),
        result = {
          text: 'Hello there person!',
          blocks: {}
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('removes empty propertied blocks (does not add block name either)', function () {
      var el = dom.create('Hello <a href="place"></a>there person!'),
        result = {
          text: 'Hello there person!',
          blocks: {}
        };

      expect(fn(el)).to.deep.equal(result);
    });

    it('removes empty propertied blocks caused by nesting', function () {
      var el = dom.create('Hello <a href="outer place"><a href="place" alt="hey">there</a> person</a>!'),
        result = {
          text: 'Hello there person!',
          blocks: {
            link: [
              {start: 6, end: 11, href: 'place', alt: 'hey'}
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
          blocks: {strong: [0, 6, 12, 18]}
        },
        result = '<strong>Hello </strong>there <strong>person</strong>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('nests when different continuous blocks are on the same space', function () {
      var model = {
          text: 'Hello there person!',
          blocks: {strong: [6, 11], emphasis: [6, 11]}
        },
        result = 'Hello <strong><em>there</em></strong> person!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('nests when continuous blocks are already in order', function () {
      var model = {
          text: 'Hello there person!',
          blocks: {strong: [6, 18], emphasis: [12, 18]}
        },
        result = 'Hello <strong>there <em>person</em></strong>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('nests when continuous blocks are not already in order', function () {
      var model = {
          text: 'Hello there person!',
          blocks: {strong: [12, 18], emphasis: [6, 18]}
        },
        result = 'Hello <em>there <strong>person</strong></em>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('overlaps when continuous blocks regardless of order', function () {
      var model = {
          text: 'Hello there person!',
          blocks: {strong: [0, 12], emphasis: [6, 18]}
        },
        result = '<strong>Hello <em>there </em></strong><em>person</em>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('converts propertied blocks', function () {
      var model = {
          text: 'Hello there person!',
          blocks: {link: [{start: 6, end: 18, alt: 'Good day!'}]}
        },
        result = 'Hello <a alt="Good day!">there person</a>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('nests when continuous blocks applied within propertied blocks', function () {
      var model = {
          text: 'Hello there person!',
          blocks: {strong: [6, 12], link: [{start: 0, end: 18}]}
        },
        result = '<a>Hello <strong>there </strong>person</a>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('nests when continuous blocks applied outside propertied blocks', function () {
      var model = {
          text: 'Hello there person!',
          blocks: {strong: [0, 18], link: [{start: 6, end: 12}]}
        },
        result = '<strong>Hello </strong><a><strong>there </strong></a><strong>person</strong>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('overlaps when continuous blocks applied to propertied blocks', function () {
      var model = {
          text: 'Hello there person!',
          blocks: {strong: [0, 12], link: [{start: 6, end: 18}]}
        },
        result = '<strong>Hello </strong><a><strong>there </strong>person</a>!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('converts singled blocks', function () {
      var model = {
          text: 'Hellothereperson!',
          blocks: {'soft return': [5, 10]}
        },
        result = 'Hello<br>there<br>person!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('overlaps when continuous blocks applied to singled blocks', function () {
      var model = {
          text: 'Hellothere person!',
          blocks: {strong: [0, 11], 'soft return': [5]}
        },
        result = '<strong>Hello<br>there </strong>person!';

      expect(documentToString(fn(model))).to.equal(result);
    });

    it('overlaps when propertied blocks applied to singled blocks', function () {
      var model = {
          text: 'Hellothere person!',
          blocks: {link: [{start: 2, end: 10}], 'soft return': [5]}
        },
        result = 'He<a>llo<br>there</a> person!';

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

      result = _.map(result, function (model) {
        return documentToString(lib.toElement(model));
      });
      expect(result).to.deep.equal(expectedResult);
    });

    it('splits continuous blocks to each side', function () {
      var num = 8,
        el = dom.create('<strong>Hello </strong>there <strong>person</strong>!'),
        result,
        expectedResult = ['<strong>Hello </strong>th', 'ere <strong>person</strong>!'];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) {
        return documentToString(lib.toElement(modelResult));
      });
      expect(result).to.deep.equal(expectedResult);
    });

    it('splits continuous blocks at middle', function () {
      var num = 8,
        el = dom.create('Hello <strong>there </strong>person!'),
        result,
        expectedResult = ['Hello <strong>th</strong>', '<strong>ere </strong>person!'];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) {
        return documentToString(lib.toElement(modelResult));
      });
      expect(result).to.deep.equal(expectedResult);
    });

    it('splits continuous blocks to each side and middle', function () {
      var num = 8,
        el = dom.create('<strong>Hello</strong> <strong>there</strong> <strong>person</strong>!'),
        result,
        expectedResult = ['<strong>Hello</strong> <strong>th</strong>', '<strong>ere</strong> <strong>person</strong>!'];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) {
        return documentToString(lib.toElement(modelResult));
      });
      expect(result).to.deep.equal(expectedResult);
    });

    it('splits propertied blocks to each side', function () {
      var num = 8,
        el = dom.create('<a>Hello </a>there <a>person</a>!'),
        result,
        expectedResult = ['<a>Hello </a>th', 'ere <a>person</a>!'];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) {
        return documentToString(lib.toElement(modelResult));
      });
      expect(result).to.deep.equal(expectedResult);
    });

    it('removes propertied blocks at middle', function () {
      var num = 8,
        el = dom.create('Hello <a>there </a>person!'),
        result,
        expectedResult = ['Hello <a>th</a>', '<a>ere </a>person!'];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) {
        return documentToString(lib.toElement(modelResult));
      });
      expect(result).to.deep.equal(expectedResult);
    });

    it('splits propertied blocks to each side and removes middle', function () {
      var num = 8,
        el = dom.create('<a>Hello</a> <a>there</a> <a>person</a>!'),
        result,
        expectedResult = ['<a>Hello</a> <a>th</a>', '<a>ere</a> <a>person</a>!'];

      result = fn(lib.fromElement(el), num);

      result = _.map(result, function (modelResult) {
        return documentToString(lib.toElement(modelResult));
      });
      expect(result).to.deep.equal(expectedResult);
    });
  });

  describe('concat', function () {
    var fn = lib[this.title];

    it('concats continuous', function () {
      var result,
        before = lib.fromElement(dom.create('Hello <strong>th</strong>')),
        after = lib.fromElement(dom.create('<strong>ere</strong> person!')),
        expectedResult = 'Hello <strong>there</strong> person!';

      result = fn(before, after);

      expect(documentToString(lib.toElement(result))).to.deep.equal(expectedResult);
    });

    it('concats nested continuous', function () {
      var result,
        before = lib.fromElement(dom.create('Hello <strong><em>th</em></strong>')),
        after = lib.fromElement(dom.create('<strong><em>ere</em></strong> person!')),
        expectedResult = 'Hello <strong><em>there</em></strong> person!';

      result = fn(before, after);

      expect(documentToString(lib.toElement(result))).to.deep.equal(expectedResult);
    });

    it('concats nested continuous (complex)', function () {
      var result,
        before = lib.fromElement(dom.create('<em>Hello <strong>t</strong>h</em>')),
        after = lib.fromElement(dom.create('<strong><em>ere</em></strong> person!')),
        expectedResult = '<em>Hello <strong>t</strong>h<strong>ere</strong></em> person!';

      result = fn(before, after);

      expect(documentToString(lib.toElement(result))).to.deep.equal(expectedResult);
    });
  });
});
