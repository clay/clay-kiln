import * as lib from './select';
import * as components from '../core-data/components';
import * as els from '../utils/component-elements';
import { refProp } from '../utils/references';

jest.mock('../core-data/components');
jest.mock('../utils/component-elements');

describe('select', () => {
  describe('getParentField', () => {
    const fn = lib.getParentField;

    test('returns empty obj if path not found in data', () => {
      components.getData.mockReturnValue({});
      components.getSchema.mockReturnValue({});
      expect(fn('foo', 'bar')).toEqual({});
    });

    test('returns empty obj if data props are not arrays or objects', () => {
      // todo: this might mean that this won't grab child components of page areas,
      // so test this before enabling editing of those page areas
      components.getData.mockReturnValue({ fooProp: 'foo' });
      components.getSchema.mockReturnValue({});
      expect(fn('foo', 'bar')).toEqual({});
    });

    test('warns if path not found in schema', () => {
      components.getData.mockReturnValue({ fooProp: { [refProp]: '/_components/foo' } });
      components.getSchema.mockReturnValue({});
      fn('/_components/foo', '/_components/bar');
      expect(mockLogger).toHaveBeenCalledWith('debug', 'bar has no field for fooProp in its schema, but has foo in its data', { action: 'getParentField' });
    });

    test('returns path for component in list', () => {
      components.getData.mockReturnValue({ fooProp: [{ [refProp]: 'foo' }] });
      components.getSchema.mockReturnValue({ fooProp: { _componentList: true } });
      els.getFieldEl.mockReturnValue(null);
      expect(fn('foo', 'bar')).toEqual({ path: 'fooProp', type: 'list', isEditable: null });
    });

    test('returns path for component in prop', () => {
      components.getData.mockReturnValue({ fooProp: { [refProp]: 'foo' } });
      components.getSchema.mockReturnValue({ fooProp: { _component: true } });
      els.getFieldEl.mockReturnValue(null);
      expect(fn('foo', 'bar')).toEqual({ path: 'fooProp', type: 'prop', isEditable: null });
    });

    test('returns non-editable path for component in list', () => {
      const fieldEl = document.createElement('div');

      components.getData.mockReturnValue({ fooProp: [{ [refProp]: 'foo' }] });
      components.getSchema.mockReturnValue({ fooProp: { _componentList: true } });
      els.getFieldEl.mockReturnValue(fieldEl);
      expect(fn('foo', 'bar')).toEqual({ path: 'fooProp', type: 'list', isEditable: false });
    });

    test('returns non-editable path for component in prop', () => {
      const fieldEl = document.createElement('div');

      components.getData.mockReturnValue({ fooProp: { [refProp]: 'foo' } });
      components.getSchema.mockReturnValue({ fooProp: { _component: true } });
      els.getFieldEl.mockReturnValue(fieldEl);
      expect(fn('foo', 'bar')).toEqual({ path: 'fooProp', type: 'prop', isEditable: false });
    });

    test('returns editable path for component in list', () => {
      const fieldEl = document.createElement('div');

      fieldEl.setAttribute('data-editable', 'fooProp');
      components.getData.mockReturnValue({ fooProp: [{ [refProp]: 'foo' }] });
      components.getSchema.mockReturnValue({ fooProp: { _componentList: true } });
      els.getFieldEl.mockReturnValue(fieldEl);
      expect(fn('foo', 'bar')).toEqual({ path: 'fooProp', type: 'list', isEditable: true });
    });

    test('returns editable path for component in prop', () => {
      const fieldEl = document.createElement('div');

      fieldEl.setAttribute('data-editable', 'fooProp');
      components.getData.mockReturnValue({ fooProp: { [refProp]: 'foo' } });
      components.getSchema.mockReturnValue({ fooProp: { _component: true } });
      els.getFieldEl.mockReturnValue(fieldEl);
      expect(fn('foo', 'bar')).toEqual({ path: 'fooProp', type: 'prop', isEditable: true });
    });
  });
});
