window.kiln = window.kiln || {};
window.kiln.selectorButtons = window.kiln.selectorButtons || {};
window.kiln.toolbarButtons = window.kiln.toolbarButtons || {};

export function addSelectorButton(name, component) {
  window.kiln.selectorButtons[name] = component;
}

export function addToolbarButton(name, component) {
  window.kiln.toolbarButtons[name] = component;
}
