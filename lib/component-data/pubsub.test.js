import * as lib from './pubsub';
import { refAttr } from '../utils/references';

const data = { foo: 'harder', bar: 'better', baz: 'faster', qux: 'stronger' },
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
    pubChildren: {
      foo: { _publish: { name: '1', scope: 'children' }}
    },
    pubParents: {
      foo: { _publish: { name: '1', scope: 'parents' }}
    },
    pubGlobal: {
      foo: { _publish: { name: '1', scope: 'global' }}
    },
    pubArrayChildren: {
      foo: { _publish: [{ name: '1', scope: 'children' }, '2']} // allow mixed scoped + unscoped
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
  },
  componentPrefix = 'domain.com/components/';

describe('pubsub', () => {
  let sandbox, store;

  beforeEach(() => {
    const grandParentEl = document.createElement('div'),
      parentEl = document.createElement('div'),
      childEl = document.createElement('div');

    sandbox = sinon.sandbox.create();
    lib.unregisterAll(); // unregister all components from pubsub
    store = {
      dispatch: sandbox.spy((action, {uri, eventID, snapshot}) => lib.publish(uri, store.state.components[uri], eventID, snapshot, store)),
      state: {
        components: {
          [`${componentPrefix}A/instances/1`]: data,
          [`${componentPrefix}B/instances/1`]: data,
          [`${componentPrefix}C/instances/1`]: data,
          [`${componentPrefix}D/instances/1`]: data
        }
      }
    };
    grandParentEl.setAttribute(refAttr, `${componentPrefix}A/instances/1`);
    parentEl.setAttribute(refAttr, `${componentPrefix}B/instances/1`);
    childEl.setAttribute(refAttr, `${componentPrefix}C/instances/1`);
    parentEl.appendChild(childEl);
    grandParentEl.appendChild(parentEl);
    document.body.appendChild(grandParentEl);
  });

  afterEach(() => {
    sandbox.restore();
  });

  function expectAwith1() {
    expect(store.dispatch).to.have.been.calledWith('saveComponent', {
      uri: `${componentPrefix}A/instances/1`,
      data: { foo: 'harder' },
      eventID,
      snapshot: null
    });
  }

  function expectBwith1() {
    expect(store.dispatch).to.have.been.calledWith('saveComponent', {
      uri: `${componentPrefix}B/instances/1`,
      data: { foo: 'harder' },
      eventID,
      snapshot: null
    });
  }

  function expectCwith1() {
    expect(store.dispatch).to.have.been.calledWith('saveComponent', {
      uri: `${componentPrefix}C/instances/1`,
      data: { foo: 'harder' },
      eventID,
      snapshot: null
    });
  }

  function expectCwith2() {
    expect(store.dispatch).to.have.been.calledWith('saveComponent', {
      uri: `${componentPrefix}C/instances/1`,
      data: { bar: 'better' },
      eventID,
      snapshot: null
    });
  }

  function expectCwith3() {
    expect(store.dispatch).to.have.been.calledWith('saveComponent', {
      uri: `${componentPrefix}C/instances/1`,
      data: { baz: 'faster' },
      eventID,
      snapshot: null
    });
  }

  function expectDwith2() {
    expect(store.dispatch).to.have.been.calledWith('saveComponent', {
      uri: `${componentPrefix}D/instances/1`,
      data: { bar: 'better' },
      eventID,
      snapshot: null
    });
  }

  function expectDwith2foo() {
    expect(store.dispatch).to.have.been.calledWith('saveComponent', {
      uri: `${componentPrefix}D/instances/1`,
      data: { foo: 'harder' },
      eventID,
      snapshot: null
    });
  }

  function expectBwith12() {
    expect(store.dispatch).to.have.been.calledWith('saveComponent', {
      uri: `${componentPrefix}B/instances/1`,
      data: { foo: 'harder', bar: 'better' },
      eventID,
      snapshot: null
    });
  }

  describe('publish', () => {
    const fn = lib.publish;

    it('does nothing if no publishable fields in the schema', () => {
      lib.register('A', schemas.noPub);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(0); // nothing else saves
      });
    });

    it('does nothing if no subscribers in the registery', () => {
      lib.register('A', schemas.pub1);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(0); // nothing else saves
      });
    });

    // components that publish will never save themselves twice (to prevent bad ux and cyclic regressions)

    it('prevents double saving when A pubs and subs to the same event (cyclic regression)', () => {
      lib.register('A', schemas.pubSelf);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(0); // A doesn't save twice
      });
    });

    // components propagate changes to other components

    it('propagates A → 1 → B', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.sub1);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(1); // B saves once
        expectBwith1();
      });
    });

    it('propagates A → 1+2 → B', () => {
      lib.register('A', schemas.pub12);
      lib.register('B', schemas.sub12);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(1); // B saves once, with both props
        expectBwith12();
      });
    });

    it('propagates A+B → 1 → C', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.pub1);
      // note: B is never called, so it's equivalent to A → 1 → C
      lib.register('C', schemas.sub1);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(1); // C saves once
        expectCwith1();
      });
    });

    it('propagates A → 1 → C / B → 2 → C', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.pub2);
      // note: B is never called, so it's equivalent to A → 1 → C
      lib.register('C', schemas.sub12);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(1); // C saves once
        expectCwith1();
      });
    });

    it('propagates A → 1 → B+C', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.sub1);
      lib.register('C', schemas.sub1);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(2); // B and C save
        expectBwith1();
        expectCwith1();
      });
    });

    it('propagates A → 1 → B / A → 2 → C', () => {
      lib.register('A', schemas.pub12);
      lib.register('B', schemas.sub1);
      lib.register('C', schemas.sub2);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(2); // B and C save
        expectBwith1();
        expectCwith2();
      });
    });

    // there are some situations where components will save twice (if they don't also publish stuff)

    it('propagates A → 1 → B+C / …B → 2 → C', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.sub1pub2);
      lib.register('C', schemas.sub12);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(3); // B and C save (C saves twice)
        expectBwith1();
        expectCwith1();
        expectCwith2();
      });
    });

    it('propagates A → 1 → B / A → 2 → C / …B → 3 → C', () => {
      lib.register('A', schemas.pub12);
      lib.register('B', schemas.sub1pub3);
      lib.register('C', schemas.sub23);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(3); // B and C save (C saves twice)
        expectBwith1();
        expectCwith2();
        expectCwith3();
      });
    });

    it('propagates A → 1 → B+C / …B → 2 → D / …D → 3 → C', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.sub1pub2);
      lib.register('C', schemas.sub13);
      lib.register('D', schemas.sub2pub3);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(4); // B, C, and D save (C saves twice)
        expectBwith1();
        expectCwith1();
        expectDwith2();
        expectCwith3();
      });
    });

    // complex or deep cyclic dependencies will also be prevented

    it('propagates A → 1 → B / …B → 2 → A', () => {
      lib.register('A', schemas.sub2pub1);
      lib.register('B', schemas.sub1pub2);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(1); // B saves (A does not)
        expectBwith1();
      });
    });

    it('propagates A → 1 → B / …B → 2 → C / …C → 3 → A', () => {
      lib.register('A', schemas.sub3pub1);
      lib.register('B', schemas.sub1pub2);
      lib.register('C', schemas.sub2pub3);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(2); // B and C save (A does not)
        expectBwith1();
        expectCwith2();
      });
    });

    it('propagates title and author to page list', () => {
      lib.register('A', {
        foo: { _publish: 'kilnTitle' },
        bar: { _publish: 'kilnAuthors' }
      });
      lib.registerPageList();
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch).to.have.been.calledWith('updatePageList', {
          title: 'harder',
          authors: 'better'
        });
      });
    });

    // multi-property pubsub

    it('propagates [A] → 1 → B', () => {
      lib.register('A', schemas.pubArray);
      lib.register('B', schemas.sub1);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(1); // B saves once
        expectBwith1();
      });
    });

    it('propagates A → 1 → [B]', () => {
      lib.register('A', schemas.pub1);
      lib.register('B', schemas.subArray);
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(1); // B saves once
        expectBwith1();
      });
    });

    // scoped pubsub

    it('propagates B → 1 → C (children)', () => {
      lib.register('B', schemas.pubChildren);
      lib.register('C', schemas.sub1);
      lib.register('D', schemas.sub1); // not a child, should not be updated
      // note: to test, you must pass in a full uri, as that's registered on the element
      return fn(`${componentPrefix}B/instances/1`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(1); // C saves once
        expectCwith1();
      });
    });

    it('propagates A → 1 → C (children)', () => {
      lib.register('A', schemas.pubChildren);
      lib.register('C', schemas.sub1);
      lib.register('D', schemas.sub1); // not a child, should not be updated
      // note: to test, you must pass in a full uri, as that's registered on the element
      return fn(`${componentPrefix}A/instances/1`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(1); // C saves once
        expectCwith1();
      });
    });

    it('propagates B → 1 → A (parents)', () => {
      lib.register('B', schemas.pubParents);
      lib.register('A', schemas.sub1);
      lib.register('C', schemas.sub1); // not a parent, should not be updated
      // note: to test, you must pass in a full uri, as that's registered on the element
      return fn(`${componentPrefix}B/instances/1`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(1); // A saves once
        expectAwith1();
      });
    });

    it('propagates C → 1 → B, C → 1 → A (parents)', () => {
      lib.register('C', schemas.pubParents);
      lib.register('A', schemas.sub1);
      lib.register('B', schemas.sub1); // actually a parent, so should update as well
      // note: to test, you must pass in a full uri, as that's registered on the element
      return fn(`${componentPrefix}C/instances/1`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(2); // A saves once, B saves once
        expectAwith1();
        expectBwith1();
      });
    });

    it('propagates A → 1 → B (global)', () => {
      lib.register('A', schemas.pubGlobal);
      lib.register('B', schemas.sub1);
      // 'global' publishing doesn't look in the dom, so the uri doesn't matter
      return fn(`${componentPrefix}A`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(1); // B saves once
        expectBwith1();
      });
    });

    it('propagates [A] → 1 → B (children), [A] → 2 → D', () => {
      lib.register('A', schemas.pubArrayChildren);
      lib.register('B', schemas.sub1);
      lib.register('D', schemas.sub2foo); // second prop in array is global
      // note: to test, you must pass in a full uri, as that's registered on the element
      return fn(`${componentPrefix}A/instances/1`, data, eventID, null, store).then(() => {
        expect(store.dispatch.callCount).to.equal(2); // B saves once, D saves once
        expectBwith1();
        expectDwith2foo();
      });
    });
  });
});
