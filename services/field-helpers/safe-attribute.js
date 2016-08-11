/**
 *
 * @param {object} obj
 * @returns {string}
 */
function objectToSafeString(obj) {
  return JSON.stringify(obj).replace(/'/g, '\\\'');
}

/**
 *
 * @param {string} str
 * @returns {object}
 */
function safeStringToObject(str) {
  return JSON.parse(str.replace(/\\'/g, '\'') || 'null');
}

/**
 * populate an element's attribute with an object safely converted to a string
 * @param {string} attrName
 * @param {object} obj
 * @returns {string} e.g. `data-somthing='{"a":"it\'s ok"}'`
 */
function writeObjectAsAttr(attrName, obj) {
  return attrName + '=\'' + objectToSafeString(obj) + '\''; // uses single quotes around attribute value
}

/**
 * safely read an element's attribute value that was an object converted to a string
 * @param {Element} el
 * @param {string} attrName
 * @returns {object}
 */
function readAttrObject(el, attrName) {
  return safeStringToObject(el.getAttribute(attrName) || '');
}

module.exports.writeObjectAsAttr = writeObjectAsAttr;
module.exports.readAttrObject = readAttrObject;
