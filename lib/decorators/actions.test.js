import * as componentElements from '../utils/component-elements';
import * as scroll from '../utils/scroll';
import * as validation from '../forms/native-validation';
import * as select from './select';
import * as lib from './actions';

describe('decorator actions', () => {
  const store = {};

  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(scroll);
    sandbox.stub(validation);
    sandbox.stub(select);
    sandbox.stub(componentElements);

    // stub store.commit so we can test for the correct mutations
    store.commit = sandbox.spy();
    store.dispatch = sandbox.spy(() => Promise.resolve());
  });

  afterEach(() => {
    sandbox.restore();

    delete store.commit;
    delete store.dispatch;
    delete store.state;
  });

  describe('unselect', () => {
    const fn = lib.unselect;

    it('does not unselect if nothing selected', () => {
      store.state = { ui: { currentSelection: {}}};
      return fn(store);
      expect(store.commit.called).to.equal(false);
    });

    it('unselects if something is selected', () => {
      const el = document.createElement('div');

      el.classList.add('selected');
      store.state = { ui: { currentSelection: { el }}};
      return fn(store);
      expect(store.commit).to.have.been.calledWith('UN_SELECT');
      expect(el.classList.contains('selected')).to.equal(false);
    });
  });
});
