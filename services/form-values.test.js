var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  _ = require('lodash'),
  rivets = require('rivets'),
  formCreator = require('./form-creator'),
  references = require('./references'),
  lib = require('./form-values');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(formCreator);
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
      node.setAttribute('rv-value', fieldName + '.' + value);

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
        formCreator.getBindings.returns({});
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
        formCreator.getBindings.returns({});
        expect(fn(document.createElement('form'))).to.eql({});
      });

      it('gets values for multiple fields', function () {
        var field1 = stubField('foo', true),
          field2 = stubField('bar', true),
          form = stubForm([field1, field2]);

        formCreator.getBindings.returns(stubBinding(form, {
          foo: {
            data: { value: 'FOO' }
          },
          bar: {
            data: { value: 'BAR' }
          }
        }));

        expect(fn(form)).to.eql({ foo: { value: 'FOO' }, bar: { value: 'BAR' }});
      });

      it('gets string value', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        formCreator.getBindings.returns(stubBinding(form, { foo: {
          data: { value: 'bar' }
        }}));

        expect(fn(form)).to.eql({ foo: { value: 'bar' }});
      });

      it('gets number value', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        formCreator.getBindings.returns(stubBinding(form, { foo: {
          data: { value: 1 }
        }}));

        expect(fn(form)).to.eql({ foo: { value: 1 }});
      });

      it('gets boolean value', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        formCreator.getBindings.returns(stubBinding(form, { foo: {
          data: { value: true }
        }}));

        expect(fn(form)).to.eql({ foo: { value: true }});
      });

      it('gets array value', function () {
        var field = stubField('foo', false),
          form = stubForm([field]);

        formCreator.getBindings.returns(stubBinding(form, { foo: {
          data: [1,2,3]
        }}));

        expect(fn(form)).to.eql({ foo: [1,2,3] });
      });

      it('gets object value', function () {
        var field = stubField('foo', false),
          form = stubForm([field]);

        formCreator.getBindings.returns(stubBinding(form, { foo: {
          data: { prop: 'val' }
        }}));

        expect(fn(form)).to.eql({ foo: { prop: 'val' } });
      });

      it('retains schemas in strings', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        formCreator.getBindings.returns(stubBinding(form, { foo: {
          data: { value: 'bar', _schema: { _name: 'foo' }}
        }}));

        expect(fn(form)).to.eql({ foo: { value: 'bar', _schema: { _name: 'foo' }}});
      });

      it('removes binding metadata from strings', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        formCreator.getBindings.returns(stubBinding(form, { foo: {
          data: { value: 'bar', _coolness: 'radical' }
        }}));

        expect(fn(form)).to.eql({ foo: { value: 'bar' }});
      });

      it('retains schemas in arrays', function () {
        var field = stubField('foo', false),
          form = stubForm([field]),
          arrayWithSchema = [
            {
              name: 'Bob'
            }, {
              name: 'Dave'
            }
          ];

        arrayWithSchema._schema = { _name: 'foo' };

        formCreator.getBindings.returns(stubBinding(form, { foo: {
          data: arrayWithSchema
        }}));

        expect(fn(form)).to.eql({ foo: _.cloneDeep(arrayWithSchema) });
      });

      it('removes binding metadata from arrays', function () {
        var field = stubField('foo', false),
          form = stubForm([field]);

        formCreator.getBindings.returns(stubBinding(form, { foo: {
          data: [
            {
              name: 'Bob',
              _coolness: 'radical'
            }, {
              name: 'Dave',
              _coolness: 'deeply uncool'
            }
          ]
        }}));

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

        formCreator.getBindings.returns(stubBinding(form, { foo: {
          data: { value: 'b&#160;a\u00a0r&nbsp;r' }
        }}));

        expect(fn(form)).to.eql({ foo: { value: 'b a r r' }});
      });

      it('trims strings', function () {
        var field = stubField('foo', true),
          form = stubForm([field]);

        formCreator.getBindings.returns(stubBinding(form, { foo: {
          data: { value: '   b a r   ' }
        }}));

        expect(fn(form)).to.eql({ foo: { value: 'b a r' }});
      });
    });
  });
});
