import _ from 'lodash';
import lib from './checkbox-group.vue';

const options = [{ name: 'One', value: 'one' }, { name: 'Two', value: 'two' }],
  state = { site: { slug: 'foo' }};

describe('checkbox-group behavior', () => {
  beforeEach(beforeEachHooks);

  afterEach(afterEachHooks);

  it('allows multiple inputs', () => {
    expect(renderWithArgs(lib, {
      args: { options }, data: {}
    }, state).$el.querySelectorAll('input').length).to.equal(2);
  });

  it('uses option.name as label', () => {
    expect(_.map(renderWithArgs(lib, {
      args: { options }, data: {}
    }, state).$el.querySelectorAll('label'), (label) => label.textContent)).to.eql(['One', 'Two']);
  });

  it('uses option.value as the value', () => {
    expect(_.map(renderWithArgs(lib, {
      args: { options }, data: {}
    }, state).$el.querySelectorAll('input'), (input) => input.value)).to.eql(['one', 'two']);
  });

  it('goes in the main slot', () => {
    expect(lib.slot).to.equal('main');
  });
});
