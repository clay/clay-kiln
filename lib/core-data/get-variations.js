import _ from 'lodash';
import logger from '../utils/log';

const log = logger(__filename);

/*
 * adds a 'componentVariation' field to the components schema
 * @param {schema} object
 * @param {componentVariations} array
 * @returns {object}
 */
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

/*
 * create a settings group if the component does not have one
 * @param {schema} object
 * @returns {object}
 */
function createSettings(schema) {
  let processedSchema = schema;

  if (!_.has(processedSchema, '_groups')) {
    _.set(processedSchema, '_groups', {
      settings: {
        fields: []
      }
    });
    log.info('Kiln created a settings group to this schema because it was missing.', { action: 'addSettings'});
  }

  return processedSchema;
}

/*
 * create a settings group if the component does not have one
 * @param {variations} object
 * @param {componentName} string
 * @returns {boolean}
 */
function hasVariations(variations, componentName) {
  return _.has(variations, componentName);
}

/*
 * add the variation field to the schema if there are variations available for
 * that component
 * @param {schema} object
 * @param {componentName} string
 * @param {variations} object
 * @returns {object}
 */
function addVariationField(schema, componentName, variations) {
  if (hasVariations(variations, componentName)) {
    return addField(schema, variations[componentName]);
  } else {
    return schema;
  }
}

/*
 * create a settings group if the component does not have one
 * @param {schema} object
 * @returns {object}
 */
function addVariationSection(sections) {
  const newSectionTitle = sections.fields.length === 0 ? 'General' : 'Component Variation';
  let newSections = sections;

  newSections.fields.push('componentVariation');
  newSections.sections.push({fields: ['componentVariation'], title: newSectionTitle});

  return newSections;
}

module.exports.addVariationField = addVariationField;
module.exports.addVariationSection = addVariationSection;

// For testing
module.exports.createSettings = createSettings;
module.exports.hasVariations = hasVariations;
