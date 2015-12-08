module.exports = function () {
  var _ = require('lodash'),
    dom = require('../services/dom'),
    focus = require('../decorators/focus');

  function isTooltip(el) {
    return el.classList.contains('medium-editor-toolbar-anchor-preview-inner') || el.classList.contains('medium-editor-action');
  }

  function wasTooltipClicked(e) {
    return _.get(e, 'target.classList') && isTooltip(e.target);
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
      if (!_.contains(e.path, el) && !wasTooltipClicked(e)) {
        e.preventDefault();
        this.removeEventListener('click', outsideClickhandler); // note: self references <html>
        return focus.unfocus().catch(_.noop);
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
      'input focus': 'stopFocus'
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
