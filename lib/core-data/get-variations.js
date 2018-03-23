import _ from 'lodash';
import logger from '../utils/log';

const log = logger(__filename);

/**
 * adds a 'componentVariation' field to the components schema
 * @param {object} schema
 * @param {array} componentVariations
 * @returns {object}
 **/
function addField(schema, componentVariations) {
  const variations = _.map(componentVariations, function (variant) {
      return {
        name: _.capitalize(variant.split('_')[1]),
        value: variant
      };
    }),
    variationField = {
      _label: 'Component Variation',
      _has: {
        input: 'select',
        options: variations
      },
      validate: {
        required: true
      }
    },
    processedSchema = createSettings(schema);

  if (_.has(processedSchema, 'componentVariation')) {
    return processedSchema;
  } else {
    return _.set(processedSchema, 'componentVariation', variationField);
  }
}

/**
 * update a scheme with a settings group if the component does not have one
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
 * that component
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
