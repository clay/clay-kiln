import _ from 'lodash';
import ctx from './context';

/**
 * Remember what a form looked like when it opened, so closing it saves only
 * what this user changed. Called when OPEN_FORM is committed (before any
 * input has touched the form).
 * @param {object} form state.ui.currentForm
 * @param {object} componentData the component's data in the store at that moment
 */
export function rememberFormBase(form, componentData) {
  ctx.formBase = {
    uri: form.uri,
    path: form.path,
    fields: _.cloneDeep(_.toPlainObject(form.fields)),
    data: _.cloneDeep(componentData || {})
  };
}

/**
 * @param {object} form
 */
export function forgetFormBase(form) {
  if (!form || ctx.formBase && ctx.formBase.uri === form.uri && ctx.formBase.path === form.path) {
    ctx.formBase = null;
  }
}

/**
 * Top-level fields the user changed in the current form.
 * note: inputs can add fields to the form that it didn't open with (copied
 * from the component), so those compare against the component data instead
 * @param {object} form state.ui.currentForm
 * @returns {string[]}
 */
export function fieldsEditedInForm(form) {
  const base = ctx.formBase,
    fields = _.toPlainObject(form.fields);

  if (!base || base.uri !== form.uri || base.path !== form.path) {
    // no snapshot (shouldn't happen): fall back to every field in the form
    return _.keys(fields);
  }

  return _.filter(_.keys(fields), (key) => {
    const original = _.has(base.fields, key) ? base.fields[key] : base.data[key];

    return !_.isEqual(_.toPlainObject(fields)[key], original);
  });
}

/**
 * Run something once the confirm dialog has closed. Keen's modal puts focus
 * back where it was when it closes, which would pull the caret out of a form
 * opened from its button.
 * @param {object} store
 * @param {function} fn
 */
export function afterConfirmCloses(store, fn) {
  let done = false,
    unsubscribe = _.noop;

  const run = () => {
    if (!done) {
      done = true;
      unsubscribe();
      setTimeout(fn, 0);
    }
  };

  // actions get Vuex's action context, which can't subscribe: use the store itself
  unsubscribe = (store.subscribe ? store : ctx.store).subscribe((mutation) => {
    if (mutation.type === 'CLOSE_CONFIRM') {
      run();
    }
  });
  setTimeout(run, 600); // in case the dialog was already gone
}
