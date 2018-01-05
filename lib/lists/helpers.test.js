import * as helpers from './helpers';

describe('list helpers', () => {
  it('get index of an item from a list of text strings', () => {
    const items = [
        'alpha',
        'beta',
        'gamma'],
      tester = 'beta',
      expectedIndex = 1;

    expect(helpers.getItemIndex(items,tester)).to.eql(expectedIndex);

  });

  it('get index of an item from a list of objects', () => {
    const items = [
        { text : 'alpha' },
        { text : 'beta' },
        { text : 'gamma'}],
      tester = 'gamma',
      expectedIndex = 2;

    expect(helpers.getItemIndex(items,tester)).to.eql(expectedIndex);
  });

  it('remove an item from a list', () => {
    const items = [
        { text : 'alpha' },
        { text : 'beta' },
        { text : 'gamma'}],
      tester = 'gamma',
      updatedItems = helpers.removeListItem(items, tester);

    expect(updatedItems.indexOf(tester)).to.eql(-1);
  });

  it('throw an error if trying to remove a non-existent item from a list', () => {
    const items = [
        { text : 'alpha' },
        { text : 'beta' },
        { text : 'gamma'}],
      tester = 'theta';

    helpers.removeListItem(items, tester);
    expect(loggerStub.error).to.have.been.calledWith('Cannot remove theta because it is not in the list.', { action: 'modifyList' });
  });

});
