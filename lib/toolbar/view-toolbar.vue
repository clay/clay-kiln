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
    <background></background>
    <ui-fab size="normal" color="primary" icon="menu" tooltip="Clay Menu" tooltipPosition="right middle" class="view-menu-button"></ui-fab>
    <ui-fab size="small" color="default" icon="mode_edit" tooltip="Edit Page" tooltipPosition="right middle" class="view-edit-button" @click="startEditing"></ui-fab>
  </div>
</template>

<script>
  import toggleEdit from '../utils/toggle-edit';
  import background from './background.vue';
  import UiFab from 'keen/UiFab';

  export default {
    data() {
      return {};
    },
    methods: {
      startEditing() {
        toggleEdit();
      }
    },
    components: {
      background,
      UiFab
    }
  };
</script>
