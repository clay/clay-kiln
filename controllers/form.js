module.exports = function () {
  var _ = require('lodash'),
    dom = require('../services/dom'),
    focus = require('../services/focus'),
    select = require('../services/select');

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
      submit: 'closeForm',
      close: 'closeForm'
    },

    closeForm: function (e) {
      console.log('close');
      e.preventDefault();
      focus.unfocus();
    }
  };

  return constructor;
};
