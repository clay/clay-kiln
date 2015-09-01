var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  dom = require('../services/dom'),
  lib = require('./radio.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {

    var options = ['apple', 'b', 'c'];

    it('replaces the result.el', function () { // Is this good?
      var result,
        elBefore = dom.create(`<div class="el-before"></div>`);

      fixture.el = elBefore;
      result = lib(fixture, {options: options});
      expect(result.el.querySelector('.el-before')).to.eql.null;
    });

    it('makes a list of options', function () {
      var result = lib(fixture, {options: options}),
        label = result.el,
        list = label.firstElementChild,
        firstItem = list.querySelector('label'),
        firstItemInput = firstItem.querySelector('input');

      expect(label.className).to.eql('input-label');
      expect(list.className).to.eql('editor-radios');
      expect(list.querySelectorAll('.editor-radio-item').length).to.eql(3);
      expect(list.querySelectorAll('input[type="radio"]').length).to.eql(3);
      expect(firstItem.textContent.trim()).to.eql('Apple');
      expect(firstItemInput.type).to.eql('radio');
      expect(firstItemInput.getAttribute('rv-field')).to.eql('foo');
      expect(firstItemInput.getAttribute('rv-checked')).to.eql('foo.data.value');
      expect(firstItemInput.getAttribute('value')).to.eql('apple');
    });

  });
});
