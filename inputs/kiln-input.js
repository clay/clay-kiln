import store from '../lib/core-data/store';

export default class KilnInput {
  constructor(schema, inputName) {
    Object.assign(this, {
      inputName,
      schemaName: schema.name,
      subscribedEvents: {},
      ...schema[inputName]
    });
  };

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

  rerender(uri = null) {
    if (uri) {
      // rerender specific component
    } else {
      // rerender components of this type
      const componentsToReRender = Object.keys(store.state.components).filter((key)=> key.includes(`/_components/${ this.schemaName }/instances/`));

      componentsToReRender.forEach((key) => {
        store.dispatch('triggerModelRender', { uri: key, data: store.state.components[key] });
      });
    }
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

  uri() {
    return store.state.url;
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

  updateLayout() {
    store.dispatch('updateLayout');
  }

  saveComponent() {
    store.dispatch('saveComponent',{ uri: 'localhost/_components/paragraph/instances/cjuv9rjel00083h5z0w65qxfw', data: { text: 'Lorum ipsum!' }});
  }
};
