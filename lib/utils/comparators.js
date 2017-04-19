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
  if (_.isArray(val) || _.isObject(val)) {
    return _.isEmpty(val);
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
