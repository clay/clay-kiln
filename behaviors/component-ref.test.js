var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  dom = require('../services/dom'),
  lib = require('./component-ref.js'); // static-analysis means this must be string, not `('./' + filename)`

/**
 * Convert an element into a string of HTML with no extra whitespaces.
 * @param {Element} el
 * @returns {string}
 */
function stringify(el) {
  var isDocumentFragment = el.nodeType === 11,
    clone = isDocumentFragment ? el.firstElementChild.cloneNode(true) : el.cloneNode(true), // Clone for in-place white-space removal.
    walker = document.createTreeWalker(clone, NodeFilter.SHOW_ALL);

  console.log(el);
  while (walker.nextNode()) {
    // remove white spaces
    walker.currentNode.textContent && walker.currentNode.textContent.replace(/[^\S+]+\s[^\S+]+/g, '');
  }
  // remove line breaks
  return clone.outerHTML.replace(/(\r|\n)\s*/g, '');
}

describe(dirname, function () {
  describe(filename, function () {
    var querySelectorClass = 'query-selector',
      anotherComponent = dom.create('<div class="' + querySelectorClass + '" data-uri="sit.com/path/components/x/instances/0"></div>');

    beforeEach(function () {
      document.body.appendChild(anotherComponent);
    });

    afterEach(function () {
      document.body.removeChild(anotherComponent);
    });

    it('appends a hidden field', function () {
      var result = lib(fixture, {selector: '.' + querySelectorClass});

      expect(stringify(result.el)).to.eql('<input type="hidden" class="input-text" rv-field="foo" rv-value="foo.data.value">');
    });

  });
});
