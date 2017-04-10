import mutations from './mutations';
import {
    LIST_LOAD_PENDING,
    LIST_LOAD_SUCCESS,
    LIST_LOAD_FAIL
} from './mutationTypes';

describe('list mutations', () => {
  it('handles PENDING', () => {
    const listName = 'fooList',
      otherList = {
        isLoading: false,
        error: null,
        items: []
      };

    expect(
      mutations[LIST_LOAD_PENDING]({}, {listName})
    ).to.deep.eql({
      fooList: {
        isLoading: true,
        error: null,
        items: []
      }
    });

    expect(
      mutations[LIST_LOAD_PENDING]({otherList}, {listName})
    ).to.deep.eql({
      otherList,
      fooList: {
        isLoading: true,
        error: null,
        items: []
      }
    });
  });

  it('handles SUCCESS', () => {
    const listName = 'fooList',
      listItems = ['itemA', 'itemB'];

    expect(
      mutations[LIST_LOAD_SUCCESS]({}, {listName, listItems})
    ).to.deep.eql({
      [listName]: {
        isLoading: false,
        error: null,
        items: listItems
      }
    });
  });

  it('handles FAIL', () => {
    const listName = 'fooList',
      error = new Error('something went wrong');

    expect(
      mutations[LIST_LOAD_FAIL]({}, {listName, error})
    ).to.deep.eql({
      [listName]: {
        isLoading: false,
        error: {
          object: error,
          message: error.message
        },
        items: []
      }
    });
  });



});
