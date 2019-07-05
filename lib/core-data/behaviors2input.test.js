import * as lib from './behaviors2input';

describe('behaviors2input', () => {
  describe('hasBehaviors', () => {
    const fn = lib.hasBehaviors,
      behavior = { fn: 'text', type: 'url' },
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

    test('returns true if field has _display', () => {
      expect(fn('displayField', schema)).toBe(true);
    });

    test('returns true if field has behaviors array', () => {
      expect(fn('arrayField', schema)).toBe(true);
    });

    test('returns true if field has behavior object', () => {
      expect(fn('objectField', schema)).toBe(true);
    });

    test(
      'returns true if field has behavior string (matches old behaviors)',
      () => {
        expect(fn('oldStringField', schema)).toBe(true);
      }
    );

    test('returns false if field has input string (matches new inputs)', () => {
      expect(fn('newStringField', schema)).toBe(false);
    });

    test('returns false if field has input object', () => {
      expect(fn('inputField', schema)).toBe(false);
    });

    test('throws error if field has no _has property', () => {
      expect(() => fn('errorField', schema)).toThrow(Error);
    });

    // groups

    test('returns true if group has _display', () => {
      expect(fn('displayGroup', schema)).toBe(true);
    });

    test('returns true if group has fields with behaviors arrays', () => {
      expect(fn('arrayGroup', schema)).toBe(true);
    });

    test('returns true if group has fields with behavior objects', () => {
      expect(fn('objectGroup', schema)).toBe(true);
    });

    test(
      'returns true if group has fields with behavior strings (matches old behaviors)',
      () => {
        expect(fn('oldStringGroup', schema)).toBe(true);
      }
    );

    test(
      'returns false if group has fields with input strings (matches new inputs)',
      () => {
        expect(fn('newStringGroup', schema)).toBe(false);
      }
    );

    test('returns false if group has fields with input objects', () => {
      expect(fn('inputGroup', schema)).toBe(false);
    });

    test('throws error if group has no fields property', () => {
      expect(() => fn('errorGroup', schema)).toThrow(Error);
    });
  });

  describe('hasAnyBehaviors', () => {
    const fn = lib.hasAnyBehaviors;

    test('returns true if schema has any old-style behaviors', () => {
      expect(fn({ a: { _has: { fn: 'text', type: 'url' } } })).toBe(true);
    });

    test('returns false if schema has no old-style behaviors', () => {
      expect(fn({ a: { _has: { input: 'text', type: 'url' } } })).toBe(false);
    });
  });

  describe('convertSchema', () => {
    const fn = lib.convertSchema,
      name = 'foo',
      path = 'bar';

    beforeEach(() => {
      fn.cache.clear(); // don't memoize when testing
    });

    test(
      'ignores _version, _description, _devDescription, and _confirmRemoval',
      () => {
        const metadata = {
          _version: 1,
          _description: 'hi',
          _devDescription: 'hi devs',
          _confirmRemoval: true
        };

        expect(fn(metadata, name)).toEqual(metadata);
      }
    );

    test('converts single field when passing in path', () => {
      expect(fn({
        [path]: {
          _display: 'overlay', // removed
          _label: 'Bar',
          _has: 'text'
        }
      }, name, path)).toEqual({
        _label: 'Bar',
        _has: 'text' // note: shorthand input definition, which you can use in schemas
      });
    });

    test('converts inline, unstyled, wysiwyg fields to inline input', () => {
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
      }, name, path)).toEqual({
        _has: {
          input: 'inline',
          buttons: ['bold']
        }
      });
    });

    test(
      'converts implicit settings group if no explicit settings defined',
      () => {
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
        }, name)).toEqual({
          a: { _has: 'text' },
          b: { _has: 'text' },
          c: { _has: 'text' },
          _groups: {
            settings: { fields: ['a', 'b'] } // no c
          }
        });
      }
    );

    test(
      'does not convert implicit settings group if explicit settings already defined',
      () => {
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
        }, name)).toEqual({
          a: { _has: 'text' },
          b: { _has: 'text' },
          c: { _has: 'text' },
          _groups: {
            settings: { fields: ['a', 'b'] } // no c, because it wasn't in explicit group
          }
        });
      }
    );

    test('does not convert _componentList and _component fields', () => {
      const schema = {
        a: { _componentList: true },
        b: { _component: true }
      };

      expect(fn(schema, name)).toEqual(schema);
    });

    test('converts groups (removing _display), passing through arguments', () => {
      expect(fn({
        _groups: {
          a: {
            _display: 'inline', // inline groups will now open in overlays
            fields: ['foo', 'bar'],
            _placeholder: { text: 'hi' }
          }
        }
      }, name)).toEqual({
        _groups: {
          a: {
            fields: ['foo', 'bar'],
            _placeholder: { text: 'hi' }
          }
        }
      });
    });

    test('converts fields (removing _display), passing through arguments', () => {
      expect(fn({
        [path]: {
          _display: 'overlay',
          _label: 'Bar',
          _placeholder: { text: 'hi' },
          _publish: 'someProp',
          _subscribe: 'someOtherProp',
          _has: 'text'
        }
      }, name, path)).toEqual({
        _label: 'Bar',
        _placeholder: { text: 'hi' },
        _publish: 'someProp',
        _subscribe: 'someOtherProp',
        _has: 'text'
      });
    });

    test('converts fields with no main input (preserving description)', () => {
      expect(fn({
        [path]: {
          _label: 'Bar',
          _has: {
            fn: 'description',
            value: 'some desc'
          }
        }
      }, name, path)).toEqual({
        _label: 'Bar',
        _has: { help: 'some desc' }
      });
    });

    test('converts textarea to multi-line text input', () => {
      expect(fn({
        [path]: { _has: 'textarea' }
      }, name, path)).toEqual({
        _has: {
          input: 'text',
          type: 'multi-line'
        }
      });
    });

    test('converts (text) type=date to actual date input', () => {
      expect(fn({
        [path]: {
          _has: {
            fn: 'text',
            type: 'date'
          }
        }
      }, name, path)).toEqual({ _has: 'datepicker' });
    });

    test('converts (text) type=time to actual time input', () => {
      expect(fn({
        [path]: {
          _has: {
            fn: 'text',
            type: 'time'
          }
        }
      }, name, path)).toEqual({ _has: 'timepicker' });
    });

    test(
      'converts (text) type=datetime-local to date input, and warns user',
      () => {
        expect(fn({
          [path]: {
            _has: {
              fn: 'text',
              type: 'datetime-local'
            }
          }
        }, name, path)).toEqual({ _has: 'datepicker' });
        expect(mockLogger).toHaveBeenCalledWith('warn', '\'bar\' (datetime-local) must be converted to two separate date and time fields! Editing this field in kiln will set the time to 12:00 AM on the date specified.', { action: 'mungeMainInput' });
      }
    );

    test(
      'converts other "main" behaviors in fields, removing certain properties and converting native validation to pre-publish',
      () => {
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
              placeholder: 'no' // float labels don't work with placeholders
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
        }, name)).toEqual({
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
      }
    );

    test('adds description as help text', () => {
      expect(fn({
        [path]: {
          _has: ['text', {
            fn: 'description',
            value: 'some desc'
          }]
        }
      }, name, path)).toEqual({
        _has: {
          input: 'text',
          help: 'some desc'
        }
      });
    });

    test('adds one attached button to input', () => {
      expect(fn({
        [path]: {
          _has: ['text', 'lock', {
            // it only grabs the first attached button,
            // so the lock will be added but magic-button won't
            fn: 'magic-button',
            field: 'url'
          }]
        }
      }, name, path)).toEqual({
        _has: {
          input: 'text',
          attachedButton: 'lock' // syntactical shorthand
        }
      });
    });

    test('adds attached button to input, with arguments', () => {
      expect(fn({
        [path]: {
          _has: ['text', {
            fn: 'magic-button',
            field: 'url'
          }]
        }
      }, name, path)).toEqual({
        _has: {
          input: 'text',
          attachedButton: {
            name: 'magic-button',
            field: 'url'
          }
        }
      });
    });

    test('adds conditional required to input', () => {
      expect(fn({
        [path]: {
          _has: ['text', {
            fn: 'conditional-required',
            field: 'title'
          }]
        }
      }, name, path)).toEqual({
        _has: {
          input: 'text',
          validate: {
            required: { field: 'title' }
          }
        }
      });
    });

    test('adds required to input', () => {
      expect(fn({
        [path]: {
          _has: ['text', 'required'] // required behavior, rather than native validation (tested above)
        }
      }, name, path)).toEqual({
        _has: {
          input: 'text',
          validate: { required: true }
        }
      });
    });

    test('adds soft-maxlength to input', () => {
      expect(fn({
        [path]: {
          _has: ['text', {
            fn: 'soft-maxlength',
            value: 10 // soft-maxlength behavior, rather than native validation (tested above)
          }]
        }
      }, name, path)).toEqual({
        _has: {
          input: 'text',
          validate: { max: 10 }
        }
      });
    });

    test('adds autocomplete config to input', () => {
      expect(fn({
        [path]: {
          _has: [{
            fn: 'simple-list',
            autocomplete: {
              list: 'some-list'
            }
          }]
        }
      }, name, path)).toEqual({
        _has: {
          input: 'simple-list',
          autocomplete: {
            list: 'some-list'
          }
        }
      });
    });
  });
});
