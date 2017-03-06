import * as lib from './soft-maxlength';

describe('validators: soft-maxlength', () => {
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

    it('passes if no fields with soft-maxlength', () => {
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

    it('passes if text field has fewer characters than length', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text', { fn: 'soft-maxlength', value: 6 }]
            }
          }
        }
      })).to.eql([]);
    });

    it('passes if text field has same number of characters as length', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text', { fn: 'soft-maxlength', value: 5 }]
            }
          }
        }
      })).to.eql([]);
    });

    it('passes if cleaned html has fewer characters than length', () => {
      expect(fn({
        components: {
          [uri]: { a: '<span>h<strong>ell</strong>o</span>' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text', { fn: 'soft-maxlength', value: 6 }]
            }
          }
        }
      })).to.eql([]);
    });

    it('fails if text field as more characters than length', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text', { fn: 'soft-maxlength', value: 2 }]
            }
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo » A',
        preview: '…llo'
      }]);
    });
  });
});
