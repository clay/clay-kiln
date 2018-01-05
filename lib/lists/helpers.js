import _ from 'lodash';
import logger from '../utils/log';

const log = logger(__filename);

/**
 * Get the format of the items in a list
 * @param {array} item
 * @returns {string}
 */

function getFormat(items) {
  const tester = _.head(items);

  if (_.isString(tester)) {
    return 'STRING';
  } else if (_.has(tester,'text')) {
    return 'OBJECT';
  } else {
    log.error('List cannot be modified because it is not a simple list.', { action: 'modifyList' });
  }
}

/**
 * @param {array} items
 * @param {string} testItem
 * @returns {integer}
 */
export function getItemIndex(items, testItem) {
  // force tester to be a string
  const tester = _.isString(testItem) ? testItem : testItem.text,
    index = _.findIndex(items, function (item) {
      if (getFormat(items) === 'STRING') {
        return item === tester;
      } else {
        return item.text === tester;
      }
    });

  return index;
}

/**
 * @param {array} items
 * @param {string} deletedItem
 * @returns {string}
 */
export function removeListItem(items, deletedItem) {
  const index = getItemIndex(items, deletedItem);

  if (index !== -1 ) {
    items.splice(index, 1);
  } else {
    log.error(`Cannot remove ${deletedItem} because it is not in the list.`, { action: 'modifyList' });
  }

  return items;
}

export function addListItem(items, newItem) {
  const index = getItemIndex(items, newItem);

  // check that the item doesn't already exist in the list
  if (index === -1) {
    items.push(newItem);
  }

  return items;
}
