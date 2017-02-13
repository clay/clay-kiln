<template>
  <div class="kiln-toolbar-wrapper">
    <div class="kiln-status"></div>
    <div class="kiln-progress-wrapper"></div>
    <section class="kiln-toolbar edit-mode">
      <toolbar-button class="clay-menu-button" icon-name="clay-menu" text="Clay"></toolbar-button>
      <toolbar-button class="new" icon-name="new-page" text="New Page"></toolbar-button>
      <div class="kiln-toolbar-inner">
        <toolbar-button class="view-button" icon-name="close-edit" @click="toggleLoading"></toolbar-button>
        <toolbar-button class="components" icon-name="search-page" text="Components"></toolbar-button>
        <div class="flex-span flex-span-inner"></div>
        <toolbar-button class="preview" icon-name="new-tab" text="Preview"></toolbar-button>
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
  import { PRELOAD_PENDING, PRELOAD_SUCCESS } from '../preloader/mutationTypes';
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
      toggleLoading() {
        if (!this.$store.state.isLoading) {
          this.$store.commit(PRELOAD_PENDING);
        } else {
          this.$store.commit(PRELOAD_SUCCESS, this.$store.state);
        }
      }
    }
  };
</script>
