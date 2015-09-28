var _ = require('lodash'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  sinon = require('sinon'),
  lib = require('./required');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    function copyKeyToRefs(state) {
      _.each(state.refs, function (obj, key) {
        obj._ref = key;
      });
    }

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('validate', function () {
      var fn = lib[this.title];

      it('returns undefined with no state.refs', function () {
        var state = {refs: {}};

        expect(fn(state)).to.equal(undefined);
      });

      it('returns undefined with no paragraph text fields', function () {
        var state = {
          refs: {
            'a/components/paragraph/instances/b': {},
            'c/components/paragraph/instances/d': {},
            'e/components/paragraph': {}
          }
        };

        expect(fn(state)).to.equal(undefined);
      });

      it('returns undefined with no article primaryHeadline fields', function () {
        var state = {
          refs: {
            'f/components/article': {},
            'g/components/article/instances/h': {}
          }
        };

        expect(fn(state)).to.equal(undefined);
      });

      it('returns errors for paragraphs', function () {
        var state = {
          refs: {
            'a/components/b/instances/c': {
              l: {value: '', _schema: {_has:[{fn: 'required'}]}},
              _schema: {l: {_has:[{fn: 'required'}]}}
            },
            'd/components/e/instances/f': {
              m: {_schema: {_has:[{fn: 'required'}]}},
              _schema: {m: {_has:[{fn: 'required'}]}}
            },
            'g/components/h': {text: {
              n: null, _schema: {_has:[{fn: 'required'}]}},
              _schema: {n: {_has:[{fn: 'required'}]}}
            },
            'i/components/j/instances/k': {
              o: {value: undefined, _schema: {_has:[{fn: 'required'}]}},
              _schema: {o: {_has:[{fn: 'required'}]}}
            }
          }
        };

        copyKeyToRefs(state);

        expect(fn(state)).to.deep.equal([ {
          ref: 'a/components/b/instances/c', fieldName: 'l', label: 'B'
        },
        {
          ref: 'd/components/e/instances/f', fieldName: 'm', label: 'E'
        },
        {
          ref: 'g/components/h', fieldName: 'n', label: 'H'
        },
        {
          ref: 'i/components/j/instances/k', fieldName: 'o', label: 'J'
        } ]);
      });
    });
  });
});

