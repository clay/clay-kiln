import _ from 'lodash';

module.exports = function () {
  var dom = require('@nymag/dom'),
    focus = require('../decorators/focus');

  function isTooltip(el) {
    return el.classList.contains('medium-editor-toolbar-anchor-preview-inner') || el.classList.contains('medium-editor-action');
  }

  function wasTooltipClicked(e) {
    return _.get(e, 'target.classList') && isTooltip(e.target);
  }

  /**
   * determine if we're clicking into the current component
   * used to stop outside clicks for inline forms
   * @param {NodeList} path
   * @param {Element} el
   * @returns {boolean}
   */
  function insideCurrentComponent(path, el) {
    return _.includes(path, el);
  }

  /**
   * determine if we're clicking into another form that's been opened
   * sometimes the outside click handler isn't removed fast enough when clicking
   * directly into something like a component's parent's settings,
   * so it'll fire if we click anything inside that settings form
   * @param {NodeList} path
   * @returns {boolean}
   */
  function insideOtherForm(path) {
    return !!_.find(path, function (el) {
      return el && el.classList && el.classList.contains('editor');
    });
  }

  /**
   * constructor
   * @param  {Element} el
   * @param  {string} ref   component ref
   * @param  {string} path  dot-delineated path to the data
   * @param  {Element} [oldEl] hold a reference to the old element for inline forms
   */
  function constructor(el, ref, path, oldEl) {
    function outsideClickhandler(e) {
      if (!insideCurrentComponent(e.path, el) && !insideOtherForm(e.path) && !wasTooltipClicked(e)) {
        e.preventDefault();
        e.stopPropagation();
        return focus.unfocus().then(function () {
          // only remove event listener if we unfocused successfully
          this.removeEventListener('click', outsideClickhandler); // note: self references <html>
        }).catch(_.noop);
      }
    }

    // if this is an inline form, add an event handler that will close the form when you click out of it
    if (oldEl) {
      dom.find('html').addEventListener('click', outsideClickhandler);
      // Make sure the event handler on html does not persist after the form is removed.
      dom.onRemove(el, function () {
        dom.find('html').removeEventListener('click', outsideClickhandler);
      });
    }

    this.ref = ref;
    this.path = path;
    this.form = dom.find(el, 'form');
  }

  constructor.prototype = {
    events: {
      submit: 'closeForm',
      close: 'closeForm',
      'input focusin': 'stopFocus',
      '[contenteditable] focusin': 'stopFocus',
      'select focusin': 'stopFocus'
    },

    closeForm: function (e) {
      e.preventDefault();
      focus.unfocus().catch(_.noop);
    },

    stopFocus: function (e) {
      e.preventDefault();
    }
  };

  return constructor;
};
