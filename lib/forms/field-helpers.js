import { closest, find } from '@nymag/dom';
import { fieldClass, mainBehaviorClass } from '../utils/references';

/**
 * find main input of a field
 * @param  {element} el
 * @return {Element|null}
 */
export function getInput(el) {
  const field = closest(el, `.${fieldClass}`),
    main = field && find(field, `.${mainBehaviorClass}`);

  return main && (find(main, 'input') || find(main, 'textarea') || find(main, '.wysiwyg-input'));
}
