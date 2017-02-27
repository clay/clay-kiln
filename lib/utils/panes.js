import store from '../core-data/store';

export function openPane(name, title, component, content) {
  return store.dispatch('openPane', {
    name,
    options: {
      title,
      component,
      content
    }
  });
}

export function changePane(name, title, component, content) {
  return store.dispatch('changePane', {
    name,
    options: {
      title,
      component,
      content
    }
  });
}

export function closePane() {
  return store.dispatch('closePane');
}

export function addComponentPane(content) {
  return store.dispatch('openPane', {
    name: 'add-component',
    options: {
      title: 'Add Component',
      component: 'add-component',
      content
    }
  });
}

