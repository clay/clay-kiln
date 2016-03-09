var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  dom = require('../services/dom'),
  lib = require('./select.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {

    var options = ['apple', 'banana', 'cantaloupe'];

    it('replaces the result.el', function () { // We could call this a "root" behavior
      var result,
        elBefore = dom.create('<div class="el-before"></div>');

      fixture.el = elBefore;
      result = lib(fixture, {options: options});
      expect(result.el.querySelector('.el-before')).to.be.null;
    });

    it('makes a select element with options', function () {
      var result = lib(fixture, {options: options}),
        label = result.el,
        select = label.querySelector('select.editor-select'),
        selectOptions = select.querySelectorAll('option'),
        firstOption = selectOptions[0];

      expect(label.className).to.eql('input-label');
      expect(select.getAttribute('rv-field')).to.eql('foo');
      expect(select.getAttribute('rv-value')).to.eql('foo.data.value');
      expect(selectOptions.length).to.eql(3);
      expect(firstOption.value).to.eql('apple');
      expect(firstOption.textContent).to.eql('Apple');
    });

  });
});
