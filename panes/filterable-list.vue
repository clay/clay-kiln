<style lang="sass">
  @import '../styleguide/inputs';
  @import '../styleguide/colors';

  .filterable-list {
    height: calc(100% - 51px);

    &-input {
      padding: 4px;
      &-field {
        @include input();

        padding: 10px 14px;
      }
    }

    &-readout {
      overflow-y: scroll;
      overflow-x: hidden;
      // pane height minus header minus filter input,
      // so it doesn't conflict with the pane tabs scrolling
      height: calc(100% - 57px);
      padding: 0 18px 18px;

      &-list {
        list-style: none;
        margin: 0;
        padding: 0;
      }
    }

    &.has-reorder &-readout {
      // has reorder, so no search input
      height: 100%;
    }
  }

  // lists inside tabbed panes need slightly different heights
  .pane-tabs-content .filterable-list {
    height: 100%;
  }

  @keyframes shake {
    0%, 100% {transform: translateX(0);}
    20%, 60% {transform: translateX(-5px);}
    40%, 80% {transform: translateX(5px);}
  }

  .kiln-shake {
    animation-name: shake;
    animation-duration: 300ms;
    animation-fill-mode: both;
  }
</style>

<template>
  <div class="filterable-list" :class="{ 'has-reorder': onReorder }">
    <div class="filterable-list-input" v-if="!onReorder">
      <input
        type="text"
        class="filterable-list-input-field"
        :placeholder="inputPlaceholder"
        ref="search"
        v-model="query"
        @keyup.stop.prevent
        @keydown.up.stop
        @keydown.down.stop="focusOnIndex(0)"
        @keydown.enter.stop.prevent="onEnterDown"
        v-conditional-focus="focusIsNull">
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
          :onClick="onClick"
          :onSettings="onSettings"
          :onDelete="onDelete"
          :onReorder="onReorder"
          :focusOnIndex="focusOnIndex"
          :setActive="setActive"></list-item>
        <list-add
          v-if="onAdd"
          :onClick="onAdd"
          :title="addTitle"></list-add>
      </ul>
    </div>
  </div>
</template>


<script>
  import _ from 'lodash';
  import { find } from '@nymag/dom';
  import listItem from './filterable-list-item.vue';
  import listAdd from './filterable-list-add.vue';
  import dragula from 'dragula';

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
   * "Search" the items in the list. Filters by both
   * `id` value and `title`
   *
   * @param  {Array} content
   * @param  {String} query
   * @return {Array}
   */
  function filterContent(content, query) {
    return _.filter(content, item => {
      var queryLower = query.toLowerCase(),
        titleLower = item.title.toLowerCase(),
        idLower = item.id.toLowerCase();

      return _.includes(titleLower, queryLower) || _.includes(idLower, queryLower);
    });
  }

  export default {
    props: ['content', 'onClick', 'onSettings', 'onDelete', 'onReorder', 'onAdd', 'addTitle', 'placeholder'],
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
      focusIsNull() {
        return _.isNull(this.focusIndex);
      },
      inputPlaceholder() {
        return this.placeholder || 'Begin typing to filter list';
      },
      selectedIndex() {
        return _.findIndex(this.matches, (item) => item.selected);
      }
    },
    mounted() {
      const self = this;

      // Add dragula
      if (this.onReorder) {
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
        const input = find(this.$el, '.filterable-list-input-field');

        // simulate active states when pressing enter
        if (this.matches.length === 1) {
          this.focusIndex = 0;
          this.activeIndex = 0;
        } else {
          this.activeIndex = null;
          input.classList.add('kiln-shake');
          setTimeout(() => input.classList.remove('kiln-shake'), 301); // length of the animation + 1
        }
      }
    },
    components: {
      'list-item': listItem,
      'list-add': listAdd
    }
  };
</script>
