import _ from 'lodash';
import cuid from 'cuid';
import {
  pubProp, subProp, componentRoute, refProp, getComponentName
} from '../utils/references';
import { ADD_SCHEMA } from './mutationTypes';
import { PRELOAD_SUCCESS } from '../preloader/mutationTypes';
import { props } from '../utils/promises';
import Vue from 'vue';

const vue = new Vue();

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
    return _.map(prop, part => _.isString(part) ? { name: part } : part);
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
 * breadth-first search, grabbing data from the store as we go
 * @param  {object} data  in the parent component
 * @param  {string} uri   (child) uri to search for
 * @param  {object} store
 * @return {boolean}
 */
function recursiveFind(data, uri, store) {
  const uriInData = _.find(data, (val) => {
    if (_.isArray(val)) {
      // array, possibly a component list
      return _.find(val, item => _.isObject(item) && item[refProp] === uri);
    } else if (_.isObject(val)) {
      // object, possibly a component prop
      return val[refProp] === uri;
    } else {
      return false;
    }
  });

  if (uriInData) {
    // hey, we found it!
    return true;
  } else {
    // lol nope, look through the children, ~ ~ ~ r e c u r s i v e l y ~ ~ ~
    const children = _.reduce(data, (childList, val) => {
      if (_.isArray(val) && _.isObject(_.head(val)) && _.has(_.head(val), refProp)) {
        // component list, add all child uris
        return childList.concat(_.map(val, childRef => childRef[refProp]));
      } else if (_.isObject(val) && _.has(val, refProp)) {
        // component prop, add single child uri
        return childList.concat([val[refProp]]);
      } else {
        return childList;
      }
    }, []);

    return _.find(children, (childURI) => {
      const childData = _.get(store, `state.components["${childURI}"]`);

      return recursiveFind(childData, uri, store);
    });
  }
}

/**
 * quickly determine if a component contains another component
 * by looking at the dom
 * @param  {string}  parent uri
 * @param  {string}  child  uri
 * @param {object} parentData
 * @param {object} store
 * @return {Boolean}
 */
function isComponentInside(parent, child, parentData, store) {
  return recursiveFind(parentData, child, store);
}

/**
 * determine if a subscriber fits the publisher's scope
 * note: allowed scopes are currently 'children', 'parent', and 'global'
 * @param  {string} scope
 * @param  {string} publisherURI
 * @param  {string} subscriberURI
 * @param {object} pubData (latest data from pubbing component, not in the store yet)
 * @param {object} store
 * @return {boolean}
 */
function subscriberInScope({
  scope, publisherURI, subscriberURI, pubData, store
}) {
  if (scope === 'global') {
    // 'global' scope is the default
    return true;
  } else if (_.includes(['children', 'child'], scope)) {
    // 'children' only publish to components inside the publisher
    // note: we send the latest data from the publishing component because it's not in the store yet
    // (and subscribing components might have just been added in the current save)
    return isComponentInside(publisherURI, subscriberURI, pubData, store);
  } else if (_.includes(['parents', 'parent'], scope)) {
    // note: if the component is publishing to parents, their data will already contain the uri of the publishing component
    const subData = _.get(store, `state.components['${subscriberURI}']`);

    // 'parents' only publish to components that contain the publisher
    return isComponentInside(subscriberURI, publisherURI, subData, store);
  } else {
    throw new Error(`Unable to determine scope for "${scope}" in ${getComponentName(publisherURI)}`);
  }
}

/**
 * update all instances of a component
 * @param  {string} eventID
 * @param  {boolean} [snapshot]
 * @param {object} pubData
 * @param  {object} store
 * @return {function}
 */
function updateComponentInstances({
  eventID, snapshot, pubData, store
}) {
  return (payload, name) => {
    const { data, scope, publisherURI } = payload;

    if (name === 'kiln') {
      // we're updating the page list!
      return store.dispatch('updatePageList', data);
    } else {
      // we're updating other components on the page!
      // get all their instances from the store,
      // (making sure to ignore deleted/empty instances)
      // then see if there's any scoping to the published stuff
      // then update them
      const instances = _.filter(Object.keys(store.state.components), uri => _.includes(uri, `${componentRoute}${name}/`) && !_.isEmpty(store.state.components[uri]));

      return Promise.all(_.compact(_.map(instances, (uri) => {
        // the saveComponent dispatch is wrapped in a $nextTick to prevent a race condition where one component is subscribed to multiple values, which can result in each subsequent save overwriting the values in the previous ones
        if (scope && subscriberInScope({
          scope, publisherURI, subscriberURI: uri, pubData, store
        })) {
          // subscriber is in scope!
          return vue.$nextTick().then(() => {
            return store.dispatch('saveComponent', {
              uri, data, eventID, snapshot
            });
          });
        } else if (scope) {
          // not in scope!
          return;
        } else {
          // no scope!
          return vue.$nextTick().then(() => {
            return store.dispatch('saveComponent', {
              uri, data, eventID, snapshot
            });
          });
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
 * @param {object} pubData from publishing component
 * @param {object} store
 * @return {Promise}
 */
function updateSubscribers({
  payload, eventID, snapshot, pubData, store
}) {
  return props(_.mapValues(payload, updateComponentInstances({
    eventID, snapshot, pubData, store
  })));
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
  return updateSubscribers({
    payload, eventID, snapshot, pubData: data, store
  }).then(() => data);
}
