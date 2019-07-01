import * as components from '../core-data/components';
import * as lib from './model';

jest.mock('../core-data/components');

describe('component model', () => {
  beforeEach(() => {
    components.getLocals.mockReturnValue({ edit: true });
  });

  describe('save', () => {
    const fn = lib.save,
      data = { a: 'b' };

    test('passes through data if no model.save', () => {
      components.getModel.mockReturnValue({});

      return fn('foo', data, {}).then((res) => {
        expect(res).toEqual(data);
      });
    });

    test('passes through data if model.save is not a function', () => {
      components.getModel.mockReturnValue({ save: 'sup' });

      return fn('foo', data, {}).then((res) => {
        expect(res).toEqual(data);
      });
    });

    test('calls model.save if it is a function', () => {
      const newData = { b: 'c' };

      components.getModel.mockReturnValue({ save: () => newData });

      return fn('foo', data, {}).then((res) => {
        expect(res).toEqual(newData);
      });
    });

    test('allows model.save to return promise', () => {
      const newData = { b: 'c' };

      components.getModel.mockReturnValue({ save: () => Promise.resolve(newData) });

      return fn('foo', data, {}).then((res) => {
        expect(res).toEqual(newData);
      });
    });

    test('catches if model.save throws error', (done) => {
      components.getModel.mockReturnValue({
        save: () => {
          throw new Error('nope');
        }
      });

      fn('foo', data, {}).then(done).catch(() => done());
    });

    test('catches if model.save times out', (done) => {
      components.getModel.mockReturnValue({
        save: () => {
          window.setTimeout(() => 'foo', 301); // timeout + 1
        }
      });

      fn('foo', data, {}).then(done).catch(() => done());
    });

    test('clones data before sending to model.save', () => {
      const originalData = { a: 'b' },
        newData = { a: 'b' };

      components.getModel.mockReturnValue({ save: () => newData });

      return fn('foo', originalData, {}).then((res) => {
        expect(res).toEqual(newData);
        expect(res).not.toBe(originalData);
      });
    });
  });

  describe('render', () => {
    const fn = lib.render,
      data = { a: 'b' };

    test('passes through data if no model.render', () => {
      components.getModel.mockReturnValue({});

      return fn('foo', data, {}).then((res) => {
        expect(res).toEqual(data);
      });
    });

    test('passes through data if model.render is not a function', () => {
      components.getModel.mockReturnValue({ render: 'sup' });

      return fn('foo', data, {}).then((res) => {
        expect(res).toEqual(data);
      });
    });

    test('calls model.render if it is a function', () => {
      const newData = { b: 'c' };

      components.getModel.mockReturnValue({ render: () => newData });

      return fn('foo', data, {}).then((res) => {
        expect(res).toEqual(newData);
      });
    });

    test('allows model.render to return promise', () => {
      const newData = { b: 'c' };

      components.getModel.mockReturnValue({ render: () => Promise.resolve(newData) });

      return fn('foo', data, {}).then((res) => {
        expect(res).toEqual(newData);
      });
    });

    test('catches if model.render throws error', (done) => {
      components.getModel.mockReturnValue({
        render: () => {
          throw new Error('nope');
        }
      });

      fn('foo', data, {}).then(done).catch(() => done());
    });

    test('catches if model.render times out', (done) => {
      components.getModel.mockReturnValue({
        render: () => {
          window.setTimeout(() => 'foo', 301); // timeout + 1
        }
      });

      fn('foo', data, {}).then(done).catch(() => done());
    });

    test('clones data before sending to model.render', () => {
      const originalData = { a: 'b' },
        newData = { a: 'b' };

      components.getModel.mockReturnValue({ render: () => newData });

      return fn('foo', originalData, {}).then((res) => {
        expect(res).toEqual(newData);
        expect(res).not.toBe(originalData);
      });
    });
  });
});
