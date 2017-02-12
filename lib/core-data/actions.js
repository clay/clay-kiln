import { assign } from 'lodash';
import preloader from '../preloader/actions';

const actions = assign({}, { preload: preloader });

export default actions;
