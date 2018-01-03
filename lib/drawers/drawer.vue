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
  <transition name="drawer" mode="out-in" @after-enter="refreshTabs">
    <ui-tabs ref="tabs" v-if="isDrawerOpen" class="right-drawer" backgroundColor="clear" :fullwidth="true">
      <ui-tab v-for="(tab, tabIndex) in tabs" :key="tabIndex" :title="tab.title" :selected="tab.selected" :disabled="tab.disabled" @select="onTabChange(tab.title)">
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
  import visibleComponents from './visible-components.vue';
  import headComponents from './head-components.vue';
  import invisibleComponents from './invisible-components.vue';
  import preview from './preview.vue';
  import health from './health.vue';
  import publish from './publish.vue';

  /**
   * get component lists in the <head> of the page
   * @param  {object} state
   * @return {array}
   */
  function getHeadComponentLists(state) {
    const layoutURI = _.get(state, 'page.data.layout'),
      schema = getSchema(layoutURI),
      lists = getListsInHead();

    return _.reduce(lists, (result, list) => result.concat({
      title: label(list.path, schema[list.path]),
      component: 'head-components',
      selected: false,
      args: {
        isPage: _.get(schema, `${list.path}.${componentListProp}.page`),
        path: list.path,
        schema: schema[list.path]
      }
    }), []);
  }

  /**
   * get invisible component lists
   * @param  {object} state
   * @return {array}
   */
  function getInvisibleComponentLists(state) {
    const layoutURI = _.get(state, 'page.data.layout'),
      schema = getSchema(layoutURI);

    return _.reduce(schema, (result, field, fieldName) => {
      if (_.has(field, `${componentListProp}.invisible`)) {
        return result.concat({
          title: label(fieldName, field),
          component: 'invisible-components',
          selected: false,
          args: {
            path: fieldName,
            schema: field
          }
        });
      } else {
        return result;
      }
    }, []);
  }

  export default {
    computed: {
      name() {
        return _.get(this.$store, 'state.ui.currentDrawer');
      },
      isDrawerOpen() {
        return !!this.name;
      },
      tabType() {
        return this.name === 'publish' ? 'icon-and-text' : 'text';
      }
    },
    asyncComputed: {
      tabs() {
        if (this.name === 'contributors') {
          return [{
            title: 'Contributors',
            component: 'contributors',
            selected: true
          }];
        } else if (this.name === 'components') {
          const state = _.get(this.$store, 'state'),
            headLists = getHeadComponentLists(state),
            invisibleLists = getInvisibleComponentLists(state);

          return [{
            title: 'Visible',
            component: 'visible-components',
            selected: true
          }].concat(headLists).concat(invisibleLists);
        } else if (this.name === 'preview') {
          return [{
            title: 'Preview',
            component: 'preview',
            selected: true
          }];
        } else if (this.name === 'publish') {
          return this.$store.dispatch('validate').then(() => {
            const errors = _.get(this.$store, 'state.validation.errors');

            return [{
              title: 'Health',
              component: 'health',
              selected: errors.length > 0
            }, {
              title: 'Publish',
              component: 'publish',
              selected: errors.length === 0
            }];
          });
        }
      }
    },
    methods: {
      refreshTabs() {
        // refresh the tabs when we switch drawers,
        // because it doesn't want to set the active tab automatically
        if (this.$refs.tabs) {
          const activeTab = _.find(this.$refs.tabs.tabs, (tab) => tab.selected);

          this.$nextTick(() => this.$refs.tabs.setActiveTab(activeTab.id));
        }
      },
      onTabChange(title) {
        this.$store.commit('SWITCH_TAB', title);
      },
      onSelectTab(title) {
        const tab = _.find(_.get(this, '$refs.tabs.tabs', []), (tab) => tab.title === title);

        this.$refs.tabs.setActiveTab(tab.id);
      }
    },
    components: {
      UiTabs,
      UiTab,
      contributors,
      'visible-components': visibleComponents,
      'head-components': headComponents,
      'invisible-components': invisibleComponents,
      preview,
      health,
      publish
    }
  };
</script>
