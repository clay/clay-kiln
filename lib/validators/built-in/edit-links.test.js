import * as lib from './edit-links';

describe('validators: edit-links', () => {
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

    it('passes if no fields with links', () => {
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

    it('passes if field with non-edit link', () => {
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

    it('fails if field with edit link', () => {
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

    it('fails if field with edit link and other query params', () => {
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
