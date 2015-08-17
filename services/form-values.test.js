var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  _ = require('lodash'),
  rivets = require('rivets'),
  edit = require('./edit'),
  behaviors = require('./behaviors'),
  references = require('./references'),
  lib = require('./form-values');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(edit);
      sandbox.stub(behaviors);
    });

    afterEach(function () {
      sandbox.restore();
    });

    /**
     * stub a form, adding in fields
     * @param {array} fields
     * @returns {Element} node
     */
    function stubForm(fields) {
      var node = document.createElement('form');

      _.map(fields, function (el) {
        node.appendChild(el);
      });

      return node;
    }

    /**
     * stub field elements
     * @param {string} fieldName
     * @returns {Element} node
     */
    function stubField(fieldName) {
      var node = document.createElement('div');

      node.setAttribute(references.fieldAttribute, fieldName);

      return node;
    }

    /**
     * stub the rivets binding
     * @param {Element} el
     * @param {object} obj w/ bindings
     * @returns {object} rivets view
     */
    function stubBinding(el, obj) {
      return rivets.bind(el, obj);
    }

    /**
     * call a function with a value
     * @param {Function} fn
     * @param {*} val
     * @returns {Function}
     */
    function withValue(fn, val) {
      return function () {
        return fn(val);
      };
    }

    /**
     * expect errors from some things, don't expect them from others
     * @param {function} fn to test
     * @param {array|*} these
     * @param {array|*} notThese
     */
    function expectErrors(fn, these, notThese) {
      // these should throw errors
      if (_.isArray(these)) {
        _.map(these, function (item) {
          expect(withValue(fn, item)).to.throw(Error);
        });
      } else {
        expect(withValue(fn, these)).to.throw(Error);
      }

      // these should not throw errors
      if (_.isArray(notThese)) {
        _.map(notThese, function (item) {
          expect(withValue(fn, item)).to.not.throw(Error);
        });
      } else {
        expect(withValue(fn, notThese)).to.not.throw(Error);
      }
    }

    describe('get', function () {
      var fn = lib[this.title];

      it('throws error if no form element', function () {
        expectErrors(fn, [
          1,
          true,
          'foo',
          null,
          [],
          {},
          undefined,
          document.createElement('div')
        ], document.createElement('form'));
      });

      it('returns empty object if no fields', function () {
        expect(fn(document.createElement('form'))).to.eql({});
      });

      it('gets string value', function () {
        var form = stubForm([stubField('foo')]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(form, { data: { value: 'bar' } }));

        expect(fn(form)).to.eql({ foo: 'bar' });
      });

      it('gets number value', function () {
        var form = stubForm([stubField('foo')]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(form, { data: { value: 1 } }));

        expect(fn(form)).to.eql({ foo: 1 });
      });

      it('gets boolean value', function () {
        var form = stubForm([stubField('foo')]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(form, { data: { value: true } }));

        expect(fn(form)).to.eql({ foo: true });
      });

      it('gets array value', function () {
        var form = stubForm([stubField('foo')]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(form, { data: [1,2,3] }));

        expect(fn(form)).to.eql({ foo: [1,2,3] });
      });

      it('gets object value', function () {
        var form = stubForm([stubField('foo')]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(form, { data: { prop: 'val' } }));

        expect(fn(form)).to.eql({ foo: { prop: 'val' } });
      });

      it('removes binding metadata from strings', function () {
        var form = stubForm([stubField('foo')]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(form, { data: { value: 'bar', _coolness: 'radical' } }));

        expect(fn(form)).to.eql({ foo: 'bar' });
      });

      it('removes binding metadata from arrays', function () {
        var form = stubForm([stubField('foo')]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(form, { data: [
          {
            name: 'Bob',
            _coolness: 'radical'
          }, {
            name: 'Dave',
            _coolness: 'deeply uncool'
          }
        ]}));

        expect(fn(form)).to.eql({ foo: [
          {
            name: 'Bob'
          }, {
            name: 'Dave'
          }
        ] });
      });

      it('removes binding metadata from objects', function () {
        var form = stubForm([stubField('foo')]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(form, { data: {
          bob: {
            name: 'Bob',
            _coolness: 'radical'
          },
          dave: {
            name: 'Dave',
            _coolness: 'deeply uncool'
          }
        }}));

        expect(fn(form)).to.eql({ foo: {
          bob: { name: 'Bob' },
          dave: { name: 'Dave' }
        } });
      });

      it('removes nonbreaking spaces from strings', function () {
        var form = stubForm([stubField('foo')]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(form, { data: { value: 'b&#160;a\u00a0r&nbsp;r' } }));

        expect(fn(form)).to.eql({ foo: 'b a r r' });
      });

      it('trims strings', function () {
        var form = stubForm([stubField('foo')]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(form, { data: { value: '   b a r   ' } }));

        expect(fn(form)).to.eql({ foo: 'b a r' });
      });
    });
  });
});
