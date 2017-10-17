<style lang="sass">
  @import '../../styleguide/toolbar';
  @import '../../styleguide/colors';

  body {
    @include toolbar-padding();
  }

  .kiln-wrapper {
    @include toolbar-wrapper();
  }

  .kiln-progress {
    height: 3px;
    left: 0;
    position: relative;
    top: 0;
    width: 100%;
  }
</style>

<template>
  <div class="kiln-wrapper">
    <drawer></drawer>
    <ui-toolbar type="colored" text-color="white">
      <ui-button type="primary" color="primary" size="large" has-dropdown>
        <span>Editing: {{ status }}</span>
        <ui-menu slot="dropdown" :options="toggleOptions" has-icons @select="stopEditing"></ui-menu>
      </ui-button>

      <div class="kiln-toolbar-actions" slot="actions">
        <ui-icon-button :disabled="!undoEnabled" color="white" size="large" type="secondary" icon="undo" tooltip="Undo" @click="undo"></ui-icon-button>
        <ui-icon-button :disabled="!redoEnabled" color="white" size="large" type="secondary" icon="redo" tooltip="Redo" @click="redo"></ui-icon-button>
        <component v-for="button in customButtons" :is="button"></component>
        <ui-icon-button color="white" size="large" type="secondary" icon="people" tooltip="Contributors" @click="toggleDrawer('people')"></ui-icon-button>
        <ui-icon-button color="white" size="large" type="secondary" icon="find_in_page" tooltip="Find on Page" @click="toggleDrawer('components')"></ui-icon-button>
        <ui-icon-button color="white" size="large" type="secondary" icon="open_in_new" tooltip="Preview" @click="toggleDrawer('preview')"></ui-icon-button>
        <ui-icon-button color="white" size="large" type="secondary" icon="publish" tooltip="Publish" @click="toggleDrawer('publish')"></ui-icon-button>
      </div>
    </ui-toolbar>
    <div class="kiln-progress">
      <progress-bar></progress-bar>
    </div>
    <background></background>
    <overlay></overlay>
    <add-component></add-component>
    <simple-modal></simple-modal>
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
  import drawer from '../drawers/drawer.vue';

  export default {
    data() {
      return {};
    },
    computed: mapState({
      pageState: (state) => state.page.state,
      currentProgress: (state) => state.ui.currentProgress,
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
      },
      isDrawerOpen: (state) => !!state.ui.currentDrawer
    }),
    methods: {
      stopEditing() {
        this.$store.commit('STOP_EDITING');
        toggleEdit();
      },
      undo() {
        this.$store.dispatch('undo');
      },
      redo() {
        this.$store.dispatch('redo');
      },
      toggleDrawer(name) {
        return this.$store.dispatch('toggleDrawer', name);
      }
    },
    components: _.merge({
      background,
      overlay,
      'add-component': addComponent,
      'simple-modal': simpleModal,
      UiToolbar,
      UiIconButton,
      UiButton,
      UiMenu,
      'progress-bar': progressBar,
      drawer
    }, window.kiln.toolbarButtons)
  };
</script>
