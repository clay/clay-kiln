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

  it('get index of an item from a list of strings', () => {
    const items = [
        'George Washington',
        'John Adams',
        'Thomas Jefferson',
        'James Madison'
      ],
      tester = 'Thomas Jefferson',
      expectedIndex = 2;

    expect(helpers.getItemIndex(items, tester)).to.eql(expectedIndex);
  });

  it('get index of an item from a list of objects, by matching one property', () => {
    const items = [
        { text : 'alpha' },
        { text : 'beta' },
        { text : 'gamma'}],
      tester = 'gamma',
      expectedIndex = 2;

    expect(helpers.getItemIndex(items, tester, 'text')).to.eql(expectedIndex);
  });

  it('get index of an item from a list of objects', () => {
    const items = [
        {
          id: 'new',
          title: 'Article'
        },
        {
          id: 'new-feature-lede',
          title: 'Feature Article'
        },
        {
          id: 'new-sponsored',
          title: 'Sponsored Article'
        }],
      tester = {
        id: 'new-feature-lede',
        title: 'Feature Article'
      },
      expectedIndex = 1;

    expect(helpers.getItemIndex(items,tester)).to.eql(expectedIndex);
  });

  it('throws an error when trying to find the index of an item that has a different data structure than the items in the list', () => {
    const items = [
        'George Washington',
        'John Adams',
        'Thomas Jefferson',
        'James Madison'
      ],
      tester = {
        name: 'Thomas Jefferson'
      };

    helpers.getItemIndex(items, tester);

    expect(loggerStub.error).to.have.been.calledWith('The item you are looking for does not have the same data structure as the items in the list.', {action: 'modifyList'});
  });

  it('throws an error when trying to find the index of an item that has a different object structure than the items in the list', () => {
    const items = [
        {text: 'George Washington'},
        {text: 'John Adams'},
        {text: 'Thomas Jefferson'},
        {text: 'James Madison'}
      ],
      tester = {
        name: 'Thomas Jefferson'
      };

    helpers.getItemIndex(items, tester);

    expect(loggerStub.error).to.have.been.calledWith('The item you are looking for does not have the same object structure as the items in the list.', {action: 'modifyList'});
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

    helpers.removeListItem(items, tester, 'text');
    expect(loggerStub.error).to.have.been.calledWith('Cannot remove theta because it is not in the list.', { action: 'modifyList' });
  });
});
