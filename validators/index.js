// array of all publishing rules, added to global
window.kiln = window.kiln || {}; // create global kiln if it doesn't exist
window.kiln.validators = [];

module.exports = [
  require('./ban-tk'),
  require('./required'),
  require('./soft-maxlength')
];
