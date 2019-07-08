import _ from 'lodash';
import store from '../../lib/core-data/store';
import { postJSON, getJSON } from '../../lib/core-data/api';
import { searchRoute, usersRoute } from '../utils/references';

/**
 * Makes a query to get the users full data object from Elastic
 * @param {string[]} usersIds to stub for testing
 * @returns {Promise<Object[]>}
 */
export function getUsersData(usersIds) {
  const prefix = _.get(store, 'state.site.prefix'),
    usersQuery = {
      index: 'users',
      body: {
        size: usersIds.length,
        query: {
          ids: {
            type: '_doc',
            values: usersIds
          }
        }
      }
    };

  return postJSON(prefix + searchRoute, usersQuery)
    .then((response) => {
      const usersDocs = _.get(response, 'hits.hits') || [],
        usersData = _.map(usersDocs, (userDoc) => {
          const id = generateUserUri(userDoc._source);

          delete userDoc._ref;

          return { id, ...userDoc._source };
        });

      return usersData;
    });
}

/**
 * GETs the data for a single user from `_users`
 * @param {string} userId
 * @returns {Object}
 */
export function getSingleUser(userId) {
  const prefix = _.get(store, 'state.site.prefix'),
    protocol = _.get(store, 'state.site.protocol');

  return getJSON(`${protocol}://${prefix}${usersRoute}${userId}`);
}

/**
 * Generates the user URI based on the username and provider.
 * @param {Object} userObject
 * @returns {string}
 */
export function generateUserUri(userObject) {
  return btoa(`${userObject.username}@${userObject.provider}`);
}

export function decodeUserUri(userUri) {
  const userData = atob(userUri).split('@');

  return {
    username: `${userData[0]}@${userData[1]}`,
    provider: userData[2]
  };
}
