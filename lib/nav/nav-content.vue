<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/animations';
  @import '../../styleguide/layers';

  .nav-content {
    @include nav-layer();

    background-color: $card-bg-color;
    height: calc(100vh - 48px);
    max-width: 100vw;
    position: fixed;
    left: 0;
    top: 48px;
    width: 100%;

    @media screen and (min-width: 600px) {
      height: 100%;
      left: 200px;
      top: 0;
      width: auto;
    }
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
    <keep-alive>
      <component class="nav-content" v-if="currentNav" :is="currentNav" keep-alive></component>
    </keep-alive>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import newPage from './new-page.vue';
  import users from './users.vue';
  import myPages from './my-pages.vue';
  import allPages from './all-pages.vue';

  export default {
    computed: {
      currentNav() {
        return _.get(this.$store, 'state.ui.currentNav');
      }
    },
    components: {
      'new-page': newPage,
      users,
      'my-pages': myPages,
      'all-pages': allPages
    }
  };
</script>
