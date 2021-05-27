import * as lib from './invalid-links';

describe('validators: invalid-links', () => {
  test('has a label', () => expect(lib.label).not.toBe(null));
  test('has a description', () => expect(lib.description).not.toBe(null));
  test('returns errors', () => expect(lib.type).toBe('error'));

  describe('validate', () => {
    const fn = lib.validate,
      uri = 'domain.com/_components/clay-paragraph/instances/bar',
      name = 'clay-paragraph';

    test('passes if no components', () => {
      expect(fn({})).toEqual([]);
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
      })).toEqual([]);
    });

    test('passes if field with valid link', () => {
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
      })).toEqual([]);
    });

    test('fails if link class="kiln-link-invalid"', () => {
      expect(fn({
        components: {
          [uri]: { a: '<a href="invalid" class="kiln-link-invalid">Lorem ipsum dolor sit amet</a>, consectetur adipisicing elit' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text']
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Paragraph',
        preview: 'Lorem ipsum dolor sit amet…'
      }]);
    });
    test('fails if mixed valid/invalid links', () => {
      expect(fn({
        components: {
          [uri]: { a: '<a href="">valid</a>, consectetur <a href="" class="kiln-link-invalid">invalid</a>' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text']
            }
          }
        }
      })).toEqual([{
        uri,
        field: 'a',
        location: 'Paragraph',
        preview: 'invalid'
      }]);
    });

    test('fails if multiple invalid links', () => {
      expect(fn({
        components: {
          [uri]: { a: '<a href="" class="kiln-link-invalid">one</a>, consectetur <a href="" class="kiln-link-invalid">two</a>' }
        },
        schemas: {
          [name]: {
            a: {
              _has: ['text']
            }
          }
        }
      })).toEqual([
        {
          uri,
          field: 'a',
          location: 'Paragraph',
          preview: 'one'
        },
        {
          uri,
          field: 'a',
          location: 'Paragraph',
          preview: 'two'
        }
      ]);
    });
  });
});
