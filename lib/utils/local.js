import _ from 'lodash';
import lf from 'localforage';
import logger from './log';

const log = logger(__filename);

// when using this module for the first time, configure the localforage instance
// note: we're importing all of localForage because it won't let us simply import { config, getItem, setItem }
lf.config({
  name: 'kiln:kiln',
  description: 'Local browser store for Kiln, using localForage'
});

// export these directly from localForage
export function getItem(key) {
  return lf.getItem(key);
}

export function setItem(key, val) {
  return lf.setItem(key, val);
}

/**
 * update counts of items in an array
 * @param  {string} key
 * @param  {object} itemToAdd
 * @param  {string} [itemProp='name'] main property for items to match against
 * @return {Promise}
 */
export function updateArray(key, itemToAdd, itemProp = 'name') {
  return lf.getItem(key)
    .then(oldArray => _.isNull(oldArray) ? [] : oldArray) // if the old array doesn't exist, create it
    .then((oldArray) => {
      // typecheck the stuff we're dealing with, so we can make assumptions below
      if (!_.isArray(oldArray)) {
        throw new Error(`Cannot update array in ${key}, it is actually: ${typeof oldArray}`);
      } else if (!_.isObject(itemToAdd)) {
        throw new Error(`Cannot update array with non-object: ${typeof itemToAdd}`);
      } else {
        return oldArray;
      }
    })
    .then((oldArray) => {
      const index = _.findIndex(oldArray, item => item[itemProp] === itemToAdd[itemProp]);

      if (index > -1) {
        oldArray[index].count++; // item is already in the array, update the count
      } else {
        itemToAdd.count = 1;
        oldArray.push(itemToAdd);
      }

      return oldArray;
    })
    .then(newArray => _.reverse(_.sortBy(newArray, ['count', itemProp]))) // sort items before putting them back into the array (highest count first)
    .then(newArray => lf.setItem(key, newArray))
    .catch((e) => {
      log.error(`Cannot update array in local browser store! ${e.message}`, { action: 'updateArray' });

      return []; // fail gracefully
    });
}
