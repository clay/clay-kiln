import lib from './icon.vue';
import icons from './icons';

describe('icon component', () => {
  beforeEach(beforeEachHooks);

  afterEach(afterEachHooks);

  it('inserts the icon passed in', () => {
    const doc = document.createElement('div');

    doc.innerHTML = icons.draft;
    expect(renderWithArgs(lib, {
      name: 'draft'
    }).$el.querySelector('path').getAttribute('d')).to.equal(doc.querySelector('path').getAttribute('d'));
  });
});
