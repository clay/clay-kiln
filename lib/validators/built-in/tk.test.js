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

    it('passes if tk is in a uri', () => {
      expect(fn({
        components: {
          [uri]: { a: 'tktk.gawker.com' }
        }
      })).to.eql([]);
      expect(fn({
        components: {
          [uri]: { a: 'host/components/whatever/instances/000tk00' }
        }
      }), 'passes classic amphora-style refs').to.eql([]);
      expect(fn({
        components: {
          [uri]: { a: 'host/_components/whatever/instances/000tk00' }
        }
      }), 'passes amphora-style refs').to.eql([]);
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
      expect(fn({
        components: {
          [uri]: { a: 'end of sentence tk. Start of sentence'}
        }
      }).length, 'fails tk at the end of a sentence').to.equal(1);
    });
  });
});
