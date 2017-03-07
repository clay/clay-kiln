import _ from 'lodash';
import lib from './checkbox-group.vue';

const options = [{ name: 'One', value: 'one' }, { name: 'Two', value: 'two' }];

describe('checkbox-group behavior', () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.sandbox.create();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('allows multiple inputs', () => {
    expect(renderWithArgs(lib, {
      args: { options }, data: {}
    }).$el.querySelectorAll('input').length).to.equal(2);
  });

  it('uses option.name as label', () => {
    expect(_.map(renderWithArgs(lib, {
      args: { options }, data: {}
    }).$el.querySelectorAll('label'), (label) => label.textContent)).to.eql(['One', 'Two']);
  });

  it('uses option.value as the value', () => {
    expect(_.map(renderWithArgs(lib, {
      args: { options }, data: {}
    }).$el.querySelectorAll('input'), (input) => input.value)).to.eql(['one', 'two']);
  });

  it('falls back to using option.value as label', () => {
    expect(renderWithArgs(lib, {
      args: { options: [{ value: 'foobar' }] }, data: {}
    }).$el.querySelector('label').textContent).to.eql('foobar');
  });

  it('goes in the main slot', () => {
    expect(lib.slot).to.equal('main');
  });

  it('throws error if no options arg', () => {
    expect(() => renderWithArgs(lib, { args: {}, data: {} })).to.throw('Checkbox Group behavior must have an `options` argument!');
  });
});
