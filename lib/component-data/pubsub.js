// cross-component updating via pubsub
import _ from 'lodash';
import { create } from 'eventify';
import { pubProp, subProp, componentRoute, instancesRoute } from '../utils/references';
import { ADD_SCHEMA } from './mutationTypes';
import { PRELOAD_SUCCESS } from '../preloader/mutationTypes';
import { getSchema } from '../core-data/components';

// Ask veit ek standa, heitir Yggdrasill
// hár baðmr, ausinn hvíta auri;
// þaðan koma döggvar þærs í dala falla;
// stendr æ yfir grœnn Urðar brunni.
const yggdrasil = create();
// Subscribers they made there, and life allotted
// To the sons of components, and set their fates

/**
 * update all instances of a component
 * @param  {Object} store
 * @param  {string} name  of the components
 * @param  {string} path  to update
 * @param  {*} data  published by the other component(s)
 */
function updateComponents(store, {name, path, data}) {
  _.forOwn(store.state.components, (componentData, uri) => {
    // only update instances of components, not the base data
    if (_.includes(uri, `${componentRoute}${name}${instancesRoute}`)) {
      store.dispatch('saveComponent', {uri, data: { [path]: data }});
    }
  });
}

/**
 * add listeners to all schemas after preloading them
 * @param {Object} schemae
 * @param {Object} store
 */
function addPreloadedListeners(schemae, store) {
  _.forOwn(schemae, (schema, name) => addListeners(name, schema, store));
}

/**
 * add listeners in a schema
 * @param {string} name   of component
 * @param {Object} schema
 * @param {Object} store
 */
function addListeners(name, schema, store) {
  _.forOwn(schema, (field, fieldName) => {
    if (_.isObject(field) && field[subProp]) {
      yggdrasil.on(field[subProp], (data) => updateComponents(store, {
        name,
        path: fieldName,
        data
      }));
    }
  });
}

/**
 * pubsub plugin
 * adds subscribers whenever we add new schemas
 * those subscribers update ALL instances of a component when their subscribed properties change
 * @param  {object} store
 */
export default function pubsub(store) {
  // after schemas are loaded (and when loading any new schemas),
  // parse them for new subscribers
  store.subscribe((mutation) => {
    if (mutation.type === PRELOAD_SUCCESS) {
      addPreloadedListeners(_.get(store, 'state.schemas'), store);
    } else if (mutation.type === ADD_SCHEMA) {
      addListeners(mutation.payload.name, mutation.payload.data, store);
    }
  });
}

/**
 * publish properties
 * note: this is called after model.js runs
 * @param  {string} uri
 * @param  {Object} data
 */
export function publish(uri, data) {
  const schema = getSchema(uri);

  _.forOwn(schema, (field, fieldName) => {
    if (_.isObject(field) && field[pubProp]) {
      yggdrasil.trigger(field[pubProp], data[fieldName]);
    }
  });
}
