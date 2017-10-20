<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/animations';
  @import '../../styleguide/layers';

  $nav-menu-width: 200px;

  .nav-menu {
    @include nav-layer();

    background-color: $pure-black;
    display: flex;
    flex-direction: column;
    height: 100%;
    left: 0;
    position: fixed;
    top: 0;
    width: $nav-menu-width;
  }

  .nav-menu-divider {
    flex: 1 0 auto;
  }

  .nav-menu-enter-to,
  .nav-menu-leave {
    transform: translateX(0);
  }

  .nav-menu-enter,
  .nav-menu-leave-to {
    transform: translateX(-$nav-menu-width - 10px);
  }

  .nav-menu-enter-active {
    transition: transform $enter-viewport-time $deceleration-curve;
  }

  .nav-menu-leave-active {
    transition: transform $leave-viewport-time $sharp-curve;
  }
</style>

<template>
  <transition name="nav-menu" v-if="displayNavMenu">
      <nav class="nav-menu">
        <nav-menu-button id="close" icon="arrow_back" size="large" @nav-click="closeNav">Clay</nav-menu-button>
        <nav-menu-button id="my-pages" @nav-click="openNav">My Pages</nav-menu-button>
        <nav-menu-button id="all-pages" @nav-click="openNav">All Pages</nav-menu-button>
        <nav-menu-button id="new-page" icon="add" @nav-click="openNav">New Page</nav-menu-button>
        <div class="nav-menu-divider"></div>
        <nav-menu-button v-if="isAdmin" id="users" @nav-click="openNav">Users</nav-menu-button>
        <nav-menu-button id="signout" @nav-click="signout">Sign Out</nav-menu-button>
      </nav>
  </transition>
</template>


<script>
  import _ from 'lodash';
  import { setItem } from '../utils/local';
  import navMenuButton from './nav-menu-button.vue';

  export default {
    computed: {
      displayNavMenu() {
        return !!_.get(this.$store, 'state.ui.currentNav');
      },
      isAdmin() {
        return _.get(this.$store, 'state.user.auth') === 'admin';
      }
    },
    methods: {
      openNav(id) {
        setItem('claymenu:activetab', id);
        this.$store.dispatch('openNav', id);
      },
      signout() {
        window.location.href = _.get(this.$store, 'state.site.path') + '/auth/logout';
      },
      closeNav() {
        this.$store.dispatch('closeNav');
      }
    },
    components: {
      'nav-menu-button': navMenuButton
    }
  };
</script>
