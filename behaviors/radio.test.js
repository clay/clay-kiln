import _ from 'lodash';
import lib from './radio.vue';

const options = ['', 'one', 'two three'];

describe('radio behavior', () => {
  it('adds radio buttons', () => {
    expect(renderWithArgs(lib, {
      args: { options }
    }).$el.querySelectorAll('input').length).to.equal(3);
  });

  it('uses "None" as label for emptystring option', () => {
    expect(_.head(renderWithArgs(lib, {
      args: { options }
    }).$el.querySelectorAll('label')).textContent.trim()).to.eql('None');
  });

  it('converts label to start case', () => {
    expect(_.map(renderWithArgs(lib, {
      args: { options }
    }).$el.querySelectorAll('label'), (label) => label.textContent.trim())).to.eql(['None', 'One', 'Two Three']);
  });

  it('goes in the main slot', () => {
    expect(lib.slot).to.equal('main');
  });
});
