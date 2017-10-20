<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/animations';
  @import '../../styleguide/layers';

  .nav-content {
    @include nav-layer();

    background-color: $card-bg-color;
    height: 100%;
    position: fixed;
    left: 200px;
    top: 0;
  }

  .nav-content-enter,
  .nav-content-leave-to {
    opacity: 0;
  }

  .nav-content-enter-to,
  .nav-content-leave {
    opacity: 1;
  }

  .nav-content-enter-active,
  .nav-content-leave-active {
    transition: opacity $standard-time $standard-curve;
  }
</style>

<template>
  <transition name="nav-content" mode="out-in">
    <component class="nav-content" v-if="currentNav" :is="currentNav"></component>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import newPage from './new-page.vue';
  import users from './users.vue';

  export default {
    computed: {
      currentNav() {
        return _.get(this.$store, 'state.ui.currentNav');
      }
    },
    components: {
      'new-page': newPage,
      users
    }
  };
</script>
