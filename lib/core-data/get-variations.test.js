import lib from './get-variations';

describe("add a variations field to a component's schema during preload", () => {

  it('if a schema is missing a settings group, add it', () => {
    const schema = {
        _label: 'foo',
        randomField: {
          _has: {
            input: 'text'
          }
        }
      },
      expected = {
        _label: 'foo',
        randomField: {
          _has: {
            input: 'text'
          },
        },
        _groups: {
          settings: {
            fields: []
          }
        }
      },
      test = lib.addSettings(schema);

    expect(test).to.deep.equal(expected);

  });

  it('if a component has a variations, add the variation field', () => {
    const variations = {
        blockquote: [
          'blockquote-red-text',
          'blockquote-green-text'
        ]
      },
      schema = {
        _label: 'blockquote',
        text: {
          _has: {
            input: 'text'
          }
        },
        smartQuotes: {
          _has: {
            input: 'checkbox'
          }
        },
        _groups: {
          settings: {
            fields: [
              'smartQuotes'
            ]
          }
        }
      },
      expected = {
        _label: 'blockquote',
        text: {
          _has: {
            input: 'text'
          }
        },
        smartQuotes: {
          _has: {
            input: 'checkbox'
          }
        },
        variation: {
          _has: {
            input: 'select',
            options: [
              'blockquote-red-text',
              'blockquote-green-text'
            ],
            validate: {
              required: true
            }
          }
        },
        _groups: {
          settings: {
            fields: [
              'smartQuotes', 'variation'
            ]
          }
        }
      },
      test = lib.addVariationField(schema, 'blockquote', variations);

    expect(test).to.deep.equal(expected);

  });

  it('if a component does not have a variations, do not change the schema', () => {
    const variations = {
        video: [
          'full-bleed',
          'feature'
        ]
      },
      schema = {
        _label: 'blockquote',
        text: {
          _has: {
            input: 'text'
          }
        },
        smartQuotes: {
          _has: {
            input: 'checkbox'
          }
        },
        _groups: {
          settings: {
            fields: [
              'smartQuotes'
            ]
          }
        }
      },
      test = lib.addVariationField(schema, 'blockquote', variations);

    expect(test).to.deep.equal(schema);

  });
});
