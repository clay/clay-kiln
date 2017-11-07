import striptags from 'striptags';

/**
 * get the number of newlines before the caret,
 * so we can accurately set the caret offset when clicking into multiline wysiwyg fields
 * @param  {string} data
 * @param  {number} offset
 * @return {number}
 */
export function getNewlinesBeforeCaret(data, offset) {
  const text = (data || '').replace(/(<\/p><p>|<br \/>)/ig, '\u00B6'), // convert to ¶ so we have something to count
    plainText = striptags(text);

  let i = 0,
    realOffset = offset;

  // go through each character (up to the real offset),
  // increasing the real offset every time we hit a paragraph
  for (; i <= realOffset; i++) {
    if (plainText[i] === '\u00B6') {
      realOffset++; // also increase the temp offset, since paragraph breaks didn't count in the initial offset
    }
  }

  return realOffset;
}

/**
 * get last offset (caret at the END of some data), when the data has newlines
 * @param {string} data
 * @return {number}
 */
export function getLastOffsetWithNewlines(data) {
  const text = (data || '').replace(/(<\/p><p>|<br \/>|\n)/ig, '\u00B6'), // convert to ¶ so we have something to count
    plainText = striptags(text);

  let i = 0,
    realOffset = plainText.length - 1;

  // go through each character (up to the end of the text),
  // increasing the real offset every time we hit a paragraph
  for (; i <= realOffset; i++) {
    if (plainText[i] === '\u00B6') {
      realOffset++;
    }
  }

  return realOffset;
}
