import lib from './required.vue';
import * as behaviors from '../lib/forms/behaviors';

describe('required behavior', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(behaviors, 'expand');
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('adds span if label behavior exists in the schema', () => {
    behaviors.expand.returns([{ fn: 'input-label' }]);
    expect(renderWithArgs(lib, {
      schema: { _has: 'input-label' }
    }).$el.innerText).to.equal('required');
  });

  it('does not add span if no label', () => {
    behaviors.expand.returns([{ fn: 'required' }]);
    expect(renderWithArgs(lib, {
      schema: { _has: 'required' }
    }).$el.innerText).to.equal(undefined);
  });

  it('goes in the before slot', () => {
    expect(lib.slot).to.equal('before');
  });
});
