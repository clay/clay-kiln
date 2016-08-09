import 'whatwg-fetch';

module.exports.send = fetch.bind(window); // either polyfill or native, depending on browser
