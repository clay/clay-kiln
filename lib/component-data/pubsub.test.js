import _ from 'lodash';
import * as components from '../core-data/components';
import * as lib from './pubsub';

const schemas = {
    noPub: { foo: 'a', bar: { baz: 'qux' }},
    pubSelf: {
      foo: {
        _subscribe: 'able',
        _publish: 'able'
      }
    },
    pubA: {
      bar: { _publish: 'able' }
    },
    subA: {
      baz: { _subscribe: 'able' }
    },
    subApubB: {
      qux: {
        _subscribe: 'able',
        _publish: 'baker'
      }
    },
    subB: {
      quux: { _subscribe: 'baker' }
    },
    pubAB: {
      foo: { _publish: 'able' },
      bar: { _publish: 'baker' }
    },
    subApubC: {
      foo: {
        _subscribe: 'able',
        _publish: 'charlie'
      }
    },
    subBpubC: {
      foo: {
        _subscribe: 'baker',
        _publish: 'charlie'
      }
    },
    subC: {
      foo: { _subscribe: 'charlie' }
    },
    // end is assigned into the schema of the last component in the chain we're testing
    end: {
      end: { _publish: 'end' }
    }
  },
  componentPrefix = 'domain.com/components/';

describe('pubsub', () => {
  let sandbox, store;

  beforeEach(() => {
    lib.yggdrasil.off(); // remove all listeners
    sandbox = sinon.sandbox.create();
    sandbox.stub(components, 'getSchema');
    store = {
      dispatch: sandbox.spy((action, {uri, data, eventID}) => lib.publish(uri, data, eventID)),
      state: {
        components: {
          [`${componentPrefix}A/instances/1`]: {},
          [`${componentPrefix}B/instances/1`]: {},
          [`${componentPrefix}C/instances/1`]: {}
        }
      }
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('publish', () => {
    const fn = lib.publish;

    it('does nothing if no publishable fields in the schema', () => {
      lib.addListeners('A', schemas.noPub, store);
      components.getSchema.returns(schemas.noPub);
      fn(`${componentPrefix}A`, {count:0});
      expect(_.size(lib.callStacks)).to.equal(0);
    });

    it('prevents double saving when A pubs and subs to the same event (cyclic regression)', () => {
      let data = { count: 0 };

      components.getSchema.returns(schemas.pubSelf);
      lib.addListeners('A', schemas.pubSelf, store);
      fn(`${componentPrefix}A`, data);
      expect(data.count).to.equal(0);
    });

    it('propagates A to B', (done) => {
      let data = { count: 0 };

      components.getSchema.withArgs(`${componentPrefix}A`).returns(schemas.pubA);
      components.getSchema.withArgs(`${componentPrefix}B/instances/1`).returns(_.assign({}, schemas.subA, schemas.end));
      lib.addListeners('B', schemas.subA, store);
      lib.yggdrasil.on('end', () => {
        expect(store.dispatch.callCount).to.equal(1);
        done();
      });
      // trigger publish after adding the end listener
      fn(`${componentPrefix}A`, data);
    });

    it('propagates A to B to C', (done) => {
      let data = { count: 0 };

      components.getSchema.withArgs(`${componentPrefix}A`).returns(schemas.pubA);
      components.getSchema.withArgs(`${componentPrefix}B/instances/1`).returns(schemas.subApubB);
      components.getSchema.withArgs(`${componentPrefix}C/instances/1`).returns(_.assign({}, schemas.subB, schemas.end));
      lib.addListeners('B', schemas.subApubB, store);
      lib.addListeners('C', schemas.subB, store);
      lib.yggdrasil.on('end', () => {
        expect(store.dispatch.callCount).to.equal(2);
        done();
      });
      // trigger publish after adding the end listener
      fn(`${componentPrefix}A`, data);
    });

    it('merges subbed data on nondeterministic updates', () => {
      // A pubs to B and C, B and C pub to D.
      let data = { count: 0 };

      components.getSchema.withArgs(`${componentPrefix}A`).returns(schemas.pubAB);
      components.getSchema.withArgs(`${componentPrefix}B/instances/1`).returns(schemas.subApubC);
      components.getSchema.withArgs(`${componentPrefix}C/instances/1`).returns(schemas.subBpubC);
      components.getSchema.withArgs(`${componentPrefix}D/instances/1`).returns(_.assign({}, schemas.subC, schemas.end));
      lib.addListeners('B', schemas.subApubC, store);
      lib.addListeners('C', schemas.subBpubC, store);
      lib.addListeners('D', schemas.subC, store);
      lib.yggdrasil.on('end', () => {
        expect(store.dispatch.callCount).to.equal(3); // D is only saved once, not twice
        done();
      });
      // trigger publish after adding the end listener
      fn(`${componentPrefix}A`, data);
    });
  });
});
