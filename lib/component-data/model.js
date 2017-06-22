import _ from 'lodash';
import { attempt, timeout } from '../utils/promises';
import { getModel, getLocals } from '../core-data/components';
import { publish } from './pubsub';

const MODEL_SAVE_TIMEOUT = 4000, // timeout for model.js pre-save hook
  MODEL_RENDER_TIMEOUT = 1000; // timeout for model.js pre-render hook. should be smaller than pre-save

/**
 * call a component's model.js pre-save hook
 * @param  {string} uri
 * @param  {object} data
 * @param {string} [eventID]
 * @param {boolean} [snapshot]
 * @return {Promise}
 */
export function save(uri, data, {eventID, snapshot}) {
  const model = getModel(uri);

  let promise;

  if (_.isFunction(model.save)) {
    promise = timeout(attempt(() => model.save(uri, data, getLocals())), MODEL_SAVE_TIMEOUT);
  } else {
    promise = Promise.resolve(data);
  }

  // publish changes for other components AFTER running through model.js (if component has one)
  // note: components with server.js will never call this, and cannot publish to properties
  // (though they can subscribe to changes)
  return promise.then((dataToPersist) => {
    publish(uri, dataToPersist, eventID, snapshot);
    return dataToPersist;
  });
}

/**
 * call a component's model.js pre-render hook
 * @param  {string} uri
 * @param  {object} data
 * @return {Promise}
 */
export function render(uri, data) {
  const model = getModel(uri);

  if (_.isFunction(model.render)) {
    return timeout(attempt(() => model.render(uri, data, getLocals())), MODEL_RENDER_TIMEOUT);
  } else {
    return Promise.resolve(_.assign(data));
  }
}
