import { find } from '@nymag/dom';
import store from '../core-data/store';

const tpl = find('.kiln-toolbar-template');

export default {
  el: '.kiln-toolbar-template',
  template: tpl.innerHTML,
  // replace: false,
  data() {
    return {
      isLoading: this.$select('isLoading'),
      pageState: this.$select('page.state as pageState')
    };
  },
  methods: {
    toggleLoading() {
      if (!this.isLoading) {
        store.dispatch({ type: 'PRELOAD_PENDING' });
      } else {
        store.dispatch({ type: 'PRELOAD_FULFILLED', payload: store.store.getState() });
      }
    }
  }
};
