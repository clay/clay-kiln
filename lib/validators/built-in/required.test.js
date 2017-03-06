import * as lib from './required';

describe('validators: required', () => {
  it('has a label', () => expect(lib.label).to.not.equal(null));
  it('has a description', () => expect(lib.description).to.not.equal(null));
  it('returns errors', () => expect(lib.type).to.equal('error'));

  describe('validate', () => {
    const fn = lib.validate,
      uri = 'domain.com/components/foo/instances/bar',
      name = 'foo';

    it('passes if no components', () => {
      expect(fn({})).to.eql([]);
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

    it('passes if required field with data', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text', 'required']
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
              _has: ['text', 'required']
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
              _has: ['text', 'required']
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
              _has: ['text', 'required']
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
              _has: ['text', 'required']
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
