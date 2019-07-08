import _ from 'lodash';
import * as lib from './pubsub';
import { refProp } from '../utils/references';

const data = {
    foo: 'harder', bar: 'better', baz: 'faster', qux: 'stronger'
  },
  componentPrefix = 'domain.com/_components/',
  aInstance = `${componentPrefix}A/instances/1`,
  bInstance = `${componentPrefix}B/instances/1`,
  cInstance = `${componentPrefix}C/instances/1`,
  dInstance = `${componentPrefix}D/instances/1`,
  eInstance = `${componentPrefix}/E/instances/1`,
  aData = _.assign({}, data, { content: [{ [refProp]: bInstance }] }),
  bData = _.assign({}, data, { content: [{ [refProp]: cInstance }] }),
  eventID = 'abcdef',
  schemas = {
    noPub: { foo: {} },
    pubSelf: {
      foo: {
        _subscribe: '1',
        _publish: '1'
      }
    },
    pubArray: {
      foo: { _publish: ['1', '2'] }
    },
    subArray: {
      foo: { _subscribe: ['1', '2'] }
    },
    // testing unsupported scopes
    pubFetch: {
      foo: { _publish: { name: '1', scope: 'fetch' } }
    },
    pubChildren: {
      foo: { _publish: { name: '1', scope: 'children' } }
    },
    pubParents: {
      foo: { _publish: { name: '1', scope: 'parents' } }
    },
    pubGlobal: {
      foo: { _publish: { name: '1', scope: 'global' } }
    },
    pubArrayChildren: {
      foo: { _publish: [{ name: '1', scope: 'children' }, '2'] } // allow mixed scoped + unscoped
    },
    pub1: {
      foo: { _publish: '1' }
    },
    sub1: {
      foo: { _subscribe: '1' }
    },
    pub2: {
      bar: { _publish: '2' }
    },
    sub2: {
      bar: { _subscribe: '2' }
    },
    sub2foo: { // special case for testing pubArrayChildren
      foo: { _subscribe: '2' }
    },
    pub12: {
      foo: { _publish: '1' },
      bar: { _publish: '2' }
    },
    sub12: {
      foo: { _subscribe: '1' },
      bar: { _subscribe: '2' }
    },
    sub1pub2: {
      foo: { _subscribe: '1' },
      bar: { _publish: '2' }
    },
    sub1pub3: {
      foo: { _subscribe: '1' },
      baz: { _publish: '3' }
    },
    sub23: {
      bar: { _subscribe: '2' },
      baz: { _subscribe: '3' }
    },
    sub2pub3: {
      bar: { _subscribe: '2' },
      baz: { _publish: '3' }
    },
    sub13: {
      foo: { _subscribe: '1' },
      baz: { _subscribe: '3' }
    },
    sub2pub1: {
      foo: { _publish: '1' },
      bar: { _subscribe: '2' }
    },
    sub3pub1: {
      foo: { _publish: '1' },
      baz: { _subscribe: '3' }
    }
  };

describe('pubsub', () => {
  let store;

  beforeEach(() => {
    lib.unregisterAll(); // unregister all components from pubsub
    store = {
      dispatch: jest.fn((action, { uri, eventID, snapshot }) => lib.publish(uri, store.state.components[uri], eventID, snapshot, store)),
      state: {
        components: {
          [aInstance]: aData,
          [bInstance]: bData,
          [cInstance]: data,
          [dInstance]: data,
          [eInstance]: {}
        }
      }
    };
  });

  function expectAwith1() {
    expect(store.dispatch).toHaveBeenCalledWith('saveComponent', {
      uri: aInstance,
      data: { foo: 'harder' },
      eventID,
      snapshot: null
    });
  }

  function expectBwith1() {
    expect(store.dispatch).toHaveBeenCalledWith('saveComponent', {
      uri: bInstance,
      data: { foo: 'harder' },
      eventID,
      snapshot: null
    });
  }

  function expectCwith1() {
    expect(store.dispatch).toHaveBeenCalledWith('saveComponent', {
      uri: cInstance,
      data: { foo: 'harder' },
      eventID,
      snapshot: null
    });
  }

  function expectCwith2() {
    expect(store.dispatch).toHaveBeenCalledWith('saveComponent', {
      uri: cInstance,
      data: { bar: 'better' },
      eventID,
      snapshot: null
    });
  }

  function expectCwith3() {
    expect(store.dispatch).toHaveBeenCalledWith('saveComponent', {
      uri: cInstance,
      data: { baz: 'faster' },
      eventID,
      snapshot: null
    });
  }

  function expectDwith2() {
    expect(store.dispatch).toHaveBeenCalledWith('saveComponent', {
      uri: dInstance,
      data: { bar: 'better' },
      eventID,
      snapshot: null
    });
  }

  function expectDwith2foo() {
    expect(store.dispatch).toHaveBeenCalledWith('saveComponent', {
      uri: dInstance,
      data: { foo: 'harder' },
      eventID,
      snapshot: null
    });
  }

  function expectBwith12() {
    expect(store.dispatch).toHaveBeenCalledWith('saveComponent', {
      uri: bInstance,
      data: { foo: 'harder', bar: 'better' },
      eventID,
      snapshot: null
    });
  }

  describe('publish', () => {
    const fn = lib.publish;

    test('does nothing if no publishable fields in the schema', () => {
      lib.register('A', schemas.noPub);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(0); // nothing else saves
      });
    });

    test('does nothing if no subscribers in the registery', () => {
      lib.register('A', schemas.pub1);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(0); // nothing else saves
      });
    });

    test('does nothing if no subscribed component has been deleted', () => {
      lib.register('A', schemas.pub1);
      lib.register('E', schemas.sub1);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(0); // E/instances/1 does not save
      });
    });

    // components that publish will never save themselves twice (to prevent bad ux and cyclic regressions)

    test(
      'prevents double saving when A pubs and subs to the same event (cyclic regression)',
      () => {
        lib.register('A', schemas.pubSelf);

        return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
          expect(store.dispatch).toHaveBeenCalledTimes(0); // A doesn't save twice
        });
      }
    );

    // components propagate changes to other components

    test('propagates A → 1 → B', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.sub1);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(1); // B saves once
        expectBwith1();
      });
    });

    test('propagates A → 1+2 → B', () => {
      lib.register('A', schemas.pub12);
      lib.register('B', schemas.sub12);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(1); // B saves once, with both props
        expectBwith12();
      });
    });

    test('propagates A+B → 1 → C', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.pub1);
      // note: B is never called, so it's equivalent to A → 1 → C
      lib.register('C', schemas.sub1);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(1); // C saves once
        expectCwith1();
      });
    });

    test('propagates A → 1 → C / B → 2 → C', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.pub2);
      // note: B is never called, so it's equivalent to A → 1 → C
      lib.register('C', schemas.sub12);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(1); // C saves once
        expectCwith1();
      });
    });

    test('propagates A → 1 → B+C', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.sub1);
      lib.register('C', schemas.sub1);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(2); // B and C save
        expectBwith1();
        expectCwith1();
      });
    });

    test('propagates A → 1 → B / A → 2 → C', () => {
      lib.register('A', schemas.pub12);
      lib.register('B', schemas.sub1);
      lib.register('C', schemas.sub2);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(2); // B and C save
        expectBwith1();
        expectCwith2();
      });
    });

    // there are some situations where components will save twice (if they don't also publish stuff)

    test('propagates A → 1 → B+C / …B → 2 → C', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.sub1pub2);
      lib.register('C', schemas.sub12);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(3); // B and C save (C saves twice)
        expectBwith1();
        expectCwith1();
        expectCwith2();
      });
    });

    test('propagates A → 1 → B / A → 2 → C / …B → 3 → C', () => {
      lib.register('A', schemas.pub12);
      lib.register('B', schemas.sub1pub3);
      lib.register('C', schemas.sub23);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(3); // B and C save (C saves twice)
        expectBwith1();
        expectCwith2();
        expectCwith3();
      });
    });

    test('propagates A → 1 → B+C / …B → 2 → D / …D → 3 → C', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.sub1pub2);
      lib.register('C', schemas.sub13);
      lib.register('D', schemas.sub2pub3);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(4); // B, C, and D save (C saves twice)
        expectBwith1();
        expectCwith1();
        expectDwith2();
        expectCwith3();
      });
    });

    // complex or deep cyclic dependencies will also be prevented

    test('propagates A → 1 → B / …B → 2 → A', () => {
      lib.register('A', schemas.sub2pub1);
      lib.register('B', schemas.sub1pub2);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(1); // B saves (A does not)
        expectBwith1();
      });
    });

    test('propagates A → 1 → B / …B → 2 → C / …C → 3 → A', () => {
      lib.register('A', schemas.sub3pub1);
      lib.register('B', schemas.sub1pub2);
      lib.register('C', schemas.sub2pub3);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(2); // B and C save (A does not)
        expectBwith1();
        expectCwith2();
      });
    });

    test('propagates title and author to page list', () => {
      lib.register('A', {
        foo: { _publish: 'kilnTitle' },
        bar: { _publish: 'kilnAuthors' }
      });
      lib.registerPageList();

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledWith('updatePageList', {
          title: 'harder',
          authors: 'better'
        });
      });
    });

    // multi-property pubsub

    test('propagates [A] → 1 → B', () => {
      lib.register('A', schemas.pubArray);
      lib.register('B', schemas.sub1);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(1); // B saves once
        expectBwith1();
      });
    });

    test('propagates A → 1 → [B]', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.subArray);

      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(1); // B saves once
        expectBwith1();
      });
    });

    // scoped pubsub

    test('throws error if unknown scope', () => {
      lib.register('A', schemas.pubFetch);
      lib.register('B', schemas.sub1);
      expect(() => fn(aInstance, aData, eventID, null, store)).toThrow('Unable to determine scope for "fetch" in A');
    });

    test('propagates B → 1 → C (children)', () => {
      lib.register('B', schemas.pubChildren);
      lib.register('C', schemas.sub1);
      lib.register('D', schemas.sub1); // not a child, should not be updated
      // note: to test, you must pass in a full uri, as that's registered on the element
      return fn(bInstance, bData, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(1); // C saves once
        expectCwith1();
      });
    });

    test('propagates A → 1 → C (children)', () => {
      lib.register('A', schemas.pubChildren);
      lib.register('C', schemas.sub1);
      lib.register('D', schemas.sub1); // not a child, should not be updated
      // note: to test, you must pass in a full uri, as that's registered on the element
      return fn(aInstance, aData, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(1); // C saves once
        expectCwith1();
      });
    });

    test('propagates B → 1 → A (parents)', () => {
      lib.register('B', schemas.pubParents);
      lib.register('A', schemas.sub1);
      lib.register('C', schemas.sub1); // not a parent, should not be updated
      // note: to test, you must pass in a full uri, as that's registered on the element
      return fn(bInstance, bData, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(1); // A saves once
        expectAwith1();
      });
    });

    test('propagates C → 1 → B, C → 1 → A (parents)', () => {
      lib.register('C', schemas.pubParents);
      lib.register('A', schemas.sub1);
      lib.register('B', schemas.sub1); // actually a parent, so should update as well
      // note: to test, you must pass in a full uri, as that's registered on the element
      return fn(cInstance, data, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(2); // A saves once, B saves once
        expectAwith1();
        expectBwith1();
      });
    });

    test('propagates A → 1 → B (global)', () => {
      lib.register('A', schemas.pubGlobal);
      lib.register('B', schemas.sub1);
      // 'global' publishing doesn't look in the dom, so the uri doesn't matter
      return fn(`${componentPrefix}A`, aData, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(1); // B saves once
        expectBwith1();
      });
    });

    test('propagates [A] → 1 → B (children), [A] → 2 → D', () => {
      lib.register('A', schemas.pubArrayChildren);
      lib.register('B', schemas.sub1);
      lib.register('D', schemas.sub2foo); // second prop in array is global
      // note: to test, you must pass in a full uri, as that's registered on the element
      return fn(aInstance, aData, eventID, null, store).then(() => {
        expect(store.dispatch).toHaveBeenCalledTimes(2); // B saves once, D saves once
        expectBwith1();
        expectDwith2foo();
      });
    });
  });
});
