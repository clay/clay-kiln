import * as lib from './tk';

describe('validators: beyonce', () => {
  it('has a label', () => expect(lib.label).to.not.equal(null));
  it('has a description', () => expect(lib.description).to.not.equal(null));
  it('returns warnings', () => expect(lib.type).to.equal('warning'));

  describe('validate', () => {
    const fn = lib.validate,
      uri = 'domain.com/components/foo/instances/bar',
      name = 'foo';

    it('passes if no components', () => {
      expect(fn({})).to.eql([]);
    });

    it('passes if no fields with text', () => {
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

    it('passes if no fields with tk', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
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

    // we don't want to fail validation if links point to stuff like 'http://tktk.gawker.com'
    it('passes if tk is in tag attributes', () => {
      expect(fn({
        components: {
          [uri]: { a: '<a href="http://tktk.gawker.com">some text</a>' }
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

    it('fails if field with tk', () => {
      expect(fn({
        components: {
          [uri]: { a: 'foo tk bar' }
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
        preview: 'foo tk bar'
      }]);
    });
  });
});
