<style lang="sass">
  @import '../styleguide/_inputs';

  .filterable-list {
    padding: 17px;
    &-input {
      &-field {
        @include input();
      }
    }
    &-readout {
      overflow-y: scroll;
      overflow-x: hidden;
      max-height: 600px;

      &-list {
        list-style: none;
        margin: 0;
        padding: 0;

        > * + * {
          border-top: 1px solid $grey;
        }
      }
    }
  }
</style>

<template>
  <div class="filterable-list">
    <div class="filterable-list-input" v-if="!onReorder">
      <input
        type="text"
        class="filterable-list-input-field"
        placeholder="Begin typing to filter list"
        ref="search"
        v-model="query">
    </div>
    <div class="filterable-list-readout">
      <ul class="filterable-list-readout-list" ref="list">
        <list-item
          v-for="(item, index) in matches"
          :item="item"
          :index="index"
          :key="item.id"
          :onClick="onClick"
          :onSettings="onSettings"
          :onDelete="onDelete"
          :onReorder="onReorder"></list-item>
      </ul>
    </div>
  </div>
</template>


<script>
  import Vue from 'vue';
  import _ from 'lodash';
  import listItem from './filterable-list-item.vue';
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
   * @param {Function} onReorder
   */
  function addDragula(el, reorder) {
    var oldIndex;

    drag = dragula([el], {
      direction: 'vertical'
    });

    drag.on('drag', function (selectedItem, container) {
      oldIndex = getIndex(selectedItem, container);
    });

    drag.on('cancel', function (selectedItem, container) {
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
    props: ['content', 'onClick', 'onSettings', 'onDelete', 'onReorder'],
    data() {
      return {
        query: ''
      }
    },
    computed: {
      matches() {
        return this.query.length ? filterContent(this.content, this.query) : this.content;
      }
    },
    mounted() {
      // Focus on the input field
      // TODO: Turn this into a directive
      if (this.$refs.search) {
        this.$refs.search.focus();
      }

      // Add dragula
      if (this.onReorder) {
        addDragula(this.$refs.list, this.onReorder);
      }

      // set height for filterable lists when they mount,
      // so filtering the list doesn't change the pane height
      this.$el.style.height = getComputedStyle(this.$el).height;
    },
    beforeDestroy() {
      // Clean up any Dragula event handlers
      if (drag) {
        drag.destroy();
      }
    },
    components: {
      'list-item': listItem
    }
  };
</script>
