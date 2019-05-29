import store from '../lib/core-data/store';
import * as api from '../lib/core-data/api.js';
import { replaceVersion } from 'clayutils';
import _cloneDeep from 'lodash/cloneDeep';

export default class KilnInput {
  /**
  * @param {object} schema
  * @param {string} inputName
  */
  constructor(schema, inputName) {
    Object.assign(this, {
      inputName,
      schemaName: schema.schemaName,
      subscribedEvents: {},
      ...schema[inputName]
    });
  };

  /**
   * fetchs and returns a component as a json object
  * @param {string} uri
  * @return {Promise}
  */
  getComponentData(uri) {
    return api.getJSON(`http://${uri}`);
  }

  /**
   * returns an array of components with the passed name on the current page
  * @param {string} componentName
  * @return {array}
  */
  getComponentInstances(componentName) {
    const components = store.state.components,
      instances = [];

    Object.keys(components).forEach((key) => {
      if (key.includes(`_components/${componentName}/instances`) && Object.keys(components[key]).length > 0) {
        instances.push(key);
      }
    });

    return instances;
  }

  /**
  * returns a copy of the current Vuex state
  * @return {object}
  */
  getState() {
    return _cloneDeep(store.state);
  }

  /**
  * register an event
  * @param {string} event
  * @param {function} fn
  */
  on(event, fn) {
    this.events = this.events || {};
    this.events[event] = fn;
  }

  /**
  * hide the input
  * @returns {promise}
  */
  hide() {
    return new Promise((resolve) => {
      if (store.state.schemas[this.schemaName]) {
        return this.setProp('visibility', false);
      } else {
        this.visibility = false;
        resolve(this);
      }
    });
  }

  /**
  * publish a component by saving to the @published version
  * @param {string} uri
  * @param {object} data
  * @returns {promise}
  */
  publishComponent(uri, data) {
    return this.saveComponent(replaceVersion(uri, 'published'), data);
  }

  /**
  * re-render a component instance
  * useful if a component's data has been updated by an outside source
  * @param {string} uri
  * @returns {promise}
  */
  reRenderInstance(uri) {
    return api.getJSON(`http://${uri}`).then((component) => {
      store.dispatch('triggerModelRender', { uri, component });
    });
  }

  /**
  * save a component
  * @param {string} uri
  * @param {object} data
  * @returns {promise}
  */
  saveComponent(uri, data) {
    return store.dispatch('saveComponent', { uri, data });
  }

  /**
  * update the value of a prop on the current schema
  * @param {string} prop
  * @param {string|number|object} value
  * @returns {promise}
  */
  setProp(prop, value) {
    return new Promise((resolve) => {
      if (this[prop] !== value ) {
        store.dispatch('updateSchemaProp', { schemaName: this.schemaName, inputName: this.inputName, prop, value })
          .then(()=> {
            resolve(this);
          });
      } else {
        resolve(this);
      }
    });
  }

  /**
  * show the input
  * @returns {promise}
  */
  show() {
    // just an alias/shortcut for calling setProp('visibility', true);
    return this.setProp('visibility', true);
  }

  /**
  * save a component
  * @param {string} event
  * @param {function} fn
  * @param {boolean} scoped
  */
  subscribe(event, fn, scoped = false) {
    this.subscribedEvents[event] = {
      func: fn,
      scoped
    };

    this.subscribeToMutations();
  }

  /**
  * subscribe to vuex mutations
  */
  subscribeToMutations() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }

    this.unsubscribe = store.subscribe((mutation) => {
      if (this.subscribedToEvent(mutation)) {
        this.subscribedEvents[mutation.type].func(mutation.payload);
      }
    });
  }

  /**
  * check if this event is subscribed to
  * @param {type} string
  * @return {boolean}
  */
  subscribedToEvent({ type }) {
    const event = this.subscribedEvents[type];

    return event && typeof event.func === 'function' && (!event.scoped || event.scoped && store.state.url && store.state.url.component === this.schemaName);
  }

  /**
  * get the vuex url object, which contains the hash elements
  * @return {object}
  */
  url() {
    // JSONing out the Vue object into a standard JavaScript object
    return JSON.parse(JSON.stringify(store.state.url));
  }

  /**
  * Get or set the value for the input
  * @param {string|number|object|array} val
  * @return {string|number|object|array}
  */
  value(val) {
    if (val) {
      // set the value of the field
      return store.dispatch('updateFormData', { path: this.inputName, val }).then(() => {
        return store.state.ui.currentForm ? store.state.ui.currentForm.fields[this.inputName] : null;
      });
    } else {
      return store.state.ui.currentForm ? store.state.ui.currentForm.fields[this.inputName] : null;
    }
  }
};
