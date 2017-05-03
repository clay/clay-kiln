import _ from 'lodash';
import { postJSON } from '../core-data/api';
import { UPDATE_PAGE_LIST_DATA } from './mutationTypes';

/**
 * update page list with data provided from pubsub
 * @param  {object} store
 * @param  {object} data
 * @return {Promise}
 */
export function updatePageList(store, data) {
  const prefix = _.get(store, 'state.site.prefix'),
    uri = _.get(store, 'state.page.uri');

  let title = _.get(store, 'state.page.listData.title'),
    authors = _.get(store, 'state.page.listData.authors'),
    updateTime = new Date();

  if (data.title) {
    title = data.title;
    store.commit(UPDATE_PAGE_LIST_DATA, { title });
  }

  if (data.authors) {
    authors = data.authors;
    store.commit(UPDATE_PAGE_LIST_DATA, { authors });
  }

  return postJSON(`${prefix}/_pagelist`, {
    url: uri,
    value: {
      title,
      authors,
      updateTime
    }
  });
}
