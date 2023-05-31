// The reason for this library is to use something that is not maintained by us.
// Some of the functions that were used in the browser to encode/decode
// are or have been deprecated over time. This ensures a little bit more reliability.
// We want to be able to encode non latin chars.
// An example of this is a smart quote ’ -- That value is going to be encoded to `%E2%80%99`.
// We store the actual symbol in our database, not the encoded value, so, when decoding it, we ensure we can get the direct symbol
// and, in consequence, the page we're looking for.
import { encode, decode } from 'js-base64';

module.exports.encode = encode;
module.exports.decode = decode;
