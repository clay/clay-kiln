// cross-component updating via pubsub
import _ from 'lodash';
import { create } from 'eventify';
import cuid from 'cuid';
import { pubProp, subProp, componentRoute, getComponentName } from '../utils/references';
import { ADD_SCHEMA } from './mutationTypes';
import { PRELOAD_SUCCESS } from '../preloader/mutationTypes';
import { getSchema } from '../core-data/components';

// Ask veit ek standa, heitir Yggdrasill
// hár baðmr, ausinn hvíta auri;
// þaðan koma döggvar þærs í dala falla;
// stendr æ yfir grœnn Urðar brunni.
export const yggdrasil = create();
// Subscribers they made there, and life allotted
// To the sons of components, and set their fates

// exported for testing
export let callStacks = {};
// when we publish for the first time, we generate an eventID.
// as components pub and sub, they add themselves to the call stack for that eventID
// e.g. callStacks[a8s7c].history = ['A+', 'B-', 'C-'] for components A → B → C
// when components pub, they're denoted with +, e.g. 'A+'
// when components sub, they're denoted with -, e.g. 'B-'
// this allows us to differentiate between cyclic regression (expected, but we stop the event chain at that point)
// and nondeterministic updates (unexpected, and we warn the dev so they can eliminate them).
// cyclic regression looks like [..., 'A+', 'A-'] (pub, then sub of the same component)
// nondeterministic updates look like [..., 'B-', 'B-'] (sub, then sub of the same component)
// note: they don't have to be right next to each other

var subscriberRegistry = {};
// when subscribers are registered, they add themselves to this registry.
// when the subscribers are fired, they add their data here
// (and check to see if all subcribers have been fired).
// once all subscribers for a component have fired, the data gets merged, the component saves,
// and the subscribed properties are nulled (ready for the next publish).
// when registering, an entry looks like: { <component name>: { <subscribed prop>: null } }
// when firing, it looks like { <component name>: { <subscribed prop>: { <field>: <value> } } }

/**
 * update all instances of a component
 * @param  {Object} store
 * @param  {string} name  of the component
 * @param {string} [eventID]
 * @param {boolean} [snapshot]
 */
function updateComponents(store, {name, eventID, snapshot}) {
  _.forOwn(store.state.components, (componentData, uri) => {
    if (_.includes(uri, `${componentRoute}${name}`)) {
      // grab all the data to update
      const data = _.reduce(subscriberRegistry[name], (result, field) => _.assign(result, field), {});

      // null out the subscriberRegistry
      _.forOwn(subscriberRegistry[name], (field, prop) => {
        subscriberRegistry[name][prop] = null;
      });
      store.dispatch('saveComponent', {uri, data, eventID, snapshot});
    }
  });
}

/**
 * add listeners to all schemas after preloading them
 * @param {Object} schemae
 * @param {Object} store
 */
function addPreloadedListeners(schemae, store) {
  /* istanbul ignore next */
  _.forOwn(schemae, (schema, name) => addListeners(name, schema, store));
}

/**
 * add listeners for updating the page list
 * @param {object} store
 */
function addPageListListeners(store) {
  // listen for page title
  yggdrasil.on('kilnTitle', (data) => {
    store.dispatch('updatePageList', { title: data });
  });
  // listen for page authors
  yggdrasil.on('kilnAuthors', (data) => {
    store.dispatch('updatePageList', { authors: data });
  });
  // listen for page content
  yggdrasil.on('kilnContent', (data) => {
    store.dispatch('updatePageList', { content: data });
  });
}

/**
 * trace a graph to find the path to a property
 * e.g. find 'D' in { A: { prop1: { B: { prop2: { C: {}, D: {}}}}}}
 * which would return 'A.prop1.B.prop2.D'
 * @param  {object} graph to search inside
 * @param  {string} propName to search for
 * @param {string} [currentPath] if searching deep in a graph
 * @param {string} [resultPath] final result path
 * @return {array}
 */
function graphTrace(graph, propName, currentPath, resultPath) {
  currentPath = currentPath || 'root';

  // iterate through this level of the graph, recursing to the next level
  _.forOwn(graph, (val, key) => {
    if (key === propName) {
      resultPath = `${currentPath}.${propName}`;
      return false;
    } else if (!resultPath) {
      resultPath = graphTrace(val, propName, `${currentPath}.${key}`, resultPath);
    }
  });
  return resultPath ? resultPath.replace('root.', '') : null;
}

function isOdd(n) {
  return Math.abs(n % 2) === 1;
}

/**
 * format a path (to a property or component name)
 * note: this is used to inform devs about circular / nondeterministic updates
 * @param  {string} path A.prop1.B.prop2, etc
 * @param {boolean} isCompleted
 * @return {string}
 */
function formatPath(path, isCompleted) {
  const pathArray = path.split('.'),
    componentNames = pathArray.filter((key, index) => isOdd(index + 1)),
    initialNames = componentNames.length > 1 ? _.initial(componentNames) : componentNames;

  return initialNames.join(' → ') + ` ${isCompleted ? '→' : '⤏'} ${_.last(pathArray)}`;
}

/**
 * function to call when subscribe is triggered
 * @param  {Object} data
 * @param  {string} eventID
 * @param  {string} name
 * @param  {string} fieldName
 * @param {string} prop that this subscribed to
 * @param  {Object} store
 * @param {boolean} [snapshot]
 * @return {Promise|undefined}
 */
function onSubscribe(data, eventID, {name, fieldName, prop, store, snapshot}) {
  if (_.includes(callStacks[eventID].history, `${name}+`)) {
    // component has already published! don't save it again
    // we don't care about logging cyclic event chains (because they're expected)
    console.log(`Cyclic update: ${name} already published! (${formatPath(graphTrace(callStacks[eventID].graph, name))})`);
  } else {
    const path = graphTrace(callStacks[eventID].graph, prop);

    let allSubscribersFinished;

    callStacks[eventID].history.push(`${name}-`);
    _.set(callStacks[eventID].graph, `${path}.${name}`, {});
    subscriberRegistry[name][prop] = { [fieldName]: data };

    allSubscribersFinished = _.every(subscriberRegistry[name], _.isObject);
    if (allSubscribersFinished) {
      return updateComponents(store, { name, eventID, snapshot });
    }
  }
}

/**
 * add listeners in a schema
 * note: exported for testing
 * @param {string} name   of component
 * @param {Object} schema
 * @param {Object} store
 */
export function addListeners(name, schema, store) {
  _.forOwn(schema, (field, fieldName) => {
    if (_.isObject(field) && field[subProp]) {
      const prop = field[subProp];

      // fun undocumented api: eventify allows multiple space-delineated events
      yggdrasil.on(prop, (data, eventID, snapshot) => onSubscribe(data, eventID, {name, fieldName, prop, store, snapshot}));
      // add the subscribers to the registry
      subscriberRegistry[name] = subscriberRegistry[name] || {};
      subscriberRegistry[name][prop] = null;
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
    /* istanbul ignore if */
    if (mutation.type === PRELOAD_SUCCESS) {
      addPreloadedListeners(_.get(store, 'state.schemas'), store);
      addPageListListeners(store);
    } else if (mutation.type === ADD_SCHEMA) {
      addListeners(mutation.payload.name, mutation.payload.data, store);
    }
  });
}

/**
 * quickly determine if a component has ANY fields that will trigger publish
 * @param  {object} schema
 * @return {boolean}
 */
function shouldPublish(schema) {
  return !!_.find(schema, (field) => _.isObject(field) && field[pubProp]);
}

/**
 * when publishing for the first time after a manual save,
 * generate an event ID and add the component name to the call stack.
 * this ID will propagate out to all listeners, preventing
 * infinite cyclic recursion and warning devs about nondeterministic behavior
 * @param  {string} name
 * @param  {string} [eventID]
 * @return {string}
 */
function generateEventID(name, eventID) {
  if (!eventID) {
    eventID = cuid();
    callStacks[eventID] = {
      history: [`${name}+`],
      graph: {
        [name]: {}
      }
    };
  } else {
    const path = graphTrace(callStacks[eventID].graph, name);

    // if this publish was triggered in an event chain, just add the component to the call stack
    callStacks[eventID].history.push(`${name}+`);
    _.set(callStacks[eventID].graph, path, {});
  }

  return eventID;
}

/**
 * publish properties
 * note: this is called after model.js runs
 * @param  {string} uri
 * @param  {Object} data
 * @param {string} [eventID]
 * @param {boolean} [snapshot]
 */
export function publish(uri, data, eventID, snapshot) {
  const schema = getSchema(uri),
    name = getComponentName(uri);

  if (shouldPublish(schema)) {
    eventID = generateEventID(name, eventID);
  }

  _.forOwn(schema, (field, fieldName) => {
    if (_.isObject(field) && field[pubProp]) {
      const prop = field[pubProp],
        path = graphTrace(callStacks[eventID].graph, name);

      // fun undocumented api: eventify allows multiple space-delineated events
      _.set(callStacks[eventID].graph, `${path}.${prop}`, {});
      yggdrasil.trigger(field[pubProp], data[fieldName], eventID, snapshot);
      // note: this uses the same eventID for every prop/field, so a component
      // will never save twice in the same event chain
      // (even if the props/fields they're pub-subbing are different)
    }
  });
}
