import _ from 'lodash';
import { CREATE_SNAPSHOT } from './mutationTypes';
import { RENDER_COMPONENT } from '../component-data/mutationTypes';

/**
 * creates snapshots by default, but when re-rendering after undoing/redoing we want to
 * explicitly pass snapshot: false to prevent creating new snapshots
 * @param  {object} mutation
 * @return {boolean}
 */
function shouldCreateSnapshot(mutation) {
  return !mutation.payload || mutation.payload.snapshot !== false;
}

export default function (store) {
  const snap = _.debounce(() => store.commit(CREATE_SNAPSHOT), 500);

  store.subscribe((mutation) => {
    if (mutation.type === RENDER_COMPONENT && shouldCreateSnapshot(mutation)) {
      snap();
    }
  });
}
