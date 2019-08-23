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

    .alert-container {
      pointer-events: none;

      & > * {
        pointer-events: all;
      }
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

    &.drawerOpen {
      background:  rgba(0, 0, 0, 0.1);
    }

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

  .kiln-toolbar-actions {
    .toolbar-publish-button {
      display: none;

      @media screen and (min-width: 600px) {
        display: inline-flex;
      }
    }
  }

  .ui-menu-option__content.activeMenuButton {
    background: $md-grey-200;
  }

</style>

<template>
  <div class="kiln-wrapper"  @keyup.esc.stop="closeDrawer">
    <alert-container></alert-container>
    <drawer></drawer>
    <ui-toolbar type="colored" text-color="white" @nav-icon-click="openNav">
      <ui-button type="primary" color="primary" size="large" :icon="statusIcon" has-dropdown ref="modeToggle">
        <span class="toolbar-button-text">{{ status }}</span>
        <ui-menu slot="dropdown" :options="toggleOptions" has-icons @select="toggleEditMode"></ui-menu>
      </ui-button>

      <div class="kiln-toolbar-actions" slot="actions">
        <!-- always display custom buttons -->
        <component v-for="(button, index) in customButtons" :is="button" :key="index"></component>

        <!-- display a dropdown menu of actions on smaller screens (viewport < 600px) -->
        <ui-icon-button class="toolbar-action-menu" :class="{drawerOpen: !!currentDrawer}" color="white" size="large" type="secondary" icon="more_vert" tooltip="Actions" has-dropdown ref="dropdownButton" @click="closeDrawer">
          <ui-menu class="toolbar-action-menu" contain-focus has-icons slot="dropdown" :options="activeToolBarOptions" @close="$refs.dropdownButton.closeDropdown()" @select="optionAction">
            <template slot-scope="props" slot="option">
              <div class="ui-menu-option__content" :class="{activeMenuButton: currentDrawer === props.option.id}"><span class="ui-icon ui-menu-option__icon material-icons" :class="props.option.icon">{{ props.option.icon }}</span> <div class="ui-menu-option__text">{{ props.option.label }}</div></div>
            </template>
          </ui-menu>
        </ui-icon-button>

        <!-- display individual buttons on larger screens (viewport >= 600px) -->
        <component
          :ref="option.id"
          size="large"
          v-for="option in activeToolBarOptions"
          :color="option.color || 'white'"
          :type="option.type || 'secondary'"
          :is="option.component || 'UiIconButton'"
          :disabled="option.disabled"
          :icon="!option.noDesktopIcon ? option.icon : null"
          :key="option.id"
          :class="{ 'is-open-drawer': currentDrawer === option.id, 'toolbar-action-button': option.icon && !option.noDesktopIcon, 'toolbar-publish-button': !option.icon || option.noDesktopIcon }"
          :tooltip="option.label"
          @click.stop="option.action(option.id)"
        ><span class="toolbar-button-text" v-if="!option.icon || option.noDesktopIcon">{{ option.label }}</span></component>
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
    <ui-snackbar-container
      ref="snacks"
      :position="snackbar.position"
      :transition="snackbar.transition"
      :queueSnackbars="snackbar.queueSnackbars"
      :duration="snackbar.duration"
    ></ui-snackbar-container>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { mapState } from 'vuex';
  import isAfter from 'date-fns/is_after';
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
  import { getLayoutNameAndInstance } from '../utils/references';
  import { getLastEditUser, hasPageChanges } from '../utils/history';


  export default {
    data() {
      return {};
    },
    computed: mapState({
      pageState: state => state.page.state,
      layoutState: state => state.layout.state,
      isLoading: state => state.isLoading,
      isPageEditMode: state => state.editMode === 'page',
      undoEnabled: (state) => {
        return !state.undo.atStart && !state.ui.currentFocus && !state.ui.currentPane;
      },
      redoEnabled: (state) => {
        return !state.undo.atEnd && !state.ui.currentFocus && !state.ui.currentPane;
      },
      customButtons() {
        return Object.keys(window.kiln.toolbarButtons);
      },
      hasPageChanges: state => hasPageChanges(state),
      hasLayoutChanges: (state) => {
        const layoutState = _.get(state, 'layout.state'),
          pubTime = layoutState.publishTime, // latest published timestamp
          upTime = layoutState.updateTime; // latest updated timestamp

        if (pubTime && upTime) {
          return isAfter(upTime, pubTime);
        } else {
          return false;
        }
      },
      toolbarOptions() {
        return [{
          id: 'undo',
          label: 'Undo',
          icon: 'undo',
          disabled: !this.undoEnabled,
          action: this.undo
        },
        {
          id: 'redo',
          label: 'Redo',
          icon: 'redo',
          disabled: !this.redoEnabled,
          action: this.redo
        },
        {
          type: 'divider'
        },
        {
          id: 'contributors',
          label: 'Contributors',
          icon: 'people',
          presentWhen: this.isPageEditMode,
          action: this.toggleDrawer
        },
        {
          id: 'layout-history',
          label: 'Layout History',
          icon: 'people',
          presentWhen: !this.isPageEditMode,
          action: this.toggleDrawer
        },
        {
          id: 'find-on-a-page',
          label: 'Find on Page',
          icon: 'find_in_page',
          presentWhen: this.isPageEditMode,
          action: this.toggleDrawer
        },
        {
          id: 'find-on-layout',
          label: 'Find on Layout',
          icon: 'find_in_page',
          presentWhen: !this.isPageEditMode,
          action: this.toggleDrawer
        },
        {
          id: 'preview',
          label: 'Preview',
          icon: 'open_in_new',
          action: this.toggleDrawer
        },
        {
          id: 'publish-page',
          label: 'Publishing',
          icon: 'publish',
          noDesktopIcon: true,
          action: this.toggleDrawer,
          presentWhen: this.isPageEditMode,
          component: 'UiButton',
          type: 'primary',
          color: 'primary'
        },
        {
          id: 'publish-layout',
          label: 'Publishing',
          icon: 'publish',
          noDesktopIcon: true,
          action: this.toggleDrawer,
          presentWhen: !this.isPageEditMode,
          component: 'UiButton',
          type: 'primary',
          color: 'primary'
        }];
      },
      activeToolBarOptions() {
        return this.toolbarOptions.filter(option => !option.type && typeof option.presentWhen === 'undefined' || !!option.presentWhen);
      },
      statusIcon() {
        return this.isPageEditMode ? 'mode_edit' : 'layers';
      },
      pageStatus() {
        if (this.isLoading) {
          return ''; // still loading the page, don't display any status
        } else if (this.pageState.scheduled) {
          return 'Page: Scheduled';
        } else if (this.pageState.published && this.hasPageChanges) {
          return 'Page: Unpublished Changes';
        } else if (this.pageState.published) {
          return 'Page: Published';
        } else if (this.pageState.archived) {
          return 'Page: Archived';
        } else {
          return 'Page: Draft';
        }
      },
      layoutStatus() {
        if (this.isLoading) {
          return ''; // still loading the layout, don't display any status
        } else if (this.layoutState.scheduled) {
          return 'Layout: Scheduled';
        } else if (this.layoutState.published && this.hasLayoutChanges) {
          return 'Layout: Unpublished Changes';
        } else if (this.layoutState.published) {
          return 'Layout: Published';
        } else {
          return 'Layout: Draft';
        }
      },
      status() {
        if (this.isPageEditMode) {
          return this.pageStatus;
        } else {
          return this.layoutStatus;
        }
      },
      isAdmin(state) {
        return _.get(state, 'user.auth') === 'admin';
      },
      toggleOptions(state) {
        if (this.isAdmin) {
          return [
            {
              label: 'Edit Page', value: 'page', icon: 'mode_edit', disabled: state.editMode === 'page'
            },
            {
              label: 'Edit Layout', value: 'layout', icon: 'layers', disabled: state.editMode === 'layout'
            },
            { label: 'View Page', value: 'view', icon: 'remove_red_eye' }
          ];
        } else {
          return [
            {
              label: 'Edit Page', value: 'page', icon: 'mode_edit', disabled: true
            },
            { label: 'View Page', value: 'view', icon: 'remove_red_eye' }
          ];
        }
      },
      componentsTooltip() {
        return this.isPageEditMode ? 'Find on Page' : 'Find on Layout';
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
        if (Object.keys(val).length) {
          this.$refs.snacks.createSnackbar(val);
        }
      }
    },
    methods: {
      toggleEditMode(option) {
        this.$store.dispatch('closeDrawer');
        const val = option.value,
          { message } = getLayoutNameAndInstance(this.$store),
          layoutAlert = { type: 'warning', text: message },
          lastUser = getLastEditUser(_.get(this.$store, 'state.layout.state'), _.get(this.$store, 'state.user')),
          layoutUserAlert = lastUser && { type: 'info', message: `Edited less than 5 minutes ago${lastUser.name ? ` by ${lastUser.name}` : ''}` };

        if (val === 'view') {
          this.$store.commit('STOP_EDITING');
          toggleEdit();
        } else if (val === 'page') {
          // page editing
          this.$store.commit('TOGGLE_EDIT_MODE', 'page');
          this.$refs.modeToggle.closeDropdown();
          this.closeDrawer();
          this.$store.dispatch('removeAlert', layoutAlert);
        } else {
          // layout editing
          this.$store.commit('TOGGLE_EDIT_MODE', 'layout');
          this.$refs.modeToggle.closeDropdown();
          this.closeDrawer();
          this.$store.dispatch('addAlert', layoutAlert);
          if (layoutUserAlert) {
            this.$store.dispatch('addAlert', layoutUserAlert);
          }
        }
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
      optionAction(option) {
        if (option.action) {
          this.$refs[action].focus();
          option.action(option.id);
        }
      },
      closeDrawer() {
        return this.$store.dispatch('closeDrawer');
      },
      openNav() {
        return getItem('claymenu:activetab').then((savedTab) => {
          const activeNav = savedTab || 'all-pages';

          this.$store.dispatch('showNavBackground', true);
          return this.$store.dispatch('openDrawer', activeNav);
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
