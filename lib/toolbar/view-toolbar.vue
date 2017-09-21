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

    // don't span full width
    width: auto;

    &.small {
      width: 350px;
    }

    &.medium {
      width: 500px;
    }

    &.large {
      width: 600px;
    }

    &.xlarge {
      width: 800px;
    }

    .publish {
      margin: 0 0 0 -3px;
      padding: 7px 16px 6px 22px;
      position: relative;

      &:before {
        background-color: $toolbar-view;
        content: '';
        height: 100%;
        position: absolute;
        right: 100%;
        top: 0;
        transform: skewX(-14deg) translateX(6px);
        width: 12px;
      }
    }
  }
</style>

<template>
  <div class="kiln-wrapper">
    <background></background>
    <div class="kiln-toolbar-wrapper">
      <pane></pane>
      <section class="kiln-toolbar view-mode" :class="paneSize">
        <toolbar-button class="clay-menu-button" icon-name="menu" text="Clay" @click="toggleMenu"></toolbar-button>

        <toolbar-button v-if="isLoading" class="publish loading" icon-name="create" text="Edit" @click="startEditing"></toolbar-button>
        <toolbar-button v-else-if="pageState.scheduled" class="publish scheduled" icon-name="schedule" text="Edit" @click="startEditing"></toolbar-button>
        <toolbar-button v-else-if="pageState.published" class="publish published" icon-name="check_circle" text="Edit" @click="startEditing"></toolbar-button>
        <toolbar-button v-else class="publish draft" icon-name="create" text="Edit" @click="startEditing"></toolbar-button>
      </section>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { mapState } from 'vuex';
  import toggleEdit from '../utils/toggle-edit';
  import { getItem } from '../utils/local';
  import button from './toolbar-button.vue';
  import background from './background.vue';
  import pane from '../panes/pane.vue';

  export default {
    computed: mapState({
      pageState: (state) => state.page.state,
      isLoading: 'isLoading',
      paneSize: (state) => state.ui.currentPane ? state.ui.currentPane.size || 'small' : null,
      customButtons() {
        return Object.keys(window.kiln.toolbarButtons);
      }
    }),
    methods: {
      startEditing() {
        toggleEdit();
      },
      toggleMenu(name, button) {
        return getItem('claymenu:activetab').then((savedTab) => {
          const activeTab = savedTab || 'All Pages',
            options = {
              name,
              title: 'Clay Menu',
              saveTab: 'claymenu',
              size: 'xlarge',
              height: 'tall',
              clayHeader: true,
              content: [{
                header: 'My Pages',
                active: activeTab === 'My Pages',
                content: {
                  component: 'page-list',
                  args: {
                    isMyPages: true
                  }
                }
              },{
                header: 'All Pages',
                active: activeTab === 'All Pages', // note: this is the default
                content: {
                  component: 'page-list'
                }
              }, {
                header: 'New Page',
                active: activeTab === 'New Page',
                content: {
                  component: 'new-page'
                }
              }]
            };

          return this.$store.dispatch('togglePane', { options, button });
        });
      }
    },
    components: _.merge({
      'toolbar-button': button,
      background,
      pane
    }, window.kiln.toolbarButtons)
  };
</script>
