<style lang="sass">
  @import '../../styleguide/typography';
  @import '../../styleguide/buttons';

  $pane-margin: 30vh;
  $easeOutExpo: cubic-bezier(.190, 1.000, .220, 1.000);
  $toolbar-height: 48px;

  .kiln-toolbar-pane {
    @include primary-text();

    background-color: $white;
    bottom: 0;
    box-shadow: 0 0 30px 0 $overlay-shadow;
    cursor: auto;
    display: flex;
    flex-direction: column;
    height: auto;
    justify-content: flex-start;
    margin: 0;
    max-height: 100 - $pane-margin;
    max-width: 320px;
    min-height: 400px;
    min-width: 200px;
    padding: 0;
    position: absolute;
    transition: transform 350ms $easeOutExpo;
    width: 100%;

    @media screen and (min-width: 600px) {
      width: 90%;

      &.kiln-toolbar-pane-large {
        max-width: 500px;
      }

      &.kiln-toolbar-pane-form {
        max-width: 600px;
        left: 50%;
        margin-left: -300px;
      }
    }

    @media screen and (min-width: 1024px) {
      width: 80%;
    }
  }

  .pane-slide-enter, .pane-slide-leave-active {
    transform: translate3d(0, 100%, 0);
  }
</style>

<template>
  <transition name="pane-slide">
    <div class="kiln-toolbar-pane" v-if="hasOpenPane" :class="[ position, size, { 'kiln-pane-form': isForm } ]" :style="{ left: offsetLeft }" @click.stop>
      <pane-header :title="headerTitle" :buttonClick="closePane" :check="headerIcon"></pane-header>
      <component v-if="singleTab" :is="contents.component" :content="contents.args"></component>
      <pane-tabs v-else :content="contents"></pane-tabs>
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
    small: 320,
    medium: 500,
    large: 600
  };

  export default {
    props: [],
    data() {
      return {};
    },
    computed: mapState({
      hasOpenPane: (state) => !_.isNull(state.ui.currentPane),
      position: (state) => _.get(state, 'ui.currentPane.position') || 'left',
      size: (state) => _.get(state, 'ui.currentPane.size') || 'small',
      isForm: (state) => _.get(state, 'ui.currentPane.isForm'),
      offsetLeft(state) {
        const offset = _.get(state.ui.currentPane.offset) || {};

        if (this.position === 'left' && offset.left + widths[this.size] > window.innerWidth) {
          return `${offset.left + offset.width - widths[this.size]}px`;
        } else {
          return `${offset.left}px`;
        }
      },
      singleTab(state) {
        const contents = _.get(state, 'ui.currentPane.contents');

        return !_.isArray(contents);
      },
      headerTitle: (state) => _.get(state, 'ui.currentPane.title') || 'Pane',
      headerIcon() {
        return this.isForm ? 'publish-check' : 'close-edit';
      }
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
