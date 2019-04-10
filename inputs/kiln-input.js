import store from '../lib/core-data/store';

export default class KilnInput {
  constructor(schema, inputName) {
    Object.assign(this, { inputName, schemaName: schema.name, ...schema[inputName] });

    this.subscribeToMutations();
  };

  addEvent(event, fn) {
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

  subscribeToMutations() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    // (mutation, state)
    this.unsubscribe = store.subscribe((mutation) => {
      switch (mutation.type) {
        case 'CLOSE_FORM':
          if (this.closeForm && typeof this.closeForm === 'function') {
            this.closeForm();
          }
          break;
        case 'OPEN_FORM':
          if (this.openForm && typeof this.openForm === 'function') {
            this.openForm();
          }
          break;
        default:

          break;
      }
    });
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
