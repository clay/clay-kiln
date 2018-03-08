import * as lib from './required';

describe('validators: required', () => {
  it('has a label', () => expect(lib.label).to.not.equal(null));
  it('has a description', () => expect(lib.description).to.not.equal(null));
  it('returns errors', () => expect(lib.type).to.equal('error'));

  describe('validate', () => {
    const fn = lib.validate,
      uri = 'domain.com/_components/foo/instances/bar',
      name = 'foo';

    it('passes if no components', () => {
      expect(fn({})).to.eql([]);
    });

    it('passes if deleted component', () => {
      expect(fn({
        components: {
          [uri]: {}
        },
        schemas: {
          [name]: {
            a: {
              _has: 'text'
            }
          }
        }
      })).to.eql([]);
    });

    it('passes if no required fields', () => {
      expect(fn({
        components: {
          [uri]: { a: null }
        },
        schemas: {
          [name]: {
            a: {
              _has: 'text'
            }
          }
        }
      })).to.eql([]);
    });

    it('passes if required field with string', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).to.eql([]);
    });

    it('passes if required field with number', () => {
      expect(fn({
        components: {
          [uri]: { a: 0 }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).to.eql([]);
    });

    it('passes if required field with boolean', () => {
      expect(fn({
        components: {
          [uri]: { a: false }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).to.eql([]);
    });

    it('fails if required field with empty string', () => {
      expect(fn({
        components: {
          [uri]: { a: '' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });

    it('fails if required field with null value', () => {
      expect(fn({
        components: {
          [uri]: { a: null }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });

    it('fails if required field with undefined value', () => {
      expect(fn({
        components: {
          [uri]: { a: undefined }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });

    it('fails if required field with empty array', () => {
      expect(fn({
        components: {
          [uri]: { a: [] }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });

    it('fails if required field with a false checkbox-group', () => {
      expect(fn({
        components: {
          [uri]: { a: {
            foo: false,
            bar: false
          }}
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'checkbox-group',
                validate: { required: true }
              }
            }
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });

    it('fails if required field not defined in the data', () => {
      expect(fn({
        components: {
          [uri]: {
            b: true // some other field needs to exist (otherwise we assume the component was deleted)
          }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: { required: true }
              }
            }
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo » A'
      }]);
    });
  });
});
