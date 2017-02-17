import lib from './checkbox.vue';

describe('checkbox behavior', () => {
  it('adds label', () => {
    expect(renderWithArgs(lib, {
      args: { label: 'Hi'}
    }).$el.querySelector('span').textContent).to.equal('Hi');
  });

  it('goes in the main slot', () => {
    expect(lib.slot).to.equal('main');
  });

  it('throws error if no label arg', () => {
    expect(() => renderWithArgs(lib, { args: {} })).to.throw('Checkbox behavior must have a `label` argument!');
  });
});
