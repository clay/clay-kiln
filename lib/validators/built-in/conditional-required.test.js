import * as lib from './conditional-required';

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

    it('passes if required field with data', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text', {fn: 'conditional-required'}]
            }
          }
        }
      })).to.eql([]);
    });

    it('passes if required field when it isn\'t required', () => {
      expect(fn({
        components: {
          [uri]: { a: null, b: 1 }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text', {fn: 'conditional-required', field: 'b', operator: '>', value: 1}]
            },
            b: {}
          }
        }
      })).to.eql([]);
    });

    it('fails if required field when it is required', () => {
      expect(fn({
        components: {
          [uri]: { a: '', b: 2 }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text', {fn: 'conditional-required', field: 'b', operator: '>', value: 1}]
            },
            b: {}
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo » A',
        preview: '(based on B)'
      }]);
    });
  });
});
