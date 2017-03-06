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
      // full width inner toolbar in edit mode
      flex: 1 1 auto;
      left: 0;
      width: auto;
    }
  }
</style>

<template>
  <div class="kiln-wrapper">
    <background></background>
    <div class="kiln-toolbar-wrapper">
      <pane></pane>
      <overlay></overlay>
      <progress-bar></progress-bar>
      <status></status>
      <section class="kiln-toolbar edit-mode">
        <toolbar-button class="clay-menu-button" icon-name="clay-menu" text="Clay" centered="false" @click="toggleMenu"></toolbar-button>
        <toolbar-button class="new" icon-name="new-page" text="New Page" @click="toggleNewPage"></toolbar-button>
        <div class="kiln-toolbar-inner">
          <toolbar-button class="view-button" name="close" icon-name="close-edit" @click="stopEditing"></toolbar-button>
          <toolbar-button class="components" name="components" icon-name="search-page" text="Search Components" @click="toggleComponents"></toolbar-button>
          <toolbar-button v-if="hasSelectedAddComponent" class="add-component-button" name="add-component" icon-name="add-icon" text="Add Component" @click="openAddComponentPane"></toolbar-button>
          <div class="flex-span flex-span-inner"></div>
          <toolbar-button class="preview" name="preview" icon-name="new-tab" text="Preview" @click="togglePreview"></toolbar-button>
        </div>
        <toolbar-button v-if="isLoading" class="publish loading" name="publish" icon-name="draft" text="Loading&hellip;" @click="togglePublish"></toolbar-button>
        <toolbar-button v-else-if="pageState.scheduled" class="publish scheduled" name="publish" icon-name="scheduled" text="Scheduled" @click="togglePublish"></toolbar-button>
        <toolbar-button v-else-if="pageState.published" class="publish published" name="publish" icon-name="published" text="Published" @click="togglePublish"></toolbar-button>
        <toolbar-button v-else class="publish draft" name="publish" icon-name="draft" text="Draft"></toolbar-button>
      </section>
    </div>
  </div>
</template>

<script>
  import { mapState } from 'vuex';
  import { find } from '@nymag/dom';
  import toggleEdit from '../utils/toggle-edit';
  import { getParentComponent } from '../utils/component-elements';
  import { refAttr, editAttr, selectorClass } from '../utils/references';
  import progressBar from './progress.vue';
  import button from './toolbar-button.vue';
  import background from './background.vue';
  import overlay from '../forms/overlay.vue';
  import pane from '../panes/pane.vue';
  import status from './status.vue';

  export default {
    computed: mapState({
      pageState: (state) => state.page.state,
      isLoading: 'isLoading',
      hasSelectedAddComponent: (state) => {
        const current = state.ui.currentSelection,
          // look in the FIRST component selector inside the selected element.
          // this will be the current component's selector
          selector = current && find(current, `.${selectorClass}`),
          hasAddButton = selector && find(selector, '.selected-add');

        return !!hasAddButton;
      }
    }),
    components: {
      'toolbar-button': button,
      background,
      overlay,
      pane,
      status,
      'progress-bar': progressBar
    },
    methods: {
      stopEditing() {
        toggleEdit();
      },
      // note: these are separate methods because there might be additional
      // logic that is specific to each button,
      // e.g. running validation before opening the publish pane
      toggleMenu(name, button) {
        const options = {
          name,
          title: 'Clay Menu',
          size: 'medium',
          content: [{
            header: 'My Pages',
            content: {
              component: 'page-list',
              args: {
                number: 1
              }
            }
          }, {
            header: 'All Pages',
            content: {
              component: 'placeholder',
              args: {
                number: 2
              }
            }
          }, {
            header: 'Searches',
            content: {
              component: 'placeholder',
              args: {
                number: 3
              }
            }
          }, {
            header: 'New Page',
            content: {
              component: 'placeholder',
              args: {
                number: 4
              }
            }
          }]
        };

        return this.$store.dispatch('togglePane', { options, button });
      },
      toggleNewPage(name, button) {
        const options = {
          name,
          title: 'New Page',
          content: {
            component: 'new-page'
          }
        };

        return this.$store.dispatch('togglePane', { options, button });
      },
      toggleComponents(name, button) {
        const options = {
          name,
          title: 'Components',
          // todo: add content / lists dynamically
          content: [{
            header: 'Find Component',
            content: {
              component: 'find-component'
            }
          }, {
            header: 'Head',
            content: {
              component: 'placeholder'
            }
          }, {
            header: 'Head Layout',
            content: {
              component: 'placeholder'
            }
          }, {
            header: 'Foot',
            content: {
              component: 'placeholder'
            }
          }]
        };

        return this.$store.dispatch('togglePane', { options, button });
      },
      togglePreview(name, button) {
        const options = {
          name,
          title: 'Preview',
          content: {
            component: 'preview-share'
          }
        };

        return this.$store.dispatch('togglePane', { options, button });
      },
      togglePublish(name, button) {
        const store = this.$store;

        return this.$store.dispatch('validate').then((results) => {
          const options = {
            name,
            title: 'Page Status',
            content: [{
              header: 'Publish',
              // disabled: results.errors.length > 0, // todo: disable the publish tab if validation fails
              content: {
                component: 'edit-publish'
              }
            }, {
              header: {
                component: 'health-icon'
              },
              active: results.errors.length > 0,
              content: {
                component: 'page-health'
              }
            }, {
              header: 'History',
              content: {
                component: 'placeholder'
              }
            }, {
              header: 'Location',
              content: {
                component: 'placeholder'
              }
            }]
          };

          store.dispatch('togglePane', { options, button });
        });
      },
      openAddComponentPane() {
        const currentEl = _.get(this, '$store.state.ui.currentSelection'),
          currentURI = currentEl && currentEl.getAttribute(refAttr),
          path = currentEl && currentEl.parentNode && currentEl.parentNode.getAttribute(editAttr),
          parentComponent = currentEl && getParentComponent(currentEl),
          parentURI = parentComponent && parentComponent.getAttribute(refAttr);

        if (currentURI && parentURI && path) {
          return this.$store.dispatch('openAddComponents', {
            currentURI,
            parentURI,
            path
          });
        }
      }
    }
  };
</script>
