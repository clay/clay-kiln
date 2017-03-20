import reactiveRender from '../component-data/reactive-render';
import pubsub from '../component-data/pubsub';

// note: external plugins might be added after DOMContentLoaded,
// so we manually add them in edit.js
const plugins = [reactiveRender, pubsub];

export default plugins;
