/**
 * Turn the text of a CSV file into data for the `csv` input.
 *
 * This replaces csvjson's `toObject()`, the only part of it kiln used. csvjson has an
 * unfixed prototype pollution advisory (in parts kiln never called) and no newer
 * release, so the parsing rules are kept here exactly as they were: the same
 * results for the same file, including its quirks (rows are split on any run of
 * newlines so blank lines vanish, cells are trimmed, missing cells are '', and a
 * backslash escapes a quote inside a quoted cell).
 */

/**
 * trim a cell, and take one pair of surrounding quotes off it
 * @param {*} str
 * @return {string}
 */
function trimQuote(str) {
  if (str) {
    return String(str).trim().replace(/^["|'](.*)["|']$/, '$1');
  }

  return '';
}

/**
 * split a line that contains quotes into cells, keeping delimiters inside quotes
 * note: delimiter and quote go into the regex as they are (not escaped), as in csvjson
 * @param {string} text
 * @param {string} delimit
 * @param {string} quote
 * @return {string[]}
 */
function quotedLineToCells(text, delimit, quote) {
  const value = new RegExp('(?!\\s*$)\\s*(?:' + quote + '([^' + quote + '\\\\]*(?:\\\\[\\S\\s][^' + quote + '\\\\]*)*)' + quote + '|([^' + delimit + quote + '\\s\\\\]*(?:\\s+[^' + delimit + quote + '\\s\\\\]+)*))\\s*(?:' + delimit + '|$)', 'g'),
    cells = [];

  text.replace(value, (match, quoted, bare) => {
    if (quoted !== undefined) {
      cells.push(quoted.replace(/\\'/g, '\''));
    } else if (bare !== undefined) {
      cells.push(bare);
    }

    return '';
  });

  // a trailing delimiter means one more, empty, cell
  if (/,\s*$/.test(text)) {
    cells.push('');
  }

  return cells;
}

/**
 * which character quotes cells: a string is used as it is, true means a double quote
 * @param {*} quote
 * @return {string|null}
 */
function getQuote(quote) {
  if (typeof quote === 'string') {
    return quote;
  }

  return quote === true ? '"' : null;
}

/**
 * split one line into cells
 * @param {string} line
 * @param {string} delimiter
 * @param {string|null} quote
 * @return {string[]}
 */
function lineToCells(line, delimiter, quote) {
  if (!quote) {
    return line.split(delimiter);
  }

  if (line.indexOf(quote) !== -1) {
    return quotedLineToCells(line, delimiter, quote);
  }

  return line.split(delimiter).map(cell => cell.trim());
}

/**
 * convert CSV text to an array of objects, one per row, keyed by the first row
 * @param {string} data the contents of the file
 * @param {object} [opts]
 * @param {string} [opts.delimiter] defaults to a comma
 * @param {string|boolean} [opts.quote] the quote character (true means a double quote); if not set, quotes aren't understood
 * @return {object[]}
 */
export function toObject(data, opts) {
  if (typeof data !== 'string') {
    throw new Error('Invalid input, input data should be a string');
  }

  const options = opts || {},
    delimiter = options.delimiter || ',',
    quote = getQuote(options.quote),
    lines = data.split(/[\n\r]+/ig),
    headers = lineToCells(lines.shift(), delimiter, quote),
    rows = [];

  lines.forEach((line) => {
    if (line) {
      const cells = lineToCells(line, delimiter, quote),
        row = {};

      headers.forEach((header, index) => {
        row[header] = trimQuote(cells[index]);
      });
      rows.push(row);
    }
  });

  return rows;
}
