var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./new-page'),
  dom = require('@nymag/dom'),
  tpl = require('../tpl'),
  fixture = require('../../test/fixtures/tpl'),
  ds = require('dollar-slice'),
  db = require('../edit/db'),
  pane = require('./');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      var toolbar = dom.create('<div class="kiln-toolbar"></div>');

      document.body.appendChild(toolbar);
      sandbox = sinon.sandbox.create();
      sandbox.stub(ds);
      sandbox.stub(db, 'get');
      sandbox.stub(tpl, 'get');
      fixture.stubAll([
        '.kiln-pane-template',
        '.filtered-input-template',
        '.filtered-items-template',
        '.filtered-add-template',
        '.filtered-item-template'
      ], tpl);
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('opens a a new page pane', function () {
      function expectNewPageItems(el) {
        expect(el.querySelector('#pane-tab-1').innerHTML).to.equal('New Page');
        expect(el.querySelectorAll('.pane-inner li.filtered-item').length).to.equal(1);
      }
      db.get.returns(Promise.resolve([{
        id: 'new',
        title: 'New Page'
      }]));
      pane.close();
      return lib().then(expectNewPageItems);
    });
  });
});
