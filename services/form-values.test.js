var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  _ = require('lodash'),
  rivets = require('rivets'),
  behaviors = require('./behaviors'),
  references = require('./references'),
  lib = require('./form-values');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
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
     * @param {boolean} hasValue
     * @returns {Element} node
     */
    function stubField(fieldName, hasValue) {
      var node = document.createElement('input'),
        value = hasValue ? 'data.value' : 'data';

      // make the node a field
      node.setAttribute(references.fieldAttribute, fieldName);
      // make the node data-bound
      node.setAttribute('rv-value', value);

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

      it('gets values for multiple fields', function () {
        var field1 = stubField('foo', true),
          field2 = stubField('bar', true),
          form = stubForm([field1, field2]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(field1, { data: { value: 'FOO' } }));
        behaviors.getBinding.withArgs('bar').returns(stubBinding(field2, { data: { value: 'BAR' } }));

        expect(fn(form)).to.eql({ foo: 'FOO', bar: 'BAR' });
      });

      it('gets string value', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(field, { data: { value: 'bar' } }));

        expect(fn(form)).to.eql({ foo: 'bar' });
      });

      it('gets number value', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(field, { data: { value: 1 } }));

        expect(fn(form)).to.eql({ foo: 1 });
      });

      it('gets boolean value', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(field, { data: { value: true } }));

        expect(fn(form)).to.eql({ foo: true });
      });

      it('gets array value', function () {
        var field = stubField('foo', false),
          form = stubForm([field]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(field, { data: [1,2,3] }));

        expect(fn(form)).to.eql({ foo: [1,2,3] });
      });

      it('gets object value', function () {
        var field = stubField('foo', false),
          form = stubForm([field]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(field, { data: { prop: 'val' } }));

        expect(fn(form)).to.eql({ foo: { prop: 'val' } });
      });

      it('removes binding metadata from strings', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(field, { data: { value: 'bar', _coolness: 'radical' } }));

        expect(fn(form)).to.eql({ foo: 'bar' });
      });

      it('removes binding metadata from arrays', function () {
        var field = stubField('foo', false),
          form = stubForm([field]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(field, { data: [
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

      it('removes nonbreaking spaces from strings', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(field, { data: { value: 'b&#160;a\u00a0r&nbsp;r' } }));

        expect(fn(form)).to.eql({ foo: 'b a r r' });
      });

      it('trims strings', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        behaviors.getBinding.withArgs('foo').returns(stubBinding(field, { data: { value: '   b a r   ' } }));

        expect(fn(form)).to.eql({ foo: 'b a r' });
      });
    });
  });
});
