<template>
  <div class="kiln-wrapper">
    <background></background>
    <overlay></overlay>
    <div class="kiln-toolbar-wrapper">
      <pane></pane>
      <div class="kiln-status"></div>
      <div class="kiln-progress-wrapper"></div>
      <section class="kiln-toolbar edit-mode">
        <toolbar-button class="clay-menu-button" icon-name="clay-menu" text="Clay" centered="false"></toolbar-button>
        <toolbar-button class="new" icon-name="new-page" text="New Page"></toolbar-button>
        <div class="kiln-toolbar-inner">
          <toolbar-button class="view-button" name="close" icon-name="close-edit" @click="stopEditing"></toolbar-button>
          <toolbar-button class="components" name="components" icon-name="search-page" text="Components"></toolbar-button>
          <div class="flex-span flex-span-inner"></div>
          <toolbar-button class="preview" name="preview" icon-name="new-tab" text="Preview"></toolbar-button>
        </div>
        <toolbar-button v-if="isLoading" class="publish loading" name="publish" icon-name="draft" text="Loading&hellip;"></toolbar-button>
        <toolbar-button v-else-if="pageState.scheduled" class="publish scheduled" name="publish" icon-name="scheduled" text="Scheduled"></toolbar-button>
        <toolbar-button v-else-if="pageState.published" class="publish published" name="publish" icon-name="published" text="Published"></toolbar-button>
        <toolbar-button v-else class="publish draft" name="publish" icon-name="draft" text="Draft"></toolbar-button>
      </section>
    </div>

  </div>
</template>

<script>
  import { mapState } from 'vuex';
  import toggleEdit from '../utils/toggle-edit';
  import button from './toolbar-button.vue';
  import background from './background.vue';
  import overlay from '../forms/overlay.vue';
  import pane from '../panes/pane.vue';

  export default {
    computed: mapState({
      pageState: (state) => state.page.state,
      isLoading: 'isLoading'
    }),
    components: {
      'toolbar-button': button,
      background,
      overlay,
      pane
    },
    methods: {
      stopEditing() {
        toggleEdit();
      }
    }
  };
</script>
