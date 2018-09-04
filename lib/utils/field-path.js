
/**
 * convert array indices from dot notation to bracket notation
 * @param  {string} path e.g. foo.0.bar
 * @return {string} e.g. foo[0].bar
 */
export function fromDotNotation(path) {
  return path.replace(/\.(\d+)/ig, '[$1]');
}

/**
 * convert array indices from bracket notation to dot notation
 * @param  {string} path e.g. foo[0].bar
 * @return {string} e.g. foo.0.bar
 */
export function toDotNotation(path) {
  return path.replace(/\[(\d+)]/ig, '.$1');
}
