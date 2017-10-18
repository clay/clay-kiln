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

    .ui-tabs__body {
      border: none;
      height: calc(100% - 48px);
      padding: 0;
    }

    .ui-tab {
      height: 100%;
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
    <ui-tabs v-if="isDrawerOpen" class="right-drawer" backgroundColor="clear" :fullwidth="true">
      <ui-tab v-for="tab in tabs" :title="tab.title">
        <component :is="tab.component" :args="tab.args"></component>
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
  import addContributor from './add-contributor.vue';
  import visibleComponents from './visible-components.vue';
  import headComponents from './head-components.vue';
  import invisibleComponents from './invisible-components.vue';

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
      args: {
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
      tabs() {
        if (this.name === 'contributors') {
          return [{
            title: 'Contributors',
            component: 'contributors'
          }, {
            title: 'Invite To Page',
            component: 'add-contributor'
          }];
        } else if (this.name === 'components') {
          const state = _.get(this.$store, 'state'),
            headLists = getHeadComponentLists(state),
            invisibleLists = getInvisibleComponentLists(state);

          return [{
            title: 'Visible',
            component: 'visible-components'
          }].concat(headLists).concat(invisibleLists);
        }
      }
    },
    components: {
      UiTabs,
      UiTab,
      contributors,
      'add-contributor': addContributor,
      'visible-components': visibleComponents,
      'head-components': headComponents,
      'invisible-components': invisibleComponents
    }
  };
</script>
