import lib from './icon.vue';
import icons from './icons';

describe('references', () => {
  it('inserts the icon passed in', () => {
    expect(renderWithArgs(lib, {
      name: 'draft'
    }).$el.innerHTML).to.equal(icons.draft);
  });
});
