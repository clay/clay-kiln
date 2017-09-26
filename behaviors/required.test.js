import lib from './required.vue';
import * as inputs from '../lib/forms/inputs';

describe('required behavior', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
    sandbox.stub(inputs, 'expand');
    beforeEachHooks();
  });

  afterEach(() => {
    sandbox.restore();
    afterEachHooks();
  });

  it('adds span if label behavior exists in the schema', () => {
    inputs.expand.returns([{ fn: 'input-label' }]);
    expect(renderWithArgs(lib, {
      schema: { _has: 'input-label' }
    }).$el.innerText).to.equal('required');
  });

  it('does not add span if no label', () => {
    inputs.expand.returns([{ fn: 'required' }]);
    expect(renderWithArgs(lib, {
      schema: { _has: 'required' }
    }).$el.innerText).to.equal(undefined);
  });

  it('goes in the before slot', () => {
    expect(lib.slot).to.equal('before');
  });
});
