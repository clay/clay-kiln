<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/animations';

  .right-drawer {
    background-color: $card-bg-color;
    box-shadow: $shadow-2dp;
    height: calc(100vh - 56px);
    position: fixed;
    right: 0;
    top: 56px;
    width: 300px;
  }

  .drawer-enter,
  .drawer-leave-to {
    transform: translateX(310px);
  }

  .drawer-enter-to,
  .drawer-leave {
    transform: translateX(0);
  }

  .drawer-enter-active {
    transition: transform $enter-viewport-time $deceleration-curve;
  }

  .drawer-leave-active {
    transition: transform $leave-viewport-time $sharp-curve;
  }
</style>

<template>
  <transition name="drawer" mode="out-in">
    <component v-if="isDrawerOpen" :is="name" class="right-drawer"></component>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import people from './people.vue';

  export default {
    computed: {
      name() {
        return _.get(this.$store, 'state.ui.currentDrawer');
      },
      isDrawerOpen() {
        return !!this.name;
      }
    },
    components: {
      people
    }
  };
</script>
