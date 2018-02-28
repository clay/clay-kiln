import _ from 'lodash';

function createField (schema,state) {
  const variationField = {
    _has: {
      input: 'select',
      options: [
        //add options here
      ]
    }
  };
  // TODO: add warning about existing variaiton field
  _.assign(schema.variation, variationField);
}



function addField () {
  if (!_.has(schema, '_groups')) {
    _.set(schema, '_groups', {
      settings: {
        fields: ['variation']
      }
    });
  }

  if (!_.has(schema._group, 'settings')) {
    _.set(schema, '_groups.settings', {
      fields: ['variation']
    });
  }
}
