import _ from 'lodash';
import logger from '../utils/log';

const log = logger(__filename);

/**
 * @param {array} items
 * @param {string | object} testItem
 * @param {string} testProperty (optional)
 * @returns {integer}
 */
export function getItemIndex(items, testItem, testProperty) {
  let listItemKeys, testItemKeys, index, matchObjects;

  const tester = _.head(items);

  if (_.isString(tester) && _.isObject(testItem) ||
      _.isObject(tester) && _.isString(testItem) && !testProperty) {
    log.error('The item you are looking for does not have the same data structure as the items in the list.', {action: 'modifyList'});
    return false;
  }

  if (_.isObject(tester) && _.isObject(testItem)) {
    listItemKeys = _.keys(_.head(items)).sort();
    testItemKeys = _.keys(testItem).sort();

    if (!_.isEqual(listItemKeys, testItemKeys)) {
      log.error('The item you are looking for does not have the same object structure as the items in the list.', {action: 'modifyList'});
      return false;
    } else {
      matchObjects = true;
    }
  }

  index = _.findIndex(items, function (item) {
    if (_.isString(tester) && _.isString(testItem) && !testProperty) {
      // match strings
      return item === testItem;
    } else if (testProperty && _.isString(testItem)) {
      // match testItem against a single property
      return item[testProperty] === testItem;
    } else if (matchObjects) {
      // match objects
      return _.isEqual(item, testItem);
    };
  });

  return index;
}

/**
 * @param {array} items
 * @param {string | object} deletedItem
 * @param {string} testProperty (optional)
 * @returns {string}
 */
export function removeListItem(items, deletedItem, testProperty) {
  let index;

  if (testProperty) {
    index = getItemIndex(items, deletedItem, testProperty);
  } else {
    index = getItemIndex(items, deletedItem);
  }

  if (index !== -1 ) {
    items.splice(index, 1);
  } else {
    log.error(`Cannot remove ${deletedItem} because it is not in the list.`, { action: 'modifyList' });
  }

  return items;
}
