import { assign } from 'lodash';
import preloader from '../preloader/actions';
import { select, unselect } from '../decorators/actions';

const actions = assign({}, {
  preload: preloader,
  select,
  unselect
});

export default actions;
