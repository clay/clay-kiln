import _ from 'lodash';
import * as lib from './actions';
import { getMeta } from '../core-data/api.js';

jest.mock('../core-data/api.js');

describe('validators: actions', () => {
  describe('validate', () => {
    const fn = lib.validate;

    beforeEach(() => {
      const resp = { scope: '', type: '', uri: '' };

      getMeta.mockResolvedValue(resp);
      window.kiln.validators = {
        'not-applied': {}, // ignored, because no 'type' property
        'error-me': { type: 'error', validate: () => [] }, // empty array counts as no issues
        'warn-me': { type: 'warning', validate: _.noop } // undefined counts as no issues
      };
    });

    afterEach(() => {
      window.kiln.validators = {};
    });

    test('runs through all validators', () => {
      return fn({ state: {}, commit: _.noop }).then((res) => {
        expect(res.errors).toEqual([]);
        expect(res.warnings).toEqual([]);
        expect(res.metadataErrors).toEqual([]);
        expect(res.metadataWarnings).toEqual([]);
        expect(res.kilnjsErrors).toEqual([]);
      });
    });

    test('grabs the validator info if it returns any issues', () => {
      window.kiln.validators['real-error'] = {
        label: 'Bad',
        description: 'Oh noes!',
        type: 'error',
        validate() {
          return [{
            uri: 'foo',
            field: 'bar'
          }];
        }
      };

      return fn({ state: {}, commit: _.noop }).then((res) => {
        expect(res.errors).toEqual([{
          label: 'Bad',
          description: 'Oh noes!',
          items: [{
            uri: 'foo',
            field: 'bar',
            path: 'bar'
          }]
        }]);
        expect(res.warnings).toEqual([]);
      });
    });
  });

  const schemas = { component1: { validation: [{ input: 'input', validator: 'validator' }] } },
    schemasWithValidation = lib.getSchemasWithValidationRules(schemas);

  describe('kilnjsValidators', () => {
    test('find schemas with validators', () => {
      expect(schemasWithValidation).toEqual(schemas);
    });

    test('find a kilnjs error', () => {
      const components = {
          ['localhost/_components/component1/instances/cjw13jst0000a3h62ssbaavst']: { input: '123Look at Me321' }
        },
        validationError = [{
          label: 'Bad',
          description: 'Oh noes!',
          type: 'error',
          preview: '123Look at Me321',
          items: [{
            uri: 'localhost/_components/component1/instances/cjw13jst0000a3h62ssbaavst',
            field: 'input',
            location: 'component1',
            preview: '123Look at Me321',
            path: 'input'
          }]
        }];

      window.kiln.validators['validator'] = {
        label: 'Bad',
        description: 'Oh noes!',
        type: 'error',
        kilnjsValidate(value) {
          return (/\d/).test(value)
            ? {
              label: 'Bad', description: 'Oh noes!', type: 'error', preview: '123Look at Me321'
            }
            : false;
        }
      };

      expect(lib.runKilnjsValidators(schemas, components)).toEqual(validationError);
    });
  });

  describe('runMetaValidator', () => {
    test('Should run validator with metadata passed', () => {
      const testingMetadata = { authors: [{ name: 'Test' }] },
        validationFn = jest.fn(),
        validator = {
          validate: validationFn
        },
        metaValidator = lib.runMetaValidator(testingMetadata);

      metaValidator(validator);

      expect(validationFn).toBeCalledWith(testingMetadata);
    });

    test('Should return validator object if result is not empty', () => {
      const testingMetadata = { authors: [{ name: 'Test' }] },
        validationFn = jest.fn(),
        testLabel = 'test label',
        testDescription = 'test Description',
        validation = [[
          { preview: 'Blah' }
        ]],
        validator = {
          label: testLabel,
          description: testDescription,
          validate: validationFn.mockResolvedValue(validation)
        },
        metaValidator = lib.runMetaValidator(testingMetadata);

      metaValidator(validator).then((result) => {
        expect(result.label).toBe(testLabel);
        expect(result.description).toBe(testDescription);
        expect(result.items).toHaveLength(validation.length);
      });
    });
  });

  describe('runMetaValidators', () => {
    test('Run process getting metadata with uri passed', () => {
      const testUri = 'cjrj7rtx80067siyeun46a1dz';

      getMeta.mockResolvedValue({});
      lib.runMetaValidators(testUri, [], []);

      expect(getMeta).toBeCalledWith(testUri);
    });

    test('should return an object with errors and warnings', () => {
      const testUri = 'cjrj7rtx80067siyeun46a1dz';

      getMeta.mockResolvedValue({});
      lib.runMetaValidators(testUri, [], [])
        .then((data) => {
          expect(data).toHaveProperty('errors');
          expect(data).toHaveProperty('warnings');
        });
    });
  });

  describe('isMetadataError', () => {
    test('should return false if not metadata scoped', () => {
      expect(lib.isMetadataError('blah', 'error')).toBe(false);
    });

    test('should return false if metadata scope is metadata but type is not error', () => {
      expect(lib.isMetadataError('metadata', 'blah')).toBe(false);
    });

    test('should return true if metadata scope is metadata and type is error', () => {
      expect(lib.isMetadataError('metadata', 'error')).toBe(true);
    });
  });

  describe('isMetadataWarning', () => {
    test('should return false if not metadata scoped', () => {
      expect(lib.isMetadataWarning('blah', 'warning')).toBe(false);
    });

    test('should return false if metadata scope is metadata but type is not error', () => {
      expect(lib.isMetadataWarning('metadata', 'blah')).toBe(false);
    });

    test('should return true if metadata scope is metadata and type is error', () => {
      expect(lib.isMetadataWarning('metadata', 'warning')).toBe(true);
    });
  });

  describe('isGlobalMetadataError', () => {
    test('should return false if uri specified', () => {
      expect(lib.isGlobalMetadataError({ scope: 'metadata', type: 'error', uri: 'uri' })).toBe(false);
    });

    test('should return true if scope is global and is type error and has no uri', () => {
      expect(lib.isGlobalMetadataError({ scope: 'metadata', type: 'error', uri: null })).toBe(true);
    });
  });

  describe('isGlobalMetadataWarning', () => {
    test('should return false if uri specified', () => {
      expect(lib.isGlobalMetadataWarning({ scope: 'metadata', type: 'warning', uri: 'uri' })).toBe(false);
    });

    test('should return true if scope is global and is type error and has no uri', () => {
      expect(lib.isGlobalMetadataWarning({ scope: 'metadata', type: 'warning', uri: null })).toBe(true);
    });
  });

  describe('isSpecificMetadataWarning', () => {
    test('should return true if uri match', () => {
      expect(lib.isSpecificMetadataWarning({ scope: 'metadata', type: 'warning', uri: 'uri' }, 'http://uri')).toBe(true);
    });

    test('should return false if uri doesnt match', () => {
      expect(lib.isGlobalMetadataWarning({ scope: 'metadata', type: 'warning', uri: 'uri' }, 'http://blah')).toBe(false);
    });
  });

  describe('isSpecificMetadataError', () => {
    test('should return true if uri match', () => {
      expect(lib.isSpecificMetadataError({ scope: 'metadata', type: 'error', uri: 'uri' }, 'http://uri')).toBe(true);
    });

    test('should return false if uri doesnt match', () => {
      expect(lib.isSpecificMetadataError({ scope: 'metadata', type: 'error', uri: 'uri' }, 'http://blah')).toBe(false);
    });
  });
});
