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

  export default {
    props: [],
    data() {

      return {}
    },
    computed: {
      displayBackground() {
        var isOverlayForm = !isNull(this.$store.state.ui.currentForm) && this.$store.state.ui.currentForm.schema[displayProp] !== 'inline',
          paneIsOpen = !isNull(this.$store.state.ui.currentPane);


        return isOverlayForm || paneIsOpen;
      }
    }
  };
</script>
