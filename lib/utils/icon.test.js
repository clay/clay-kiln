import lib from './icon.vue';
import icons from './icons';

describe('icon component', () => {
  beforeEach(beforeEachHooks);

  afterEach(afterEachHooks);

  it('inserts the icon passed in', () => {
    const doc = document.createElement('div');

    doc.innerHTML = icons.copy;
    expect(renderWithArgs(lib, {
      name: 'copy'
    }).$el.querySelector('path').getAttribute('d')).to.equal(doc.querySelector('path').getAttribute('d'));
  });
});
