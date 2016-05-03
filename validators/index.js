// array of all publishing rules, added to global
window.kiln = window.kiln || {}; // create global kiln if it doesn't exist
window.kiln.validators = window.kiln.validators || { errors: [], warnings: [] }; // create global validators if they don't exist

module.exports = window.kiln.validators; // export them to use in other services

module.exports.addError = function (rule) {
  window.kiln.validators.errors.push(rule);
};

module.exports.addWarning = function (rule) {
  window.kiln.validators.warnings.push(rule);
};
