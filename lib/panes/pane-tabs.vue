<style lang="sass">
  @import '../../styleguide/panes';

  .pane-tabs-titles-list {
    @include pane-tab-list();
  }
</style>

<template>
  <div class="pane-tabs">
    <div class="pane-tabs-titles">
      <ul class="pane-tabs-titles-list">
        <li v-for="(tab, index) in tabs">
          <button type="button" class="pane-tabs-titles-list-trigger" :class="{ 'active' : isActive(index), 'disabled': tab.disabled }" @click.stop="selectTab(index, tab.disabled)">
            <span v-if="tab.isString" v-html="tab.header" class="pane-tab-title"></span>
            <component v-else :is="tab.component"></component>
          </button>
        </li>
      </ul>
      <!-- todo: add right arrow for scrolling -->
    </div>
    <div class="pane-tabs-content" v-for="(item, index) in content" v-if="isActive(index)">
      <keep-alive>
        <component :is="item.content.component" :args="item.content.args"></component>
      </keep-alive>
    </div>
  </div>
</template>


<script>
  import _ from 'lodash';

  export default {
    props: ['content'],
    data() {
      return {};
    },
    computed: {
      tabs() {
        return _.map(this.content, (item) => {
          const header = item.header;

          return _.isString(header) ? { header, isString: true, disabled: item.disabled } : { component: header.component, disabled: item.disabled };
        });
      },
      activeTab() {
        return _.findIndex(this.content, (item) => item.active) || 0;
      }
    },
    mounted() {
      // set height for tabbed panes when they mount,
      // so clicking tabs doesn't change the pane height
      this.$el.style.height = getComputedStyle(this.$el).height;
    },
    methods: {
      isActive(index) {
        return this.activeTab === index;
      },
      selectTab(index, isDisabled) {
        if (!isDisabled) {
          this.activeTab = index;
        }
      }
    },
    components: window.kiln.panes
  };
</script>
