import lib from './label.vue';

describe('label behavior', () => {
  it('adds label', () => {
    expect(renderWithArgs(lib, {
      name: 'test'
    }).$el.innerText).to.equal('Test');
  });
});
