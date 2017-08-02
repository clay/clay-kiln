<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';
  @import '../../styleguide/buttons';

  .kiln-pane-header {
    align-items: center;
    display: flex;
    flex: 0 0 auto;
    border-bottom: 1px solid $pane-header-border;
    justify-content: space-between;

    &-left {
      @include header();

      display: flex;
      flex: 1 0 auto;
      padding-left: 18px;
    }

    .clay-logo {
      align-items: center;
      display: flex;
      flex: 1 0 auto;
      height: 34px;
      // 17px visual border between edge and clay dude's body (not arm)
      margin-left: -4px;
    }

    .sign-out,
    .directory-button {
      @include secondary-text();

      background: none;
      border: none;
      cursor: pointer;
      flex: 0 0 auto;
      margin: 0;
      outline: none;
      padding: 6px 8px;
    }

    &-right {
      &-close {
        @include icon-button($title, 14px);

        padding: 17px;
      }
    }
  }
</style>

<template>
  <div class="kiln-pane-header">
    <div v-if="clayHeader" class="kiln-pane-header-left">
      <icon class="clay-logo" name="clay-logo-horizontal"></icon>
      <button v-if="isAdmin" class="directory-button" @click.stop.prevent="openDirectory">Directory</button>
      <button class="sign-out" @click.stop.prevent="signOut">Sign Out</button>
    </div>
    <div v-else class="kiln-pane-header-left">
      {{ title }}
    </div>
    <div class="kiln-pane-header-right">
      <button type="button" class="kiln-pane-header-right-close" @click="buttonClick"><icon :name="check"></icon></button>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import icon from '../utils/icon.vue';

  export default {
    props: ['title', 'buttonClick', 'check', 'clayHeader'],
    data() {
      return {};
    },
    computed: {
      isAdmin() {
        return _.get(this.$store, 'state.user.auth') === 'admin';
      }
    },
    methods: {
      openDirectory() {
        return this.$store.dispatch('openPane', {
          title: 'Directory',
          position: 'left',
          size: 'small',
          height: 'medium-height',
          content: {
            component: 'directory'
          }
        });
      },
      signOut() {
        window.location.href = _.get(this.$store, 'state.site.path') + '/auth/logout';
      }
    },
    components: {
      icon
    }
  };
</script>
