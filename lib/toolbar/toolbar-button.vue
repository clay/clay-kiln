<template>
  <button class="kiln-toolbar-button" @click.stop="handleClick">
    <div class="button-flex-inner">
      <icon :name="iconName"></icon>
      <span class="text" v-if="text" v-html="text"></span>
    </div>
  </button>
</template>

<script>
  import { get } from 'lodash'
  import paneContent from './pane-content';
  import icon from '../utils/icon.vue';
  import { OPEN_PANE, CLOSE_PANE } from '../panes/mutationTypes';

  export default {
    props: ['iconName', 'name', 'text'],
    data() {
      return {};
    },
    methods: {
      handleClick() {
        var currentPaneName = get(this.$store, 'state.ui.currentPane.name', null),
          paneName = this.name || this.iconName;

        if (currentPaneName !== paneName) {
          this.$store.commit(OPEN_PANE, { name: paneName, previous: currentPaneName, options: paneContent[paneName]});
        } else {
          this.$store.commit(CLOSE_PANE, null);
        }
      }
    },
    components: {
      icon
    }
  };
</script>
