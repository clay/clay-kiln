<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/layers';
  @import '../../styleguide/animations';

  .nav-background {
    @include overlay-layer();

    background-color: rgba($md-blue-grey-900, $text-opacity);
    display: block;
    height: 100%;
    left: 0;
    opacity: 1;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    position: fixed;
    top: 0;
    width: 100%;
  }

  .nav-fade-enter-active, .nav-fade-leave-active {
    transition: opacity 350ms $standard-curve;
  }

  .nav-fade-enter, .nav-fade-leave-to {
    opacity: 0;
  }

  /* don't scroll the page when left nav is open */
  .nav-noscroll {
    height: 100%;
    overflow: hidden;
  }
</style>

<template>
  <transition name="nav-fade" v-if="displayBackground">
      <div class="nav-background" @click.stop="closeNav">
        <slot></slot>
      </div>
  </transition>
</template>


<script>
  import _ from 'lodash';

  const noscrollClass = 'nav-noscroll',
    htmlElement = document.documentElement;

  /**
   * Toggle the `noscroll` class
   * @param  {Boolean} show
   */
  function toggleNoScroll(show) {
    if (show) {
      htmlElement.classList.add(noscrollClass);
    } else if (!show && htmlElement.classList.contains(noscrollClass)) {
      htmlElement.classList.remove(noscrollClass);
    }
  }

  export default {
    props: [],
    data() {
      return {};
    },
    computed: {
      displayBackground() {
        const navIsOpen = !!_.get(this.$store, 'state.ui.currentNav');

        // Toggle the `noscroll` class
        toggleNoScroll(navIsOpen);
        // Return test
        return navIsOpen;
      }
    },
    methods: {
      closeNav() {
        return this.$store.dispatch('closeNav');
      }
    }
  };
</script>
