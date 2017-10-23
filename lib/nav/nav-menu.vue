<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/animations';
  @import '../../styleguide/layers';

  $nav-menu-width: 200px;

  .nav-menu {
    @include nav-layer();

    align-items: center;
    background-color: $pure-black;
    display: flex;
    flex-direction: row;
    height: 48px;
    left: 0;
    position: fixed;
    top: 0;
    width: 100%;

    .nav-menu-button,
    .nav-menu-divider {
      display: none;
    }

    .nav-menu-button-small {
      display: block;
      flex: 0 0 auto;
    }

    .nav-menu-divider-small {
      display: block;
    }

    .nav-menu-button-small-white {
      color: $pure-white;

      &:hover:not(.is-disabled),
      &.has-dropdown-open,
      &.has-focus-ring:focus,
      body[modality="keyboard"] &:focus {
        background-color: $md-blue-grey-900;
      }

      .ui-button__icon,
      .ui-button__dropdown-icon {
        color: $pure-white;
      }

      .ui-ripple-ink__ink {
        opacity: 0.4;
      }
    }

    .nav-button-small-text {
      font-weight: bold;
    }

    @media screen and (min-width: 600px) {
      align-items: flex-start;
      flex-direction: column;
      height: 100%;
      width: $nav-menu-width;

      .nav-menu-button,
      .nav-menu-divider {
        display: block;
      }

      .nav-menu-button-small,
      .nav-menu-divider-small {
        display: none;
      }
    }
  }

  .nav-menu-divider,
  .nav-menu-divider-small {
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
        <!-- nav menu buttons on small viewport (< 600px) -->
        <ui-icon-button class="nav-menu-button-small" type="secondary" color="white" icon="arrow_back" @click="closeNav"></ui-icon-button>
        <ui-button buttonType="button" class="nav-menu-button-small nav-menu-button-small-white" type="primary" color="none" has-dropdown>
          <span class="nav-button-small-text">{{ currentNav }}</span>
          <ui-menu slot="dropdown" :options="navOptions" @select="selectNavOption"></ui-menu>
        </ui-button>
        <div class="nav-menu-divider-small"></div>
        <ui-icon-button class="nav-menu-button-small" color="white" type="secondary" icon="add" tooltip="New Page" @click="openNav('new-page')"></ui-icon-button>
        <ui-icon-button class="nav-menu-button-small" color="white" type="secondary" icon="more_vert" has-dropdown ref="dropdownButton">
          <ui-menu slot="dropdown" :options="settingsOptions" @close="$refs.dropdownButton.closeDropdown()" @select="selectSettingsOption"></ui-menu>
        </ui-icon-button>
        <!-- nav menu buttons on large viewport (600px+) -->
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
  import UiIconButton from 'keen/UiIconButton';
  import UiMenu from 'keen/UiMenu';
  import UiButton from 'keen/UiButton';

  export default {
    computed: {
      displayNavMenu() {
        return !!_.get(this.$store, 'state.ui.currentNav');
      },
      isAdmin() {
        return _.get(this.$store, 'state.user.auth') === 'admin';
      },
      currentNav() {
        const val = _.get(this.$store, 'state.ui.currentNav');

        switch (val) {
          case 'my-pages': return 'My Pages';
          case 'all-pages': return 'All Pages';
          case 'new-page': return 'New Page';
          case 'users': return 'Users';
          default: return 'Clay';
        }
      },
      navOptions() {
        return ['My Pages', 'All Pages'];
      },
      settingsOptions() {
        if (this.isAdmin) {
          return ['Users', 'Sign Out'];
        } else {
          return ['Sign Out'];
        }
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
      },
      selectNavOption(value) {
        switch (value) {
          case 'My Pages': return this.openNav('my-pages');
          case 'All Pages': return this.openNav('all-pages');
          default: return this.closeNav();
        }
      },
      selectSettingsOption(value) {
        if (value === 'Users') {
          this.openNav('users');
        } else {
          this.signout();
        }
      }
    },
    components: {
      'nav-menu-button': navMenuButton,
      UiIconButton,
      UiMenu,
      UiButton
    }
  };
</script>
