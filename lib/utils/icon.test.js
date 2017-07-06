import lib from './icon.vue';
import icons from './icons';

describe('references', () => {
  beforeEach(beforeEachHooks);

  afterEach(afterEachHooks);

  it('inserts the icon passed in', () => {
    expect(renderWithArgs(lib, {
      name: 'draft'
    }).$el.innerHTML).to.equal(icons.draft);
  });
});
