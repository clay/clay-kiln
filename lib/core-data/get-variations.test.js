import lib from './get-variations';

describe("add a variations field to a component's schema", () => {
  test('if a schema is missing a settings group, add it', () => {
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
          }
        },
        _groups: {
          settings: {
            fields: []
          }
        }
      },
      test = lib.createSettings(schema);

    expect(test).toEqual(expected);
  });

  test('if a component has variations, add the variation field', () => {
    const variations = {
        blockquote: [
          'blockquote_red-text',
          'blockquote_green-text'
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
        componentVariation: {
          _label: 'Component Variation',
          _has: {
            input: 'select',
            options: [
              {
                name: 'Default', value: 'blockquote'
              },
              {
                name: 'Red-text', value: 'blockquote_red-text'
              },
              {
                name: 'Green-text', value: 'blockquote_green-text'
              }]
          },
          validate: {
            required: true
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

    expect(test.componentVariation).toEqual(expected.componentVariation);
  });


  test(
    'if a component does not have a settings group, create a general section with the component variation field',
    () => {
      const sections = {
          fields: [],
          sections: []
        },
        expected = {
          fields: ['componentVariation'],
          sections: [{
            fields: ['componentVariation'],
            title: 'General'
          }]
        },
        test = lib.addVariationSection(sections);

      expect(test).toEqual(expected);
    }
  );

  test(
    'if a component has a settings group, create a new component variation group',
    () => {
      const sections = {
          fields: ['text'],
          sections: [{
            fields: ['text'],
            title: 'General'
          }]
        },
        expected = {
          fields: ['text', 'componentVariation'],
          sections: [
            {
              fields: ['text'],
              title: 'General'
            },
            {
              fields: ['componentVariation'],
              title: 'Component Variation'
            }]
        },
        test = lib.addVariationSection(sections);

      expect(test).toEqual(expected);
    }
  );

  test(
    'if a component does not have a variations, do not change the schema',
    () => {
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

      expect(test).toEqual(schema);
    }
  );
});
