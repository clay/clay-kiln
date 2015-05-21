'use strict';
var label = require('../services/label'),
  dom = require('../services/dom'),
  rivets = require('rivets');

module.exports = function (el, args, data, name) {
  data = data || ''; // default to empty string

  // add some stuff
  args.value = data;
  args.label = label(name);
  args.name = name;

  var tpl = `
      <label><span class="input-label">{ label }</span> 
        <input name="{ name }" type="text" rv-required="required" rv-pattern="pattern" rv-minLength="minLength" rv-maxLength="maxLength" rv-placeholder="placeholder" rv-value="value" />
      </label>
    `,
    textField = dom.create(tpl);

  rivets.bind(textField, args);

  console.log(textField);

  if (el.nodeType === 1) {
    el.appendChild(textField);
    return el;
  } else {
    return textField;
  }
};