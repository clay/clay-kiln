<template>
  <button class="kiln-toolbar-button" @click.stop="handleClick">
    <div class="button-flex-inner">
      <icon :name="iconName"></icon>
      <span class="text" v-if="text" v-html="text"></span>
    </div>
  </button>
</template>

<script>
  import { get, assign } from 'lodash'
  import paneContent from './pane-content';
  import icon from '../utils/icon.vue';
  import { OPEN_PANE, CLOSE_PANE } from '../panes/mutationTypes';

  function getLeftOffset(el) {
    var offsetLeft = el.offsetLeft;

    while (el = el.offsetParent) {
      offsetLeft += el.offsetLeft;
    }

    return offsetLeft;
  }

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
          let paneConfig = {
            name: paneName,
            previous: currentPaneName,
            options: paneContent[paneName],
            paneOffset: {
              left: getLeftOffset(this.$el),
              width: this.$el.offsetWidth
            }
          };

          // If a pane is open
          if (currentPaneName) {
            this.$store.dispatch('changePane', paneConfig);
          } else {
            this.$store.commit(OPEN_PANE, paneConfig);
          }
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
