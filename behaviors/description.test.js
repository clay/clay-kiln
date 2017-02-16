import lib from './description.vue';

describe('description behavior', () => {
  it('passes in value', () => {
    expect(renderWithArgs(lib, {
      args: { value: 'Hello'}
    }).$el.innerHTML).to.equal('Hello');
  });

  it('allows html', () => {
    expect(renderWithArgs(lib, {
      args: { value: '<em>Hello</em>' }
    }).$el.innerHTML).to.equal('<em>Hello</em>');
  });

  it('goes in the before slot', () => {
    expect(lib.slot).to.equal('before');
  });
});
