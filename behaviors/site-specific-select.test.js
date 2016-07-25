var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  dom = require('@nymag/dom'),
  site = require('../services/site'),
  lib = require('./site-specific-select.js'); // static-analysis means this must be string, not `('./' + filename)`

describe(dirname, function () {
  describe(filename, function () {
    var options = ['apple', 'banana', 'cantaloupe'],
      sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(site);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('replaces the result.el', function () { // We could call this a "root" behavior
      var result,
        elBefore = dom.create('<div class="el-before"></div>');

      site.get.returns('site1');
      fixture.el = elBefore;
      result = lib(fixture, {sites: [{
        slug: 'site1',
        options: options
      }]});
      expect(result.el.querySelector('.el-before')).to.be.null;
    });

    it('makes a select element with options', function () {
      var result, label, select, selectOptions, firstOption;

      site.get.returns('site1');

      result = lib(fixture, {sites: [{
        slug: 'site1',
        options: options
      }]});
      label = result.el;
      select = label.querySelector('select.editor-select');
      selectOptions = select.querySelectorAll('option');
      firstOption = selectOptions[0];

      expect(label.className).to.eql('input-label');
      expect(select.getAttribute('rv-field')).to.eql('foo');
      expect(select.getAttribute('rv-value')).to.eql('foo.data.value');
      expect(selectOptions.length).to.eql(3);
      expect(firstOption.value).to.eql('apple');
      expect(firstOption.textContent).to.eql('Apple');
    });

    it('matches site slug', function () {
      var result, label, select, selectOptions, firstOption;

      site.get.returns('site2');

      result = lib(fixture, {sites: [{
        slug: 'site1',
        options: options
      }, {
        slug: 'site2',
        options: ['foo', 'bar', 'baz']
      }]});
      label = result.el;
      select = label.querySelector('select.editor-select');
      selectOptions = select.querySelectorAll('option');
      firstOption = selectOptions[0];

      expect(label.className).to.eql('input-label');
      expect(select.getAttribute('rv-field')).to.eql('foo');
      expect(select.getAttribute('rv-value')).to.eql('foo.data.value');
      expect(selectOptions.length).to.eql(3);
      expect(firstOption.value).to.eql('foo');
      expect(firstOption.textContent).to.eql('Foo');
    });

    it('allows default options', function () {
      var result, label, select, selectOptions, firstOption;

      site.get.returns('site3');

      result = lib(fixture, {sites: [{
        slug: 'site1',
        options: options
      }], default: ['baz']});
      label = result.el;
      select = label.querySelector('select.editor-select');
      selectOptions = select.querySelectorAll('option');
      firstOption = selectOptions[0];

      expect(label.className).to.eql('input-label');
      expect(select.getAttribute('rv-field')).to.eql('foo');
      expect(select.getAttribute('rv-value')).to.eql('foo.data.value');
      expect(selectOptions.length).to.eql(1);
      expect(firstOption.value).to.eql('baz');
      expect(firstOption.textContent).to.eql('Baz');
    });

    it('throws error if no site matches and no default options set', function () {
      var result;

      site.get.returns('site3');

      result = function () {
        lib(fixture, {sites: [{
          slug: 'site1',
          options: options
        }]});
      };

      expect(result).to.throw('foo » site-specific-selector: No options specified for current site!');
    });
  });
});
