import _ from 'lodash';
// TODO: should i just import the store???

export function isItemString (items) {
  const tester = _.head(items);

  return _.isString(tester);
  // check if it's a string or object via first object in list
  // if its an object , deep clone an item (?) to get  the data format
  // but how do i know which string is which?
  // looks like simple list is just getting text?
  // should I assume it's just the text property, if it's just simple-list right?
}

export function getItems (listName, lists) {
  const items = _.get(lists, `${listName}.items`);
  let promise;

  if (items) {
    promise = Promise.resolve(items);
  } else {
    promise = this.$store.dispatch('getList', listName).then(() => _.get(lists, `${listName}.items`));
  }

  return promise;
}

export function getItemIndex (items, testItem) {
  // TODO: add warning if the item object doesn't match the tester item
  const index = _.findIndex(items, function (item) {
    if (isItemString(items)) {
      return item === testItem;
    } else {
      // use json.stringify
    }
  });
  return index;
}

export function removeListItem (items, deletedItem) {
  const index = getItemIndex(items, deletedItem);

  items.splice(index, 1);

  return items;
}

export function addListItem (items, newItem) {
  const index = getItemIndex(items, newItem);

  //check that the item doesn't already exist in the list
  if (index === -1) {
    items.push(newItem)
  }

  return items;
}

