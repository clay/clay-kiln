import _ from 'lodash';
import { getData, getSchema } from './components';
import { hasBehaviors } from './behaviors2input';
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
 * parse out sections from fields array
 * e.g. fieldName (Section Title)
 * @param  {array} fields
 * @return {object}
 */
export function parseSections(fields) {
  const sectionRegex = /^(\w+)(?:\s?\((.*)\))?$/;

  return _.reduce(fields, (parsed, rawFieldName) => {
    const matches = rawFieldName.match(sectionRegex),
      fieldName = matches && matches[1],
      sectionTitle = matches && matches[2],
      relevantSection = sectionTitle && _.find(parsed.sections, (section) => section.title === sectionTitle),
      // fields without a section title get added to the 'General' section
      generalSection = !sectionTitle && _.find(parsed.sections, (section) => section.title === 'General');

    if (!fieldName) {
      throw new Error(`Cannot parse field name in group: "${rawFieldName}"`);
    }

    // add field name
    parsed.fields.push(fieldName);

    // determine if it goes in a section, then add it to the relevant section
    if (relevantSection) {
      // add it to the relevant section
      relevantSection.fields.push(fieldName);
    } else if (sectionTitle) {
      // create a new section
      parsed.sections.push({
        title: sectionTitle,
        fields: [fieldName]
      });
    } else if (generalSection) {
      // add it to the general section
      generalSection.fields.push(fieldName);
    } else {
      // create the general section
      parsed.sections.push({
        title: 'General',
        fields: [fieldName]
      });
    }

    return parsed;
  }, { fields: [], sections: [] });
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
    const parsed = parseSections(_.get(schema, `${groupsProp}.settings.fields`));

    // get fields in the `settings` group
    return { fields: expandFields(parsed.fields, data), sections: parsed.sections };
  } else {
    // look for all fields with `_display: settings`
    // note: no sections if there isn't a manual settings group
    return {
      fields: _.reduce(schema, (fields, fieldData, fieldName) => {
        if (_.get(fieldData, displayProp) === 'settings') {
          fields[fieldName] = data[fieldName];
        }
        return fields;
      }, {}),
      sections: []
    };
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
  const { fields, sections } = getSettingsFields(data, schema),
    manualSettingsGroup = _.get(schema, `${groupsProp}.settings`) || {},
    settingsSchema = _.assign({}, manualSettingsGroup, { // pull in other props from the settings group, like _placeholder (if they're set)
      fields: Object.keys(fields),
      sections,
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
    field = data && data[path],
    fieldSchema = schema && schema[path],
    isOldAPI = hasBehaviors(path, schema);

  if (!isOldAPI && !_.get(schema, `${path}._componentList`) && !_.get(schema, `${path}._component`)) {
    console.log(`NEW: ${getComponentName(uri)} → ${path}`)
  }

  if (fieldSchema) {
    // get single field
    return { fields: { [path]: field }, schema: fieldSchema };
  } else if (path === 'settings') {
    // get settings fields (from manual 'settings' group, or just all fields with '_display: settings')
    return getSettingsGroup(uri, data, schema);
  } else if (_.has(schema, `${groupsProp}.${path}`)) {
    // get arbitrary group
    let groupSchema = _.get(schema, `${groupsProp}.${path}`),
      parsed = parseSections(groupSchema.fields);

    return { fields: expandFields(parsed.fields, data), schema: _.assign({}, groupSchema, { sections: parsed.sections }) };
  } else {
    throw new Error(`No group or field found at '${path}' (in ${getComponentName(uri)})`);
  }
}
