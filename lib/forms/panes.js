import { convertNativeTagName } from './inputs';


// hash of all panes, added to global
window.kiln = window.kiln || {}; // note: this is here for testing. it should already exist when this file is imported
window.kiln.panes = window.kiln.panes || {};

export function add(name, vueComponent) {
  name = convertNativeTagName(name);

  // note: this WILL overwrite pane contents already in the hash,
  // allowing people to use custom versions of our core panes
  window.kiln.panes[name] = vueComponent;
}
