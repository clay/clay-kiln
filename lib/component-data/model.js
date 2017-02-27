import _ from 'lodash';
import { timeout } from 'promise-timeout';
import { attempt } from '../utils/promises';
import { getModel, getLocals } from '../core-data/components';

const MODEL_SAVE_TIMEOUT = 500, // timeout for model.js pre-save hook
  MODEL_RENDER_TIMEOUT = 300; // timeout for model.js pre-render hook. should be smaller than pre-save

/**
 * call a component's model.js pre-save hook
 * @param  {string} uri
 * @param  {object} data
 * @return {Promise}
 */
export function save(uri, data) {
  const model = getModel(uri);

  if (_.isFunction(model.save)) {
    return timeout(attempt(() => model.save(uri, data, getLocals())), MODEL_SAVE_TIMEOUT);
  } else {
    return Promise.resolve(data);
  }
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