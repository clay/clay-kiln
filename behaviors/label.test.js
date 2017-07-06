import lib from './label.vue';

describe('label behavior', () => {
  beforeEach(beforeEachHooks);

  afterEach(afterEachHooks);

  it('adds label', () => {
    expect(renderWithArgs(lib, {
      name: 'test'
    }).label).to.equal('Test');
  });

  it('goes in the before slot', () => {
    expect(lib.slot).to.equal('before');
  });
});
