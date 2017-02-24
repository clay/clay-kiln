<template>
  <transition name="pane-slide">
    <div class="kiln-toolbar-pane" v-if="hasCurrentPaneName" v-bind:style="{ left: `${paneOffset}px` }" @click.stop>
      <div class="kiln-pane-header">
        <div class="kiln-pane-header-left">
          {{ paneTitle || 'Pane Title' }}
        </div>
        <div class="kiln-pane-header-right">
          <button type="button" class="kiln-pane-header-right-close" @click="closePane"><icon name="close-edit"></icon></button>
        </div>
      </div>
      <component :is="nonTabComponent" :content="nonTabContent" v-if="nonTabComponent"></component>
      <paneTabs :tabs="tabs" :contents="tabContents" v-if="isTabbed"></paneTabs>
    </div>
  </transition>
</template>


<script>
  import _ from 'lodash';
  import { OPEN_PANE, CLOSE_PANE } from '../panes/mutationTypes'
  import paneTabs from './pane-tabs.vue';
  import icon from '../utils/icon.vue';
  import paneActions from './pane-actions.vue';

  const contentPath = 'state.ui.currentPane.options.content';

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
    props: [],
    data() {
      return {};
    },
    computed: {
      paneTitle() {
        var title = _.get(this.$store, 'state.ui.currentPane.options.title', '');

        if (!title) {
          console.warn('Pane has no `title` property set, string "Pane Title" will be displayed as a placeholder.');
        }

        return title;
      },
      nonTabComponent() {
        return _.get(this.$store, 'state.ui.currentPane.options.component', '');
      },
      nonTabContent() {
        return _.get(this.$store, 'state.ui.currentPane.options.content', '');
      },
      hasCurrentPaneName() {
        return _.get(this.$store, 'state.ui.currentPane.name', '');
      },
      isTabbed() {
        return _.get(this.$store, 'state.ui.currentPane.options.tabbed', false);
      },
      tabs() {
        return separateContent(_.get(this.$store, contentPath, null), 'title');
      },
      tabContents() {
        return separateContent(_.get(this.$store, contentPath, null), 'tabContent');;
      },
      hasPaneActions() {
        return true;
      },
      paneOffset() {
        // TODO: Make this work with variable pane widths
        var offset = _.get(this.$store, 'state.ui.currentPane.paneOffset', ''),
          paneWidth = 320,
          rightAlignedOffset = null;

        if (offset && (offset.left + paneWidth > window.innerWidth)) {
          rightAlignedOffset = (offset.left + offset.width) - paneWidth;
        }

        return rightAlignedOffset || offset.left;
      }
    },
    methods: {
      closePane() {
        var currentPane = _.get(this.$store, 'state.ui.currentPane');

        this.$store.commit(CLOSE_PANE, null);
      }
    },
    components: _.assign(window.kiln.panes, { paneTabs, icon, paneActions })
  };
</script>
