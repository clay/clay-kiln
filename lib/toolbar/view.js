import { find } from '@nymag/dom';
import { mapState } from 'vuex';
import store from '../core-data/store';
import { PRELOAD_PENDING, PRELOAD_SUCCESS } from '../preloader/mutationTypes';
import icon from '../templates/icon.vue';

const tpl = find('.kiln-toolbar-template');

export default {
  el: '.kiln-toolbar-template',
  template: tpl.innerHTML, // todo: pull out actual template into vue template, so we can simply use the runtime
  store,
  computed: mapState({
    pageState: (state) => state.page.state,
    isLoading: 'isLoading'
  }),
  components: {
    icon
  },
  methods: {
    toggleLoading() {
      if (!this.$store.state.isLoading) {
        this.$store.commit(PRELOAD_PENDING);
      } else {
        this.$store.commit(PRELOAD_SUCCESS, this.$store.state);
      }
    }
  }
};
