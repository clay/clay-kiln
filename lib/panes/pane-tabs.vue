<style lang="sass">
  @import '../../styleguide/colors';

  .pane-tabs-titles-list {
    border-bottom: 1px solid #D6D6D6; // todo: pull these colors from the styleguide
    display: flex;
    margin: 0;
    padding: 0;
    list-style: none;
    justify-content: space-between;

    > * {
      flex-grow: 1;
      flex-basis: 25%;
      text-align: center;
    }

    &-trigger {
      appearance: none;
      background: transparent;
      border: none;
      cursor: pointer;
      font-size: 14px;
      margin: 0;
      padding: 17px 0;
      width: 100%;

      &:focus {
        outline: none;
      }

      &.active span {
        border-bottom: 4px solid #727272;
      }
    }
  }

  .more-tabs {
    position: relative;

    &-popover {
      position: absolute;
    }
  }

</style>

<template>
  <div class="pane-tabs">
    <div class="pane-tabs-titles">
      <ul class="pane-tabs-titles-list">
        <li v-for="(tab, index) in primaryTabs">
          <button type="button" class="pane-tabs-titles-list-trigger" :class="{ 'active' : isActive(index) }" @click.stop="selectTab(index)">
            <span>{{ tab }}</span>
          </button>
        </li>
        <li v-if="secondaryTabs.length">
          <moreTabs :items="secondaryTabs" :onClick="selectTab" :activeTab="activeTab"></moreTabs>
        </li>
      </ul>
    </div>
    <div class="pane-tabs-content" v-for="(content, index) in contents" v-if="isActive(index)">
      <keep-alive>
        <component :is="content.component" :args="content.args"></component>
      </keep-alive>
    </div>
  </div>
</template>


<script>
  import _ from 'lodash';
  import moreTabs from './more-tabs.vue';

  /**
   * Returns a new array with only the desired
   * property as for each entry
   *
   * @param  {Array} content
   * @param  {String} property
   * @return {Array}
   */
  function separateContent(content, property) {
    return _.compact(_.map(content, item => _.get(item, property, null)));
  }

  export default {
    props: ['tabs', 'contents'],
    data() {
      return {
        activeTab: 0
      };
    },
    computed: {
      secondaryTabs() {
        return this.tabs.length > 4 ? this.tabs.slice(3) : [];
      },
      primaryTabs() {
        return this.tabs.length > 4 ? this.tabs.slice(0, 3) : this.tabs;
      }
    },
    methods: {
      isActive(index) {
        return this.activeTab === index;
      },
      selectTab(index) {
        this.activeTab = index;
      }
    },
    components: _.assign(window.kiln.panes, { moreTabs })
  };
</script>
