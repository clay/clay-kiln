import _ from 'lodash';
import * as model from './model';
import * as template from './template';
import * as api from '../core-data/api';
import * as components from '../core-data/components';
import * as componentElements from '../utils/component-elements';
import * as queue from '../core-data/queue';
import * as lib from './actions';

describe('component-data actions', () => {
  const uri = 'domain.com/components/foo',
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

    it('saves client-side components', () => {
      components.getModel.returns(true);
      components.getTemplate.returns(true);
      model.save.returns(Promise.resolve(data));
      queue.add.returns(Promise.resolve());
      model.render.returns(Promise.resolve(data));
      return fn(store, { uri, data, prevData }).then(() => {
        expect(store.commit).to.have.been.calledWith('UPDATE_COMPONENT', { uri, data });
        expect(store.commit).to.have.callCount(3); // currently saving true, update, currently saving false
      });
    });

    it('reverts client-side components if model.js errors', () => {
      components.getModel.returns(true);
      components.getTemplate.returns(true);
      model.save.returns(Promise.reject(new Error('nope')));
      return fn(store, { uri, data, prevData }).catch(() => {
        expect(console.error).to.have.been.calledWith('Error saving component (foo): nope');
      });
    });

    it('queues client-side save to server', () => {
      components.getModel.returns(true);
      components.getTemplate.returns(true);
      model.save.returns(Promise.resolve(data));
      queue.add.returns(Promise.resolve());
      model.render.returns(Promise.resolve(data));
      return fn(store, { uri, data, prevData }).then(() => {
        expect(queue.add).to.have.been.calledWith(api.save, [uri, data, false], 'save');
      });
    });

    it('reverts client-side components if queued save errors', () => {
      components.getModel.returns(true);
      components.getTemplate.returns(true);
      model.save.returns(Promise.resolve(data));
      queue.add.returns(Promise.reject(new Error('nope')));
      model.render.returns(Promise.resolve(data));
      return fn(store, { uri, data, prevData }).catch(() => {
        expect(queue.add).to.have.been.calledWith(api.save, [uri, data, false], 'save');
        expect(console.error).to.have.been.calledWith('Error saving component (foo): nope');
      });
    });

    it('saves server-side components', () => {
      components.getModel.returns(false);
      components.getTemplate.returns(true);
      queue.add.returns(Promise.resolve(data));
      return fn(store, { uri, data, prevData }).then(() => {
        expect(store.commit).to.have.been.calledWith('UPDATE_COMPONENT', { uri, data });
        expect(store.commit).to.have.callCount(3); // currently saving true, update, currently saving false
      });
    });

    it('reverts server-side components if queued save errors', () => {
      components.getModel.returns(false);
      components.getTemplate.returns(true);
      queue.add.returns(Promise.reject(new Error('nope')));
      return fn(store, { uri, data, prevData }).catch(() => {
        expect(queue.add).to.have.been.calledWith(api.save, [uri, _.assign({}, data, prevData)], 'save');
        expect(console.error).to.have.been.calledWith('Error saving component (foo): nope');
      });
    });

    it('does not take snapshots when undoing', () => {
      components.getModel.returns(true);
      components.getTemplate.returns(true);
      model.save.returns(Promise.resolve(data));
      queue.add.returns(Promise.resolve());
      model.render.returns(Promise.resolve(data));
      return fn(store, { uri, data, prevData, snapshot: false }).then(() => {
        expect(store.dispatch).to.not.have.been.calledWith('setFixedPoint');
      });
    });

    it('updates page list when saving page-specific components', () => {
      componentElements.isComponentInPage.returns(true);
      components.getModel.returns(true);
      components.getTemplate.returns(true);
      model.save.returns(Promise.resolve(data));
      queue.add.returns(Promise.resolve());
      model.render.returns(Promise.resolve(data));
      return fn(store, { uri, data, prevData, snapshot: false }).then(() => {
        expect(store.dispatch).to.not.have.been.calledWith('setFixedPoint');
      });
    });
  });
});
