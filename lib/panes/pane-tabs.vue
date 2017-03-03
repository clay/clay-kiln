<style lang="sass">
  @import '../../styleguide/panes';

  .pane-tabs-titles {
    border-bottom: 1px solid $pane-header-border;
    overflow-x: scroll;
    overflow-y: hidden;

    &::-webkit-scrollbar {
      display: none;
    }
  }

  .pane-tabs-titles-list {
    @include pane-tab-list();
  }
</style>

<template>
  <div class="pane-tabs">
    <div class="pane-tabs-titles">
      <ul class="pane-tabs-titles-list" ref="tabItemContainer">
        <li v-for="(tab, index) in tabs" ref="tabItems" >
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
        paneWidth: null,
        tabContainerWidth: null,
        activeTab: 0
      };
    },
    computed: {
      tabs() {
        return _.map(this.content, (item) => item.header);
      }
    },
    mounted() {
      var lastTabBtn = _.last(this.$refs.tabItems),
        $elComputedStyles = getComputedStyle(this.$el);

      // set height for tabbed panes when they mount,
      // so clicking tabs doesn't change the pane height
      this.$el.style.height = $elComputedStyles.height;

      // Use position of the last tab item to define the width of the container
      this.paneWidth = $elComputedStyles.width;
      this.tabContainerWidth = lastTabBtn.offsetLeft + lastTabBtn.offsetWidth;
      this.$refs.tabItemContainer.style.height = this.tabContainerWidth;

      this.showArrows();
    },
    methods: {
      showArrows() {
        console.log('Add Arrows In If Needed');
        // if (this.tabContainerWidth > this.$el.style.width) {
        //   console.log('Womp', this.$el.style.width);
        // }
      },
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
