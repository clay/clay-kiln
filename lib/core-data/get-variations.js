import _ from 'lodash';
import logger from '../utils/log';

const log = logger(__filename);

/**
 * adds a 'componentVariation' field to the components schema. This function
 * is only called from addVariationField(). If there are no component variations
 * , this does not get called.
 *
 * @param {object} schema
 * @param {array} componentVariations
 * @returns {object}
 **/
function addField(schema, componentVariations) {
  // making the assumption that the component variation name is prefixed by the
  // component name and that all variations are designated by the component name
  // followed by an underscore (amphora-html also follows this convention)
  const componentName = componentVariations[0].split('_')[0],
    variations = _.map(componentVariations, function (variant) {
      return {
        name: _.capitalize(variant.split('_')[1]),
        value: variant
      };
    }),
    processedSchema = createSettings(schema);
  let variationField;

  // add a None option. This allows the the user to remove a variation so that
  // the component will go back to its base styles
  variations.unshift({
    name: 'None',
    value: componentName
  });

  variationField = {
    _label: 'Component Variation',
    _has: {
      input: 'select',
      options: variations
    },
    validate: {
      required: true
    }
  };

  if (_.has(processedSchema, 'componentVariation')) {
    return processedSchema;
  } else {
    return _.set(processedSchema, 'componentVariation', variationField);
  }
}

/**
 * update a schema with a settings group if the component does not have one else
 * return the schema unchanged
 *
 * @param {object} schema
 * @returns {object}
**/
function createSettings(schema) {
  let processedSchema = schema;

  if (!_.has(processedSchema, '_groups')) {
    _.set(processedSchema, '_groups', {
      settings: {
        fields: []
      }
    });
    log.debug('Kiln created a settings group to this schema because it was missing.', { action: 'addSettings'});
  }

  return processedSchema;
}

/**
 * add the variation field to the schema if there are variations available for
 * that component. If there is no variations available for the component, return
 * the schema, unchanged
 *
 * @param {object} schema
 * @param {string} componentName
 * @param {object} variations
 * @returns {object}
 **/
function addVariationField(schema, componentName, variations) {
  if (_.has(variations, componentName)) {
    return addField(schema, variations[componentName]);
  } else {
    return schema;
  }
}

/**
 * create a variations section/tab
 *
 * @param {object} parsed - schema fields that have been organized into sections
 * @returns {object}
 **/
function addVariationSection(parsed) {
  const newSectionTitle = parsed.fields.length === 0 ? 'General' : 'Component Variation',
    newParsed = parsed;

  newParsed.fields.push('componentVariation');
  newParsed.sections.push({fields: ['componentVariation'], title: newSectionTitle});

  return newParsed;
}

module.exports.addVariationField = addVariationField;
module.exports.addVariationSection = addVariationSection;

// For testing
module.exports.createSettings = createSettings;
