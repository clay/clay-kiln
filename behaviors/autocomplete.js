'use strict';
var _ = require('lodash'),
  dom = require('../services/dom');

/**
 * Find the first child that is a text input.
 * @param {object} el
 * @returns {object|undefined}
 */
function findFirstTextInput(el) {
  
  var inputs = el.querySelectorAll('input'),
    l = inputs.length,
    i = 0,
    type,
    textInput;
  
  while (i < l) {
    type = inputs[i].getAttribute('type');
    if (!type || type === 'text') {
      textInput = inputs[i];
      break;
    }
    i += 1;
  }
  
  return textInput;
}

/**
 * Temporary, until the endpoint is hooked up.
 * @param q
 * @returns {*}
 */
function mockEndpoint(q) {
  if (q.toLowerCase().indexOf('m') === 0) {
    // Names with M
    return JSON.stringify({results:['Morgan', 'Mindy', 'Miguel']});
  } else {
    // Random names
    return JSON.stringify({results:['Amy Koran', 'Zena Strother', 'Karole Herdt', 'Sheila Cowell', 'Josiah Hagaman', 'Beatris Doetsch', 'Zachary Brunell', 'Manuel Grassi', 'Amie Ridgell', 'Lupe Harrill', 'Adriana Bakke', 'Francoise Lashley', 'Gwenn Sampley', 'Randall Coller', 'Terence Villegas', 'Matthew Mcconnaughey', 'Rosella Conroy', 'Gemma Osburn', 'Shanel Holt']});
  }
}


module.exports = function (result, args) {
  
  var existingInput = findFirstTextInput(result.el);
  
  if (existingInput) {
    
    // Add element.
    var datalist = document.createElement('datalist');

    // Set attributes.
    var listName = args.listName || 'list-needs-an-id';
    existingInput.setAttribute('list', listName);
    datalist.id = listName;

    // Add options.
    var options = dom.create(`
      <label>
        or select from the list:
        <select name="${ existingInput.getAttribute('name') }">
          <option value="">
          <option>Bip
          <option>Bop
          <option>Boop
        </select>
      </label>
    `);
    datalist.appendChild(options);
    
    var optionsParent = options.querySelector('select');

    existingInput.addEventListener('input', (function(optionsParent) { 
      return function(e) {
        
        var options = JSON.parse(mockEndpoint(e.target.value)).results.reduce(function(prev, curr) { 
          return prev + '<option>' + curr; 
        }, '<option value="">');
        
        options = dom.create(`${ options }`);

        dom.clearChildren(optionsParent);
        optionsParent.appendChild(options);
      };
    })(optionsParent));

    // Add it back to the result element.
    result.el.appendChild(datalist);
  }
  
  return result;
  
};