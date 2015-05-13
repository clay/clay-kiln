'use strict';
// controller that gets instantiated for all editable components
module.exports = function () {
  var svc = '../services/',
    dom = require(svc + 'dom'),
    references = require(svc + 'references'),
    formcreator = require(svc + 'formcreator'),
    templates = require(svc + 'templates'),
    edit = require(svc + 'edit'),
    ds = require('dollar-slice'),
    _ = require('lodash');

  _.mixin(require('lodash-deep'));

  function open(ref, name, el) {
    var possChildEl = dom.getFirstChildElement(el);
    // first, check to make sure any inline editors aren't open in this element's children
    if (possChildEl && possChildEl.classList.contains('editor-inline')) {
      return;
    } else {
      edit.getSchemaAndData(ref, name).then(function (res) {
        var schema = res.schema,
          data = res.data,
          display = schema._display || 'modal', // defaults to modal
          modal, form;

        if (display === 'modal') {
          // create form and modal
          form = formcreator.createForm(name, {schema: schema, data: data, display: 'modal'});
          modal = templates.apply('editor-modal', { html: form.outerHTML });

          document.body.appendChild(modal);
          dom.find('html').classList.add('noscroll');

          // instantiate modal controller
          ds.get(__dirname + '/editor-modal', modal);
          // instantiate form controller
          ds.get(__dirname + '/editor-form', dom.find(modal, 'form'), ref, name);
        } else if (display === 'inline') {
          // create form
          form = formcreator.createInlineForm(name, { schema: schema, data: data });
          dom.clearChildren(el);
          el.appendChild(form);
          // instantiate form controller
          ds.get(__dirname + '/editor-form', form, ref, name);
        }
      });
    }
  }

  /**
   * get mask text
   * if mask has a string, use it
   * otherwise get the name of the field/group, prettified
   * e.g. "title.social" would become "Title » Social"
   * @param  {string} name     
   * @param  {{}} partials 
   * @return {string}          
   */
  function getMaskText(name, partials) {
    var possibleMaskText = _.deepGet(partials, 'schema._mask');

    if (typeof possibleMaskText === 'string' && possibleMaskText !== 'true') {
      return possibleMaskText;
    } else {
      return name.split('.').map(_.startCase).join(' » ');
    }
  }

  /**
   * get mask height based on the field _type
   * @param  {string} type
   * @return {string}
   */
  function getMaskHeight(type) {
    switch (type) {
      case 'vertical-list': return '600px';
      case 'component': return '300px';
      default: return 'auto';
    }
  }

  function isFieldEmpty(data) {
    // note: 0, false, etc are valid bits of data for numbers, booleans, etc so they shouldn't be masked
    return data === undefined || data === null || data === '' || (Array.isArray(data) && !data.length);
  }

  /**
   * add mask if field is blank
   * @param {NodeElement} node
   * @param {{}} partials
   * @param {{}} maskObj
   */
  function addFieldMask(node, partials, maskObj) {
    var fieldData = partials.data,
      mask;

    if (isFieldEmpty(fieldData)) {
      // add mask for this field!
      mask = templates.apply('editor-mask', maskObj);
      node.appendChild(mask);
    }
  }

  /**
   * add mask if group contains any required fields that are blank
   * @param {NodeElement} node     
   * @param {{}} partials 
   * @param {{}} maskObj
   */
  function addGroupMask(node, partials, maskObj) {
    var hasEmptyRequiredFields = false,
      mask;

    // grab all the required fields
    _.deepMapValues(partials.schema, function (val, key) {
      var isRequired = _.contains(key, '_required') && val === true,
        prop = _.initial(key).join('.'),
        fieldData;

      if (isRequired) {
        fieldData = _.deepGet(partials.data, prop);
        if (isFieldEmpty(fieldData)) {
          hasEmptyRequiredFields = true;
          // add mask height based on the specific field required
          maskObj.height = getMaskHeight(_.deepGet(partials.schema, prop)._type);
        }
      }
    });

    // if there's at least one empty required field, display the mask
    if (hasEmptyRequiredFields) {
      // add mask for this field group!
      mask = templates.apply('editor-mask', maskObj);
      node.appendChild(mask);
    }
  }

  /**
   * generate and add mask, if configured
   * mask should be shown if:
   * - name is a field and field is blank
   * - OR name is a group of fields (e.g. title) and contains any REQUIRED fields that are blank (e.g. title.social)
   * @param {string} ref
   * @param {NodeElement} node
   */
  function addMask(ref, node) {
    var name = node.getAttribute('name');

    edit.getSchemaAndData(ref, name).then(function (partials) {
      var hasMask = _.deepHas(partials, 'schema._mask'),
        isField = _.deepHas(partials, 'schema._type');

      if (hasMask) {
        // there should be a mask. See if it's a field or a group of fields
        if (isField) {
          addFieldMask(node, partials, { text: getMaskText(name, partials), height: getMaskHeight(_.deepGet(partials, 'schema._type')) });
        } else {
          addGroupMask(node, partials, { text: getMaskText(name, partials) });
        }
      }
    });
  }

  function constructor(el) {
    var ref = el.getAttribute(references.referenceAttribute),
      // Normally name is only on children of components. One exception is the tags component.
      componentHasName = el.getAttribute('data-component') && el.getAttribute('name'),
      walker = document.createTreeWalker(el, NodeFilter.SHOW_ELEMENT, { acceptNode: function (node) {
        if (!node.getAttribute('data-component')) {
          return NodeFilter.FILTER_ACCEPT;
        } else {
          return NodeFilter.FILTER_REJECT;
        }
      }}),
      node,
      name;
    
    // Special case when name is in the component element.
    if (componentHasName) {
      name = componentHasName;
      el.addEventListener('click', open.bind(null, ref, name, el));
    }

    // add click events to children with [name], but NOT children inside child components
    while ((node = walker.nextNode())) {
      if (name = node.getAttribute('name')) { // jshint ignore:line
        // add click event that generates a form
        node.addEventListener('click', open.bind(null, ref, name, node));
        // add mask
        addMask(ref, node);
      }
    }
  }

  constructor.prototype = {
    events: {
      'a click': 'killLinks'
    },

    killLinks: function (e) {
      // prevent all links in this component from being clicked
      // allows us to attach click handlers to open things like tags, author, sources (lists of links)
      // users can still right-click + open in new tab on links they want to actually go to
      dom.preventDefault(e);
    }
  };

  return constructor;
};