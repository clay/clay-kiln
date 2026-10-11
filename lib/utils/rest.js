import 'whatwg-fetch';

// either polyfill or native, depending on browser
export const send = fetch.bind(window);

// some callers import the module as a whole (`import rest from` + `rest.send`),
// others import `send` by name; webpack let this file use module.exports for both
export default { send };
