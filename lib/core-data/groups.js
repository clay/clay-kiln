import _ from 'lodash';
import store from './store';
import { getData, getSchema } from './components';
import { groupsProp, labelProp, pagesRoute, getComponentName } from '../utils/references';
import label from '../utils/label';
import { addVariationField, addVariationSection } from './get-variations';

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
 * Get fields from a component's data
 *
 * @param {string} uri
 * @param {string} path to field or group
 * @returns {object}
 */
export function get(uri, path) {
  let parsed;
  // get the data and schema of either a page or component
  const { data, schema } = uri.includes(pagesRoute) ?
      _getPageDataSchema() :
      _getComponentDataSchema(),
    field = data && data[path],
    fieldSchema = schema && schema[path];

  // field || fieldSchema || throw new Error('no field or no schema')

  // Return the fields and schema of the component
  // logic below branches based on determining
  // property type (property | group | group member)

  // handle single property on on schema
  if (_isProperty(schema, path)) {

    // console.log('is roperty');
    return {
      fields: { [path]: field },
      schema: fieldSchema
    };
  }

  // handle group member property
  if (_isGroupMember(path)) {
    return {
      fields: {},
      schema: fieldSchema,
    };
  }

  // console.log(_groupSchema(schema, path));

  // handle group
  if (_isGroup(schema, path)) {

    // console.log('is group');
    const groupSchema = _groupSchema(schema, path),
      // override any manual _label in the settings group
      // (they ususally don't have one) for consistency
      groupLabel = path === 'settings' && label(getComponentName(uri) + ' Settings') ||
        groupSchema[labelProp] ||
        label(path);

    parsed = parseSections(groupSchema.fields);

    // create a variations section/tab
    if (path === 'settings' &&
      _.has(schema, 'componentVariation') &&
      !_.has(parsed.fields, 'componentVariation')) {

      parsed = addVariationSection(parsed);

      return {
        fields: expandFields(parsed.fields, data),
        schema: Object.assign({}, groupSchema, {
          sections: parsed.sections,
          [labelProp]: groupLabel
        })
      };
    }
  }

  // handle single member on group
  // if (_isGroupMember(schema, path)) {
  //   return fields:
  //   schema: Object.assign({}, groupSchema, {

  //   })
  // }


  // Handle single member of group

  /*
  try {
    // Group
    if (_isGroup(schema, path) {
      let groupSchema = schema[`${groupsProp}.${path}`],
        parsed = parseSections(groupSchema.fields),

        // override any manual _label in the settings group (they ususally don't have one) for consistency
        groupLabel = path === 'settings' && label(getComponentName(uri) + ' Settings') ||
          groupSchema[labelProp] ||
          label(path);

      // ?????
      if (path === 'settings' && _.has(schema, 'componentVariation') && !_.has(parsed.fields, 'componentVariation')) {
        parsed = addVariationSection(parsed);
      }

      return {
        fields: expandFields(parsed.fields, data),
        schema: Object.assign({}, groupSchema, {
          sections: parsed.sections,
          [labelProp]: groupLabel
        })
      };
    }
  } catch (e) {

    console.log('///////');
    console.log(path);
    console.log(schema);
  }
  */

  console.log(path, schema);

  console.log('could not get data type');

  return {
    fields: [],
    schema: {},
  };

  /*

    if (fieldSchema) {
      // get single field
      return { fields: { [path]: field }, schema: fieldSchema };
    } else if (_.has(schema, `${groupsProp}.${path}`)) {
      // get arbitrary group
      let groupSchema = _.get(schema, `${groupsProp}.${path}`),
        parsed = parseSections(groupSchema.fields),
        // override any manual _label in the settings group (they ususally don't have one) for consistency
        groupLabel = path === 'settings' && label(getComponentName(uri) + ' Settings') || groupSchema[labelProp] || label(path);

      if (path === 'settings' && _.has(schema, 'componentVariation') && !_.has(parsed.fields, 'componentVariation')) {
        parsed = addVariationSection(parsed);
      }

      return { fields: expandFields(parsed.fields, data), schema: _.assign({}, groupSchema, { sections: parsed.sections, [labelProp]: groupLabel }) };
    } else {
      throw new Error(`No group or field found at '${path}' (in ${getComponentName(uri)})`);
    }
    */

  /*
  if (_.includes(uri, pagesRoute)) {
    // if the uri points to a page, we need to grab the schema from the layout
    // and the data from the page itself
    data = _.get(store, 'state.page.data');
    schema = getSchema(data.layout);
  } else {
    // if the uri points to a component, grab both data and schema from that component
    data = getData(uri);
    schema = addVariationField(getSchema(uri), getComponentName(uri), _.get(store, 'state.componentVariations'));
  }
  */



  /*
  field = data && data[path];
  fieldSchema = schema && schema[path];



  if (fieldSchema) {
    // get single field
    return { fields: { [path]: field }, schema: fieldSchema };
  } else if (_.has(schema, `${groupsProp}.${path}`)) {
    // get arbitrary group
    let groupSchema = _.get(schema, `${groupsProp}.${path}`),
      parsed = parseSections(groupSchema.fields),
      // override any manual _label in the settings group (they ususally don't have one) for consistency
      groupLabel = path === 'settings' && label(getComponentName(uri) + ' Settings') || groupSchema[labelProp] || label(path);

    if (path === 'settings' && _.has(schema, 'componentVariation') && !_.has(parsed.fields, 'componentVariation')) {
      parsed = addVariationSection(parsed);
    }

    return { fields: expandFields(parsed.fields, data), schema: _.assign({}, groupSchema, { sections: parsed.sections, [labelProp]: groupLabel }) };
  } else {
    throw new Error(`No group or field found at '${path}' (in ${getComponentName(uri)})`);
  }


  // get here
  return {
    fields,
    schema,
  };
  */

  // get schema given a path
  // if an array, get the value before the index
  function _groupSchema(schema, path) {
    return _.get(schema, `${groupsProp}.${path}`, null);
  }

  function _isProperty(schema = {}, prop = '') {
    return schema.hasOwnProperty(prop);
  }


  function _isGroup(schema = {}, path = '') {
    return _.has(schema, `${groupsProp}.${path}`);
  }

  function _isGroupMember(prop = '') {
    return !!prop.match(/\[.[0 - 9]?\]/);
  }

  function _getComponentDataSchema() {
    return {
      data: getData(uri),
      schema: addVariationField(
        getSchema(uri),
        getComponentName(uri),
        _.get(store, 'state.componentVariations')
      ),
    };
  }

  function _getPageDataSchema() {

    return {
      data: _.get(store, 'state.page.data'),
      schema: getSchema(data.layout),
    };
  }
}

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
