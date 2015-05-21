'use strict';
var _ = require('lodash'),
  references = require('./references');

/**
 * get label
 * if _label exists, use it
 * else get the name of the field/group, prettified
 * e.g. "title.social" would become "Title » Social"
 * @param  {string} name     
 * @param  {{}} schema 
 * @return {string}          
 */
module.exports = function (name, schema) {
  schema = schema || {};
  
  var possibleLabelText = schema[references.labelProperty];

  if (typeof possibleLabelText === 'string') {
    return possibleLabelText;
  } else {
    return name.split('.').map(_.startCase).join(' » ');
  }
};