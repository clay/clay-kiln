import _ from 'lodash';
import store from './store';
import { getData, getSchema } from './components';
import { groupsProp, labelProp, pagesRoute, getComponentName } from '../utils/references';
import label from '../utils/label';
import { addVariationField, addVariationSection } from './get-variations';

// TODO: This file needs a description.
// Some explanation about what these funcitons have in common would be helpful
// What does "Group" mean in this context?
// It's not a defined term and this method Get does not return a "Group" as far as I can tell.

// fields needs to be defined in a @typedef somewhere.

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


// TODO: This funciton needs a better name. parseSections doesn't mean anything to me.
// What's a section? (@typedef would help here.) If it's "parsing" sections,
// shouldn't its argument be sections?
// why is this function exported?
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

// TODO: This function returns an object with two properties: fields and schema.
// Is that what we're callling a group? whatever it is, @typedef it
// TODO: this funciton's logic is very forked.
// Should be refactored as a factory method or something


/**
 * Decorate a
 * @param {Schema} schema
 * @param {string} path
 * @return {object.Fields}
 * @return {object.Schema}
 */
function groupSchema(schema, path, componentName) {
  if (!schema) return null;

  // get sections & fields
  // add the sections object
  // add componentVariations key
  const { fields, sections } = overrideVariations(parseSections(schema));

  return {
    fields: expandFields(parsed.fields, data),
    schema: Object.assign(
      schema,
      { sections },
      { [labelProp]: writeLabel() },
      {})
  };

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
 * @returns {FieldSet}
 */
export function get(uri, path) {

  // Conditionally assign data and schema vars
  // These can either be derived from a lookup direclty on the layout
  //  or from component data
  if (uri.includes(pagesRoute)) {
    const { data, schema } = getPageData(...arguments);
  } else {
    const { data, schema } = getComponentData(...arguments);
  }

  // error if missing data or schema
  if (_.isEmpty(data) || _.isEmpty(schema)) {
    console.error(`failed to get ${path} at ${uri}: 
      missing ${_.isEmpty(data) ? 'data' : 'schema'}`);
    return null;
  }

  // return an {fields, schema} object
  // if the path can't be found on the schema, look for it on the _groups property
  // otherwise, warn and return null
  if (schema[path]) {
    return {
      fields: { [path]: data[path] },
      schema: schema[path]
    };
  } else if (groupsAddress()) {
    return groupSchema(groupsAddress(), path, getComponentName(uri));
  } else {
    console.warn('could not ');
    return null;
  }

  // get path's address on the schema's goupsProp (_groups)
  function groupsAddress() {
    return _.get(schema, `${groupsProp}.${path}`, null);
  }

  // get data/schema from component uri
  function getComponentData() {

    return {
      data: getData(uri),
      schema: addVariationField(
        getSchema(uri),
        getComponentName(uri),
        _.get(store, 'state.componentVariations')
      )
    };
  }

  // get data/schema from layout uri
  function getPageData() {

    const data = _.get(store, 'state.page.data'),
      schema = getSchema(data.layout);

    return {
      data,
      schema,
    };
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
