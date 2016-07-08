var events = require('./events'),
  dom = require('@nymag/dom');

describe('events service', function () {
  var sandbox;

  beforeEach(function () {
    sandbox = sinon.sandbox.create();
  });

  afterEach(function () {
    sandbox.restore();
  });

  it('adds event handler to element', function () {
    var el = dom.create('<div>hi</div>'),
      Constructor = function (el) {
        this.el = el;
      },
      instance;

    Constructor.prototype.onClick = sandbox.spy();
    instance = new Constructor(el);

    events.add(el, { click: 'onClick' }, instance);
    el.dispatchEvent(new MouseEvent('click'));
    expect(instance.onClick.calledOnce).to.equal(true);
  });

  it('adds event handler to child element', function () {
    var el = dom.create('<div><span></span></div>'),
      Constructor = function (el) {
        this.el = el;
      },
      instance;

    Constructor.prototype.onClick = sandbox.spy();
    instance = new Constructor(el);

    events.add(el, { 'span click': 'onClick' }, instance);
    el.firstElementChild.dispatchEvent(new MouseEvent('click'));
    expect(instance.onClick.calledOnce).to.equal(true);
  });
});
