var dirname = __dirname.split('/').pop(),
  filename = __filename.split('/').pop().split('.').shift(),
  lib = require('./placeholder'),
  tpl = require('../services/tpl'),
  fixture = require('../test/fixtures/tpl'),
  references = require('../services/references');

describe(dirname, function () {
  describe(filename, function () {
    var sandbox;

    beforeEach(function () {
      sandbox = sinon.sandbox.create();
      sandbox.stub(tpl, 'get').returns(fixture['.placeholder-template']());
    });

    afterEach(function () {
      sandbox.restore();
    });

    describe('getPlaceholderText', function () {
      var fn = lib[this.title],
        mockName = 'foo.bar';

      it('does not support _placeholder: {string}', function () {
        // we used to support _placeholder: 'some string of text'
        // but we don't anymore.
        // if you want to specify placeholder text, put it in the `text` property
        // e.g. _placeholder: { text: 'some string of text' }
        expect(fn(mockName, {_schema: {_placeholder: 'Bar'}})).to.equal('Foo Bar');
      });

      it('uses placeholder text if it exists', function () {
        expect(fn(mockName, {_schema: {_placeholder: {text: 'Baz'}}})).to.equal('Baz');
      });

      it('falls back to label if no placeholder text', function () {
        expect(fn(mockName, {_schema: {_placeholder: 'true'}})).to.equal('Foo Bar');
        expect(fn(mockName, {_schema: {_placeholder: true}})).to.equal('Foo Bar');
      });

      it('uses property value in placeholder text if value exists', function () {
        var mockData = {
            _schema: {
              _placeholder: {
                text: 'Value is ${mockProp}'
              },
              _name: 'mockProp'
            },
            value: 'some value'
          },
          componentData = { mockProp: { value: 'some value' }};

        expect(fn('mockProp', mockData, componentData)).to.equal('Value Is Some Value');
      });

      it('uses values from a group in placeholder text if values exist', function () {
        var mockGroupData = {
            value: [{
              _schema: {
                _name: 'propA'
              }, value: 'some value'
            }, {
              _schema: {
                _name: 'propB'
              }, value: 'another value'
            }],
            _schema: {
              _name: 'mockGroup',
              fields: ['propA', 'propB'],
              _placeholder: {
                text: 'A is ${propA} and B is ${propB}'
              }
            }
          },
          componentData = {
            propA: { value: 'some value' },
            propB: { value: 'another value' }
          };

        expect(fn('mockGroup', mockGroupData, componentData)).to.equal('A Is Some Value And B Is Another Value');
      });

      it('uses empty string in placeholder text if value does not exist', function () {
        var mockData = {
            _schema:{
              _placeholder: {
                text: 'Value is ${mockProp}'
              },
              _name: 'mockProp'
            },
            value: undefined
          },
          componentData = {
            mockProp: { value: null }
          };

        expect(fn('mockProp', mockData, componentData)).to.equal('Value Is ');
      });
    });

    describe('getPlaceholderHeight', function () {
      var fn = lib[this.title];

      it('gets height when set explicitly', function () {
        expect(fn(document.createElement('div'), {_placeholder: {height: '500px'}})).to.equal('500px');
      });

      it('uses computed parent height if greater than set height', function () {
        var el = document.createElement('div');

        el.style.minHeight = '100px';
        document.body.appendChild(el); // append to dom so getComputedStyle works
        expect(fn(el, {_placeholder: {height: '10px'}})).to.equal('100px');
      });

      it('falls back to 100px height', function () {
        expect(fn(document.createElement('div'), {_placeholder: {text: 'This is some text'}})).to.equal('100px');
        expect(fn(document.createElement('div'), {_placeholder: true})).to.equal('100px');
        expect(fn(document.createElement('div'), {_placeholder: 'true'})).to.equal('100px');
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

      node.setAttribute(references.editableAttribute, 'title');
      return node;
    }

    describe('when', function () {
      var fn = lib[this.title];

      it('returns true if permanent placeholder', function () {
        var stubData = {
          value: '',
          _schema: {
            _placeholder: {
              permanent: true
            }
          }
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'title'})).to.equal(true);
      });

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

      it('returns true if empty component list', function () {
        var stubData = [];

        stubData._schema = {
          _placeholder: true,
          _componentList: {}
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(true);
      });

      it('returns false if non-empty component list', function () {
        var stubData = [{
          _ref: 'fakeRef2'
        }];

        stubData._schema = {
          _placeholder: true,
          _componentList: {}
        };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'content'})).to.equal(false);
      });

      it('returns true if empty component list in page', function () {
        var stubData = { value: 'content'},
          pageData = { content: [] };

        stubData._schema = {
          _placeholder: true,
          _componentList: {}
        };

        expect(fn(stubNode(), {data: stubData, pageData: pageData, ref: 'fakeRef', path: 'content'})).to.equal(true);
      });

      it('returns true if undefined component list in page', function () {
        var stubData = { value: 'content'},
          pageData = {};

        stubData._schema = {
          _placeholder: true,
          _componentList: {}
        };

        expect(fn(stubNode(), {data: stubData, pageData: pageData, ref: 'fakeRef', path: 'content'})).to.equal(true);
      });

      it('returns false if non-empty component list in page', function () {
        var stubData = { value: 'content'},
          pageData = {
            content: ['fakeRef2']
          };

        stubData._schema = {
          _placeholder: true,
          _componentList: {}
        };

        expect(fn(stubNode(), {data: stubData, pageData: pageData, ref: 'fakeRef', path: 'content'})).to.equal(false);
      });

      it('returns true if group with ifEmpty pointing to an empty field', function () {
        var title = {
            value: '',
            _schema: {
              _has: 'text',
              _name: 'title'
            }
          },
          stubData = {
            value: [title],
            _schema: {
              fields: ['title'],
              _placeholder: {
                ifEmpty: 'title'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'titlegroup'})).to.equal(true);
      });

      it('returns false if group with ifEmpty pointing to a non-empty field', function () {
        var title = {
            value: 'abcd',
            _schema: {
              _has: 'text',
              _name: 'title'
            }
          },
          stubData = {
            value: [title],
            _schema: {
              fields: ['title'],
              _placeholder: {
                ifEmpty: 'title'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'titlegroup'})).to.equal(false);
      });

      it('returns false if group with ifEmpty points to something that is not a field', function () {
        var otherField = {
            value: '',
            _schema: {
              _has: 'text',
              _name: 'otherField'
            }
          },
          stubData = {
            value: [otherField],
            _schema: {
              fields: ['title'],
              _placeholder: {
                ifEmpty: 'title'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'title'})).to.equal(false);
      });

      it('returns true if group with ifEmpty pointing to two empty fields with AND', function () {
        var title = {
            value: '',
            _schema: {
              _has: 'text',
              _name: 'title'
            }
          },
          desc = {
            value: '',
            _schema: {
              _has: 'text',
              _name: 'desc'
            }
          },
          stubData = {
            value: [title, desc],
            _schema: {
              fields: ['title', 'desc'],
              _placeholder: {
                ifEmpty: 'title AND desc'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'titlegroup'})).to.equal(true);
      });

      it('returns false if group with ifEmpty pointing to one empty field and one non-empty field with AND', function () {
        var title = {
            value: '',
            _schema: {
              _has: 'text',
              _name: 'title'
            }
          },
          desc = {
            value: 'asdf',
            _schema: {
              _has: 'text',
              _name: 'desc'
            }
          },
          stubData = {
            value: [title, desc],
            _schema: {
              fields: ['title', 'desc'],
              _placeholder: {
                ifEmpty: 'title AND desc'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'titlegroup'})).to.equal(false);
      });

      it('returns false if group with ifEmpty pointing to two non-empty fields with AND', function () {
        var title = {
            value: 'asdf',
            _schema: {
              _has: 'text',
              _name: 'title'
            }
          },
          desc = {
            value: 'asdf',
            _schema: {
              _has: 'text',
              _name: 'desc'
            }
          },
          stubData = {
            value: [title, desc],
            _schema: {
              fields: ['title', 'desc'],
              _placeholder: {
                ifEmpty: 'title AND desc'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'titlegroup'})).to.equal(false);
      });

      it('returns true if group with ifEmpty pointing to two empty fields with OR', function () {
        var title = {
            value: '',
            _schema: {
              _has: 'text',
              _name: 'title'
            }
          },
          desc = {
            value: '',
            _schema: {
              _has: 'text',
              _name: 'desc'
            }
          },
          stubData = {
            value: [title, desc],
            _schema: {
              fields: ['title', 'desc'],
              _placeholder: {
                ifEmpty: 'title OR desc'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'titlegroup'})).to.equal(true);
      });

      it('returns true if group with ifEmpty pointing to one empty field and one non-empty field with OR', function () {
        var title = {
            value: '',
            _schema: {
              _has: 'text',
              _name: 'title'
            }
          },
          desc = {
            value: 'asdf',
            _schema: {
              _has: 'text',
              _name: 'desc'
            }
          },
          stubData = {
            value: [title, desc],
            _schema: {
              fields: ['title', 'desc'],
              _placeholder: {
                ifEmpty: 'title OR desc'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'titlegroup'})).to.equal(true);
      });

      it('returns false if group with ifEmpty pointing to two non-empty fields with OR', function () {
        var title = {
            value: 'asdf',
            _schema: {
              _has: 'text',
              _name: 'title'
            }
          },
          desc = {
            value: 'asdf',
            _schema: {
              _has: 'text',
              _name: 'desc'
            }
          },
          stubData = {
            value: [title, desc],
            _schema: {
              fields: ['title', 'desc'],
              _placeholder: {
                ifEmpty: 'title OR desc'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'titlegroup'})).to.equal(false);
      });

      it('returns false if group with ifEmpty pointing to two empty fields with XOR', function () {
        var title = {
            value: '',
            _schema: {
              _has: 'text',
              _name: 'title'
            }
          },
          desc = {
            value: '',
            _schema: {
              _has: 'text',
              _name: 'desc'
            }
          },
          stubData = {
            value: [title, desc],
            _schema: {
              fields: ['title', 'desc'],
              _placeholder: {
                ifEmpty: 'title XOR desc'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'titlegroup'})).to.equal(false);
      });

      it('returns true if group with ifEmpty pointing to one empty field and one non-empty field with XOR', function () {
        var title = {
            value: '',
            _schema: {
              _has: 'text',
              _name: 'title'
            }
          },
          desc = {
            value: 'asdf',
            _schema: {
              _has: 'text',
              _name: 'desc'
            }
          },
          stubData = {
            value: [title, desc],
            _schema: {
              fields: ['title', 'desc'],
              _placeholder: {
                ifEmpty: 'title XOR desc'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'titlegroup'})).to.equal(true);
      });

      it('returns false if group with ifEmpty pointing to two non-empty fields with XOR', function () {
        var title = {
            value: 'asdf',
            _schema: {
              _has: 'text',
              _name: 'title'
            }
          },
          desc = {
            value: 'asdf',
            _schema: {
              _has: 'text',
              _name: 'desc'
            }
          },
          stubData = {
            value: [title, desc],
            _schema: {
              fields: ['title', 'desc'],
              _placeholder: {
                ifEmpty: 'title XOR desc'
              },
              _name: 'titlegroup'
            }
          };

        expect(fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'titlegroup'})).to.equal(false);
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

        expect(newNode.querySelector('.kiln-placeholder').style.minHeight).to.equal('100px');
        expect(newNode.querySelector('span.placeholder-label').textContent).to.equal('Title');
      });

      it('adds permanent placeholder', function () {
        var stubData = {
            value: '',
            _schema: {
              _placeholder: {
                permanent: true
              }
            }
          },
          newNode = fn(stubNode(), {data: stubData, ref: 'fakeRef', path: 'title'});

        expect(newNode.querySelector('.kiln-permanent-placeholder').style.minHeight).to.equal('100px');
        expect(newNode.querySelector('span.placeholder-label').textContent).to.equal('Title');
      });
    });
  });
});
