// some little helpers to make writing validators easier
/**
 * get the text to preview
 * @param  {string} text  without htmltags
 * @param  {number} index of the matched string
 * @param {number} length of the matched string
 * @return {string}
 */
export function getPreviewText(text, index, length) {
  const cutStart = 20,
    cutEnd = 20; // don't add ellipses if we're this close to the start or end

  let previewText = text,
    endIndex = index;

  if (index > cutStart) {
    previewText = `…${text.substr(index - cutStart)}`;
    endIndex = index - (index - cutStart) + 1;
  }

  if (previewText.length > endIndex + cutEnd) {
    previewText = `${previewText.substr(0, endIndex + cutEnd + length)}…`;
  }

  return previewText;
}
