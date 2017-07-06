import lib from './checkbox.vue';

describe('checkbox behavior', () => {
  beforeEach(beforeEachHooks);

  afterEach(afterEachHooks);

  it('adds label', () => {
    expect(renderWithArgs(lib, {
      args: { label: 'Hi'}
    }).$el.querySelector('span').textContent).to.equal('Hi');
  });

  it('goes in the main slot', () => {
    expect(lib.slot).to.equal('main');
  });
});
