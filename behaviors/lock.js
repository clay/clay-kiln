const dom = require('@nymag/dom'),
  tpl = require('../services/tpl'),
  getInput = require('../services/field-helpers').getInput;

function unlock(input, button, e) {
  e.stopPropagation();
  e.preventDefault(); // stop the form from submitting, silly
  input.removeAttribute('disabled');
  input.parentNode.removeEventListener('click', jiggle);
  button.classList.add('unlocked');
}

function jiggle(button, e) {
  e.stopPropagation();
  e.preventDefault();
  button.classList.add('jiggle'); // trigger the jiggle animation
  setTimeout(() => button.classList.remove('jiggle'), 601); // length of the animation + 1
}

/**
 * Create lock
 *
 * @param {{name: string, bindings: {}}} result
 * @returns {{}}
 */
module.exports = function (result) {
  const el = result.el,
    button = tpl.get('.lock-button-template'),
    buttonInner = dom.find(button, 'button'),
    input = getInput(el);

  // lock the input when the form opens, but clicking the lock button will
  // ONLY unlock (it doesn't toggle it. why would you want to toggle it?)
  input.setAttribute('disabled', true);
  input.classList.add('has-lock-button'); // make space for the lock button
  input.parentNode.addEventListener('click', jiggle.bind(null, buttonInner));

  buttonInner.addEventListener('click', unlock.bind(null, input, buttonInner));
  dom.insertAfter(input, button);

  return result;
};
