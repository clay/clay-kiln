import _ from 'lodash';
import * as lib from './helpers';

function getFirstArg(spy) {
  return _.get(spy, 'args.0.0');
}

describe('validation helpers', () => {
  let sandbox, spy;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    spy = sandbox.spy();
  });

  afterEach(() => {
    spy = null;
    sandbox.restore();
  });

  describe('forEachComponent', () => {
    const fn = lib.forEachComponent;

    it('does not run function if no components', () => {
      fn(null, spy);
      expect(spy.callCount).to.equal(0);
    });

    it('does not run function on components that have been removed from the state', () => {
      fn({
        components: {
          a: {},
          b: { a: 'b' }
        }
      }, spy);
      expect(spy.callCount).to.equal(1); // only called on b
    });

    it('calls function on each component', () => {
      let aData = { a: 'b' },
        bData = { b: 'c' };

      fn({
        components: {
          a: aData,
          b: bData
        }
      }, spy);
      expect(spy.callCount).to.equal(2);
      expect(spy.args[0]).to.eql([aData, 'a']);
      expect(spy.args[1]).to.eql([bData, 'b']);
    });

    it('allows filtering by component', () => {
      let aData = { a: 'b' },
        bData = { b: 'c' };

      fn({
        components: {
          'components/a/instances/foo': aData,
          'components/b/instances/foo': bData,
          'components/a': {} // empty data
        }
      }, spy, 'a');
      expect(spy.callCount).to.equal(1);
      expect(spy.args[0]).to.eql([aData, 'components/a/instances/foo']);
    });

    it('allows filtering by multiple components', () => {
      let aData = { a: 'b' },
        bData = { b: 'c' },
        cData = { c: 'd' };

      fn({
        components: {
          'components/a/instances/foo': aData,
          'components/b/instances/foo': bData,
          'components/c/instances/foo': cData
        }
      }, spy, ['a', 'b']);
      expect(spy.callCount).to.equal(2);
      expect(spy.args[0]).to.eql([aData, 'components/a/instances/foo']);
      expect(spy.args[1]).to.eql([bData, 'components/b/instances/foo']);
    });
  });

  describe('getSchema', () => {
    const fn = lib.getSchema;

    it('gets schema for component', () => {
      expect(fn({ schemas: { foo: { a: 'b' }}}, 'foo')).to.eql({ a: 'b' });
    });

    it('gets schema for hyphenated-named component', () => {
      expect(fn({ schemas: { 'foo-bar': { a: 'b' }}}, 'foo-bar')).to.eql({ a: 'b' });
    });

    it('gets schema for uri', () => {
      expect(fn({ schemas: { foo: { a: 'b' }}}, 'domain.com/components/foo/instances/bar')).to.eql({ a: 'b' });
    });
  });

  describe('forEachField', () => {
    const fn = lib.forEachField;

    it('does not call fn for empty component', () => {
      fn({ schemas: { foo: { a: {} } } }, {}, 'foo', spy);
      expect(spy.callCount).to.equal(0);
    });

    it('does not call fn for empty schema (no fields or metadata)', () => {
      fn({ schemas: { foo: {} } }, { a: 'b' }, 'foo', spy);
      expect(spy.callCount).to.equal(0);
    });

    it('does not call fn for metadata', () => {
      // _version, _description, and _devDescription are component metadata
      fn({
        schemas: {
          foo: {
            _version: 1,
            _description: 'some desc',
            _devDescription: 'some desc'
          }
        }
      }, { a: 'b' }, 'foo', spy);
      expect(spy.callCount).to.equal(0);
    });

    // component lists

    it('calls fn w/ empty data for component list', () => {
      fn({
        schemas: {
          foo: {
            a: { _componentList: true }
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'component-list',
        name: 'a',
        path: 'a',
        value: [],
        schema: { _componentList: true }
      });
    });

    it('calls fn w/ empty array for component list', () => {
      fn({
        schemas: {
          foo: {
            a: { _componentList: true }
          }
        }
      }, { a: [] }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'component-list',
        name: 'a',
        path: 'a',
        value: [],
        schema: { _componentList: true }
      });
    });

    it('calls fn w/ data for component list', () => {
      fn({
        schemas: {
          foo: {
            a: { _componentList: true }
          }
        }
      }, { a: [{ _ref: 'domain.com/components/bar' }] }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'component-list',
        name: 'a',
        path: 'a',
        value: ['domain.com/components/bar'],
        schema: { _componentList: true }
      });
    });

    it('calls fn w/ data for page area', () => {
      fn({
        schemas: {
          foo: {
            a: { _componentList: { page: true } }
          }
        }
      }, { a: 'a' }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'component-list',
        name: 'a',
        path: 'a',
        value: 'a',
        schema: { _componentList: { page: true } }
      });
    });

    // component props

    it('calls fn w/ null data for component prop', () => {
      fn({
        schemas: {
          foo: {
            a: { _component: true }
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'component-prop',
        name: 'a',
        path: 'a',
        value: null,
        schema: { _component: true }
      });
    });

    it('calls fn w/ data for component prop', () => {
      fn({
        schemas: {
          foo: {
            a: { _component: true }
          }
        }
      }, { a: { _ref: 'domain.com/components/bar' } }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'component-prop',
        name: 'a',
        path: 'a',
        value: 'domain.com/components/bar',
        schema: { _component: true }
      });
    });

    // non-editable fields

    it('calls fn w/ null data for field w/ empty object in schema', () => {
      // note: these log warnings when they're initially added to the page,
      // because we want developers to add descriptions to their fields
      fn({
        schemas: {
          foo: {
            a: {}
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'non-editable-field',
        name: 'a',
        path: 'a',
        value: null,
        schema: {},
        validate: undefined
      });
    });

    it('calls fn w/ null data for non-editable fields', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { help: 'hi' }}
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'non-editable-field',
        name: 'a',
        path: 'a',
        value: null,
        schema: { _has: { help: 'hi' }},
        validate: undefined
      });
    });

    it('calls fn w/ null data for non-editable fields w/ undefined data', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { help: 'hi' }}
          }
        }
      }, { a: undefined }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'non-editable-field',
        name: 'a',
        path: 'a',
        value: null,
        schema: { _has: { help: 'hi' }},
        validate: undefined
      });
    });

    it('calls fn w/ data for non-editable fields', () => {
      // e.g. if data is generated by model.js or pubsub
      fn({
        schemas: {
          foo: {
            a: { _has: { help: 'hi' }}
          }
        }
      }, { a: 'b' }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'non-editable-field',
        name: 'a',
        path: 'a',
        value: 'b',
        schema: { _has: { help: 'hi' }},
        validate: undefined
      });
    });

    it('calls fn w/ null data for editable fields (shorthand syntax)', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: 'text'}
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: null,
        schema: { _has: 'text' },
        validate: undefined
      });
    });

    it('calls fn w/ null data for editable fields (longhand syntax)', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'text' } }
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: null,
        schema: { _has: { input: 'text' }  },
        validate: undefined
      });
    });

    it('calls fn w/ data for editable fields (shorthand syntax)', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: 'checkbox'}
          }
        }
      }, { a: false }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: false,
        schema: { _has: 'checkbox' },
        validate: undefined
      });
    });

    it('calls fn w/ data for editable fields (longhand syntax)', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'checkbox' } }
          }
        }
      }, { a: false }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: false,
        schema: { _has: { input: 'checkbox' }  },
        validate: undefined
      });
    });

    it('calls fn w/ data for editable fields (empty string)', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'text' } }
          }
        }
      }, { a: '' }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: '',
        schema: { _has: { input: 'text' }  },
        validate: undefined
      });
    });

    it('calls fn w/ data for editable fields (zero)', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'text', type: 'number' } }
          }
        }
      }, { a: 0 }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: 0,
        schema: { _has: { input: 'text', type: 'number' }  },
        validate: undefined
      });
    });

    it('calls fn w/ data for editable fields (boolean)', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'checkbox' } }
          }
        }
      }, { a: true }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: true,
        schema: { _has: { input: 'checkbox' }  },
        validate: undefined
      });
    });

    it('calls fn w/ data for editable fields (string)', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'text' } }
          }
        }
      }, { a: 'hi' }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: 'hi',
        schema: { _has: { input: 'text' }  },
        validate: undefined
      });
    });

    it('calls fn w/ data for editable fields (number)', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'text', type: 'number' } }
          }
        }
      }, { a: 5 }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'editable-field',
        name: 'a',
        path: 'a',
        value: 5,
        schema: { _has: { input: 'text', type: 'number' }  },
        validate: undefined
      });
    });

    // complex lists

    it('calls fn w/ empty array for undefined complex-lists', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } }
          }
        }
      }, { b: 'c' }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'complex-list',
        name: 'a',
        path: 'a',
        value: [],
        schema: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } },
        validate: undefined
      });
    });

    it('calls fn w/ empty array for empty complex-lists', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } }
          }
        }
      }, { a: [] }, 'foo', spy);
      expect(spy.callCount).to.equal(1);
      expect(getFirstArg(spy)).to.eql({
        type: 'complex-list',
        name: 'a',
        path: 'a',
        value: [],
        schema: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } },
        validate: undefined
      });
    });

    it('recursively calls fn for complex-lists (null child)', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } }
          }
        }
      }, { a: [{}] }, 'foo', spy);
      expect(spy.callCount).to.equal(2);
      expect(getFirstArg(spy)).to.eql({
        type: 'complex-list',
        name: 'a',
        path: 'a',
        value: [{}],
        schema: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } },
        validate: undefined
      });
      expect(_.get(spy, 'args.1.0')).to.eql({
        type: 'editable-field',
        name: 'b',
        path: 'a.0.b',
        value: null,
        schema: { prop: 'b', _has: 'text' },
        validate: undefined
      });
    });

    it('recursively calls fn for complex-lists (children w/ data)', () => {
      fn({
        schemas: {
          foo: {
            a: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } }
          }
        }
      }, { a: [{ b: 'c' }, { b: 'd' }] }, 'foo', spy);
      expect(spy.callCount).to.equal(3);
      expect(getFirstArg(spy)).to.eql({
        type: 'complex-list',
        name: 'a',
        path: 'a',
        value: [{ b: 'c' }, { b: 'd' }],
        schema: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: 'text' }] } },
        validate: undefined
      });
      expect(_.get(spy, 'args.1.0')).to.eql({
        type: 'editable-field',
        name: 'b',
        path: 'a.0.b',
        value: 'c',
        schema: { prop: 'b', _has: 'text' },
        validate: undefined
      });
      expect(_.get(spy, 'args.2.0')).to.eql({
        type: 'editable-field',
        name: 'b',
        path: 'a.1.b',
        value: 'd',
        schema: { prop: 'b', _has: 'text' },
        validate: undefined
      });
    });

    it('recursively calls fn for complex-lists inside complex-list', () => {
      // [ ಠ Ĺ̯ ಠೃ ] I say, steady on old chum!
      fn({
        schemas: {
          foo: {
            a: {
              _has: {
                input: 'complex-list',
                props: [{
                  prop: 'b',
                  _has: {
                    input: 'complex-list',
                    props: [{
                      prop: 'c',
                      _has: 'text'
                    }]
                  }
                }]
              }
            }
          }
        }
      }, { a: [{ b: [{ c: 'hi' }] }] }, 'foo', spy);
      expect(spy.callCount).to.equal(3);
      expect(getFirstArg(spy)).to.eql({
        type: 'complex-list',
        name: 'a',
        path: 'a',
        value: [{ b: [{ c: 'hi' }] }],
        schema: { _has: { input: 'complex-list', props: [{ prop: 'b', _has: { input: 'complex-list', props: [{ prop: 'c', _has: 'text' }]} }] } },
        validate: undefined
      });
      expect(_.get(spy, 'args.1.0')).to.eql({
        type: 'complex-list',
        name: 'b',
        path: 'a.0.b',
        value: [{ c: 'hi' }],
        schema: { prop: 'b', _has: { input: 'complex-list', props: [{ prop: 'c', _has: 'text' }]} },
        validate: undefined
      });
      expect(_.get(spy, 'args.2.0')).to.eql({
        type: 'editable-field',
        name: 'c',
        path: 'a.0.b.0.c',
        value: 'hi',
        schema: { prop: 'c', _has: 'text' },
        validate: undefined
      });
    });
  });

  describe('getPlaintextValue', () => {
    const fn = lib.getPlaintextValue;

    it('passes through strings without formatting', () => {
      expect(fn('hi')).to.eql('hi');
    });

    it('removes formatting from strings', () => {
      expect(fn('<strong>hi</strong>')).to.eql('hi');
    });

    it('decodes html entities', () => {
      expect(fn('&hellip;')).to.eql('…');
    });
  });

  describe('getPreviewText', () => {
    const fn = lib.getPreviewText;

    it('returns the full text if short', () => {
      expect(fn('hello', 0, 0)).to.equal('hello');
    });

    it('truncates text', () => {
      expect(fn('O brave new world, that has such people in\'t!', 21, 0)).to.equal('… brave new world, that has such people i…');
    });
  });

  describe('shouldBeRequired', () => {
    const fn = lib.shouldBeRequired;

    it('compares root fields', () => {
      expect(fn({
        path: 'a',
        validate: {
          required: {
            field: 'b',
            operator: 'empty'
          }
        }}, { b: '' })).to.equal(true);
    });

    it('compares complex-list field to root field', () => {
      expect(fn({
        path: 'a.0.b',
        validate: {
          required: {
            field: 'c',
            operator: 'empty'
          }
        }}, { a: [{ b: 'hi' }], c: '' })).to.equal(true);
    });

    it('compares complex-list field to field in same list item', () => {
      expect(fn({
        path: 'a.0.b',
        validate: {
          required: {
            field: 'c',
            operator: 'empty'
          }
        }}, { a: [{ b: 'hi', c: '' }] })).to.equal(true);
    });

    it('compares complex-list field to field in same list item BEFORE checking root field', () => {
      expect(fn({
        path: 'a.0.b',
        validate: {
          required: {
            field: 'c',
            operator: '===',
            value: 'one'
          }
        }}, { a: [{ b: 'hi', c: 'one' }], c: 'two' })).to.equal(true);
    });

    it('compares nested complex-list field to field in same list item BEFORE checking higher-level list', () => {
      expect(fn({
        path: 'a.0.b.0.c',
        validate: {
          required: {
            field: 'd',
            operator: '===',
            value: 'one'
          }
        }}, { a: [{ b: [{ c: 'hi', d: 'one' }], d: 'two' }] })).to.equal(true);
    });
  });

  describe('isValid', () => {
    const fn = lib.isValid;

    it('returns true if no validation rules', () => {
      expect(fn({ schema: { _has: 'text' } })).to.equal(true);
    });

    it('returns true if non-empty and required', () => {
      expect(fn({ validate: { required: true }, value: 'hi' })).to.equal(true);
    });

    it('returns false if empty and required', () => {
      expect(fn({ validate: { required: true }, value: '' })).to.equal(false);
    });

    it('returns true if non-empty and conditionally-required', () => {
      expect(fn({ path: 'b', validate: { required: { field: 'a', operator: 'empty' } }, value: 'hi' }, { a: '' })).to.equal(true);
    });

    it('returns false if empty and conditionally-required', () => {
      expect(fn({ path: 'b', validate: { required: { field: 'a', operator: 'empty' } }, value: '' }, { a: '' })).to.equal(false);
    });

    it('returns true if pattern matches', () => {
      expect(fn({ validate: { pattern: '^a' }, value: 'abc' })).to.equal(true);
    });

    it('returns true if pattern does not match', () => {
      expect(fn({ validate: { pattern: '^a' }, value: 'bcd' })).to.equal(false);
    });

    it('returns true if string length >= min', () => {
      expect(fn({ validate: { min: 2 }, value: 'hi' })).to.equal(true);
    });

    it('returns false if string length !>= min', () => {
      expect(fn({ validate: { min: 2 }, value: 'a' })).to.equal(false);
    });

    it('returns true if array length >= min', () => {
      expect(fn({ validate: { min: 1 }, value: ['a'] })).to.equal(true);
    });

    it('returns false if array length !>= min', () => {
      expect(fn({ validate: { min: 2 }, value: ['a'] })).to.equal(false);
    });

    it('returns true if number value >= min', () => {
      expect(fn({ validate: { min: 5 }, value: 5 })).to.equal(true);
    });

    it('returns false if number value !>= min', () => {
      expect(fn({ validate: { min: 5 }, value: 4 })).to.equal(false);
    });

    it('returns true if string length <= max', () => {
      expect(fn({ validate: { max: 2 }, value: 'hi' })).to.equal(true);
    });

    it('returns false if string length !<= max', () => {
      expect(fn({ validate: { max: 2 }, value: 'abc' })).to.equal(false);
    });

    it('returns true if array length <= max', () => {
      expect(fn({ validate: { max: 1 }, value: ['a'] })).to.equal(true);
    });

    it('returns false if array length !<= max', () => {
      expect(fn({ validate: { max: '1' }, value: ['a', 'b'] })).to.equal(false);
    });

    it('returns true if number value <= max', () => {
      expect(fn({ validate: { max: 5 }, value: 5 })).to.equal(true);
    });

    it('returns false if number value !<= max', () => {
      expect(fn({ validate: { max: 5 }, value: 6 })).to.equal(false);
    });
  });

  // DEPRECATED - will be removed in kiln 6.x

  describe('getInput', () => {
    const fn = lib.getInput;

    it('returns null if no inputs', () => {
      expect(fn('foo', { _has: {} })).to.equal(null);
    });

    it('returns null if input not found in root', () => {
      expect(fn('foo', { _has: 'text' })).to.equal(null);
    });

    it('returns null if input not found in complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'text'
        }]
      } })).to.equal(null);
    });

    it('returns null if input not found in nested complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            input: 'complex-list',
            props: [{
              prop: 'someOtherProp',
              _has: 'text'
            }]
          }
        }]
      } })).to.equal(null);
    });

    it('returns input config if input found in root', () => {
      expect(fn('foo', { _has: 'foo' })).to.eql({ input: 'foo' });
    });

    it('returns input config if input found in complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'foo'
        }]
      } })).to.eql({ input: 'foo', _path: 'someProp' });
    });

    it('returns input config if input found in nested complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            input: 'complex-list',
            props: [{
              prop: 'someOtherProp',
              _has: 'foo'
            }]
          }
        }]
      } })).to.eql({ input: 'foo', _path: 'someProp.someOtherProp' });
    });
  });

  describe('hasInput', () => {
    const fn = lib.hasInput;

    it('returns false if no inputs', () => {
      expect(fn('foo', { _has: {} })).to.equal(false);
    });

    it('returns false if input not found in root', () => {
      expect(fn('foo', { _has: 'text' })).to.equal(false);
    });

    it('returns false if input not found in complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'text'
        }]
      } })).to.equal(false);
    });

    it('returns false if input not found in nested complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            input: 'complex-list',
            props: [{
              prop: 'someOtherProp',
              _has: 'text'
            }]
          }
        }]
      } })).to.equal(false);
    });

    it('returns true if input found in root', () => {
      expect(fn('foo', { _has: 'foo' })).to.equal(true);
    });

    it('returns true if input found in complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: 'foo'
        }]
      } })).to.equal(true);
    });

    it('returns true if input found in nested complex list', () => {
      expect(fn('foo', { _has: {
        input: 'complex-list',
        props: [{
          prop: 'someProp',
          _has: {
            input: 'complex-list',
            props: [{
              prop: 'someOtherProp',
              _has: 'foo'
            }]
          }
        }]
      } })).to.equal(true);
    });
  });

  describe('getListProps', () => {
    const fn = lib.getListProps;

    it('returns null if no complex-list', () => {
      expect(fn({})).to.equal(null);
    });
  });
});
