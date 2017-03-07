import * as components from '../core-data/components';
import * as lib from './template';

describe('component template', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(components);
    components.getTemplate.returns((data) => `hi ${data.locals.edit} ${data.text} (${data._ref})!`);
    components.getLocals.returns({ edit: true });
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('render', () => {
    const fn = lib.render;

    it('renders with data and locals', () => {
      fn('foo', { _ref: 'foo', text: 'friend' }).then((res) => {
        expect(res).to.equal('hi true friend (foo)!');
      });
    });

    it('adds _ref if not passed in', () => {
      fn('foo', { text: 'friend' }).then((res) => {
        expect(res).to.equal('hi true friend (foo)!');
      });
    });
  });
});
