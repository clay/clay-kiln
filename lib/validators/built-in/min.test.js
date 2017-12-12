import * as lib from './min';

describe('validators: min', () => {
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

    it('passes if no fields with min', () => {
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

    it('passes if text field has more characters than length', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: {
                  min: 2
                }
              }
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
              _has: {
                input: 'text',
                validate: {
                  min: 5
                }
              }
            }
          }
        }
      })).to.eql([]);
    });

    it('passes if cleaned html has more characters than length', () => {
      expect(fn({
        components: {
          [uri]: { a: '<span>h<strong>ell</strong>o</span>' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: {
                  min: 4
                }
              }
            }
          }
        }
      })).to.eql([]);
    });

    it('passes if component list has more components than length', () => {
      expect(fn({
        components: {
          [uri]: { a: [{ _ref: 'domain.com/components/foo' }, { _ref: 'domain.com/components/bar' }] }
        },
        schemas: {
          [name]: {
            a: {
              _componentList: {
                validate: {
                  min: 1
                }
              }
            }
          }
        }
      })).to.eql([]);
    });

    it('fails if text field has fewer characters than length', () => {
      expect(fn({
        components: {
          [uri]: { a: 'hello' }
        },
        schemas: {
          [name]: {
            a: {
              _has: {
                input: 'text',
                validate: {
                  min: 10
                }
              }
            }
          }
        }
      })).to.eql([{
        uri,
        field: 'a',
        location: 'Foo » A',
        preview: 'hello'
      }]);
    });

    it('fails if component list has fewer components than length', () => {
      expect(fn({
        components: {
          [uri]: { a: [{ _ref: 'domain.com/components/foo' }, { _ref: 'domain.com/components/bar' }] }
        },
        schemas: {
          [name]: {
            a: {
              _componentList: {
                validate: {
                  min: 3
                }
              }
            }
          }
        }
      })).to.eql([{
        uri,
        location: 'Foo » A'
      }]);
    });
  });
});
