<style lang="sass">
  @import '../../styleguide/panes';

  .pane-tabs {
    // max height of panes, minus pane header
    height: calc(100% - 51px);
  }

  .pane-tabs-titles {
    display: flex;
    border-bottom: 1px solid $pane-header-border;
    position: relative;

    &-scroll {
      &::-webkit-scrollbar {
        display: none;
      }
    }

    &-btn {
      appearance: none;
      background: white;
      border: none;
      color: black;
      cursor: pointer;
      outline: none;
      position: absolute;
      top: 0;
      height: 100%;

       &.left {
        background: linear-gradient(-90deg, transparent, rgba(255,255,255, 0.95) 14px);
        left: 0;
        padding: 0 23px 0 17px;
      }

      &.right {
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95) 14px);
        right: 0;
        padding: 0 17px 0 23px;
      }
    }

    &-scroll {
      overflow-x: scroll;
      overflow-y: hidden;
    }
  }

  .pane-tabs-titles-list {
    @include pane-tab-list();
  }

  .pane-tabs-content {
    height: calc(100% - 50px); // account for tab height
    overflow-x: visible;
    overflow-y: scroll;
  }
</style>

<template>
  <div class="pane-tabs">
    <div class="pane-tabs-titles">
      <button type="button" class="pane-tabs-titles-btn left" v-if="arrowsVisible && !hideLeftArrow" @click="sideScrollClick(false)">
        <svg viewBox="0 0 8 12" xmlns="http://www.w3.org/2000/svg" width="8" height="12"><path fill="#7A7A7A" d="M6 0l1.41 1.41L2.83 6l4.58 4.59L6 12 0 6z" fill-rule="evenodd"/></svg>
      </button>
      <div class="pane-tabs-titles-scroll" @scroll="tabScroll" ref="scrollContainer" v-h-scroll="scrollPos">
        <ul class="pane-tabs-titles-list" ref="tabItemContainer" v-bind:style="{ width: `${tabContainerWidth}px` }">
          <li v-for="(tab, index) in tabs" ref="tabItems" >
            <button type="button" class="pane-tabs-titles-list-trigger" :class="{ 'active' : isActive(index), 'disabled': tab.disabled }" @click.stop="selectTab(index, tab.disabled)">
              <span v-if="tab.isString" v-html="tab.header" class="pane-tab-title"></span>
              <component v-else :is="tab.component"></component>
            </button>
          </li>
        </ul>
      </div>
      <button type="button" class="pane-tabs-titles-btn right" v-if="arrowsVisible && !hideRightArrow" @click="sideScrollClick(true)">
        <icon name="right-caret"></icon>
      </button>
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
  import { setItem } from '../utils/local';
  import icon from '../utils/icon.vue';

  // TODO: FIGURE OUT THE BUG THAT WON'T INCLUDE THE `LEFT-CARET` ICON WITHOUT
  // PULLING IN THE SVG FOR THE RIGHT-CARET

  export default {
    props: ['content', 'saveTab'],
    data() {
      return {
        paneWidth: null,
        tabContainerWidth: null,
        activeTab: 0,
        arrowsVisible: false,
        hideRightArrow: true,
        hideLeftArrow: true,
        scrollPos: 0,
        step: null
      };
    },
    computed: {
      tabs() {
        return _.map(this.content, (item) => {
          const header = item.header;

          return _.isString(header) ? { header, isString: true, disabled: item.disabled } : { component: header.component, disabled: item.disabled };
        });
      }
    },
    created() {
      // Find the active index
      const activeIndex = _.findIndex(this.content, (item) => item.active);

      // Set active tab when opening
      this.activeTab = activeIndex < 0 ? 0 : activeIndex;
    },
    mounted() {
      let lastTabBtn = _.last(this.$refs.tabItems),
        width = getComputedStyle(this.$el).width;

      // Use position of the last tab item to define the width of the container
      this.paneWidth = _.parseInt(width.replace('px', ''));
      this.tabContainerWidth = lastTabBtn.offsetLeft + lastTabBtn.offsetWidth;

      // TODO: determine step calculation
      this.step = this.tabContainerWidth - this.paneWidth > 100 ? 100 : this.tabContainerWidth - this.paneWidth;

      // Toggle showing the arrows
      this.showArrows();
    },
    methods: {
      sideScrollClick(dir) {
        var step = this.tabContainerWidth - this.paneWidth > 100 ? 100 : this.tabContainerWidth - this.paneWidth - 1;

        this.scrollPos = dir ? this.scrollPos += step : this.scrollPos -= step;
      },
      tabScroll(e) {
        // TODO: move the tabs into it's own component so that we can get all this logic into it's own component
        this.scrollPos = e.target.scrollLeft;

        if (this.scrollPos <= 5) {
          this.hideLeftArrow = true;
          this.hideRightArrow = false;
        } else if (this.tabContainerWidth - this.scrollPos <= this.paneWidth + 5) {
          this.hideLeftArrow = false;
          this.hideRightArrow = true;
        } else {
          this.hideLeftArrow = false;
          this.hideRightArrow = false;
        }
      },
      showArrows() {
        if (this.tabContainerWidth > this.paneWidth) {
          this.arrowsVisible = true;
          this.hideRightArrow = false;
        }
      },
      isActive(index) {
        return this.activeTab === index;
      },
      selectTab(index, isDisabled) {
        if (isDisabled !== true) {
          this.$store.commit('SWITCH_TAB', this.tabs[index] && this.tabs[index].header);
          this.activeTab = index;

          if (this.saveTab) {
            // if this pane has a clay header (e.g. it's a clay menu),
            // then persist the active tab so it becomes the default next time
            setItem(`${this.saveTab}:activetab`, this.tabs[index].header);
          }
        }
      }
    },
    components: _.merge(window.kiln.panes, { icon })
  };
</script>
