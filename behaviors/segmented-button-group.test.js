var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  fixture = require('../test/fixtures/behavior')({}),
  dom = require('@nymag/dom'),
  lib = require('./segmented-button-group');

describe(dirname, function () {
  describe(filename, function () {

    var values = [
        {icon: 'mock-icon', text: 'mock-text', value: 'mock-value'},
        {text: 'mock-text-no-icon', value: 'mock-value-no-icon'},
        {value: 'mock-value-no-text'}
      ],
      options = [
        { title: 'First', values: values },
        { title: 'Second', values: values}
      ];

    it('replaces the result.el', function () { // We could call this a "root" behavior
      var result,
        elBefore = dom.create('<div class="el-before"></div>');

      fixture.el = elBefore;
      result = lib(fixture, {options: options});
      expect(result.el.querySelector('.el-before')).to.eql.null;
    });

    it('makes a list of buttons', function () {
      var result = lib(fixture, {options: options}),
        label = result.el,
        buttonContainer = label.querySelector('.segmented-button-group'),
        buttons = buttonContainer.querySelectorAll('input[type="radio"]'),
        firstButton = buttons[0];

      expect(label.className).to.eql('input-label');
      expect(buttonContainer.className).to.eql('segmented-button-group');
      expect(buttons.length).to.eql(6);
      expect(firstButton.name).to.eql('foo');
      expect(buttonContainer.getAttribute('rv-field')).to.eql('foo');
      expect(firstButton.getAttribute('rv-checked')).to.eql('foo.data.value');
      expect(firstButton.getAttribute('value')).to.eql('mock-value');
      expect(firstButton.getAttribute('id')).to.eql('foo-mock-value-0');
      expect(buttonContainer.querySelector('label[for="foo-mock-value-0"]')).to.not.eql.null;
    });

    it('uses icon for label', function () {
      var result = lib(fixture, {options: options}),
        buttonWithIconId = 'foo-mock-value-0',
        icon = result.el.querySelector('label[for="' + buttonWithIconId + '"] > img');

      expect(icon.src).to.contain('mock-icon');
      expect(icon.alt).to.eql('mock-text');
    });

    it('uses text for label when no icon', function () {
      var result = lib(fixture, {options: options}),
        buttonWithoutIconId = 'foo-mock-value-no-icon-1',
        label = result.el.querySelector('label[for="' + buttonWithoutIconId + '"]');

      expect(label.textContent).to.eql('mock-text-no-icon');
    });

    it('uses value for label when no text or icon', function () {
      var result = lib(fixture, {options: options}),
        buttonWithoutTextId = 'foo-mock-value-no-text-2',
        label = result.el.querySelector('label[for="' + buttonWithoutTextId + '"]');

      expect(label.textContent).to.eql('mock-value-no-text');
    });

  });
});
