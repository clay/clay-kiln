import _ from 'lodash';

const operators = {
  '===': (l, r) => l === r,
  '!==': (l, r) => l !== r,
  '<': (l, r) => l < r,
  '>': (l, r) => l > r,
  '<=': (l, r) => l <= r,
  '>=': (l, r) => l >= r,
  typeof: (l, r) => typeof l == r,
  regex: (l, r) => !!(new RegExp(r)).exec(l),
  empty: (l) => isEmpty(l),
  'not-empty': (l) => !isEmpty(l),
  truthy: (l) => !!l,
  falsy: (l) => !!!l
};

/**
 * determine if a field is empty
 * @param  {*}  val
 * @return {Boolean}
 */
export function isEmpty(val) {
  if (_.isArray(val)) {
    // an array is empty if it has no items, if all of the items are considered empty, or if the item contains props that are considered empty
    // (e.g. complex-list items)
    return _.isEmpty(val) || _.every(val, (item) => _.isObject(item) ? _.every(item, (itemVal) => isEmpty(itemVal)) : isEmpty(item));
  } else if (_.isObject(val)) {
    // an object is empty if it's empty or all its props are falsy (e.g. checkbox-group)
    return _.isEmpty(val) || _.every(val, (prop) => !prop);
  } else if (_.isString(val)) {
    return val.length === 0; // emptystring is empty
  } else if (_.isNull(val) || _.isUndefined(val)) {
    return true; // null and undefined are empty
  } else {
    // numbers, booleans, etc are never empty
    return false;
  }
}

/**
 * compare a field's data to a value
 * @param  {*} data from a field
 * @param  {string} [operator]
 * @param  {*} [value]
 * @return {boolean}
 */
export function compare({ data, operator, value }) {
  if (!operator && value === undefined) {
    // if neither operator or value are specified, default to
    // checking if field has a value
    return !isEmpty(data);
  } else if (!operator) {
    // if no operator, default to equal
    return operators['==='](data, value);
  } else if (operators[operator]) {
    return operators[operator](data, value);
  } else {
    throw new Error(`Unknown operator: ${operator}`);
  }
}
