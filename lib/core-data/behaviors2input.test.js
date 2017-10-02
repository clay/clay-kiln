import * as lib from './behaviors2input';

describe('behaviors2input', () => {
  describe('hasBehaviors', () => {
    const fn = lib.hasBehaviors,
      behavior = { fn: 'text',  type: 'url' },
      input = { input: 'text', type: 'url' },
      schema = {
        displayField: { _display: 'overlay' },
        arrayField: { _has: [behavior] },
        objectField: { _has: behavior },
        oldStringField: { _has: 'textarea' },
        newStringField: { _has: 'text' },
        inputField: { _has: input },
        _groups: {
          displayGroup: { _display: 'overlay' },
          arrayGroup: { fields: ['arrayField'] },
          objectGroup: { fields: ['objectField'] },
          oldStringGroup: { fields: ['oldStringField'] },
          newStringGroup: { fields: ['newStringField'] },
          inputGroup: { fields: ['inputField'] }
        }
      };

    // fields

    it('returns true if field has _display', () => {
      expect(fn('displayField', schema)).to.equal(true);
    });

    it('returns true if field has behaviors array', () => {
      expect(fn('arrayField', schema)).to.equal(true);
    });

    it('returns true if field has behavior object', () => {
      expect(fn('objectField', schema)).to.equal(true);
    });

    it('returns true if field has behavior string (matches old behaviors)', () => {
      expect(fn('oldStringField', schema)).to.equal(true);
    });

    it('returns false if field has input string (matches new inputs)', () => {
      expect(fn('newStringField', schema)).to.equal(false);
    });

    it('returns false if field has input object', () => {
      expect(fn('inputField', schema)).to.equal(false);
    });

    it('throws error if field has no _has property', () => {
      expect(() => fn('errorField', schema)).to.throw(Error);
    });

    // groups

    it('returns true if group has _display', () => {
      expect(fn('displayGroup', schema)).to.equal(true);
    });

    it('returns true if group has fields with behaviors arrays', () => {
      expect(fn('arrayGroup', schema)).to.equal(true);
    });

    it('returns true if group has fields with behavior objects', () => {
      expect(fn('objectGroup', schema)).to.equal(true);
    });

    it('returns true if group has fields with behavior strings (matches old behaviors)', () => {
      expect(fn('oldStringGroup', schema)).to.equal(true);
    });

    it('returns false if group has fields with input strings (matches new inputs)', () => {
      expect(fn('newStringGroup', schema)).to.equal(false);
    });

    it('returns false if group has fields with input objects', () => {
      expect(fn('inputGroup', schema)).to.equal(false);
    });

    it('throws error if group has no fields property', () => {
      expect(() => fn('errorGroup', schema)).to.throw(Error);
    });
  });

  describe('convertSchema', () => {
    const fn = lib.convertSchema,
      name = 'foo',
      path = 'bar';

    beforeEach(() => {
      fn.cache.clear(); // don't memoize when testing
    });

    it('ignores _version, _description, and _devDescription', () => {
      const metadata = {
        _version: 1,
        _description: 'hi',
        _devDescription: 'hi devs'
      };

      expect(fn(metadata, name)).to.eql(metadata);
    });

    it('converts single field when passing in path', () => {
      expect(fn({
        [path]: {
          _display: 'overlay', // removed
          _label: 'Bar',
          _has: 'text'
        }
      }, name, path)).to.eql({
        _label: 'Bar',
        _has: 'text' // note: shorthand input definition, which you can use in schemas
      });
    });

    it('converts inline, unstyled, wysiwyg fields to inline input', () => {
      expect(fn({
        [path]: {
          // strict inline wysiwyg is defined by three things:
          _display: 'inline', // 1 - inline display on the field itself (groups cannot be inline)
          _has: {
            fn: 'wysiwyg', // 2 - wysiwyg behavior, of course
            styled: false, // 3 - styled: false, or unset, so it pulls styles from the component itself
            buttons: ['bold'] // other arguments will be passed into the new input
          }
        }
      }, name, path)).to.eql({
        _has: {
          input: 'inline',
          buttons: ['bold']
        }
      });
    });

    it('converts implicit settings group if no explicit settings defined', () => {
      expect(fn({
        a: {
          _display: 'settings',
          _has: 'text'
        },
        b: {
          _display: 'settings',
          _has: 'text'
        },
        c: {
          _display: 'overlay',
          _has: 'text'
        }
      }, name)).to.eql({
        a: { _has: 'text' },
        b: { _has: 'text' },
        c: { _has: 'text' },
        _groups: {
          settings: { fields: ['a', 'b'] } // no c
        }
      });
    });

    it('does not convert implicit settings group if explicit settings already defined', () => {
      expect(fn({
        a: {
          _display: 'settings',
          _has: 'text'
        },
        b: {
          _display: 'settings',
          _has: 'text'
        },
        c: {
          _display: 'settings',
          _has: 'text'
        },
        _groups: {
          settings: { fields: ['a', 'b'] } // no c in explicit group
        }
      }, name)).to.eql({
        a: { _has: 'text' },
        b: { _has: 'text' },
        c: { _has: 'text' },
        _groups: {
          settings: { fields: ['a', 'b'] } // no c, because it wasn't in explicit group
        }
      });
    });

    it('does not convert _componentList and _component fields', () => {
      const schema = {
        a: { _componentList: true },
        b: { _component: true }
      };

      expect(fn(schema, name)).to.eql(schema);
    });

    it('converts groups (removing _display), passing through arguments', () => {
      expect(fn({
        _groups: {
          a: {
            _display: 'inline', // inline groups will now open in overlays
            fields: ['foo', 'bar'],
            _placeholder: { text: 'hi' }
          }
        }
      }, name)).to.eql({
        _groups: {
          a: {
            fields: ['foo', 'bar'],
            _placeholder: { text: 'hi' }
          }
        }
      });
    });

    it('converts fields (removing _display), passing through arguments', () => {
      expect(fn({
        [path]: {
          _display: 'overlay',
          _label: 'Bar',
          _placeholder: { text: 'hi' },
          _publish: 'someProp',
          _subscribe: 'someOtherProp',
          _has: 'text'
        }
      }, name, path)).to.eql({
        _label: 'Bar',
        _placeholder: { text: 'hi' },
        _publish: 'someProp',
        _subscribe: 'someOtherProp',
        _has: 'text'
      });
    });

    it('converts fields with no main input (preserving description)', () => {
      expect(fn({
        [path]: {
          _label: 'Bar',
          _has: {
            fn: 'description',
            value: 'some desc'
          }
        }
      }, name, path)).to.eql({
        _label: 'Bar',
        _has: { help: 'some desc' }
      });
    });

    it('converts textarea to multi-line text input', () => {
      expect(fn({
        [path]: { _has: 'textarea' }
      }, name, path)).to.eql({
        _has: {
          input: 'text',
          type: 'multi-line'
        }
      });
    });

    it('converts (text) type=date to actual date input', () => {
      expect(fn({
        [path]: {
          _has: {
            fn: 'text',
            type: 'date'
          }
        }
      }, name, path)).to.eql({ _has: 'datepicker' });
    });

    it('converts (text) type=time to actual time input', () => {
      expect(fn({
        [path]: {
          _has: {
            fn: 'text',
            type: 'time'
          }
        }
      }, name, path)).to.eql({ _has: 'time' });
    });

    it('converts (text) type=datetime-local to date input, and warns user', () => {
      expect(fn({
        [path]: {
          _has: {
            fn: 'text',
            type: 'datetime-local'
          }
        }
      }, name, path)).to.eql({ _has: 'datepicker' });
      expect(loggerStub.error.called).to.equal(true);
    });

    it('converts other "main" behaviors in fields, removing certain properties and converting native validation to pre-publish', () => {
      expect(fn({
        a: {
          _has: {
            fn: 'text',
            input: 'no',
            help: 'no',
            required: true,
            pattern: 'abc',
            minLength: 1,
            maxLength: 2,
            placeholder: 'no', // float labels don't work with placeholders
            autocomplete: false
          }
        },
        b: {
          _has: {
            fn: 'text',
            type: 'number',
            min: 1,
            max: 2
          }
        },
        c: {
          _has: {
            fn: 'checkbox',
            label: 'no' // checkbox label comes from field _label
          }
        }
      }, name)).to.eql({
        a: {
          _has: {
            input: 'text',
            validate: {
              // these are moved to the validate object
              required: true,
              pattern: 'abc',
              min: 1, // minLength is consolidated into min
              max: 2 // maxLength is consolidated into max
            }
          }
        },
        b: {
          _has: {
            input: 'text',
            type: 'number',
            validate: {
              min: 1,
              max: 2
            }
          }
        },
        c: { _has: 'checkbox' }
      });
    });

    it('adds description as help text', () => {
      expect(fn({
        [path]: {
          _has: ['text', {
            fn: 'description',
            value: 'some desc'
          }]
        }
      }, name, path)).to.eql({
        _has: {
          input: 'text',
          help: 'some desc'
        }
      });
    });

    it('adds one attached button to input', () => {
      expect(fn({
        [path]: {
          _has: ['text', 'lock', {
            // it only grabs the first attached button,
            // so the lock will be added but magic-button won't
            fn: 'magic-button',
            field: 'url'
          }]
        }
      }, name, path)).to.eql({
        _has: {
          input: 'text',
          attachedButton: 'lock' // syntactical shorthand
        }
      });
    });

    it('adds attached button to input, with arguments', () => {
      expect(fn({
        [path]: {
          _has: ['text', {
            fn: 'magic-button',
            field: 'url'
          }]
        }
      }, name, path)).to.eql({
        _has: {
          input: 'text',
          attachedButton: {
            name: 'magic-button',
            field: 'url'
          }
        }
      });
    });

    it('adds conditional required to input', () => {
      expect(fn({
        [path]: {
          _has: ['text', {
            fn: 'conditional-required',
            field: 'title'
          }]
        }
      }, name, path)).to.eql({
        _has: {
          input: 'text',
          validate: {
            required: { field: 'title' }
          }
        }
      });
    });

    it('adds required to input', () => {
      expect(fn({
        [path]: {
          _has: ['text', 'required'] // required behavior, rather than native validation (tested above)
        }
      }, name, path)).to.eql({
        _has: {
          input: 'text',
          validate: { required: true }
        }
      });
    });

    it('adds soft-maxlength to input', () => {
      expect(fn({
        [path]: {
          _has: ['text', {
            fn: 'soft-maxlength',
            value: 10 // soft-maxlength behavior, rather than native validation (tested above)
          }]
        }
      }, name, path)).to.eql({
        _has: {
          input: 'text',
          validate: { max: 10 }
        }
      });
    });
  });
});
