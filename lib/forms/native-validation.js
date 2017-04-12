import _ from 'lodash';
import { find } from '@nymag/dom';

export function checkValidity(state) {
  const form = _.get(state, 'ui.currentForm'),
    formEl = form && form.el && find(form.el, 'form') || find('.kiln-toolbar-pane-form form'),
    isFormValid = formEl && formEl.checkValidity();

  if (isFormValid) {
    return true;
  } else {
    let submitButton = find(formEl, '.hidden-submit');

    // trigger a manual click on the submit button (hidden for inline, shown for overlay),
    // which will show the validation messages
    submitButton.dispatchEvent(new MouseEvent('click'));
    return false;
  }
}
