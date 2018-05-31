import expect from 'expect';
import * as lib from './beyonce';

describe('validators: beyonce', () => {
  test('has a label', () => expect(lib.label).to.not.equal(null));
  test('has a description', () => expect(lib.description).to.not.equal(null));
  test('returns warnings', () => expect(lib.type).to.equal('warning'));

  describe('validate', () => {
    const fn = lib.validate,
      uri = 'domain.com/_components/foo/instances/bar',
      name = 'foo';

    test('passes if no components', () => {
      expect(fn({})).to.eql([]);
    });

    test('passes if no fields with beyonce', () => {
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

    test('passes if field with proper spelling', () => {
      expect(fn({
        components: {
          [uri]: { a: 'Beyoncé' }
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

    // we don't want to fail validation if links point to stuff like 'http://beyonce.com'
    test('passes if misspelling is in tag attributes', () => {
      expect(fn({
        components: {
          [uri]: { a: '<a href="http://beyonce.com">some text</a>' }
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

    test('passes if input type is url', () => {
      expect(fn({
        components: {
          [uri]: { a: 'http://beyonce.com' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                type: 'url'
              }
            }
          }
        }
      })).to.eql([]);
    });

    test('fails if field without accent', () => {
      expect(fn({
        components: {
          [uri]: { a: 'Beyonce' }
        },
        schemas: {
          [name]: {
            a: {
              _has: 'text'
            }
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo',
        preview: 'Beyonce'
      }]);
    });
  });
});
