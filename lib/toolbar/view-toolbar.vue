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
</style>

<template>
  <div class="kiln-wrapper">
    <background></background>
    <div class="kiln-toolbar-wrapper">
      <pane></pane>
      <progress-bar></progress-bar>
      <status></status>
      <section class="kiln-toolbar view-mode">
        <toolbar-button class="clay-menu-button" icon-name="clay-menu" text="Clay" @click="toggleMenu"></toolbar-button>
        <div class="flex-span flex-span-outer"></div>
        <div class="kiln-toolbar-inner">
          <toolbar-button class="edit-button" icon-name="edit" @click="startEditing"></toolbar-button>
        </div>
        <toolbar-button v-if="isLoading" class="publish loading" icon-name="draft" text="Loading&hellip;"></toolbar-button>
        <toolbar-button v-else-if="pageState.scheduled" class="publish scheduled" icon-name="scheduled" text="Scheduled" @click="togglePublish"></toolbar-button>
        <toolbar-button v-else-if="pageState.published" class="publish published" icon-name="published" text="Published" @click="togglePublish"></toolbar-button>
        <toolbar-button v-else class="publish draft" icon-name="draft" text="Draft" @click="togglePublish"></toolbar-button>
      </section>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex';
  import toggleEdit from '../utils/toggle-edit';
  import progressBar from './progress.vue';
  import button from './toolbar-button.vue';
  import background from './background.vue';
  import pane from '../panes/pane.vue';
  import status from './status.vue';

  export default {
    computed: mapState({
      pageState: (state) => state.page.state,
      isLoading: 'isLoading'
    }),
    methods: {
      startEditing() {
        toggleEdit();
      },
      toggleMenu(name, button) {
        const options = {
          name,
          title: 'Clay Menu',
          size: 'medium',
          clayHeader: true,
          content: [{
            header: 'All Pages',
            content: {
              component: 'page-list'
            }
          }, {
            header: 'New Page',
            content: {
              component: 'new-page'
            }
          }]
        };

        return this.$store.dispatch('togglePane', { options, button });
      },
      togglePublish(name, button) {
        const options = {
          name,
          title: 'Publish',
          content: {
            component: 'view-publish'
          }
        };

        return this.$store.dispatch('togglePane', { options, button });
      }
    },
    components: {
      'toolbar-button': button,
      background,
      pane,
      status,
      'progress-bar': progressBar
    }
  };
</script>
