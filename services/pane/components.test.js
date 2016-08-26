var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  pane = require('./'),
  lib = require('./components'),
  dom = require('@nymag/dom'),
  tpl = require('../tpl'),
  head = require('../components/head-components'),
  invisibleList = require('../components/invisible-list'),
  select = require('../components/select'),
  fixture = require('../../test/fixtures/tpl');

/**
 * stub a component with an ancestor, so it won't have a null offsetParent
 * @returns {Element}
 */
function stubComponent() {
  var component = dom.create('<div data-uri="domain.com/components/foo/instances/bar"></div>');

  document.body.appendChild(component);
  return component;
}

/**
 * stub a component without an ancestor, so it will have a null offsetParent
 * @returns {Element}
 */
function stubHiddenComponent() {
  return dom.create('<div data-uri="domain.com/components/foo/instances/bar"></div>');
}

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      var toolbar = dom.create('<div class="kiln-toolbar"></div>');

      document.body.appendChild(toolbar);
      sandbox = sinon.sandbox.create();
      sandbox.stub(tpl, 'get');
      sandbox.stub(dom, 'findAll');
      sandbox.stub(head, 'getListTabs').returns(Promise.resolve([]));
      sandbox.stub(invisibleList, 'getListTabs').returns(Promise.resolve([]));
      sandbox.stub(select);
      fixture.stubAll([
        '.kiln-pane-template',
        '.filtered-input-template',
        '.filtered-items-template',
        '.filtered-item-template',
        '.filtered-add-template'
      ], tpl);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('opens a components pane', function () {
      dom.findAll.returns([
        stubComponent()
      ]);
      pane.close();
      return lib().then(function (el) {
        expect(el.querySelector('#pane-tab-1').innerHTML).to.equal('Find Component');
        expect(el.querySelectorAll('.pane-inner li.filtered-item').length).to.equal(1);
      });
    });

    it('only shows visible components', function () {
      dom.findAll.returns([
        stubComponent(),
        stubHiddenComponent(),
        stubHiddenComponent()
      ]);
      pane.close();
      return lib().then(function (el) {
        expect(el.querySelector('#pane-tab-1').innerHTML).to.equal('Find Component');
        expect(el.querySelectorAll('.pane-inner li.filtered-item').length).to.equal(1);
      });
    });
  });
});
