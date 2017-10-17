<style lang="sass">
  @import '../../styleguide/toolbar';

  body {
    @include toolbar-padding();
  }

  .kiln-toolbar-wrapper {
    @include toolbar-wrapper();
  }
</style>

<template>
  <div class="kiln-wrapper">
    <background></background>
    <div class="kiln-toolbar-wrapper">
      <overlay></overlay>
      <add-component></add-component>
      <simple-modal></simple-modal>
      <ui-toolbar type="colored" text-color="white">
        <ui-button type="primary" color="primary" size="large" has-dropdown>
          <span>Editing: {{ status }}</span>
          <ui-menu slot="dropdown" :options="toggleOptions" has-icons @select="stopEditing"></ui-menu>
        </ui-button>

        <div class="kiln-toolbar-actions" slot="actions">
          <ui-icon-button :disabled="!undoEnabled" color="white" size="large" type="secondary" icon="undo" tooltip="Undo" @click="undo"></ui-icon-button>
          <ui-icon-button :disabled="!redoEnabled" color="white" size="large" type="secondary" icon="redo" tooltip="Redo" @click="redo"></ui-icon-button>
          <component v-for="button in customButtons" :is="button"></component>
          <ui-icon-button color="white" size="large" type="secondary" icon="people" tooltip="Contributors"></ui-icon-button>
          <ui-icon-button color="white" size="large" type="secondary" icon="find_in_page" tooltip="Find on Page"></ui-icon-button>
          <ui-icon-button color="white" size="large" type="secondary" icon="open_in_new" tooltip="Preview"></ui-icon-button>
          <ui-icon-button color="white" size="large" type="secondary" icon="publish" tooltip="Publish"></ui-icon-button>
        </div>
      </ui-toolbar>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { mapState } from 'vuex';
  import { find } from '@nymag/dom';
  import isAfter from 'date-fns/is_after';
  import addSeconds from 'date-fns/add_seconds';
  import toggleEdit from '../utils/toggle-edit';
  import { getSchema } from '../core-data/components';
  import { layoutAttr, editAttr, componentListProp } from '../utils/references';
  import label from '../utils/label';
  import { getListsInHead } from '../utils/head-components';
  import { getItem } from '../utils/local';
  import progressBar from './progress.vue';
  import button from './toolbar-button.vue';
  import background from './background.vue';
  import overlay from '../forms/overlay.vue';
  import pane from '../panes/pane.vue';
  import status from './status.vue';
  import addComponent from '../component-data/add-component.vue';
  import simpleModal from './simple-modal.vue';
  import UiToolbar from 'keen/UiToolbar';
  import UiButton from 'keen/UiButton';
  import UiIconButton from 'keen/UiIconButton';
  import UiMenu from 'keen/UiMenu';

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
        const pubTime = _.get(state, 'page.state.publishTime'), // latest published timestamp
          upTime = _.get(state, 'page.state.updateTime'); // latest updated timestamp

        if (pubTime && upTime) {
          return isAfter(upTime, addSeconds(pubTime, 30)); // give it 30 seconds of leeway, in case there are slow updates to the server
        } else {
          return false;
        }
      },
      status() {
        if (this.pageState.scheduled) {
          return 'Scheduled';
        } else if (this.hasChanges) {
          return 'Unpublished Changes';
        } else if (this.pageState.published) {
          return 'Published';
        } else {
          return 'Draft';
        }
      },
      toggleOptions() {
        return [
          { label: 'Edit Mode', icon: 'mode_edit', disabled: true },
          { label: 'View Mode', icon: 'remove_red_eye' }
        ];
      }
    }),
    methods: {
      stopEditing() {
        this.$store.commit('STOP_EDITING');
        toggleEdit();
      },
      // note: these are separate methods because there might be additional
      // logic that is specific to each button,
      // e.g. running validation before opening the publish pane
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
      },
      undo() {
        this.$store.dispatch('undo');
      },
      redo() {
        this.$store.dispatch('redo');
      },
      togglePeople(name, button) {
        let options = {
          name,
          title: 'People',
          content: {
            component: 'people'
          }
        };

        return this.$store.dispatch('togglePane', { options, button });
      },
      toggleComponents(name, button) {
        return getItem('findonpage:activetab').then((savedTab) => {
          const activeTab = savedTab || 'Visible';

          let options = {
              name,
              title: 'Find on Page',
              saveTab: 'findonpage',
              height: 'medium-height',
              content: [{
                header: 'Visible',
                active: activeTab === 'Visible',
                content: {
                  component: 'visible-components'
                }
              }]
            },
            headTabs = _.map(getHeadTabs(this.$store.state), (tab) => {
              tab.active = activeTab === tab.header;
              return tab;
            }),
            invisibleTabs = _.map(getInvisibleTabs(this.$store.state), (tab) => {
              tab.active = activeTab === tab.header;
              return tab;
            });

          // add head components (from page and layout)
          options.content = options.content.concat(headTabs);
          // add invisible components (from layout)
          options.content = options.content.concat(invisibleTabs);

          return this.$store.dispatch('togglePane', { options, button });
        });
      },
      togglePreview(name, button) {
        const options = {
          name,
          title: 'Preview',
          height: 'preview-height',
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
            height: results.errors.length > 0 ? 'medium-height' : 'publish-height',
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
      'add-component': addComponent,
      'simple-modal': simpleModal,
      UiToolbar,
      UiIconButton,
      UiButton,
      UiMenu
    }, window.kiln.toolbarButtons)
  };
</script>
