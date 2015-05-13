'use strict';
var _ = require('lodash'),
  dom = require('./dom'),
  references = require('./references'),
  templates = require('./templates'),
  
  // Deals with the creation and reading of the values of editor forms.
  typeProperty = references.typeProperty,
  displayProperty = references.displayProperty,
  componentListAttribute = references.componentListAttribute,
  referenceAttribute = references.referenceAttribute,
  referenceProperty = references.referenceProperty,
  componentMarkdownAttribute = references.componentMarkdownAttribute;

/**
 * Create editor element for all templates that take a `name` and a `value`.
 * Curry so that `templateName` and `allowedDefinition` come from `fieldCreators` and remaining arguments from `createField`.
 *
 * @type {Function}
 * @param {string} templateName       Used as editor template class name. Defined in `fieldCreators`.
 * @param {array} allowedDefinition   Properties allowed to be passed to the editor template. Defined in `fieldCreators`.
 * @param {object} definition         Schema for the field.
 * @param {object} data               Data for the field.
 * @param {string} fieldName          Path of the field.
 * @returns {object}                  Element node.
 */
var createNameValueTemplate = _.curry(function (templateName, allowedDefinition, definition, data, fieldName) {
  data = data !== true && _.isEmpty(data) ? '' : data; // catch empty objects (so they don't become [object Object])
  return templates.apply(templateName, _(definition).pick(allowedDefinition).assign({
    label: definition._label || _.startCase(fieldName),
    name: fieldName,
    value: data + '' //force to string
  }).value());
});

/**
 * Create ordered list element for editing a horizontal-list.
 * Curry so that `templateName` and `allowedDefinition` come from `fieldCreators` and remaining arguments from `createField`
 *
 * @type {Function}
 * @param {string} templateName       Used as editor template class name.
 * @param {array} allowedDefinition   Properties allowed to be passed to the editor template.
 * @param {object} schema             Schema for the field.
 * @param {object} data               Data for the field.
 * @param {string} fieldName          Path of the field.
 * @returns {object}                  Ordered list element containing all the horizontal-list items.
 */
var createHorizontalListTemplate = _.curry(function (templateName, allowedDefinition, schema, data, fieldName) {
  
  if (!schema._item) {
    throw new Error('schema._item required in horizontal list');
  }

  var ol = createNameValueTemplate(templateName, allowedDefinition, schema, data, fieldName), // An ordered list contains the horizontal-list items.
    itemsSchema = schema._item,
    itemsFields = Object.keys(itemsSchema).filter(function removeNonFieldNames (key) {
      return key.substr(0, 1) !== '_';
    }),
    itemsSchemaIsFlat = itemsFields.length === 0;
  
  // Field name for the horizonal list.
  ol.setAttribute('name', fieldName);
  
  // For flat items schema (e.g. `{schema: {_item: {_type: 'text'}}}`) force the field name to "_flatListItem".
  if (itemsSchemaIsFlat) {
    itemsFields = ['_flatListItem'];
    itemsSchema = {_flatListItem: itemsSchema};
  }

  // For all the items create an li element.
  data.forEach(function (item) {
    var li = ol.appendChild(document.createElement('li')); // An li contains each item.
    
    // For all the fields in each item, create an input field.
    itemsFields.forEach(function (itemFieldName) {
      var itemSchema = itemsSchema[itemFieldName],
        itemData = (itemsSchemaIsFlat ? item : item[itemFieldName]) || '', // Cannot create a form field without data
        itemField = createField(itemSchema, itemData, itemFieldName);

      li.appendChild(itemField);
    });
  });
  
  return ol;
});

/**
 * Create a vertical list editing section
 * @param {object} definition
 * @param {*} data
 * @param {string} fieldName
 * @returns {Element}
 */
function createVerticalList(definition, data, fieldName) {
  var editorList = templates.apply('editor-list', {
    name: definition._label ||  _.startCase(fieldName)
  });

  //items
  _(data).each(function (item) {
    return editorList.appendChild(templates.apply('editor-item', item));
  }).value();

  return editorList;
}

// note: these map to the "_type" field in schema.yaml
var fieldCreators = {
  defaults: createNameValueTemplate('editor-text', ['_required', '_minlength', '_maxlength', '_pattern', '_placeholder', '_tooltip', '_label']),
  markdown: createNameValueTemplate('editor-markdown', ['_required']),
  datetime: createNameValueTemplate('editor-datetime', ['_required']),
  email: createNameValueTemplate('editor-email', ['_required', '_pattern', '_placeholder']),
  url: createNameValueTemplate('editor-url', ['_required', '_pattern', '_placeholder']),
  text: createNameValueTemplate('editor-text', ['_required', '_minlength', '_maxlength', '_pattern', '_placeholder', '_tooltip', '_label']),
  bool: createNameValueTemplate('editor-checkbox', ['_required']), // `_required` in boolean means that the checkbox must be checked.
  'vertical-list': createVerticalList,
  'horizontal-list': createHorizontalListTemplate('editor-horizontal-list', ['_required', '_item'])
};

/**
 * Validate input to field creators.
 * @param {object} definition
 * @param {*} data
 * @param {string} fieldName
 * @returns {Element}
 */
function createField(definition, data, fieldName) {
  if (!definition) {
    throw new Error('Missing definition for field.');
  } else if (!fieldName) {
    throw new Error('Missing field name for field: ' + definition);
  } else if (data === null || data === undefined) {
    throw new Error('Missing data for field: ' + fieldName);
  }

  var fieldCreator = definition[typeProperty] && fieldCreators[definition[typeProperty]] || fieldCreators.defaults;

  return fieldCreator.apply(this, _.slice(arguments));
}

function createFieldOrForm(key, options) {
  var value = options.value,
    data = options.data,
    display = options.display,
    // default subOptions
    subOptions = {
      schema: value,
      data: data,
      subform: document.createDocumentFragment()
    };

  if (value[typeProperty]) {
    // add fields
    return createField(value, data, key);
  } else {
    // pass through display if it exists
    if (display) {
      subOptions.display = display;
    }
    // add subforms
    return createForm(key, subOptions);
  }
}

/**
 * @param {string} name 
 * @param {object} options            
 * @param {object} options.schema
 * @param {object} [options.data]
 * @param {string} [options.display]  e.g. 'inline', 'modal', or 'meta'
 * @return {Element}
 */
function createForm(name, options) {
  var schema = options.schema,
    data = options.data,
    display = options.display,
    el = options.subform,
    parentKey, inputContainer;

  // schema and name are required
  if (!name) {
    throw new Error('Name is required to create a form!');
  } else if (!schema) {
    throw new Error('Schema is required to create a form!');
  }

  // start setting up the form
  if (!el) {
    parentKey = '';
    el = templates.apply('editor-outer', {
      name: schema._label || _.startCase(name)
    });
    inputContainer = dom.find(el, 'form .input-container');
  } else {
    parentKey = name + '.';
    el = templates.apply('editor-section', {
      name: schema._label || _.startCase(name)
    });
    inputContainer = dom.find(el, '.editor-section-body');
  }

  data = data || {};

  // catch one-level-deep schemas
  if (_.contains(Object.keys(schema), '_type')) {
    schema = _.deepSet({}, name, schema);
    data = _.deepSet({}, name, data);
  }

  // iterate through the schema, creating forms and fields
  _.each(schema, function (value, key) {
    var childEl;

    if (typeof value === 'object') {
      if (!data[key]) {
        data[key] = '';
      }

      if (
        // modal will display by default if they're not inline or meta
        // meta will display if they're meta
        (display === 'modal' && value[displayProperty] !== 'inline' && value[displayProperty] !== 'meta') ||
        (display === 'meta' && value[displayProperty] === 'meta')) {
        // only add stuff with the proper display
        childEl = createFieldOrForm(parentKey + key, {value: value, data: data[key], display: display});
      } else if (!display) {
        // add all stuff
        childEl = createFieldOrForm(parentKey + key, {value: value, data: data[key]});
      }

      if (childEl) {
        inputContainer.appendChild(childEl);
      }
    }
  });
  return el;
}

function createInlineForm(name, options) {
  var schema = options.schema,
    data = options.data,
    el, inputContainer;

  // schema and name are required
  if (!name) {
    throw new Error('Name is required to create a form!');
  } else if (!schema) {
    throw new Error('Schema is required to create a form!');
  } else if (!_.contains(Object.keys(schema), '_type')) {
    throw new Error('Must specify a field for inline forms!');
  }

  // start setting up the form
  el = templates.apply('editor-inline', {
    name: _.startCase(name)
  });
  inputContainer = dom.find(el, 'form .input-container');

  data = data || {};

  inputContainer.appendChild(createField(schema, data, name));
  return el;
}

/**
 * @param {object} data
 * @param {Element} el
 * @returns {object}
 */
function getComponentListValues(data, el) {
  var name = el.getAttribute(componentListAttribute);

  data[name] = _.map(dom.findAll(el, 'li[' + referenceAttribute + ']'), function (itemEl) {
    var item = {};
    item[referenceProperty] = itemEl.getAttribute(referenceAttribute);
    return item;
  });
  return data;
}

function getMarkdownValues(data, el) {
  var name = el.getAttribute(componentMarkdownAttribute);

  data[name] = el.innerHTML;
  return data;
}

function getInputValues(data, el) {
  var name = el.getAttribute('name'),
    tag = el.tagName.toLowerCase(),
    type;

  if (tag === 'input') {
    type = el.getAttribute('type');

    // inputs have weird logic, depending on type
    switch (type) {
      case 'checkbox':
      case 'radio':
        _.deepSet(data, name, el.checked);
        break;
      default:
        _.deepSet(data, name, el.value);
    }
  } else if (tag === 'select') {
    _.deepSet(data, name, el.value);
  } else {
    _.deepSet(data, name, el.innerText);
  }

  return data;
}

/**
 * Get values for all `items` within a `horizontal-list` and add them to the data object.
 * @param {object} data    Data to be saved.
 * @param {object} el      Ordered list element.
 * @returns {object}       Data to be saved, including the items array.
 */
function getHorizontalListValues(data, el) {
  
  var name = el.getAttribute('name'),
    items = _.map(_.slice(el.childNodes), getFormValues); // Top-level children are "items" in the list. Get the values within each of these items.
  
  // Gather items into an array and handle "flat" items which are not deep objects, e.g. string.
  data[name] = items.map(function handleFlatItems(item) {
    if (item.hasOwnProperty('_flatListItem')) {
      item = item._flatListItem;
    }
    return item;
  });
  
  return data;
}

/**
 * @param {Element} form
 * @returns {object}
 */
function getFormValues(form) {
  var data = {},
    horizontalLists = dom.findAll(form, 'ol.horizontal-list'),
    isHorizontalList = horizontalLists.length > 0;
  
  if (isHorizontalList) {
    _.reduce(horizontalLists, getHorizontalListValues, data);
  } else {
    _.reduce(dom.findAll(form, 'input,select,textarea'), getInputValues, data);
    _.reduce(dom.findAll(form, 'ul[' + componentListAttribute + ']'), getComponentListValues, data);
    _.reduce(dom.findAll(form, '[' + componentMarkdownAttribute + '][contenteditable=true]'), getMarkdownValues, data);
  }

  return data;
}

// expose these methods
module.exports = {
  getFormValues: getFormValues,
  createForm: createForm,
  createInlineForm: createInlineForm
};