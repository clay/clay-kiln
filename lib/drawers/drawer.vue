<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/animations';

  $drawer-width: 320px;

  .right-drawer {
    background-color: $card-bg-color;
    box-shadow: $shadow-2dp;
    height: calc(100vh - 56px);
    position: fixed;
    right: 0;
    top: 56px;
    width: $drawer-width;

    &.ui-tabs {
      margin-bottom: 0;
      width: $drawer-width;
    }

    .ui-tabs__body {
      border: none;
      height: calc(100% - 48px);
      padding: 0;
    }

    .ui-tab {
      height: 100%;
      // allow scrolling if the height of the viewport is too small
      max-height: 100%;
      overflow-y: scroll;
    }
  }

  .drawer-enter,
  .drawer-leave-to {
    transform: translateX($drawer-width + 10px);
  }

  .drawer-enter-to,
  .drawer-leave {
    transform: translateX(0);
  }

  .drawer-enter-active {
    transition: transform $enter-viewport-time $deceleration-curve;
  }

  .drawer-leave-active {
    transition: transform $leave-viewport-time $sharp-curve;
  }
</style>

<template>
  <transition name="drawer" mode="out-in">
    <ui-tabs :key="name" ref="tabs" v-if="isDrawerOpen" class="right-drawer" backgroundColor="clear" :fullwidth="true">
      <ui-tab v-for="(tab, tabIndex) in activeDrawer.tabs" :key="`${tab.component}-${tabIndex}`" :title="tab.title" :selected="tab.selected" :disabled="tab.disabled" @select="onTabChange(tab)">
        <keep-alive>
          <component :is="tab.component" :args="tab.args" @selectTab="onSelectTab"></component>
        </keep-alive>
      </ui-tab>
    </ui-tabs>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import { getSchema } from '../core-data/components';
  import label from '../utils/label';
  import { getListsInHead } from '../utils/head-components';
  import { componentListProp } from '../utils/references';
  import UiTabs from 'keen/UiTabs';
  import UiTab from 'keen/UiTab';
  // components used in tabs
  import contributors from './contributors.vue';
  import pageHistory from './page-history.vue';
  import visibleComponents from './visible-components.vue';
  import headComponents from './head-components.vue';
  import invisibleComponents from './invisible-components.vue';
  import preview from './preview.vue';
  import health from './health.vue';
  import publishPage from './publish-page.vue';
  import publishLayout from './publish-layout.vue';
  import layoutHistory from './layout-history.vue';

  /**
   * get component lists in the <head> of the page
   * @param  {object} state
   * @return {array}
   */
  function getHeadComponentLists(state) {
    const layoutURI = _.get(state, 'page.data.layout'),
      schema = getSchema(layoutURI),
      lists = getListsInHead(),
      isPageEditMode = state.editMode === 'page',
      hashTabName = _.get(state, 'url.sites');

    return _.reduce(lists, (result, list) => {
      const isPageList = _.get(schema, `${list.path}.${componentListProp}.page`);

      if (isPageEditMode && isPageList || !isPageEditMode && !isPageList) {
        result.push({
          title: label(list.path, schema[list.path]),
          component: 'head-components',
          selected: hashTabName === 'head-components',
          args: {
            isPage: isPageList,
            path: list.path,
            schema: schema[list.path]
          }
        });
      }
  
      return result;
    }, []);
  }

  /**
   * get invisible component lists
   * @param  {object} state
   * @return {array}
   */
  function getInvisibleComponentLists(state) {
    const layoutURI = _.get(state, 'page.data.layout'),
      schema = getSchema(layoutURI),
      isPageEditMode = state.editMode === 'page';

    return _.reduce(schema, (result, field, fieldName) => {
      const isPageList = _.get(field, `${componentListProp}.page`),
        isInvisibleList = _.has(field, `${componentListProp}.invisible`),
        hashTabName = _.get(state, 'url.sites');

      if (isInvisibleList && (isPageEditMode && isPageList || !isPageEditMode && !isPageList)) {
        result.push({
          title: label(fieldName, field),
          component: 'invisible-components',
          selected: hashTabName === 'visible-components',
          args: {
            path: fieldName,
            schema: field
          }
        });
      }
  
      return result;
    }, []);
  }

  export default {
    computed: {
      name() {
        return _.get(this.$store, 'state.ui.currentDrawer');
      },
      isDrawerOpen() {
        return !!this.name && this.activeDrawer;
      },
      tabType() {
        return this.name === 'publish-page' || 'publish-layout' ? 'icon-and-text' : 'text';
      },
      /* eslint-disable complexity */
      tabs() {
        const state = _.get(this.$store, 'state'),
          errors = _.get(state, 'validation.errors', []),
          warnings = _.get(state, 'validation.warnings', []),
          metadataErrors = _.get(this.$store, 'state.validation.metadataErrors', []),
          metadataWarnings = _.get(this.$store, 'state.validation.metadataWarnings', []),
          hashTabName = _.get(state, 'url.sites'), // state.url.sites is just the second param in the url hash object
          openHealth = errors.length > 0 || warnings.length > 0 || metadataErrors.length > 0 || metadataWarnings.length > 0;

        let tabs = [
          {
            name: 'contributors',
            tabs: [
              {
                title: 'Contributors',
                component: 'contributors',
                selected: hashTabName === 'contributors'
              },
              {
                title: 'Page History',
                component: 'page-history',
                selected: hashTabName === 'page-history'
              }
            ]
          },
          {
            name: 'layout-history',
            tabs: [{
              title: 'Layout History',
              component: 'layout-history',
              selected: true
            }]
          },
          {
            name: 'find-on-a-page',
            tabs: [{
              title: 'Visible',
              component: 'visible-components',
              selected: hashTabName === 'visible-components'
            }].concat(getHeadComponentLists(state)).concat(getInvisibleComponentLists(state))
          },
          {
            name: 'find-on-layout',
            tabs: [{
              title: 'Visible',
              component: 'visible-components',
              selected: hashTabName === 'visible-components'
            }].concat(getHeadComponentLists(state)).concat(getInvisibleComponentLists(state))
          },
          {
            name: 'preview',
            tabs: [{
              title: 'Preview',
              component: 'preview',
              selected: true
            }]
          },
          {
            name: 'publish-page',
            tabs: [{
              title: 'Health',
              component: 'health',
              selected: openHealth
            },
            {
              title: 'Publish',
              component: 'publish-page',
              selected: !openHealth
            }]
          },
          {
            name: 'publish-layout',
            tabs: [{
              title: 'Health',
              component: 'health',
              selected: openHealth
            },
            {
              title: 'Publish',
              component: 'publish-layout',
              selected: !openHealth
            }]
          }
        ];

        return tabs;
      },
      activeDrawer() {
        return this.tabs.find(tab => tab.name === this.name);
      }
    },
    methods: {
      onTabChange(tab) {
        const currentUrl = _.get(this.$store, 'state.url');

        let urlTab = null;

        if (!currentUrl || !currentUrl.tab) {
          urlTab = this.name || '';
        } else {
          urlTab = currentUrl.tab;
        }

        this.$store.dispatch('setHash', {
          menu: {
            tab: urlTab, sites: tab.component, status: '', query: ''
          }
        });
        this.$store.commit('SWITCH_TAB', tab.title);
      },
      onSelectTab(title) {
        const tab = _.find(_.get(this, '$refs.tabs.tabs', []), tab => tab.title === title);

        this.$refs.tabs.setActiveTab(tab.id);
      }
    },
    components: {
      UiTabs,
      UiTab,
      contributors,
      'page-history': pageHistory,
      'visible-components': visibleComponents,
      'head-components': headComponents,
      'invisible-components': invisibleComponents,
      preview,
      health,
      'publish-page': publishPage,
      'publish-layout': publishLayout,
      'layout-history': layoutHistory
    }
  };
</script>
