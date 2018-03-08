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
        options: [variations]
      },
      validate: {
        required: true
      }
    },
    processedSchema = addSettings(schema),
    newField = processedSchema._groups.settings.fields.length > 0 ? 'componentVariation (Component Variations)' : 'componentVariation';

  if (_.has(processedSchema, 'componentVariation')) {
    return processedSchema;
  } else {
    // BUG: THIS LINE CAUSES A VUEX ERROR. DO I NEED TO COMMIT A MUTATION?
    processedSchema._groups.settings.fields.push(newField);
    return _.set(processedSchema, 'componentVariation', variationField);
  }
}

function addSettings(schema) {
  let processedSchema = schema;

  if (!_.has(processedSchema, '_groups')) {
    _.set(processedSchema, '_groups', {
      settings: {
        fields: []
      }
    });
    log.info('Kiln added a settings group to this schema because it was missing.', { action: 'addSettings'});
  }

  return processedSchema;
}

function addVariationField(schema, componentName, variations) {
  if (_.has(variations, componentName)) {
    return addField(schema, variations[componentName]);
  } else {
    return schema;
  }
}

module.exports.addVariationField = addVariationField;

// For testing
module.exports.addSettings = addSettings;
module.exports.addField = addField;
