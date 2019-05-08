import store from '../lib/core-data/store';
import * as api from '../lib/core-data/api.js';

export default class KilnInput {
  constructor(schema, inputName) {
    Object.assign(this, {
      inputName,
      schemaName: schema.schema_name,
      subscribedEvents: {},
      ...schema[inputName]
    });
  };

  getComponentInstances(componentName) {
    const components = store.state.components,
      instances = [];

    Object.keys(components).forEach((key)=> {
      if (key.includes(`_components/${componentName}/instances`)) {
        instances.push(key);
      }
    });

    return instances;
  }

  on(event, fn) {
    this.events = this.events || {};
    this.events[event] = fn;
  }

  hide() {
    return new Promise((resolve) => {
      let props = { schemaName: this.schemaName, inputName: this.inputName, prop: 'visibility', value: false };

      if (store.state.schemas[this.schemaName]) {
        store.dispatch('updateSchemaProp', props).then(()=> {
          resolve(this);
        });
      } else {
        this.visibility = false;
        resolve(this);
      }
    });
  }

  reRenderInstance(uri) {
    api.getJSON(`http://${uri}`).then((component) => {
      store.dispatch('triggerModelRender', { uri, component });
    });
  }

  saveComponent(uri, data) {
    store.dispatch('saveComponent', { uri, data});
  }

  setProp(prop, value) {
    return new Promise((resolve) => {
      store.dispatch('updateSchemaProp', { schemaName: this.schemaName, inputName: this.inputName, prop, value }).then(()=> {
        resolve(this);
      });
    });
  }

  show() {
    return new Promise((resolve) => {
      store.dispatch('updateSchemaProp', { schemaName: this.schemaName, inputName: this.inputName, prop: 'visibility', value: true }).then(()=> {
        resolve(this);
      });
    });
  }

  subscribe(event, fn, scoped = false) {
    this.subscribedEvents[event] = {
      func: fn,
      scoped
    };

    this.subscribeToMutations();
  }

  subscribeToMutations() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // (mutation, state)
    // SOME USEFUL EVENTS TO SUBSCRIBE TO: CLOSE_FORM, OPEN_FORM, UPDATE_FORMDATA (when the data is changed, but not yet saved), UPDATE_COMPONENT (when data is actually saved)
    this.unsubscribe = store.subscribe((mutation) => {
      if (this.subscribedToEvent(mutation)) {
        this.subscribedEvents[mutation.type].func(mutation.payload);
      }
    });
  }

  subscribedToEvent( { type } ) {
    const event = this.subscribedEvents[type];

    return event && typeof event.func === 'function' && (!event.scoped || !store.state.url || event.scoped && store.state.url.component === this.schemaName);
  }

  url() {
    // JSONing out the Vue object into a standard JavaScript object
    return JSON.parse(JSON.stringify(store.state.url));
  }

  value(val) {
    if (val) {
      // set the value of the field
      store.dispatch('updateFormData', { path: this.inputName, val }).then(()=> {
        return store.state.ui.currentForm ? store.state.ui.currentForm.fields[this.inputName] : null;
      });
    } else {
      return store.state.ui.currentForm ? store.state.ui.currentForm.fields[this.inputName] : null;
    }
  }
};
