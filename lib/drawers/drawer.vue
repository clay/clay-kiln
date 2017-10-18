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

    .ui-tabs__body {
      border: none;
      height: calc(100% - 48px);
      padding: 0;
    }

    .ui-tab {
      height: 100%;
    }
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
    <ui-tabs v-if="isDrawerOpen" class="right-drawer" backgroundColor="clear" :fullwidth="true">
      <ui-tab v-for="tab in tabs" :title="tab.title">
        <component :is="tab.component"></component>
      </ui-tab>
    </ui-tabs>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import UiTabs from 'keen/UiTabs';
  import UiTab from 'keen/UiTab';
  import contributors from './contributors.vue';
  import addContributor from './add-contributor.vue';

  export default {
    computed: {
      name() {
        return _.get(this.$store, 'state.ui.currentDrawer');
      },
      isDrawerOpen() {
        return !!this.name;
      },
      tabs() {
        if (this.name === 'contributors') {
          return [{
            title: 'Contributors',
            component: 'contributors'
          }, {
            title: 'Invite To Page',
            component: 'add-contributor'
          }];
        }
      }
    },
    components: {
      UiTabs,
      UiTab,
      contributors,
      'add-contributor': addContributor
    }
  };
</script>
