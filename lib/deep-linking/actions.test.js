import * as lib from './actions';
import { refAttr } from '../utils/references';

describe('deep-linking actions', () => {
  const store = { state: { site: { prefix: 'domain.com' } } };

  describe('checkHashedForm', () => {
    const fn = lib.checkHashedForm;

    test('returns null when component not found', () => {
      expect(fn(store, {
        component: 'aComponentThatDoesNotExist', instance: null, path: null, initialFocus: null
      })).toBeNull();
    });

    test('returns found component when passed a component', () => {
      let name = 'found-instance',
        instance = '1';

      document.body.innerHTML = `<div ${refAttr}="nymag.com/_components/${name}/instances/${instance}"></div>`;

      expect(fn(store, {
        component: name, instance: instance, path: null, initialFocus: null
      })).toBeTruthy();
    });
  });
});
