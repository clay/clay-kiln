import expect from 'expect';
import * as lib from './edit-links';

describe('validators: edit-links', () => {
  test('has a label', () => expect(lib.label).to.not.equal(null));
  test('has a description', () => expect(lib.description).to.not.equal(null));
  test('returns errors', () => expect(lib.type).to.equal('error'));

  describe('validate', () => {
    const fn = lib.validate,
      uri = 'domain.com/_components/foo/instances/bar',
      name = 'foo';

    test('passes if no components', () => {
      expect(fn({})).to.eql([]);
    });

    test('passes if no fields with links', () => {
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

    test('passes if field with non-edit link', () => {
      expect(fn({
        components: {
          [uri]: { a: '<a href="http://domain.com">Lorem ipsum dolor sit amet</a>, consectetur adipisicing elit' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text']
            }
          }
        }
      })).to.eql([]);
    });

    test('fails if field with edit link', () => {
      expect(fn({
        components: {
          [uri]: { a: '<a href="http://domain.com?edit=true">Lorem ipsum dolor sit amet</a>, consectetur adipisicing elit' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text']
            }
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo',
        preview: 'Lorem ipsum dolor sit amet,…'
      }]);
    });

    test('fails if field with edit link and other query params', () => {
      expect(fn({
        components: {
          [uri]: { a: '<a href="http://domain.com?foo=bar&edit=true">Lorem ipsum dolor sit amet</a>, consectetur adipisicing elit' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text']
            }
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo',
        preview: 'Lorem ipsum dolor sit amet,…'
      }]);
    });
  });
});
