<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/animations';
  @import '../../styleguide/typography';

  .filterable-list {
    display: flex;
    flex-direction: column;
    height: 100%;

    &-input {
      flex: 0 0 auto;
      margin: 16px;
    }

    &-headers {
      @include type-list-header();

      align-items: center;
      background-color: $md-grey-50;
      border-top: 1px solid $divider-color;
      display: flex;
      flex: 0 0 auto;
      padding: 8px 16px;

      .filterable-list-header {
        &-drag {
          flex: 0 0 36px;
        }

        &-title {
          flex: 0 1 100%;
        }
      }
    }

    &-readout {
      flex: 0 1 100%;
      min-height: 200px;
      overflow-y: scroll;
      overflow-x: hidden;
      padding: 0;

      &-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
    }

    &-add {
      border-top: 1px solid $divider-color;
      flex: 0 0 auto;
      padding: 16px;

      &-button {
        width: 100%;
      }
    }
  }

  @keyframes shake {
    0%, 100% {transform: translateX(0);}
    20%, 60% {transform: translateX(-5px);}
    40%, 80% {transform: translateX(5px);}
  }

  .kiln-shake {
    animation-name: shake;
    animation-duration: $standard-time;
    animation-fill-mode: both;
  }
</style>

<template>
  <div class="filterable-list">
    <div class="filterable-list-input" v-if="hasFilter">
      <ui-textbox
        v-model.trim="query"
        :label="filterLabel || 'Filter List'"
        :floatingLabel="true"
        :help="filterHelp"
        :autofocus="true"
        @keyup.prevent
        @keydown.up.stop
        @keydown.down.stop="focusOnIndex(0)"
        @keydown.enter.stop.prevent="onEnterDown"
        v-conditional-focus="focusIsNull"></ui-textbox>
    </div>
    <div v-if="hasHeaders" class="filterable-list-headers">
      <span v-if="hasReorder" class="filterable-list-header filterable-list-header-drag"><!-- no header --></span>
      <span class="filterable-list-header filterable-list-header-title">{{ header }}</span>
      <span v-if="hasSecondaryActions" class="filterable-list-header filterable-list-header-actions" :style="{ flex: secondaryActionWidth }">Actions</span>
    </div>
    <div class="filterable-list-readout">
      <ul class="filterable-list-readout-list" ref="list">
        <list-item
          v-for="(item, index) in matches"
          :item="item"
          :index="index"
          :focused="focusIndex === index"
          :active="activeIndex === index"
          :selected="selectedIndex === index"
          :key="item.id"
          :hasReorder="hasReorder"
          :hasRootAction="hasRootAction"
          :hasChildAction="hasChildAction"
          :secondaryActions="secondaryActions"
          :isFiltered="isFiltered"
          @focus-index="focusOnIndex"
          @set-active="setActive"
          @root-action="onRootAction"
          @child-action="onChildAction"></list-item>
      </ul>
      <div v-if="hasAddItem" class="filterable-list-add">
        <ui-button class="filterable-list-add-button" type="primary" color="default" @click.stop="$emit('add')" :icon="addIcon || 'add'">{{ addTitle || 'Add To List' }}</ui-button>
      </div>
    </div>
  </div>
</template>


<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import dragula from 'dragula';
  import { requestTimeout } from './events';
  import listItem from './filterable-list-item.vue';
  import UiTextbox from 'keen/UiTextbox';
  import UiButton from 'keen/UiButton';

  // Placeholder for Dragula instance
  var drag;

  /**
   * get index of a child element in a container
   * @param {Element} el
   * @param {Element} container
   * @returns {number}
   */
  function getIndex(el, container) {
    return _.findIndex(container.children, (child) => child === el);
  }

  /**
   * Add Dragula functionality
   *
   * @param {Element} el
   * @param {Function} reorder
   */
  function addDragula(el, reorder) {
    var oldIndex;

    drag = dragula([el], {
      direction: 'vertical'
    });

    drag.on('drag', function (selectedItem, container) {
      oldIndex = getIndex(selectedItem, container);
    });

    drag.on('cancel', function () {
      oldIndex = null;
    });

    drag.on('drop', function (selectedItem, container) {
      reorder(selectedItem.getAttribute('data-item-id'), getIndex(selectedItem, container), oldIndex, selectedItem);
    });
  }

  /**
   * determine if a root-level item has children that match the query
   * @param  {object}  item
   * @param  {string}  queryLower
   * @return {Boolean}
   */
  function hasChildMatches(item, queryLower) {
    if (!item.children) {
      return false;
    } else {
      return _.filter(item.children, (child) => {
        let titleLower = child.title.toLowerCase(),
          idLower = child.id.toLowerCase();

        return _.includes(titleLower, queryLower) || _.includes(idLower, queryLower);
      }).length > 0;
    }
  }

  /**
   * "Search" the items in the list. Filters by both
   * `id` value and `title`
   *
   * @param  {Array} content
   * @param  {String} query
   * @return {Array}
   */
  function filterContent(content, query) {
    return _.filter(content, (item) => {
      var queryLower = query.toLowerCase(),
        titleLower = item.title.toLowerCase(),
        idLower = item.id.toLowerCase();

      return _.includes(titleLower, queryLower) || _.includes(idLower, queryLower) || hasChildMatches(item, queryLower);
    });
  }

  export default {
    props: ['content', 'secondaryActions', 'header', 'addTitle', 'addIcon', 'filterLabel', 'filterHelp'],
    data() {
      return {
        query: '',
        focusIndex: null,
        activeIndex: null
      };
    },
    computed: {
      matches() {
        return this.query.length ? filterContent(this.content, this.query) : this.content;
      },
      isFiltered() {
        // when expandable items are filtered, they should expand automatically
        return this.query.length > 0;
      },
      focusIsNull() {
        return _.isNull(this.focusIndex);
      },
      selectedIndex() {
        return _.findIndex(this.matches, (item) => item.selected);
      },
      hasFilter() {
        return !_.has(this.$listeners, 'reorder');
      },
      hasReorder() {
        return _.has(this.$listeners, 'reorder');
      },
      hasHeaders() {
        return !!this.header;
      },
      hasRootAction() {
        return _.has(this.$listeners, 'root-action');
      },
      hasChildAction() {
        return _.has(this.$listeners, 'child-action');
      },
      hasSecondaryActions() {
        return this.secondaryActions && !!this.secondaryActions.length;
      },
      secondaryActionWidth() {
        return this.hasSecondaryActions ? `0 0 ${this.secondaryActions.length * 36}px` : '0 0 0px';
      },
      hasAddItem() {
        return _.has(this.$listeners, 'add');
      }
    },
    mounted() {
      const self = this;

      // Add dragula
      if (this.hasReorder) {
        addDragula(this.$refs.list, this.onReorder);
      }

      this.$nextTick(() => {
        const input = find(self.$el, '.filterable-list-input-field');

        // focus on the input if it wasn't focused before
        input && input.focus();
      });
    },
    beforeDestroy() {
      // Clean up any Dragula event handlers
      if (drag) {
        drag.destroy();
      }
    },
    methods: {
      focusOnIndex(index) {
        if (index < 0) {
          this.focusIndex = null;
        } else if (index !== this.matches.length) {
          this.focusIndex = index;
        }
      },
      setActive(index) {
        if (index < 0) {
          this.activeIndex = null;
        } else if (index !== this.matches.length) {
          this.activeIndex = index;
        }
      },
      onEnterDown() {
        const input = find(this.$el, '.filterable-list-input input');

        // simulate active states when pressing enter
        if (this.matches.length === 1) {
          this.focusIndex = 0;
          this.activeIndex = 0;
        } else {
          this.activeIndex = null;
          if (input) {
            input.classList.add('kiln-shake');
            requestTimeout(() => input.classList.remove('kiln-shake'), 301); // length of the animation + 1
          }
        }
      },
      onReorder(id, index, oldIndex, selectedItem) {
        this.$emit('reorder', id, index, oldIndex, selectedItem);
      },
      onRootAction(id, title) {
        this.$emit('root-action', id, title);
      },
      onChildAction(id, title) {
        this.$emit('child-action', id, title);
      }
    },
    components: {
      'list-item': listItem,
      UiTextbox,
      UiButton
    }
  };
</script>
