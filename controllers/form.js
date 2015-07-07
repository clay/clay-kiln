module.exports = function () {
  var _ = require('lodash'),
    dom = require('../services/dom'),
    edit = require('../services/edit'),
    focus = require('../services/focus'),
    select = require('../services/select'),
    references = require('../services/references'),
    formValues = require('../services/form-values');

  /**
   * constructor
   * @param  {Element} el
   * @param  {string} ref   component ref
   * @param  {string} path  dot-delineated path to the data
   * @param  {Element} [oldEl] hold a reference to the old element for inline forms
   */
  function constructor(el, ref, path, oldEl) {
    function outsideClickhandler(e) {
      if (!_.contains(e.path, el)) {
        el.dispatchEvent(new CustomEvent('close'));
        this.removeEventListener('click', outsideClickhandler); // note: this references <html>
      }
    }

    // if this is an inline form, add an event handler that will close the form when you click out of it
    if (oldEl) {
      dom.find('html').addEventListener('click', outsideClickhandler);

      // also set the height of the component bar
      select.setHeight(dom.closest(oldEl, '[' + references.referenceAttribute + ']'));
    }

    this.ref = ref;
    this.path = path;
    this.form = dom.find(el, 'form');
  }

  constructor.prototype = {
    events: {
      submit: 'saveData',
      close: 'closeForm'
    },

    saveData: function (e) {
      var data,
        form = this.form,
        ref = this.ref,
        path = this.path;

      e.preventDefault();

      if (path === references.getComponentNameFromReference(ref)) {
        // we're at the top level of the component, e.g. in a settings form
        data = formValues(ref, form);
      } else {
        // only things relative to path have changed
        data = _.get(formValues(ref, form), path);
      }

      if (form.checkValidity()) {
        edit.update(ref, data, path);
      }
    },

    closeForm: function () {
      focus.unfocus();
    }
  };

  return constructor;
};
