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
  let listItemKeys, testItemKeys;

  const tester = _.head(items),
    index = _.findIndex(items, function (item) {
      if (_.isString(tester) && _.isString(testItem) && !testProperty) {
        // match strings
        return item === testItem;
      } else if (testProperty && _.isString(testItem)) {
        // match testItem against a single property
        return item[testProperty] === testItem;
      } else if (!_.isString(tester) && _.isObject(testItem) ) {
        // match objects
        listItemKeys = _.keys(_.head(items)).sort();
        testItemKeys = _.keys(testItem).sort();

        if (_.isEqual(listItemKeys, testItemKeys)) {
          return _.isEqual(item, testItem);
        } else {
          log.error('The item you are looking for does not have the same object structure as the items in the list.', {action: 'modifyList'});
        }
      } else {
        log.error('The item you are looking for does not have the same data structure as the items in the list.', {action: 'modifyList'});
      };
    });

  return index;
}

/**
 * @param {array} items
 * @param {string | object} deletedItem
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
