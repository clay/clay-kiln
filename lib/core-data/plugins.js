import pubsub from '../component-data/pubsub';
import undo from '../undo/plugin';
import validation from '../validators/plugin';

// note: external plugins might be added after DOMContentLoaded,
// so we manually add them in edit.js
const plugins = [pubsub, undo, validation];
export default plugins;
