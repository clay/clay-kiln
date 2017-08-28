<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/layers';
  @import '../../styleguide/typography';

  $overlay-margin: 10vh;

  .editor-overlay-background {
    @include overlay-layer();

    background-color: $overlay-background;
    display: block;
    height: 100%;
    left: 0;
    opacity: 1;
    overflow: auto;
    -webkit-overflow-scrolling: touch;
    position: fixed;
    top: 0;
    transform: translateZ(0); // create a new viewport context
    width: 100%;
  }

  .fade-enter-active, .fade-leave-active {
    transition: opacity 350ms ease-out;
  }

  .fade-enter, .fade-leave-to {
    opacity: 0;
  }

  /* don't scroll the page when overlay (or pane) is open */
  .noscroll {
    height: 100%;
    overflow: hidden;
  }
</style>

<template>
  <transition name="fade" v-if="displayBackground">
      <div class="editor-overlay-background" @click.prevent="unsetDragStop">
        <slot></slot>
      </div>
  </transition>
</template>


<script>
  import { isNull } from 'lodash';
  import { displayProp } from '../utils/references';

  const noscrollClass = 'noscroll',
    htmlElement = document.documentElement;

  /**
   * Toggle the `noscroll` class
   * @param  {Boolean} show
   */
  function toggleNoScroll(show) {
    if (show) {
      htmlElement.classList.add(noscrollClass);
    } else if (!show && htmlElement.classList.contains(noscrollClass)){
      htmlElement.classList.remove(noscrollClass);
    }
  }

  export default {
    props: [],
    data() {
      return {}
    },
    computed: {
      displayBackground() {
        var isOverlayForm = !isNull(this.$store.state.ui.currentForm) && this.$store.state.ui.currentForm.schema[displayProp] !== 'inline',
          paneIsOpen = !isNull(this.$store.state.ui.currentPane),
          showbackground = isOverlayForm || paneIsOpen;

        // Toggle the `noscroll` class
        toggleNoScroll(showbackground);
        // Return test
        return showbackground;
      }
    },
    methods: {
      unsetDragStop() {
        // unset isInvalidDrag, so we can click out of overlay/settings forms
        window.kiln.isInvalidDrag = false;
      }
    }
  };
</script>
