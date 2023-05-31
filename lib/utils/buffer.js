// The reason for this library is to use something that is not maintained by us.
// Some of the functions that were used in the browser to encode/decode
// are or have been deprecated over time. This ensures a little bit more reliability.
import { encode, decode } from 'js-base64';

module.exports.encode = encode;
module.exports.decode = decode;
