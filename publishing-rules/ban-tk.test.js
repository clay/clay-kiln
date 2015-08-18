var _ = require('lodash'),
  dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  sinon = require('sinon'),
  lib = require('./ban-tk');

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
        var justText = 'TK',
          shortText = 'abcTKdef',
          longText = 'qwertyuiopasdfghjkl;zTKqwertyuiopasdfghjkl;z',
          state = {
            refs: {
              'a/components/paragraph/instances/b': {text: {value: justText}},
              'c/components/paragraph/instances/d': {text: {value: shortText}},
              'e/components/paragraph': {text: {value: shortText}},
              'k/components/paragraph/instances/l': {text: {value: longText}}
            }
          };

        copyKeyToRefs(state);

        expect(fn(state)).to.deep.equal([{
          ref: 'a/components/paragraph/instances/b',
          fieldName: 'text',
          label: 'Paragraph',
          preview: 'TK'
        }, {
          ref: 'c/components/paragraph/instances/d',
          fieldName: 'text',
          label: 'Paragraph',
          preview: 'abcTKdef'
        }, {
          ref: 'e/components/paragraph',
          fieldName: 'text',
          label: 'Paragraph',
          preview: 'abcTKdef'
        }, {
          ref: 'k/components/paragraph/instances/l',
          fieldName: 'text',
          label: 'Paragraph',
          preview: '...wertyuiopasdfghjkl;zTKqwertyuiopasdfgh...'
        }]);
      });

      it('returns errors for articles', function () {
        var justText = 'TK',
          shortText = 'abcTKdef',
          longText = 'qwertyuiopasdfghjkl;zTKqwertyuiopasdfghjkl;z',
          state = {
            refs: {
              'f/components/article': {primaryHeadline: {value: shortText}},
              'g/components/article/instances/h': {primaryHeadline: {value: shortText}},
              'i/components/article/instances/j': {primaryHeadline: {value: justText}},
              'm/components/article/instances/n': {primaryHeadline: {value: longText}},
              'o/components/article/instances/p': {primaryHeadline: {value: shortText, _schema: {_label: 'Headline'}}}
            }
          };

        copyKeyToRefs(state);

        expect(fn(state)).to.deep.equal([{
          ref: 'f/components/article',
          fieldName: 'primaryHeadline',
          label: 'Article',
          preview: 'abcTKdef'
        }, {
          ref: 'g/components/article/instances/h',
          fieldName: 'primaryHeadline',
          label: 'Article',
          preview: 'abcTKdef'
        }, {
          ref: 'i/components/article/instances/j',
          fieldName: 'primaryHeadline',
          label: 'Article',
          preview: 'TK'
        }, {
          ref: 'm/components/article/instances/n',
          fieldName: 'primaryHeadline',
          label: 'Article',
          preview: '...wertyuiopasdfghjkl;zTKqwertyuiopasdfgh...'
        }, {
          ref: 'o/components/article/instances/p',
          fieldName: 'primaryHeadline',
          label: 'Article Headline',
          preview: 'abcTKdef'
        }]);
      });
    });
  });
});

