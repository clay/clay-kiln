import * as lib from './actions';

describe('toolbar actions', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('showStatus', () => {
    const fn = lib.showStatus;

    it('hides status, waits a tick, then shows status', () => {
      const store = { commit: sandbox.spy() };

      fn(store, 'foo');
      expect(store.commit).to.have.been.calledWith('HIDE_STATUS');
      setTimeout(() => {
        expect(store.commit).to.have.been.calledWith('SHOW_STATUS', 'foo');
      }, 0);
    });
  });

  describe('togglePane', () => {
    const fn = lib.togglePane,
      button = document.createElement('button');

    document.body.appendChild(button); // add to body, so it gets an offsetParent

    it('closes pane if same pane open', () => {
      const store = { dispatch: sandbox.spy(), state: { ui: { currentPane: { name: 'foo' }}}};

      fn(store, { options: { name: 'foo' }, button: button });
      expect(store.dispatch).to.have.been.calledWith('closePane');
    });

    it('opens pane if no pane open', () => {
      const store = { dispatch: sandbox.spy(), state: { ui: { currentPane: { name: 'bar' }}}};

      fn(store, { options: { name: 'foo' }, button: button });
      expect(store.dispatch).to.have.been.calledWith('openPane');
    });
  });
});
