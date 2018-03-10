import _ from 'lodash';
import logger from '../utils/log';

const log = logger(__filename);

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

function hasVariations(variations, componentName) {
  return _.has(variations, componentName);
}

function addVariationField(schema, componentName, variations) {
  if (hasVariations(variations, componentName)) {
    return addField(schema, variations[componentName]);
  } else {
    return schema;
  }
}

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
