import * as lib from './actions';

describe('pane actions', () => {
  let sandbox, store;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    store = {
      dispatch: sandbox.spy(() => Promise.resolve()),
      commit: sandbox.spy()
    };
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('openPane', () => {
    const fn = lib.openPane;

    it('opens pane', () => {
      return fn(store).then(() => {
        expect(store.dispatch).to.have.been.calledWith('unfocus');
        expect(store.commit).to.have.been.calledWith('OPEN_PANE');
      });
    });
  });

  describe('closePane', () => {
    const fn = lib.closePane;

    it('closes panes', () => {
      return fn(store).then(() => {
        expect(store.dispatch).to.have.been.calledWith('unfocus');
        expect(store.commit).to.have.been.calledWith('CLOSE_PANE');
      });
    });
  });
});
