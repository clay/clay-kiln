import store from '../core-data/store';
import { OPEN_PANE, CLOSE_PANE } from '../panes/mutationTypes';


export function openPane(name, title, component, content) {
  store.commit(OPEN_PANE, {
    name,
    options: {
      title,
      component,
      content
    }
  });
}

export function addComponentPane(content) {
  store.commit(OPEN_PANE, {
    name: 'add-component',
    options: {
      title: 'Add Component',
      component: 'add-component',
      content
    }
  });
}

