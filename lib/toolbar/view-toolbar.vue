<template>
  <div class="kiln-wrapper view-mode">
    <alert-container></alert-container>
    <div class="kiln-progress">
      <progress-bar></progress-bar>
    </div>
    <ui-fab size="normal" color="primary" icon="menu" tooltip="Clay Menu" tooltipPosition="right middle" class="view-menu-button" @click="openNav"></ui-fab>
    <ui-fab size="small" color="default" icon="mode_edit" :tooltip="'Edit Page' + status" tooltipPosition="right middle" class="view-edit-button" @click="startEditing"></ui-fab>
    <ui-fab size="small" color="default" icon="add" tooltip="New Page" tooltipPosition="right middle" class="view-new-button" @click="openNewPage"></ui-fab>
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
  import toggleEdit from '../utils/toggle-edit';
  import { getItem } from '../utils/local';
  import { hasPageChanges } from '../utils/history';
  import navBackground from '../nav/nav-background.vue';
  import navMenu from '../nav/nav-menu.vue';
  import navContent from '../nav/nav-content.vue';
  import UiFab from 'keen/UiFab';
  import simpleModal from './simple-modal.vue';
  import confirm from './confirm.vue';
  import progressBar from './progress.vue';
  import UiSnackbarContainer from 'keen/UiSnackbarContainer';
  import alertContainer from './alert-container.vue';

  export default {
    data() {
      return {};
    },
    computed: {
      snackbar() {
        return _.get(this.$store, 'state.ui.snackbar') && _.toPlainObject(_.get(this.$store, 'state.ui.snackbar'));
      },
      isLoading() {
        return _.get(this.$store, 'state.isLoading');
      },
      pageState() {
        return _.get(this.$store, 'state.page.state');
      },
      hasChanges() {
        return hasPageChanges(this.$store.state);
      },
      status() {
        if (this.isLoading) {
          return ''; // still loading the page, don't display any status
        } else if (this.pageState.scheduled) {
          return ' (Scheduled)';
        } else if (this.pageState.published && this.hasChanges) {
          return ' (Unpublished Changes)';
        } else if (this.pageState.published) {
          return ' (Published)';
        } else if (this.pageState.archived) {
          return ' (Archived)';
        } else {
          return ' (Draft)';
        }
      }
    },
    watch: {
      snackbar(val) {
        if (Object.keys(val).length) {
          this.$refs.snacks.createSnackbar(val);
        }
      }
    },
    methods: {
      startEditing() {
        toggleEdit();
      },
      openNav() {
        return getItem('claymenu:activetab').then((savedTab) => {
          const activeNav = savedTab || 'all-pages';

          return this.$store.dispatch('openDrawer', activeNav);
        });
      },
      openNewPage() {
        return this.$store.dispatch('openDrawer', 'new-page');
      }
    },
    components: {
      'nav-background': navBackground,
      'nav-menu': navMenu,
      'nav-content': navContent,
      UiFab,
      'simple-modal': simpleModal,
      confirm,
      UiSnackbarContainer,
      'progress-bar': progressBar,
      'alert-container': alertContainer
    }
  };
</script>

<style lang="sass">
  @import '../../styleguide/toolbar';
  @import '../../styleguide/layers';

  .kiln-wrapper.view-mode {
    @include toolbar-wrapper();

    pointer-events: none;

    & > * {
      pointer-events: all;
    }

    .view-menu-button {
      margin: 10px;
    }

    .kiln-progress {
      height: 3px;
      left: 0;
      position: fixed;
      top: 0;
      width: 100%;
    }

    .view-edit-button,
    .view-new-button {
      margin: 10px 18px;
    }

    .ui-snackbar-container {
      @include confirm-layer();

      bottom: 0;
      position: fixed;
    }
  }
</style>
