var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./placeholder');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('getPlaceholderText', function () {
      var fn = lib[this.title],
        mockName = 'foo.bar';

      it('uses _placeholder string if it exists', function () {
        expect(fn(mockName, {_placeholder: 'Baz'})).to.equal('Baz');
      });

      it('falls back to calling label service', function () {
        expect(fn(mockName, {_placeholder: 'true'})).to.equal('Foo » Bar');
      });
    });

    describe('getPlaceholderHeight', function () {
      var fn = lib[this.title];

      it('gets height of vertical-list', function () {
        expect(fn([{
          fn: 'text',
          required: true
        }, {
          fn: 'vertical-list'
        }])).to.equal('600px');
      });

      it('gets height of component', function () {
        expect(fn([{
          fn: 'component'
        }, {
          fn: 'dragdrop-reorder'
        }])).to.equal('300px');
      });

      it('gets default height', function () {
        expect(fn([{
          fn: 'text',
          required: true
        }, {
          fn: 'soft-maxlength',
          value: 80
        }])).to.equal('auto');
      });
    });

    describe('isFieldEmpty', function () {
      var fn = lib[this.title];

      it('is true if null', function () {
        expect(fn({value: null})).to.equal(true);
      });
      it('is true if empty string', function () {
        expect(fn({value: ''})).to.equal(true);
      });
      it('is true if empty array', function () {
        expect(fn([])).to.equal(true);
      });
      it('is true if empty obj', function () {
        expect(fn({})).to.equal(true);
      });
      it('is true if empty array w/ schema', function () {
        var emptyWithSchema = [];

        emptyWithSchema._schema = {};
        expect(fn(emptyWithSchema)).to.equal(true);
      });
      it('is true if empty obj w/ schema', function () {
        var emptyWithSchema = [];

        emptyWithSchema._schema = {};
        expect(fn(emptyWithSchema)).to.equal(true);
      });

      it('is false if string w/ characters', function () {
        expect(fn({value: '123'})).to.equal(false);
      });
      it('is false if number', function () {
        expect(fn({value: 123})).to.equal(false);
      });
      it('is false if array w/ values', function () {
        expect(fn({value: [1, 2, 3]})).to.equal(false);
      });
    });

    function stubNode() {
      var node = document.createElement('div');

      node.setAttribute('data-editable', 'title');
      return node;
    }

    describe('when', function () {
      var fn = lib[this.title];

      it('returns true if field and blank', function () {
        var stubData = {
          value: '',
          _schema: {
            _has: 'text',
            _placeholder: true
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'title'})).to.equal(true);
      });

      it('returns false if field and not blank', function () {
        var stubData = {
          value: 'asdf',
          _schema: {
            _has: 'text',
            _placeholder: true
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'title'})).to.equal(false);
      });

      it('returns false if not field', function () {
        var stubData = {
          value: '',
          _schema: {
            _placeholder: true
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'title'})).to.equal(false);
      });
    });

    describe('handler', function () {
      var fn = lib[this.title];

      it('adds placeholder', function () {
        var stubData = {
          value: '',
          _schema: {
            _has: 'text',
            _placeholder: true
          }
        },
        newNode = fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'title'});

        expect(newNode.querySelector('.editor-placeholder').style.height).to.equal('auto');
        expect(newNode.querySelector('span.placeholder-label').textContent).to.equal('Title');
      });
    });
  });
});
