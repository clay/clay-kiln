import _ from 'lodash';
import * as lib from './actions';
import { getMeta } from '../core-data/api.js';

jest.mock('../core-data/api.js');

describe('validators: actions', () => {
  describe('validate', () => {
    const fn = lib.validate;

    beforeEach(() => {
      const resp = { scope: '', type: '', uri:'' };

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
});
