import * as components from '../core-data/components';
import * as api from '../core-data/api';
import * as model from './model';
import * as utils from 'clayutils';
import lib from './create';

jest.mock('./model');
jest.mock('../core-data/api');
jest.mock('../core-data/components');
jest.mock('clayutils');

describe('component creator', () => {
  beforeEach(() => {
    utils.isDefaultComponent.mockReturnValue(true);
    api.getText.mockRejectedValue();
  });

  test('resolves to empty array if passed no components', () => {
    return lib([]).then(res => expect(res).toEqual([]));
  });

  test('creates a single component with no children', () => {
    components.getSchema.mockReturnValue({});
    components.getDefaultData.mockReturnValue({ a: 'b' });
    components.getModel.mockReturnValue(null);
    // note: the _ref will be a uid that we can't test against
    return lib([{ name: 'foo' }]).then(res => expect(res[0].a).toBe('b'));
  });

  test('creates a single component with data, but no children', () => {
    components.getSchema.mockReturnValue({});
    // make sure we don't accidentally expand non-child-component arrays and objects in the data
    components.getDefaultData.mockReturnValue({ a: 'b', nonComponentArray: [{ text: 'ok' }], nonComponentProp: { text: 'ok' } });
    components.getModel.mockReturnValue(null);

    return lib([{ name: 'foo', data: { c: 'd' } }]).then((res) => {
      expect(res[0].a).toBe('b');
      expect(res[0].c).toBe('d');
    });
  });

  test('creates a single component with a child list', () => {
    components.getSchema.mockReturnValue({});
    // no store.state.site.prefix, hence undefined
    components.getDefaultData.mockReturnValueOnce({ a: 'b', children: [{ _ref: 'undefined/_components/bar' }] });
    components.getDefaultData.mockReturnValueOnce({ c: 'd' });
    components.getModel.mockReturnValue(null);
    // note: the _ref will be a uid that we can't test against
    return lib([{ name: 'foo' }]).then(res => expect(res[0].children[0].c).toBe('d'));
  });

  test('creates a single component with a child prop', () => {
    components.getSchema.mockReturnValue({});
    // no store.state.site.prefix, hence undefined
    components.getDefaultData.mockReturnValueOnce({ a: 'b', child: { _ref: 'undefined/_components/bar' } });
    components.getDefaultData.mockReturnValueOnce({ c: 'd' });
    components.getModel.mockReturnValue(null);
    // note: the _ref will be a uid that we can't test against
    return lib([{ name: 'foo' }]).then(res => expect(res[0].child.c).toBe('d'));
  });

  test('resolves default data from the server', () => {
    components.getSchema.mockReturnValue({});
    api.getObject.mockResolvedValue({ a: 'b' });
    components.getDefaultData.mockReturnValue(null);
    components.getModel.mockReturnValue(null);

    return lib([{ name: 'foo' }]).then(() => expect(api.getObject).toHaveBeenCalled());
  });

  test('resolves default data from the server', () => {
    components.getSchema.mockReturnValue(null);
    api.getSchema.mockResolvedValue({});
    components.getDefaultData.mockReturnValue({ a: 'b' });
    components.getModel.mockReturnValue(null);

    return lib([{ name: 'foo' }]).then(() => expect(api.getSchema).toHaveBeenCalled());
  });

  test('updates store with data passed through model.js', () => {
    components.getSchema.mockReturnValue({});
    components.getDefaultData.mockReturnValue({ a: 'b' });
    components.getModel.mockReturnValue(true);
    model.save.mockResolvedValue({ c: 'd' });
    model.render.mockResolvedValue({ c: 'd' });

    return lib([{ name: 'foo' }]).then(() => {
      expect(model.save).toHaveBeenCalled();
      expect(model.render).toHaveBeenCalled();
    });
  });

  test(
    'Returns the component data that may have been added on save when passed a component list',
    () => {
      components.getSchema.mockReturnValue({});
      components.getDefaultData.mockReturnValue({ a: 'b' });
      components.getModel.mockReturnValue(true);
      model.save.mockResolvedValue({ c: 'd' });
      model.render.mockResolvedValue({ c: 'd' });

      return lib([{ name: 'foo' }]).then((resolved) => {
        expect(resolved[0].c).toBe('d');
      });
    }
  );
});
