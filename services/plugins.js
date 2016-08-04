var _ = require('lodash');

// object of plugins, added to global
window.kiln = window.kiln || {}; // create global kiln if it doesn't exist
window.kiln.plugins = window.kiln.plugins || {};

/**
 * initialize all plugins
 * @returns {Promise}
 */
function init() {
  return Promise.all(_.map(window.kiln.plugins, function (fn, name) {
    console.log('init plugin: ' + name);
    return fn(); // note: plugins are currently not initialized with any arguments
  }));
}

function addPlugin(name, fn) {
  if (!name || !fn) {
    throw new Error('Plugins need a name and function!');
  }

  if (!_.isFunction(fn)) {
    throw new Error('Plugin "' + name + '" is not a function!');
  }

  window.kiln.plugins[name] = fn;
}

module.exports.init = init;
module.exports.add = addPlugin;

// testing
module.exports.set = function (value) {
  window.kiln.plugins = value;
};
