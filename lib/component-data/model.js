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

  console.log('should call model.save?')

  if (_.isFunction(model.save)) {
    console.log('yes, call model.save with: ', data)
    return timeout(attempt(() => model.save(uri, data, getLocals())), MODEL_SAVE_TIMEOUT);
  } else {
    console.log('no', data)
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

  console.log('should call model.render?')

  if (_.isFunction(model.render)) {
    console.log('yes, call model.render with: ', data)
    return timeout(attempt(() => model.render(uri, data, getLocals())), MODEL_RENDER_TIMEOUT);
  } else {
    console.log('no', data)
    return Promise.resolve(_.assign(data));
  }
}
