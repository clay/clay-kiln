/**
 * Base-64 encode a string
 *
 * @param {string} str
 * @return {string}
 */
function encode(str) {
  if (typeof str !== 'string') {
    return str;
  }

  const encoder = new TextEncoder();
  const unit8Array = encoder.encode(str);
  let base64Str = window.btoa(String.fromCharCode.apply(null, unit8Array));
  // Add padding equals signs if necessary
  const paddingLength = 4 - (base64Str.length % 4);

  // The presence of equals signs at the end of a base64-encoded string is used for padding,
  // ensuring that the length of the encoded string is a multiple of 4.
  // The Buffer function in Nodejs (server) automatically adds the necessary padding to the encoded string
  // ensuring consistency with the padding behavior of the Buffer function in Node.js.
  base64Str += paddingLength === 4 ? '' : '==='.slice(0, paddingLength);

  return base64Str.replace(/\+/g, '-').replace(/\//g, '_');
}

/**
 * Decode a Base-64 string to UTF-8
 *
 * @param {string} str
 * @return {string}
 */
function decode(str) {
  if (typeof str !== 'string') {
    return str;
  }

  // We replace the URL-safe characters "-" and "_" back to their original base64
  // counterparts ("+" and "/") using the replace method.
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Then, we use window.atob to decode the base64-encoded string.
  const rawData = window.atob(base64);
  // Next, we convert the decoded string to a Uint8Array by iterating over each
  // character and assigning its corresponding char code.
  const uint8Array = new Uint8Array(rawData.length);

  uint8Array.forEach((_, i) => {
    uint8Array[i] = rawData.charCodeAt(i);
  });

  // Finally, we create a TextDecoder with UTF-8 encoding and use it to decode the Uint8Array back to a string
  // to handle non-Latin1 characters in a base64-decoded string without using deprecated functions.
  const decoder = new TextDecoder('utf-8');
  const decodedData = decoder.decode(uint8Array);

  return decodedData;
}

module.exports.encode = encode;
module.exports.decode = decode;
