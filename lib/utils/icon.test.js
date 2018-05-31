import expect from 'expect';
import lib from './icon.vue';
import icons from './icons';

describe('icon component', () => {
  beforeEach(beforeEachHooks);

  afterEach(afterEachHooks);

  test('inserts the icon passed in', () => {
    const doc = document.createElement('div');

    doc.innerHTML = icons['magic-button'];
    expect(renderWithArgs(lib, {
      name: 'magic-button'
    }).$el.querySelector('path').getAttribute('d')).to.equal(doc.querySelector('path').getAttribute('d'));
  });
});
