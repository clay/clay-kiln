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
          <button type="button" class="pane-tabs-titles-list-trigger" :class="{ 'active' : isActive(index) }" @click.stop="selectTab(index)">
            <span v-html="tab"></span>
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
      return {
        activeTab: 0
      };
    },
    computed: {
      tabs() {
        return _.map(this.content, (item) => item.header);
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
    components: window.kiln.panes
  };
</script>
