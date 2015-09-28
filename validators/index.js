// array of all publishing rules, added to global
window.kiln = window.kiln || {}; // create global kiln if it doesn't exist
window.kiln.validators = [];

module.exports = window.kiln.validators;

module.exports.add = function (rule) {
  window.kiln.validators.push(rule);
};
