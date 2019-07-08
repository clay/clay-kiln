import * as model from './model';
import * as api from '../core-data/api';
import * as components from '../core-data/components';
import * as componentElements from '../utils/component-elements';
import * as queue from '../core-data/queue';
import * as lib from './actions';
import * as dom from '@nymag/dom';

jest.mock('./model');
jest.mock('../core-data/api');
jest.mock('../core-data/components');
jest.mock('../utils/component-elements');
jest.mock('../core-data/queue');

describe('component-data actions', () => {
  const uri = 'domain.com/_components/foo',
    data = { a: 'b' },
    prevData = { c: 'd' },
    store = {};

  beforeEach(() => {
    store.commit = jest.fn();
    store.dispatch = jest.fn(() => Promise.resolve());
  });

  describe('saveComponent', () => {
    const fn = lib.saveComponent;

    test('does not save when data has not changed', () => {
      return fn(store, { uri, data, prevData: data }).then(() => {
        expect(store.commit).not.toHaveBeenCalled();
      });
    });

    test('fetches previous data from store', () => {
      components.getData.mockReturnValue(data);

      return fn(store, { uri, data }).then(() => {
        expect(store.commit).not.toHaveBeenCalled();
      });
    });

    test('saves components with/without model.js', () => {
      model.save.mockResolvedValue(data);
      queue.add.mockResolvedValue();
      model.render.mockResolvedValue(data);

      return fn(store, { uri, data, prevData }).then(() => {
        expect(store.commit).toHaveBeenCalledWith('UPDATE_COMPONENT', { uri, data, fields: ['a'] });
        expect(store.commit).toHaveBeenCalledTimes(3); // currently saving true, update, currently saving false
      });
    });

    test('reverts components with model.js if model.js errors', () => {
      model.save.mockRejectedValue(new Error('nope'));

      return fn(store, { uri, data, prevData }).catch(() => {
        expect(mockLogger).toHaveBeenCalled();
      });
    });

    test('queues component with model.js save to server', () => {
      model.save.mockResolvedValue(data);
      queue.add.mockResolvedValue();
      model.render.mockResolvedValue(data);

      return fn(store, { uri, data, prevData }).then(() => {
        expect(queue.add).toHaveBeenCalledWith(api.save, [uri, data, false], 'save');
      });
    });

    test('reverts components with model.js if queued save errors', () => {
      model.save.mockResolvedValue(data);
      queue.add.mockRejectedValue(new Error('nope'));
      model.render.mockResolvedValue(data);

      return fn(store, { uri, data, prevData }).catch(() => {
        expect(queue.add).toHaveBeenCalledWith(api.save, [uri, data, false], 'save');
        expect(mockLogger).toHaveBeenCalled();
      });
    });

    test('does not take snapshots when undoing', () => {
      model.save.mockResolvedValue(data);
      queue.add.mockResolvedValue();
      model.render.mockResolvedValue(data);

      return fn(store, {
        uri, data, prevData, snapshot: false
      }).then(() => {
        expect(store.dispatch).not.toHaveBeenCalledWith('setFixedPoint');
      });
    });

    test('updates page list when saving page-specific components', () => {
      componentElements.isComponentInPage.mockReturnValue(true);
      model.save.mockResolvedValue(data);
      queue.add.mockResolvedValue();
      model.render.mockResolvedValue(data);

      return fn(store, {
        uri, data, prevData, snapshot: false
      }).then(() => {
        expect(store.dispatch).not.toHaveBeenCalledWith('setFixedPoint');
      });
    });
  });

  describe('removeComponent', () => {
    const fn = lib.removeComponent,
      parentEl = dom.create('<div data-uri="domain.com/_components/foo" data-editable="settings"></div>'),
      el = dom.create('<div data-uri="domain.com/_components/bar"></div>'),
      dataWithEl = { el: el, msg: 'testing' };

    test('accepts an element as the second argument', () => {
      componentElements.getComponentEl.mockReturnValue(el);
      componentElements.getParentComponent.mockReturnValue(parentEl);
      components.getData.mockResolvedValue([]);
      model.save.mockResolvedValue();

      return fn(store, data).then(() => {
        expect(store.commit).toHaveBeenCalledWith('REMOVE_COMPONENT', { uri: 'domain.com/_components/bar', componentName: 'bar' });
      });
    });

    test(
      'it accepts and object containing `el` and `msg` properties as the second argument',
      () => {
        componentElements.getComponentEl.mockReturnValue(el);
        componentElements.getParentComponent.mockReturnValue(parentEl);
        components.getData.mockResolvedValue([]);
        model.save.mockResolvedValue();

        return fn(store, dataWithEl).then(() => {
          expect(store.commit).toHaveBeenCalledWith('REMOVE_COMPONENT', { uri: 'domain.com/_components/bar', msg: 'testing' });
        });
      }
    );
  });
});
