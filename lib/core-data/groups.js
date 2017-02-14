import _ from 'lodash';
import { getData, getSchema } from './components';
import { displayProp, groupsProp, labelProp, getComponentName } from '../utils/references';
import label from '../utils/label';

/**
 * Given an array of fields, get an array of matching data.
 *
 * @param {array} fields
 * @param {object} data
 * @throws if not given an array
 * @returns {array} expanded
 */
export function expandFields(fields, data) {
  if (!_.isArray(fields)) {
    throw new Error('Please provide an array of fields!');
  }

  return _.reduce(fields, function (obj, field) {
    const expanded = _.get(data, field) || null;

    obj[field] = expanded;
    return obj;
  }, {});
}

/**
  * get fields in the `settings` group
  * Note: If you manually specify a `settings` group, it will override the default behavior
  * This is used to guarantee field order if you need your settings in a specific order
  * Default behavior is to look for all fields with `_display: settings` and generate
  * a group from them (where field order is NOT enforced)
 * @param {object} data
 * @param {object} schema
 * @returns {object}
 */
export function getSettingsFields(data, schema) {
  const hasManualSettingsGroup = _.has(schema, `${groupsProp}.settings`);

  if (hasManualSettingsGroup) {
    // get fields in the `settings` group
    return expandFields(_.get(schema, `${groupsProp}.settings.fields`), data);
  } else {
    // look for all fields with `_display: settings`
    return _.reduce(data, function (fields, fieldData, fieldName) {
      if (_.get(schema, `${fieldName}.${displayProp}`) === 'settings') {
        fields[fieldName] = fieldData;
      }

      return fields;
    }, {});
  }
}

/**
 * Get the settings group (a specially named group)
 * @param {string} uri
 * @param {object} data
 * @param {object} schema
 * @returns {object}
 */
function getSettingsGroup(uri, data, schema) {
  const fields = getSettingsFields(data, schema),
    manualSettingsGroup = _.get(schema, `${groupsProp}.settings`) || {},
    settingsSchema = _.assign({}, manualSettingsGroup, { // pull in other props from the settings group, like _placeholder (if they're set)
      fields: Object.keys(fields),
      [displayProp]: 'settings',
      [labelProp]: label(getComponentName(uri) + ' Settings') // overrides any manual _label in the settings group
    });

  return {
    fields,
    schema: settingsSchema
  };
}

/**
 * Get fields from a component's data
 *
 * @param {string} uri
 * @param {string} path to field or group
 * @returns {object}
 */
export function get(uri, path) {
  const data = getData(uri),
    schema = getSchema(uri),
    field = data[path],
    fieldSchema = schema[path];

  if (fieldSchema) {
    // get single field
    return { fields: { [path]: field }, schema: fieldSchema };
  } else if (path === 'settings') {
    // get settings fields (from manual 'settings' group, or just all fields with '_display: settings')
    return getSettingsGroup(uri, data, schema);
  } else if (_.has(schema, `${groupsProp}.${path}`)) {
    // get arbitrary group
    let groupSchema = _.get(schema, `${groupsProp}.${path}`);

    return { fields: expandFields(groupSchema.fields, data), schema: groupSchema };
  } else {
    throw new Error(`No group or field found at '${path}' (in ${getComponentName(uri)})`);
  }
}
