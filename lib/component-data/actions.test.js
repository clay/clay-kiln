import * as model from './model';
import * as template from './template';
import * as api from '../core-data/api';
import * as components from '../core-data/components';
import * as componentElements from '../utils/component-elements';
import * as queue from '../core-data/queue';
import * as lib from './actions';

describe('component-data actions', () => {
  const uri = 'domain.com/_components/foo',
    data = { a: 'b' },
    prevData = { c: 'd' },
    store = {};

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(model);
    sandbox.stub(template);
    sandbox.stub(api);
    sandbox.stub(components);
    sandbox.stub(componentElements);
    sandbox.stub(queue);

    // stub store.commit so we can test for the correct mutations
    store.commit = sandbox.spy();
    store.dispatch = sandbox.spy(() => Promise.resolve());
  });

  afterEach(() => {
    sandbox.restore();

    delete store.commit;
    delete store.dispatch;
  });

  describe('saveComponent', () => {
    const fn = lib.saveComponent;

    it('does not save when data has not changed', () => {
      return fn(store, { uri, data, prevData: data }).then(() => {
        expect(store.commit.called).to.equal(false);
      });
    });

    it('fetches previous data from store', () => {
      components.getData.returns(data);
      return fn(store, { uri, data }).then(() => {
        expect(store.commit.called).to.equal(false);
      });
    });

    it('saves components with/without model.js', () => {
      model.save.returns(Promise.resolve(data));
      queue.add.returns(Promise.resolve());
      model.render.returns(Promise.resolve(data));
      return fn(store, { uri, data, prevData }).then(() => {
        expect(store.commit).to.have.been.calledWith('UPDATE_COMPONENT', { uri, data });
        expect(store.commit).to.have.callCount(3); // currently saving true, update, currently saving false
      });
    });

    it('reverts components with model.js if model.js errors', () => {
      model.save.returns(Promise.reject(new Error('nope')));
      return fn(store, { uri, data, prevData }).catch(() => {
        expect(loggerStub.error.called).to.equal(true);
      });
    });

    it('queues component with model.js save to server', () => {
      model.save.returns(Promise.resolve(data));
      queue.add.returns(Promise.resolve());
      model.render.returns(Promise.resolve(data));
      return fn(store, { uri, data, prevData }).then(() => {
        expect(queue.add).to.have.been.calledWith(api.save, [uri, data, false], 'save');
      });
    });

    it('reverts components with model.js if queued save errors', () => {
      model.save.returns(Promise.resolve(data));
      queue.add.returns(Promise.reject(new Error('nope')));
      model.render.returns(Promise.resolve(data));
      return fn(store, { uri, data, prevData }).catch(() => {
        expect(queue.add).to.have.been.calledWith(api.save, [uri, data, false], 'save');
        expect(loggerStub.error.called).to.equal(true);
      });
    });

    it('does not take snapshots when undoing', () => {
      model.save.returns(Promise.resolve(data));
      queue.add.returns(Promise.resolve());
      model.render.returns(Promise.resolve(data));
      return fn(store, { uri, data, prevData, snapshot: false }).then(() => {
        expect(store.dispatch).to.not.have.been.calledWith('setFixedPoint');
      });
    });

    it('updates page list when saving page-specific components', () => {
      componentElements.isComponentInPage.returns(true);
      model.save.returns(Promise.resolve(data));
      queue.add.returns(Promise.resolve());
      model.render.returns(Promise.resolve(data));
      return fn(store, { uri, data, prevData, snapshot: false }).then(() => {
        expect(store.dispatch).to.not.have.been.calledWith('setFixedPoint');
      });
    });
  });
});
