import _ from 'lodash';
import lib from './radio.vue';

const options = ['one', 'two three'],
  state = { site: { slug: 'foo' }};

describe('radio behavior', () => {
  beforeEach(beforeEachHooks);

  afterEach(afterEachHooks);

  it('adds radio buttons', () => {
    expect(renderWithArgs(lib, {
      args: { options }
    }, state).$el.querySelectorAll('input').length).to.equal(2);
  });

  it('allows options with objects', () => {
    expect(_.head(renderWithArgs(lib, {
      args: { options: [{ value: '', name: 'None' }] }
    }, state).$el.querySelectorAll('label')).textContent.trim()).to.eql('None');
  });

  it('converts label to start case', () => {
    expect(_.map(renderWithArgs(lib, {
      args: { options }
    }, state).$el.querySelectorAll('label'), (label) => label.textContent.trim())).to.eql(['One', 'Two Three']);
  });
});
