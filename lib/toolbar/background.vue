<style lang="sass">
  .fade-enter-active, .fade-leave-active {
    transition: opacity 350ms
  }
  .fade-enter, .fade-leave-to /* .fade-leave-active in <2.1.8 */ {
    opacity: 0
  }
</style>

<template>
  <transition name="fade" v-if="displayBackground">
      <div class="editor-overlay-background">
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
    }
  };
</script>
