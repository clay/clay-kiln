import _ from 'lodash';
import { postJSON } from '../core-data/api';
import { UPDATE_PAGE_LIST_DATA } from './mutationTypes';
import { searchRoute } from '../utils/references';

const postPageList = _.debounce(postJSON, 500); // only update the page list every 500ms

/**
 * update page list with data provided from pubsub
 * note: if called without data, this just updates the updateTime and user
 * (e.g. when saving components in the page)
 * @param  {object} store
 * @param  {object} [data]
 */
export function updatePageList(store, data = {}) {
  const prefix = _.get(store, 'state.site.prefix'),
    uri = _.get(store, 'state.page.uri');

  let title = _.get(store, 'state.page.listData.title'),
    authors = _.get(store, 'state.page.listData.authors'),
    updateTime = new Date(),
    users = _.get(store, 'state.page.listData.users') ? _.cloneDeep(_.get(store, 'state.page.listData.users')) : [],
    // always add the update time to the user you're adding to the list.
    // this will allow us to display the list of people who've edited the page, AND the last update timestamp
    currentUser = _.assign({}, _.get(store, 'state.user'), { updateTime }),
    userIndex = _.findIndex(users, (user) => user.username === currentUser.username);

  if (data.title) {
    title = data.title;
  }

  if (data.authors) {
    authors = data.authors;
  }

  if (userIndex === -1) {
    users.push(currentUser);
  } else if (userIndex > -1 && userIndex !== users.length - 1) {
    // if the current user is in the list, but isn't at the end, we should move it to the end
    users.splice(userIndex, 1); // remove user from list
    users.push(currentUser); // and add it to the end
  }

  store.commit(UPDATE_PAGE_LIST_DATA, { title, authors, updateTime, users });

  postPageList(`${prefix}/_pagelist`, {
    url: uri,
    value: {
      title,
      authors,
      updateTime,
      users
    }
  });
}

/**
 * get the list data for a specific page
 * note: if prefix is specified, this does NOT commit the data (only returns it),
 * allowing the preloader to use it when doing the initial preload of data
 * @param {object} store
 * @param  {string} uri
 * @param {string} [prefix] passed in when preloading (e.g. if site isn't in store yet)
 * @return {Promise}
 */
export function getListData(store, { uri, prefix }) {
  const sitePrefix = prefix || _.get(store, 'state.site.prefix');

  let query = {
    index: 'pages',
    type: 'general',
    body: {
      size: 1,
      query: {
        term: {
          uri // match page uri
        }
      }
    }
  };

  return postJSON(sitePrefix + searchRoute, query)
    .then((res) => _.get(res, 'hits.hits[0]._source'))
    .then((rawData = {}) => {
      let listData = _.pick(rawData, ['title', 'authors', 'updateTime', 'publishTime', 'users']);

      if (prefix) {
        return listData; // called by preloader, so it'll do a single big commit with the whole state
      } else {
        // simply commit the data into the store
        store.commit(UPDATE_PAGE_LIST_DATA, listData);
      }
    })
    .catch(() => {
      if (prefix) {
        return {};
      } else {
        store.commit(UPDATE_PAGE_LIST_DATA, {});
      }
    });
}
