<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/animations';
  @import '../../styleguide/layers';
  @import '../../styleguide/clay-menu-columns';

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
        display: flex;
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

  .mobile-nav-dropdown{
    .ui-menu-option__text {
      text-transform: capitalize;
    }
  }

</style>

<template>
  <transition name="nav-menu" v-if="displayNavMenu">
    <nav class="nav-menu">
      <!-- nav menu buttons on small viewport (< 600px) -->
      <ui-icon-button class="nav-menu-button-small" buttonType="button" type="secondary" color="white" icon="arrow_back" @click="closeNav"></ui-icon-button>

      <ui-button buttonType="button" class="nav-menu-button-small nav-menu-button-small-white" type="primary" color="none" has-dropdown>
        <span class="nav-button-small-text">{{ currentDrawerName }}</span>
        <ui-menu class="mobile-nav-dropdown" slot="dropdown" :options="mobileNavOptions" @select="openNav"></ui-menu>
      </ui-button>
      <div class="nav-menu-divider-small"></div>
      <ui-icon-button class="nav-menu-button-small" buttonType="button" color="white" type="secondary" :icon="newPageOption.icon" tooltip="newPageOption.label" @click="newPageOption.action(newPageOption.id)"></ui-icon-button>
      <ui-icon-button class="nav-menu-button-small" buttonType="button" color="white" type="secondary" icon="more_vert" has-dropdown ref="dropdownButton">
        <ui-menu slot="dropdown" :options="settingsOptions" @close="$refs.dropdownButton.closeDropdown()" @select="selectSettingsOption"></ui-menu>
      </ui-icon-button>

      <!-- nav menu buttons on large viewport (600px+) -->
      <nav-menu-button id="close" icon="arrow_back" size="large" @nav-click="closeNav">Clay</nav-menu-button>
      <nav-menu-button v-for="option in desktopNavOptions" :id="option.id" @nav-click="option.action" :key="option.id">{{option.label}}</nav-menu-button>

      <!-- custom nav buttons -->
      <component v-for="(button, index) in customButtons" :is="button" :key="index"></component>
      <div class="nav-menu-divider"></div>
      <nav-menu-button v-for="option in settingsOptions" :id="option.id" @nav-click="option.action" :key="option.id">{{ option.label }}</nav-menu-button>
    </nav>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import { setItem } from '../utils/local';
  import { logoutRoute } from '../utils/references';
  import navMenuButton from './nav-menu-button.vue';
  import UiIconButton from 'keen/UiIconButton';
  import UiMenu from 'keen/UiMenu';
  import UiButton from 'keen/UiButton';

  export default {
    computed: {
      customButtons() {
        return Object.keys(_.get(window, 'kiln.navButtons', {}));
      },
      displayNavMenu() {
        if (this.navShouldBeOpen && !this.navBackgroundIsOpen) {
          this.$store.dispatch('showNavBackground');
        }

        return this.navShouldBeOpen;
      },
      navShouldBeOpen() {
        return this.menuOptions.find(option => option.id === this.currentDrawer) || this.customButtons.find(button => button === this.currentDrawer);
      },
      navBackgroundIsOpen() {
        return _.get(this.$store, 'state.ui.showNavBackground');
      },
      isAdmin() {
        return _.get(this.$store, 'state.user.auth') === 'admin';
      },
      currentDrawer() {
        return _.get(this.$store, 'state.ui.currentDrawer');
      },
      currentDrawerName() {
        const activeDrawer = this.menuOptions.find(option => option.id === this.currentDrawer);

        return activeDrawer ? activeDrawer.label : this.currentDrawer;
      },
      desktopNavOptions() {
        return this.menuOptions.filter(option => option.desktopNav);
      },
      mobileNavOptions() {
        let mobileNavOptions = this.menuOptions.filter(option => option.mobileNav);


        return [...mobileNavOptions, ...this.customButtons];
      },
      settingsOptions() {
        return this.menuOptions.filter(option => option.settings && (option.adminOnly && this.isAdmin || !option.adminOnly));
      },
      newPageOption() {
        return this.menuOptions.find(option => option.id === 'new-page');
      },
      menuOptions() {
        return [{
          id: 'my-pages',
          label: 'My Pages',
          disabled: this.currentDrawer === 'my-pages',
          action: this.openNav,
          desktopNav: true,
          mobileNav: true
        },
        {
          id: 'all-pages',
          label: 'All Pages',
          disabled: this.currentDrawer === 'all-pages',
          action: this.openNav,
          desktopNav: true,
          mobileNav: true
        },
        {
          id: 'new-page',
          label: 'New Page',
          action: this.openNav,
          desktopNav: true,
          icon: 'add'
        },
        {
          id: 'users',
          label: 'Users',
          action: this.openNav,
          settings: true,
          adminOnly: true
        },
        {
          id: 'signout',
          label: 'Sign Out',
          action: this.signout,
          settings: true
        }
        ];
      }
    },
    methods: {
      openNav(id) {
        id = _.isString(id) ? id : id.id;
        setItem('claymenu:activetab', id);

        return this.$store.dispatch('toggleDrawer', id);
      },
      signout() {
        window.location.href = _.get(this.$store, 'state.site.path') + logoutRoute;
      },
      closeNav() {
        this.$store.dispatch('closeDrawer');
        this.$store.dispatch('hideNavBackground');
      },
      selectSettingsOption(settingsOption) {
        if (settingsOption) {
          settingsOption.action(settingsOption.id);
        }
      },
      currentDrawerForAdminsOnly() {
        if (!this.currentDrawer) {
          return false;
        }

        let requiresAdmin = this.menuOptions.find(option => option.adminOnly && option.id === this.currentDrawer);

        return !!requiresAdmin;
      },
      openFirstAllowedNav() {
        this.openNav(this.menuOptions.find(option => !option.adminOnly).id);
      }
    },
    updated() {
      if (!this.isAdmin && this.currentDrawerForAdminsOnly()) {
        this.openFirstAllowedNav();
      }
    },
    components: _.merge({
      'nav-menu-button': navMenuButton,
      UiIconButton,
      UiMenu,
      UiButton
    }, _.get(window, 'kiln.navButtons', {}))
  };
</script>
