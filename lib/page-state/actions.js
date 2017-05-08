import _ from 'lodash';
import { postJSON } from '../core-data/api';
import { UPDATE_PAGE_LIST_DATA } from './mutationTypes';

/**
 * update page list with data provided from pubsub
 * note: if called without data, this just updates the updateTime and user
 * (e.g. when saving components in the page)
 * @param  {object} store
 * @param  {object} [data]
 * @return {Promise}
 */
export function updatePageList(store, data = {}) {
  const prefix = _.get(store, 'state.site.prefix'),
    uri = _.get(store, 'state.page.uri');

  let title = _.get(store, 'state.page.listData.title'),
    authors = _.get(store, 'state.page.listData.authors'),
    updateTime = new Date(),
    users = _.get(store, 'state.page.listData.users') || [],
    currentUser = _.get(store, 'state.user.username');

  if (data.title) {
    title = data.title;
  }

  if (data.authors) {
    authors = data.authors;
  }

  if (!_.includes(users, currentUser)) {
    users.push(currentUser);
  }

  store.commit(UPDATE_PAGE_LIST_DATA, { title, authors, updateTime });

  return postJSON(`${prefix}/_pagelist`, {
    url: uri,
    value: {
      title,
      authors,
      updateTime,
      users
    }
  });
}
