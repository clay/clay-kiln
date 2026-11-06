import _ from 'lodash';

/**
 * What someone typed that didn't make it into the page (someone else took the
 * field over while they were away) is never simply gone: the notice telling
 * them has a button that copies it.
 */

/**
 * @param {string} html a field's value
 * @returns {string} its text
 */
export function plainText(html) {
  const doc = new DOMParser().parseFromString(`<body>${String(html).replace(/<br\s*\/?>/gi, '\n')}</body>`, 'text/html');

  return doc.body.textContent.trim();
}

/**
 * Copy with a hidden text area (browsers without the clipboard API, or when it's refused).
 * @param {string} text
 * @returns {Promise}
 */
function copyWithSelection(text) {
  const area = document.createElement('textarea');
  let copied = false;

  area.value = text;
  area.setAttribute('readonly', '');
  area.style.position = 'fixed';
  area.style.opacity = '0';
  document.body.appendChild(area);
  area.select();
  try {
    copied = typeof document.execCommand === 'function' && document.execCommand('copy');
  } catch (e) {
    copied = false;
  }
  document.body.removeChild(area);

  return copied ? Promise.resolve() : Promise.reject(new Error('Could not copy'));
}

/**
 * Put field values on the clipboard: formatted where the browser allows it
 * (pasting back into a kiln field keeps bold, links…), plain text otherwise.
 * @param {string[]} values
 * @returns {Promise}
 */
export function copyToClipboard(values) {
  const html = values.join('<br><br>'),
    plain = _.map(values, plainText).join('\n\n');

  if (navigator.clipboard && navigator.clipboard.write && window.ClipboardItem) {
    return navigator.clipboard.write([new window.ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plain], { type: 'text/plain' })
    })]).catch(() => copyWithSelection(plain));
  }

  return copyWithSelection(plain);
}

/**
 * A notice with a button that copies what the user had typed (when there's
 * any text to copy).
 * @param {object} store
 * @param {string} message
 * @param {object} typed field -> value the user had typed
 * @returns {object|string} showSnackbar config
 */
export function withCopy(store, message, typed) {
  const texts = _.filter(_.values(typed), value => _.isString(value) && !!plainText(value));

  if (!texts.length) {
    return message;
  }

  return {
    message,
    action: 'Copy your text',
    actionDuration: 20000,
    onActionClick: () => copyToClipboard(texts).then(
      () => store.dispatch('showSnackbar', 'Copied'),
      () => store.dispatch('showSnackbar', 'Couldn\'t copy your text')
    )
  };
}
