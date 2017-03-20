import _ from 'lodash';
import reactiveRender from '../component-data/reactive-render';
import pubsub from '../component-data/pubsub';

const externalPlugins = _.values(_.get(window, 'kiln.plugins') || {}),
  plugins = [reactiveRender, pubsub].concat(externalPlugins);

export default plugins;
