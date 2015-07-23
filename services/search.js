/**
 * If the number were to be inserted into the block, get the index where it would be inserted.
 *
 * NOTE: block is assumed to be in ascending order.
 *
 * @param {[number]} list
 * @param {number} value
 * @returns {number}
 */
function getBinarySortedInsertPosition(list, value) {
  var midpoint, midValue,
    high = list.length - 1,
    low = 0;

  while (low <= high) {
    midpoint = low + (high - low >> 1);
    midValue = list[midpoint];

    if (midValue < value) {
      low = midpoint + 1;
    } else if (midValue > value) {
      high = midpoint - 1;
    } else {
      return midpoint;
    }
  }
  return low;
}

module.exports.getBinarySortedInsertPosition = getBinarySortedInsertPosition;
