<style lang="sass">
  @import '../../styleguide/toolbar';

  .kiln-wrapper {
    @include toolbar-wrapper();

    .view-menu-button {
      margin: 10px;
    }

    .view-edit-button {
      margin: 10px 18px;
    }
  }
</style>

<template>
  <div class="kiln-wrapper">
    <ui-fab size="normal" color="primary" icon="menu" tooltip="Clay Menu" tooltipPosition="right middle" class="view-menu-button" @click="openNav"></ui-fab>
    <ui-fab size="small" color="default" icon="mode_edit" tooltip="Edit Page" tooltipPosition="right middle" class="view-edit-button" @click="startEditing"></ui-fab>
    <nav-background></nav-background>
    <nav-menu></nav-menu>
  </div>
</template>

<script>
  import toggleEdit from '../utils/toggle-edit';
  import { getItem } from '../utils/local';
  import navBackground from '../nav/nav-background.vue';
  import navMenu from '../nav/nav-menu.vue';
  import UiFab from 'keen/UiFab';

  export default {
    data() {
      return {};
    },
    methods: {
      startEditing() {
        toggleEdit();
      },
      openNav() {
        return getItem('claymenu:activetab').then((savedTab) => {
          const activeNav = savedTab || 'all-pages';

          return this.$store.dispatch('openNav', activeNav);
        });
      }
    },
    components: {
      'nav-background': navBackground,
      'nav-menu': navMenu,
      UiFab
    }
  };
</script>
