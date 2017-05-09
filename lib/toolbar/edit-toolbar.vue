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

    .clay-menu-button {
      border-right: 1px solid $toolbar-view-border;
    }

    .publish {
      @media screen and (min-width: 1024px) {
        min-width: 130px; // largest width (scheduled)
      }
    }
  }
</style>

<template>
  <div class="kiln-wrapper">
    <selector></selector>
    <background></background>
    <div class="kiln-toolbar-wrapper">
      <pane></pane>
      <overlay></overlay>
      <progress-bar></progress-bar>
      <status></status>
      <section class="kiln-toolbar edit-mode">
        <toolbar-button class="clay-menu-button" icon-name="clay-menu" text="Clay" @click="toggleMenu"></toolbar-button>
        <toolbar-button class="view-button" name="close" icon-name="close-edit" text="Stop Editing" @click="stopEditing"></toolbar-button>
        <div class="kiln-toolbar-inner">
          <toolbar-button class="components" name="components" icon-name="search-page" text="Find on Page" @click="toggleComponents"></toolbar-button>
          <toolbar-button class="undo" :disabled="!undoEnabled" icon-name="undo" text="Undo" @click="undo"></toolbar-button>
          <toolbar-button class="redo" :disabled="!redoEnabled" icon-name="redo" text="Redo" @click="redo"></toolbar-button>
          <component v-for="button in customButtons" :is="button"></component>
          <div class="flex-span flex-span-inner"></div>
          <toolbar-button class="preview" name="preview" icon-name="new-tab" text="Preview" @click="togglePreview"></toolbar-button>
        </div>
        <toolbar-button v-if="isLoading" class="publish loading" name="publish" icon-name="draft" text="Loading&hellip;"></toolbar-button>
        <toolbar-button v-else-if="pageState.scheduled" class="publish scheduled" name="publish" icon-name="scheduled" text="Scheduled" @click="togglePublish"></toolbar-button>
        <toolbar-button v-else-if="hasChanges" class="publish changes" name="publish" icon-name="unpubbed-changes" text="Changes" @click="togglePublish"></toolbar-button>
        <toolbar-button v-else-if="pageState.published" class="publish published" name="publish" icon-name="published" text="Published" @click="togglePublish"></toolbar-button>
        <toolbar-button v-else class="publish draft" name="publish" icon-name="draft" text="Draft" @click="togglePublish"></toolbar-button>
      </section>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { mapState } from 'vuex';
  import { find } from '@nymag/dom';
  import isAfter from 'date-fns/is_after';
  import toggleEdit from '../utils/toggle-edit';
  import { getSchema } from '../core-data/components';
  import { layoutAttr, editAttr, componentListProp } from '../utils/references';
  import label from '../utils/label';
  import { getListsInHead } from '../utils/head-components';
  import progressBar from './progress.vue';
  import button from './toolbar-button.vue';
  import background from './background.vue';
  import overlay from '../forms/overlay.vue';
  import pane from '../panes/pane.vue';
  import status from './status.vue';
  import selector from './selector.vue';

  /**
   * get tabs for head component lists in the page and layout
   * @param  {object} state
   * @return {array}
   */
  function getHeadTabs(state) {
    const layoutURI = _.get(state, 'page.data.layout'),
      schema = getSchema(layoutURI),
      lists = getListsInHead();

    return _.reduce(lists, (result, list) => result.concat({
      header: label(list.path, schema[list.path]),
      content: {
        component: 'head-components',
        args: {
          uri: layoutURI,
          path: list.path,
          isPage: _.get(schema, `${list.path}.${componentListProp}.page`) || false
        }
      }
    }), []);
  }

  /**
   * determine if a field in the schema has an invisible list
   * @param  {object}  field
   * @return {Boolean}
   */
  function isInvisibleList(field) {
    return _.has(field, `${componentListProp}.invisible`);
  }

  /**
   * find an element that matches a specific component's data-editable path
   * @param  {string}  uri
   * @param  {string}  path
   * @return {Element|null}
   */
  function getListElement(uri, path) {
    return find(`[${layoutAttr}="${uri}"] [${editAttr}="${path}"]`);
  }

  /**
   * get tabs for invisible lists in the layout
   * @param  {object} state
   * @return {array}
   */
  function getInvisibleTabs(state) {
    const layoutURI = _.get(state, 'page.data.layout'),
      schema = getSchema(layoutURI);

    return _.reduce(schema, (result, field, fieldName) => {
      const listEl = getListElement(layoutURI, fieldName);

      if (isInvisibleList(field) && !!listEl) {
        result.push({
          header: label(fieldName, field),
          content: {
            component: 'invisible-components',
            args: {
              uri: layoutURI,
              path: fieldName,
              listEl
            }
          }
        });
      }
      return result;
    }, []);
  }

  export default {
    computed: mapState({
      pageState: (state) => state.page.state,
      isLoading: 'isLoading',
      undoEnabled: (state) => {
        return !state.undo.atStart && !state.ui.currentFocus && !state.ui.currentPane;
      },
      redoEnabled: (state) => {
        return !state.undo.atEnd && !state.ui.currentFocus && !state.ui.currentPane;
      },
      customButtons() {
        return Object.keys(window.kiln.toolbarButtons);
      },
      hasChanges: (state) => {
        const pubTime = _.get(state, 'page.state.publishedAt'),
          upTime = _.get(state, 'page.listData.updateTime');

        if (pubTime && upTime) {
          return isAfter(upTime, pubTime);
        } else {
          return false;
        }
      }
    }),
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
          size: 'xlarge',
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
      undo() {
        this.$store.dispatch('undo');
      },
      redo() {
        this.$store.dispatch('redo');
      },
      toggleComponents(name, button) {
        let options = {
          name,
          title: 'Find on Page',
          content: [{
            header: 'Visible',
            content: {
              component: 'visible-components'
            }
          }]
        };

        // add head components (from page and layout)
        options.content = options.content.concat(getHeadTabs(this.$store.state));
        // add invisible components (from layout)
        options.content = options.content.concat(getInvisibleTabs(this.$store.state));

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
              disabled: results.errors.length > 0, // disable the publish tab if validation fails
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
              header: 'Location',
              content: {
                component: 'page-location'
              }
            }]
          };

          store.dispatch('togglePane', { options, button });
        });
      }
    },
    components: _.merge({
      'toolbar-button': button,
      background,
      overlay,
      pane,
      status,
      'progress-bar': progressBar,
      selector
    }, window.kiln.toolbarButtons)
  };
</script>
