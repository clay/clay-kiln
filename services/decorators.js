var _ = require('lodash'),
  edit = require('./edit'),
  decorators = [
    require('./placeholder'),
    require('./focus')
  ];

/**
 * get the schema, then run through the decorators
 * @param {Element} el
 * @param {{ ref: string, path: string }} options
 * @returns {Promise}
 */
function decorate(el, options) {
  return edit.getData(options.ref).then(function (data) {
    options.data = _.get(data, options.path);

    return _.map(decorators, function (decorator) {
      if (decorator.when(el, options)) {
        return decorator.handler(el, options);
      }
    });
  });
}

/**
 * add a new decorator
 * @param {{ when: function, handler: function }} newDecorator
 */
function addDecorator(newDecorator) {
  if (!newDecorator || !_.isFunction(newDecorator.when) || !_.isFunction(newDecorator.handler)) {
    throw new Error('New decorator must have .when and .handler methods!');
  } else {
    decorators.push(newDecorator);
  }
}

module.exports = decorate;
module.exports.add = addDecorator;
