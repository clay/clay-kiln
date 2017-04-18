<style lang="sass">
  @import '../../styleguide/panes';

  .kiln-toolbar-pane {
    @include pane();
  }

  .pane-slide-enter, .pane-slide-leave-active {
    transform: translate3d(0, 100%, 0);
  }
</style>

<template>
  <transition name="pane-slide">
    <div class="kiln-toolbar-pane" v-if="hasOpenPane" :class="[position, size]" :style="{ left: offsetLeft }" @click.stop>
      <pane-header :title="headerTitle" :buttonClick="closePane" check="close-edit" :clayHeader="clayHeader"></pane-header>
      <component v-if="singleTab" :is="singleComponent" :args="singleComponentArgs"></component>
      <pane-tabs v-else :content="content"></pane-tabs>
    </div>
  </transition>
</template>


<script>
  import _ from 'lodash';
  import { mapState } from 'vuex';
  import paneHeader from './pane-header.vue';
  import paneTabs from './pane-tabs.vue';

  // these are the pane widths we support
  const widths = {
    small: 350,
    medium: 500,
    large: 600
  };

  export default {
    data() {
      return {};
    },
    computed: mapState({
      hasOpenPane: (state) => _.isObject(state.ui.currentPane) && !state.ui.currentPane.transitioning,
      // note: 'transitioning' is a special property that's set when panes are transitioning
      position: (state) => _.get(state, 'ui.currentPane.position') || 'left',
      size: (state) => _.get(state, 'ui.currentPane.size') || 'small',
      offsetLeft(state) {
        const offset = _.get(state, 'ui.currentPane.offset') || {};

        if (this.position === 'left' && offset.left + widths[this.size] > window.innerWidth) {
          return `${offset.left + offset.width - widths[this.size]}px`;
        } else {
          return `${offset.left}px`;
        }
      },
      content: (state) => _.get(state, 'ui.currentPane.content'),
      singleTab() {
        return !_.isArray(this.content);
      },
      singleComponent() {
        return _.get(this, 'content.component');
      },
      singleComponentArgs() {
        return _.get(this, 'content.args');
      },
      headerTitle: (state) => _.get(state, 'ui.currentPane.title') || 'Pane',
      clayHeader: (state) => _.get(state, 'ui.currentPane.clayHeader')
    }),
    methods: {
      closePane() {
        this.$store.dispatch('closePane');
      }
    },
    components: _.assign(window.kiln.panes, {
      'pane-tabs': paneTabs,
      'pane-header': paneHeader
    })
  };
</script>
