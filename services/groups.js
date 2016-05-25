var _ = require('lodash'),
  references = require('./references'),
  label = require('./label');

/**
 * Given an array of fields, get an array of matching data.
 *
 * @param {array} fields
 * @param {object} data
 * @throws if not given an array
 * @returns {array} expanded
 */
function expandFields(fields, data) {
  if (!_.isArray(fields)) {
    throw new Error('Please provide an array of fields!');
  }

  return _.map(fields, function (field) {
    var expanded = _.get(data, field);

    if (!expanded) {
      throw new Error('Field (' + field + ') doesn\'t exist in the schema!');
    }

    return expanded;
  });
}

/**
  * get fields in the `settings` group
  * Note: If you manually specify a `settings` group, it will override the default behavior
  * This is used to guarantee field order if you need your settings in a specific order
  * Default behavior is to look for all fields with `_display: settings` and generate
  * a group from them (where field order is NOT enforced)
 * @param {object} data
 * @returns {array}
 */
function getSettingsFields(data) {
  var hasManualSettingsGroup = _.has(data, '_schema._groups.settings');

  if (!_.isObject(data) || _.isEmpty(data)) {
    return [];
  } else if (hasManualSettingsGroup) {
    // get fields in the `settings` group
    return expandFields(_.get(data, '_schema._groups.settings.fields'), data);
  } else {
    // look for all fields with `_display: settings`
    return _.reduce(data, function (fields, fieldData) {
      if (_.get(fieldData, '_schema.' + references.displayProperty) === 'settings') {
        fields.push(fieldData);
      }

      return fields;
    }, []);
  }
}

/**
 * Get the settings group (a specially named group)
 * @param {string} ref
 * @param {object} data
 * @returns {{value: array, _schema: {_display: string, _label: string, _name: string}}}
 */
function getSettingsGroup(ref, data) {
  return {
    value: getSettingsFields(data),
    _schema: {
      _display: 'settings',
      _label: label(references.getComponentNameFromReference(ref)) + ' Settings',
      _name: 'settings'
    }
  };
}

/**
 * Get fields from a component's data
 *
 * @param {string} ref
 * @param {object} data
 * @param {string} [path]
 * @throws Error when path is not empty, and also does not match a group or field
 * @returns {object}
 */
function get(ref, data, path) {
  var field = data[path];

  if (field) {
    return field;
  } else if (!path) {
    return getSettingsGroup(ref, data);
  } else {
    throw new Error('No group or field found at "' + path + '"');
  }
}

module.exports.expandFields = expandFields;
module.exports.getSettingsFields = getSettingsFields;
module.exports.get = get;
