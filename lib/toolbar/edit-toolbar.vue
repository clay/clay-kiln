<style lang="sass">
  @import '../../styleguide/toolbar';
  @import '../../styleguide/colors';
  @import '../../styleguide/layers';

  body {
    @include toolbar-padding();
  }

  .kiln-wrapper {
    @include toolbar-wrapper();

    .ui-snackbar-container {
      @include confirm-layer();

      bottom: 0;
      position: fixed;
    }
  }

  .kiln-progress {
    height: 3px;
    left: 0;
    position: relative;
    top: 0;
    width: 100%;
  }

  .toolbar-action-menu.ui-icon-button {
    display: inline-flex;

    @media screen and (min-width: 600px) {
      display: none;
    }
  }

  .toolbar-action-button.ui-icon-button {
    display: none;

    &.is-open-drawer {
      background-color: rgba(0, 0, 0, 0.3);
    }

    @media screen and (min-width: 600px) {
      display: inline-flex;
    }
  }

  .toolbar-publish-button.is-open-drawer {
    background-color: rgba(0, 0, 0, 0.3);
  }

  .toolbar-button-text {
    font-weight: bold;
  }
</style>

<template>
  <div class="kiln-wrapper">
    <alert-container></alert-container>
    <drawer></drawer>
    <ui-toolbar type="colored" text-color="white" @nav-icon-click="openNav">
      <ui-button type="primary" color="primary" size="large" icon="mode_edit" has-dropdown>
        <span class="toolbar-button-text">{{ status }}</span>
        <ui-menu slot="dropdown" :options="toggleOptions" has-icons @select="stopEditing"></ui-menu>
      </ui-button>

      <div class="kiln-toolbar-actions" slot="actions">
        <!-- always display custom buttons -->
        <component v-for="(button, index) in customButtons" :is="button" :key="index"></component>
        <!-- display a dropdown menu of actions on smaller screens (viewport < 600px) -->
        <ui-icon-button class="toolbar-action-menu" color="white" size="large" type="secondary" icon="more_vert" tooltip="Actions" has-dropdown ref="dropdownButton" @click="closeDrawer">
          <ui-menu contain-focus has-icons slot="dropdown" :options="toolbarOptions" @close="$refs.dropdownButton.closeDropdown()" @select="toggleDrawerFromMenu"></ui-menu>
        </ui-icon-button>
        <!-- display individual buttons on larger screens (viewport >= 600px) -->
        <ui-icon-button class="toolbar-action-button" :disabled="!undoEnabled" color="white" size="large" type="secondary" icon="undo" tooltip="Undo" @click="undo"></ui-icon-button>
        <ui-icon-button class="toolbar-action-button" :disabled="!redoEnabled" color="white" size="large" type="secondary" icon="redo" tooltip="Redo" @click="redo"></ui-icon-button>
        <ui-icon-button class="toolbar-action-button" :class="{ 'is-open-drawer': currentDrawer === 'contributors' }" color="white" size="large" type="secondary" icon="people" tooltip="Contributors" @click.stop="toggleDrawer('contributors')"></ui-icon-button>
        <ui-icon-button class="toolbar-action-button" :class="{ 'is-open-drawer': currentDrawer === 'components' }" color="white" size="large" type="secondary" icon="find_in_page" tooltip="Find on Page" @click.stop="toggleDrawer('components')"></ui-icon-button>
        <ui-icon-button class="toolbar-action-button" :class="{ 'is-open-drawer': currentDrawer === 'preview' }" color="white" size="large" type="secondary" icon="open_in_new" tooltip="Preview" @click.stop="toggleDrawer('preview')"></ui-icon-button>
        <ui-button class="toolbar-publish-button" :class="{ 'is-open-drawer': currentDrawer === 'publish' }" type="primary" color="primary" size="large" @click.stop="toggleDrawer('publish')"><span class="toolbar-button-text">{{ publishAction }}</span></ui-button>
      </div>
    </ui-toolbar>
    <div class="kiln-progress">
      <progress-bar></progress-bar>
    </div>
    <background></background>
    <overlay></overlay>
    <add-component></add-component>
    <nav-background></nav-background>
    <nav-menu></nav-menu>
    <nav-content></nav-content>
    <simple-modal></simple-modal>
    <confirm></confirm>
    <ui-snackbar-container ref="snacks"></ui-snackbar-container>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { mapState } from 'vuex';
  import isAfter from 'date-fns/is_after';
  import addSeconds from 'date-fns/add_seconds';
  import toggleEdit from '../utils/toggle-edit';
  import { getItem } from '../utils/local';
  import progressBar from './progress.vue';
  import background from './background.vue';
  import overlay from '../forms/overlay.vue';
  import addComponent from '../component-data/add-component.vue';
  import simpleModal from './simple-modal.vue';
  import UiToolbar from 'keen/UiToolbar';
  import UiButton from 'keen/UiButton';
  import UiIconButton from 'keen/UiIconButton';
  import UiMenu from 'keen/UiMenu';
  import UiSnackbarContainer from 'keen/UiSnackbarContainer';
  import drawer from '../drawers/drawer.vue';
  import navBackground from '../nav/nav-background.vue';
  import navMenu from '../nav/nav-menu.vue';
  import navContent from '../nav/nav-content.vue';
  import confirm from './confirm.vue';
  import alertContainer from './alert-container.vue';
  import logger from '../utils/log';

  const log = logger(__filename);

  export default {
    data() {
      return {};
    },
    computed: mapState({
      pageState: (state) => state.page.state,
      isLoading: (state) => state.isLoading,
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
        if (this.isLoading) {
          return ''; // still loading the page, don't display any status
        } else if (this.pageState.scheduled) {
          return 'Scheduled';
        } else if (this.pageState.published && this.hasChanges) {
          return 'Unpublished Changes';
        } else if (this.pageState.published) {
          return 'Published';
        } else if (this.pageState.archived) {
          return 'Archived';
        } else {
          return 'Draft';
        }
      },
      publishAction() {
        if (this.pageState.published) {
          return 'Republish';
        } else if (this.pageState.archived) {
          return 'Unarchive';
        } else {
          return 'Publish';
        }
      },
      toggleOptions() {
        return [
          { label: 'Edit Mode', icon: 'mode_edit', disabled: true },
          { label: 'View Mode', icon: 'remove_red_eye' }
        ];
      },
      toolbarOptions() {
        return [{
          label: 'Undo',
          icon: 'undo',
          disabled: !this.undoEnabled
        }, {
          label: 'Redo',
          icon: 'redo',
          disabled: !this.redoEnabled
        }, {
          type: 'divider'
        }, {
          label: 'Contributors',
          icon: 'people'
        }, {
          label: 'Find on Page',
          icon: 'find_in_page'
        }, {
          label: 'Preview',
          icon: 'open_in_new'
        }];
      },
      snackbar() {
        return _.get(this.$store, 'state.ui.snackbar') && _.toPlainObject(_.get(this.$store, 'state.ui.snackbar'));
      },
      currentDrawer() {
        return _.get(this.$store, 'state.ui.currentDrawer');
      }
    }),
    watch: {
      snackbar(val) {
        if (val) {
          this.$refs.snacks.createSnackbar(val);
          this.$store.dispatch('hideSnackbar'); // clear the store
        }
      }
    },
    methods: {
      stopEditing() {
        this.$store.commit('STOP_EDITING');
        toggleEdit();
      },
      undo() {
        return this.$store.dispatch('undo');
      },
      redo() {
        return this.$store.dispatch('redo');
      },
      toggleDrawer(name) {
        return this.$store.dispatch('toggleDrawer', name);
      },
      toggleDrawerFromMenu(option) {
        switch (option.label) {
          case 'Undo': return this.undo();
          case 'Redo': return this.redo();
          case 'Contributors': return this.toggleDrawer('contributors');
          case 'Find on Page': return this.toggleDrawer('components');
          case 'Preview': return this.toggleDrawer('preview');
          default: log.warn(`Unknown drawer: ${option.label}`);
        }
      },
      closeDrawer() {
        return this.$store.dispatch('closeDrawer');
      },
      openNav() {
        return getItem('claymenu:activetab').then((savedTab) => {
          const activeNav = savedTab || 'all-pages';

          return this.$store.dispatch('openNav', activeNav);
        });
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
      UiSnackbarContainer,
      'progress-bar': progressBar,
      drawer,
      'nav-background': navBackground,
      'nav-menu': navMenu,
      'nav-content': navContent,
      confirm,
      'alert-container': alertContainer
    }, window.kiln.toolbarButtons)
  };
</script>
