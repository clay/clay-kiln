import 'whatwg-fetch';

module.exports.send = fetch; // either polyfill or native, depending on browser
