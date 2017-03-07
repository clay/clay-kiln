import lib from './mutations';
import { OPEN_PANE, CLOSE_PANE, CHANGE_PANE } from './mutationTypes';

define('pane mutations', () => {
  it('opens pane', () => {
    expect(lib[OPEN_PANE]({}, 'options')).to.eql({ ui: { currentPane: 'options' }});
  });

  it('closes pane', () => {
    expect(lib[CLOSE_PANE]({})).to.eql({ ui: { currentPane: null }});
  });

  it('changes pane', () => {
    expect(lib[CHANGE_PANE]({})).to.eql({ ui: { currentPane: { transitioning: true }}});
  });
});
