import _ from 'lodash';
import cuid from 'cuid';
import { find } from '@nymag/dom';
import { pubProp, subProp, componentRoute, getComponentName, refAttr } from '../utils/references';
import { ADD_SCHEMA } from './mutationTypes';
import { PRELOAD_SUCCESS } from '../preloader/mutationTypes';
import { props } from '../utils/promises';

let callStacks = {},
  // when we publish for the first time, we generate an eventID.
  // as components publish, they add themselves to an array based on that eventID
  // this allows us to prevents cyclic updates (e.g. a component publishing, then subscribing to itself)
  // note: cyclic updates might be complex, and involve multiple intermediate pubs/subs across
  // different components
  publisherRegistery = {},
  // when component publishers are added, they register themselves here.
  // this allows us to quickly determing if a component needs to publish stuff,
  // and what properties it should publish to
  subscriberRegistery = {};
  // when component subscribers are added, they register themselves here.
  // this allows us to determine which component(s) should update when properties are published

/**
 * convert publishable props to objects (or arrays of objects)
 * @param  {string|object|array} prop
 * @return {object|array}
 */
function convertPubObjects(prop) {
  if (_.isArray(prop)) {
    return _.map(prop, (part) => _.isString(part) ? { name: part } : part);
  } else if (_.isString(prop)) {
    return { name: prop }; // convert to object
  } else {
    return prop; // already an object
  }
}

/**
 * register publishers and subscribers for a component
 * note: exported for testing
 * @param  {string} name   of component
 * @param  {object} schema
 */
export function register(name, schema) {
  _.forOwn(schema, (field, fieldName) => {
    // register publisher, if it exists
    if (_.isObject(field) && field[pubProp]) {
      const pub = field[pubProp];

      publisherRegistery[name] = publisherRegistery[name] || {};
      publisherRegistery[name][fieldName] = convertPubObjects(pub); // may be array or object
    }

    // register subscriber, if it exists
    if (_.isObject(field) && field[subProp]) {
      const prop = field[subProp];

      if (_.isArray(prop)) {
        _.each(prop, (p) => {
          subscriberRegistery[p] = subscriberRegistery[p] || {};
          subscriberRegistery[p][name] = subscriberRegistery[p][name] || new Set();
          subscriberRegistery[p][name].add(fieldName);
        });
      } else {
        subscriberRegistery[prop] = subscriberRegistery[prop] || {};
        subscriberRegistery[prop][name] = subscriberRegistery[prop][name] || new Set();
        subscriberRegistery[prop][name].add(fieldName);
      }
    }
  });
}

/**
 * unregister all components from pubsub
 * note: exported for testing
 */
export function unregisterAll() {
  publisherRegistery = {};
  subscriberRegistery = {};
  callStacks = {};
}

/**
 * add subscribers for kiln page list
 * note: other components cannot subscribe to internal kiln props
 * note: exported for testing
 */
export function registerPageList() {
  subscriberRegistery.kilnTitle = { kiln: new Set(['title']) };
  subscriberRegistery.kilnAuthors = { kiln: new Set(['authors']) };
}

// istanbul ignore next

/**
 * register all schemas after they're preloaded (on initial page load)
 * @param  {object} schemas
 */
function registerAll(schemas) {
  _.forOwn(schemas, (schema, name) => register(name, schema));
}

/**
 * pubsub plugin
 * registers publishers and subscribers whenever we add new schemas
 * those subscribers update ALL instances of a component when their subscribed properties change
 * @param  {object} store
 */
export default function pubsub(store) {
  // after schemas are loaded (and when loading any new schemas),
  // parse them for new publishers and subscribers
  store.subscribe((mutation) => {
    /* istanbul ignore if */
    if (mutation.type === PRELOAD_SUCCESS) {
      registerAll(_.get(store, 'state.schemas'));
      registerPageList();
    } else if (mutation.type === ADD_SCHEMA) {
      register(mutation.payload.name, mutation.payload.data);
    }
  });
}

/**
 * determine if a component has anything it needs to publish
 * @param  {string} name
 * @return {boolean}
 */
function shouldPublish(name) {
  return _.isObject(publisherRegistery[name]) && !!_.size(publisherRegistery[name]);
}

/**
 * determine if a property has any subscribers
 * @param  {string}  prop
 * @return {boolean}
 */
function hasSubscribers(prop) {
  return _.isObject(subscriberRegistery[prop]) && !!_.size(subscriberRegistery[prop]);
}

/**
 * components should not have their subscriptions triggered if they've already published
 * @param  {string} name
 * @param  {string} eventID
 * @return {boolean}
 */
function shouldSubscribe(name, eventID) {
  return !_.includes(callStacks[eventID], name);
}

/**
 * set payload values for property to publish
 * @param {object} prop
 * @param {object} payload  to modify
 * @param {*} value    to publish
 * @param {string} eventID
 * @param {string} uri
 */
function setPayload(prop, payload, value, eventID, uri) { // eslint-disable-line
  const propName = prop.name,
    propScope = prop.scope;

  if (hasSubscribers(propName)) {
    // there are subscribers to this property!
    // see if they should subscribe (e.g. they haven't already published) and construct
    // a payload of the data that needs to be sent to these components
    _.forOwn(subscriberRegistery[propName], (subscribedFields, subscriberName) => {
      if (shouldSubscribe(subscriberName, eventID)) {
        payload[subscriberName] = {
          data: _.reduce(Array.from(subscribedFields), (subData, subscribedField) => _.assign(subData, { [subscribedField]: value }), _.get(payload, `${subscriberName}.data`, {})),
          scope: propScope,
          publisherURI: uri
        };
      }
    });
  }
}

/**
 * quickly determine if a component contains another component
 * by looking at the dom
 * @param  {string}  parent uri
 * @param  {string}  child  uri
 * @return {Boolean}
 */
function isComponentInside(parent, child) {
  return !!find(`[${refAttr}="${parent}"] [${refAttr}="${child}"]`);
}

/**
 * determine if a subscriber fits the publisher's scope
 * note: allowed scopes are currently 'children', 'parent', and 'global'
 * @param  {string} scope
 * @param  {string} publisherURI
 * @param  {string} subscriberURI
 * @return {boolean}
 */
function subscriberInScope(scope, publisherURI, subscriberURI) {
  if (scope === 'global') {
    // 'global' scope is the default
    return true;
  } else if (_.includes(['children', 'child'], scope)) {
    // 'children' only publish to components inside the publisher
    return isComponentInside(publisherURI, subscriberURI);
  } else if (_.includes(['parents', 'parent'], scope)) {
    // 'parents' only publish to components that contain the publisher
    return isComponentInside(subscriberURI, publisherURI);
  } else {
    throw new Error(`Unable to determine scope for "${scope}" in ${getComponentName(publisherURI)}`);
  }
}

/**
 * update all instances of a component
 * @param  {string} eventID
 * @param  {boolean} [snapshot]
 * @param  {object} store
 * @return {function}
 */
function updateComponentInstances(eventID, snapshot, store) {
  return (payload, name) => {
    const { data, scope, publisherURI } = payload;

    if (name === 'kiln') {
      // we're updating the page list!
      return store.dispatch('updatePageList', data);
    } else {
      // we're updating other components on the page!
      // get all their instances from the store,
      // then see if there's any scoping to the published stuff
      // then update them
      const instances = _.filter(Object.keys(store.state.components), (uri) => _.includes(uri, `${componentRoute}${name}/`));

      return Promise.all(_.compact(_.map(instances, (uri) => {
        if (scope && subscriberInScope(scope, publisherURI, uri)) {
          // subscriber is in scope!
          return store.dispatch('saveComponent', { uri, data, eventID, snapshot });
        } else if (scope) {
          // not in scope!
          return;
        } else {
          // no scope!
          return store.dispatch('saveComponent', { uri, data, eventID, snapshot });
        }
      })));
    }
  };
}

/**
 * update all subscribing components
 * @param  {object} payload
 * @param  {string} eventID
 * @param  {boolean} [snapshot]
 * @param {object} store
 * @return {Promise}
 */
function updateSubscribers(payload, eventID, snapshot, store) {
  return props(_.mapValues(payload, updateComponentInstances(eventID, snapshot, store)));
}

/**
 * publish properties
 * note: this is called after model.js runs
 * @param  {string} uri
 * @param  {Object} data
 * @param {string} [eventID]
 * @param {boolean} [snapshot]
 * @param {object} store
 * @returns {Promise}
 */
export function publish(uri, data, eventID, snapshot, store) { // eslint-disable-line
  const name = getComponentName(uri);

  let payload = {};

  // if the component has nothing to publish, resolve quickly
  if (!shouldPublish(name)) {
    return Promise.resolve(data);
  }

  // generate eventID if it wasn't passed in
  eventID = eventID || /* istanbul ignore next */ cuid();

  // create or add callstack for this eventID
  callStacks[eventID] = callStacks[eventID] || [];
  callStacks[eventID].push(name);

  // construct a payload of props + values that should publish from this component,
  // keyed by the potential subscribing comnponents
  _.forOwn(publisherRegistery[name], (prop, field) => {
    const value = data[field];

    if (_.isArray(prop)) {
      _.each(prop, (p) => {
        setPayload(p, payload, value, eventID, uri);
      });
    } else {
      setPayload(prop, payload, value, eventID, uri);
    }
  });

  // update all the subscribed components, then return the original component's data
  return updateSubscribers(payload, eventID, snapshot, store).then(() => data);
}
