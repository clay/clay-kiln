import lib from './text.vue';

describe('text behavior', () => {
  beforeEach(beforeEachHooks);

  afterEach(afterEachHooks);

  it('defaults to text input', () => {
    expect(renderWithArgs(lib, {
      args: {}
    }).$el.getAttribute('type')).to.equal('text');
  });

  it('sets type', () => {
    expect(renderWithArgs(lib, {
      args: { type: 'url' }
    }).$el.getAttribute('type')).to.equal('url');
  });

  it('goes in the main slot', () => {
    expect(lib.slot).to.equal('main');
  });
});
