import { basename, extname } from 'path';

// hash of all validators, added to global
window.kiln = window.kiln || {}; // note: this is here for testing. it should already exist when this file is imported
window.kiln.validators = window.kiln.validators || {};

export function init() {
  // when this is called for the first time, add the built-in validators
  const builtInReq = require.context('./built-in', false, /(?!.*test)\.js$/);

  builtInReq.keys().forEach(function (key) {
    add(basename(key, extname(key)), builtInReq(key));
  });
}

export function add(name, config) {
  // allow overwriting of default validators
  window.kiln.validators[name] = config;
}
