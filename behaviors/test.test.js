import lib from './text.vue';

describe('text behavior', () => {
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
});
