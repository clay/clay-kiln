<style lang="sass">
  @import '../../styleguide/toolbar';

  body {
    @include toolbar-padding();
  }

  .kiln-toolbar-wrapper {
    @include toolbar-wrapper();
  }

  .kiln-toolbar {
    @include toolbar();

    .kiln-toolbar-inner {
      // short inner toolbar in view mode
      flex: 0 1 auto;
      right: 0;
      width: auto;
    }
  }

  // edit mode doesn't have a border on this button
  .kiln-toolbar.view-mode .new {
    border-right: 1px solid $toolbar-view-border;
  }
</style>

<template>
  <div class="kiln-toolbar-wrapper">
    <div class="kiln-status"></div>
    <div class="kiln-progress-wrapper"></div>
    <section class="kiln-toolbar view-mode">
      <toolbar-button class="clay-menu-button" icon-name="clay-menu" text="Clay"></toolbar-button>
      <toolbar-button class="new" icon-name="new-page" text="New Page"></toolbar-button>
      <div class="flex-span flex-span-outer"></div>
      <div class="kiln-toolbar-inner">
        <toolbar-button class="edit-button" icon-name="edit" @click="startEditing"></toolbar-button>
      </div>
      <toolbar-button v-if="isLoading" class="publish loading" icon-name="draft" text="Loading&hellip;"></toolbar-button>
      <toolbar-button v-else-if="pageState.scheduled" class="publish scheduled" icon-name="scheduled" text="Scheduled"></toolbar-button>
      <toolbar-button v-else-if="pageState.published" class="publish published" icon-name="published" text="Published"></toolbar-button>
      <toolbar-button v-else class="publish draft" icon-name="draft" text="Draft"></toolbar-button>
    </section>
  </div>
</template>

<script>
  import { mapState } from 'vuex';
  import toggleEdit from '../utils/toggle-edit';
  import button from './toolbar-button.vue';

  export default {
    computed: mapState({
      pageState: (state) => state.page.state,
      isLoading: 'isLoading'
    }),
    components: {
      'toolbar-button': button
    },
    methods: {
      startEditing() {
        toggleEdit();
      }
    }
  };
</script>
