import pubsub from '../component-data/pubsub';
import undo from '../undo/plugin';

// note: external plugins might be added after DOMContentLoaded,
// so we manually add them in edit.js
const plugins = [pubsub, undo];

export default plugins;
