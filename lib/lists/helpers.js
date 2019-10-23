import _ from 'lodash';
import logger from '../utils/log';

const log = logger(__filename);

/**
 * @param {array} items
 * @param {string | object} testItem
 * @param {string} testProperty (optional)
 * @returns {array}
 */
export function addListItem(items, testItem) {
  const index = getItemIndex(items, testItem);

  if (index !== -1) {
    log.info('This item already exists in this list.', { action: 'modifyList' });

    return items;
  } else {
    items.push(testItem);

    return items;
  }
}

/**
* check that item in a list have a property that is a string or number 0 and then return that property
* @param {array} items
* @param {string} testProperty
* @returns {boolean}
*/
export function getProp(items, testProperty) {
  const tester = _.head(items),
    propValue = _.get(tester, testProperty);

  return (propValue || _.isNumber(propValue)) && !_.isObject(propValue) ? testProperty : null;
}

/**
 * @param {array} items
 * @param {string | object} testItem
 * @param {string} testProperty (optional)
 * @returns {integer}
 */
export function getItemIndex(items, testItem, testProperty) {
  let listItemKeys,
    testItemKeys,
    index,
    matchObjects;

  const tester = _.head(items);

  if (_.isString(tester) && _.isObject(testItem)
      || _.isObject(tester) && _.isString(testItem) && !testProperty) {
    log.error('The item you are looking for does not have the same data structure as the items in the list.', { action: 'modifyList' });

    return false;
  }

  if (_.isObject(tester) && _.isObject(testItem)) {
    listItemKeys = _.keys(tester).sort();
    testItemKeys = _.keys(testItem).sort();

    if (!_.isEqual(listItemKeys, testItemKeys)) {
      log.error('The item you are looking for does not have the same object structure as the items in the list.', { action: 'modifyList' });

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

  if (index !== -1) {
    items.splice(index, 1);
  } else {
    log.error(`Cannot remove ${deletedItem} because it is not in the list.`, { action: 'modifyList' });
  }

  return items;
}

/**
 * when fetching or updating pages, make sure they're sorted
 * note: this will also place them into a General category if they don't currently have categories
 * @param  {array} items
 * @return {array}
 */
export function sortPages(items) {
  if (!items || !_.isObject(_.head(items)) || !_.head(items).children) {
    // no categories, so put all pages in a General category before rendering them
    items = [{
      id: 'general',
      title: 'General',
      children: _.sortBy(items, ['title', 'id'])
    }];
  } else {
    // categories are already set up, so sort them and their children
    // note: we're doing this every time to take into account bootstraps and manual changes to the new-pages list
    items = _.sortBy(items, ['title', 'id']);
    _.each(items, (item) => {
      item.children = _.sortBy(item.children, ['title', 'id']);
    });
  }

  return items;
}
