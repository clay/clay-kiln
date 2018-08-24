import _ from 'lodash';
import store from './store';
import { getData, getSchema } from './components';
import { groupsProp, labelProp, pagesRoute, getComponentName } from '../utils/references';
import label from '../utils/label';
import { addVariationField, addVariationSection } from './get-variations';


/**
 * A set of fields and corresponding schema against which to validate
 * TODO: verify this info
 * @typedef {object} FieldSet
 * @property {array.Field} fields form fields and corresponding info
 * @param {Schema} schema
 */

/**
 * TODO: figure out what this is, exactly
 * @typedef {object} Field
 */

/** f
 * Schema against which to verify input data
 * TODO: verify this info
 * TODO: flesh this out
 * @typedef {object} Schema
 */

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
 * Create a new fieldset
 * @param {object} data data associated with object
 * @param {Schema} schema
 * @param {string} path object literal path of the property on the data
 * TODO: verify
 * @param {string} componentName
 * @return {FieldSet}
 */
function newFieldSet(data, schema, path = '', componentName = '') {

  // require first three args
  if (!schema || !data || !path) return null;

  // if path is a property of schema and data
  // return a FieldSet with the data on fields, and the corresponding part of the schema
  if (schema[path] && data[path]) {
    return {
      fields: { [path]: data[path] },
      schema: schema[path]
    };
  };

  // TODO: handle array

  // look for property on the schema's groupsProp (._group)
  if (groupFields()) {
    let gf = groupFields();

    // get sections & fields
    // add the sections object
    // add componentVariations key
    const { fields, sections } = overrideVariations(parseSections(gf));

    return {
      fields: expandFields(fields, data),
      schema: Object.assign(
        schema,
        { sections },
        { [labelProp]: writeLabel() },
        {})
    };
  }

  // schema._groups... property getter
  // TODO: should schema be data here???
  function groupFields() {
    return _.get(schema, `${groupsProp}.${path}.fields`, null);
  }

  // create a group label
  function writeLabel() {
    return path === 'settings' && label(componentName + ' Settings') ||
      schema[labelProp] ||
      label(path);
  }

  // adds componentVaration key
  function overrideVariations({ fields, sections }) {
    if (path === 'settings' &&
      _.has(schema, 'componentVariation') &&
      !_.has(parsed.fields, 'componentVariation')) {
      return addVariationSection({ fields, sections });
    }
    return { fields, sections };
  }
}

/**
 * Get fields from a component's data
 *
 * @param {string} uri
 * @param {string} path to field or group
 * @return {FieldSet}
 * @throws {Error}
 */
export function get(uri, path) {
  const componentName = getComponentName(uri),

    // Conditionally assign data and schema vars
    // These can either be derived from a lookup direclty on the layout
    //  or from component data
    fieldSet = uri.includes(pagesRoute) ?
      newFieldSetFromPage() :
      newFieldSetFromComponent();

  if (!fieldSet) {
    throw new Error(`No group or field found at '${path}' (in ${getComponentName(uri)})`);
  }
  return fieldSet;

  // return a new FieldSet by grabbing the data/schema from the component uri
  function newFieldSetFromComponent() {
    const schema = addVariationField(
      getSchema(uri),
      componentName,
      _.get(store, 'state.componentVariations')
    );

    return newFieldSet(getData(uri), schema, path, componentName);
  }

  // return a new FieldSet by grabbing the data/schema from the store and layout respectively
  function newFieldSetFromPage() {
    return newFieldSet(
      _.get(store, 'state.page.data'),
      getSchema(data.layout),
      path,
      componentName
    );
  }
};

// TODO: I would really expect get to return an empty set or null if it can't find the thing it is getting
/**
 * check to see if a group exists, failing gracefully if it doesn't
 * @param  {string}  uri
 * @param  {string}  path
 * @return {Boolean}
 */
export function has(uri, path) {
  try {
    get(uri, path); // this will return a field/group or throw an error

    return true;
  } catch (e) {
    return false;
  }
}
