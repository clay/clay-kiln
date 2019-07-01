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
        @keydown.down.stop.prevent="focusDown"
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
          :selected="selectedIndex === index"
          :key="`${item.id}-${index}`"
          :hasReorder="hasReorder"
          :hasRootAction="hasRootAction"
          :hasChildAction="hasChildAction"
          :secondaryActions="secondaryActions"
          :isFiltered="isFiltered"
          :focusIndex="focusIndex"
          :activeIndex="activeIndex"
          @toggle-expand="toggleExpand"
          @focus-up="focusUp"
          @focus-down="focusDown"
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
  import sortable from 'sortablejs';
  import { requestTimeout } from './events';
  import listItem from './filterable-list-item.vue';
  import UiTextbox from 'keen/UiTextbox';
  import UiButton from 'keen/UiButton';
  import { getDragDelay } from '../decorators/helpers';

  /**
   * Add SortableJS functionality
   *
   * @param {Element} el
   * @param {Function} reorder
   */
  function addSortableJS(el, reorder) {
    sortable.create(el, {
      delay: getDragDelay(),
      direction: 'vertical',
      handle: '.drag_handle',
      onEnd(evt) {
        reorder(evt.item.getAttribute('data-item-id'), evt.newIndex, evt.oldIndex, evt.item);
      }
    });
  }

  /**
   * determine if a root-level item has children that match the query,
   * and if so return them
   * @param  {object}  item
   * @param  {string}  queryLower
   * @return {array}
   */
  function findChildMatches(item, queryLower) {
    if (!item.children) {
      return [];
    } else {
      return _.filter(item.children, (child) => {
        let titleLower = child.title.toLowerCase(),
          idLower = child.id.toLowerCase();

        return _.includes(titleLower, queryLower) || _.includes(idLower, queryLower);
      });
    }
  }

  /**
   * "Search" the items in the list. Filters by both
   * `id` value and `title`. if items have children, will filter them too
   *
   * @param  {Array} content
   * @param  {String} query
   * @return {Array}
   */
  function filterContent(content, query) {
    return _.reduce(content, (items, item) => {
      let queryLower = query.toLowerCase(),
        titleLower = item.title.toLowerCase(),
        idLower = item.id.toLowerCase(),
        isRootMatch = _.includes(titleLower, queryLower) || _.includes(idLower, queryLower),
        childMatches = findChildMatches(item, queryLower);

      if (isRootMatch) {
        // pass along the item, include all its children (if it has them)
        items.push(item);
      } else if (childMatches.length) {
        // pass along the item, but only pass along children that match
        items.push(_.assign({}, item, { children: childMatches }));
      }
  
      return items;
    }, []);
  }

  /**
   * when the store is updated (e.g. if you hit the meta key), we don't want to
   * automatically close any expanded categories. this makes sure that categories
   * which are currently expanded remain expanded when `this.content` updates
   * @param  {array} list
   * @param  {array} matches
   * @return {array}
   */
  function expandCurrentlyExpanded(list, matches) {
    return _.map(list, (item) => {
      if (!item.expanded && _.find(matches, match => item.id === match.id && match.expanded)) {
        item.expanded = true;
      }
  
      return item;
    });
  }

  export default {
    props: ['content', 'secondaryActions', 'header', 'addTitle', 'addIcon', 'filterLabel', 'filterHelp', 'initialExpanded'],
    data() {
      return {
        query: '',
        focusIndex: [null, null],
        activeIndex: [null, null],
        matches: []
      };
    },
    computed: {
      fullContent() {
        return _.map(_.cloneDeep(this.content), (item) => {
          item.expanded = this.hasChildAction && item.id === this.initialExpanded;
  
          return item;
        });
      },
      isFiltered() {
        // when expandable items are filtered, they should expand automatically
        return this.query.length > 0;
      },
      focusIsNull() {
        return _.isEqual(this.focusIndex, [null, null]);
      },
      selectedIndex() {
        return _.findIndex(this.matches, item => item.selected);
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
    watch: {
      query(val) {
        this.matches = val.length ? filterContent(this.fullContent, this.query) : this.fullContent;
      },
      fullContent(val) {
        val = expandCurrentlyExpanded(val, this.matches);
        // when the full list updates, update the matches
        this.matches = this.query.length ? filterContent(val, this.query) : val;
      }
    },
    mounted() {
      const self = this;

      // set initial list data
      this.matches = this.fullContent;

      // Add Sortable
      if (this.hasReorder) {
        addSortableJS(this.$refs.list, this.onReorder);
      }

      this.$nextTick(() => {
        const input = find(self.$el, '.filterable-list-input-field');

        // focus on the input if it wasn't focused before
        input && input.focus();
      });
    },
    methods: {
      focusOnIndex(index, childIndex) {
        this.focusIndex = [index, childIndex];
      },
      focusDown() {
        const parentIndex = !_.isNull(this.focusIndex[0]) ? this.focusIndex[0] : -1, // set to -1 if it's null
          childIndex = !_.isNull(this.focusIndex[1]) ? this.focusIndex[1] : -1, // set to -1 if it's null
          parentsLength = _.get(this, 'matches.length', 0),
          childrenLength = _.get(this, `matches[${parentIndex}].children.length`, 0),
          expanded = _.get(this, `matches[${parentIndex}].expanded`, false);

        if (expanded && childIndex < childrenLength - 1) {
          this.focusIndex = [parentIndex, childIndex + 1]; // next child
        } else if (parentIndex < parentsLength - 1) {
          this.focusIndex = [parentIndex + 1, null]; // next parent
        } // otherwise we're at the end of the list
      },
      focusUp() {
        const parentIndex = !_.isNull(this.focusIndex[0]) ? this.focusIndex[0] : -1, // set to -1 if it's null
          childIndex = !_.isNull(this.focusIndex[1]) ? this.focusIndex[1] : -1, // set to -1 if it's null
          expanded = _.get(this, `matches[${parentIndex}].expanded`, false),
          prevExpanded = _.get(this, `matches[${parentIndex - 1}].expanded`, false),
          prevChildrenLength = _.get(this, `matches[${parentIndex - 1}].children.length`, 0);

        if (expanded && childIndex > 0) {
          this.focusIndex = [parentIndex, childIndex - 1]; // prev child
        } else if (expanded && childIndex === 0) {
          this.focusIndex = [parentIndex, null]; // back to parent
        } else if (parentIndex > 0 && prevExpanded) {
          this.focusIndex = [parentIndex - 1, prevChildrenLength - 1]; // last child of prev parent
        } else if (parentIndex > 0) {
          this.focusIndex = [parentIndex - 1, null]; // prev parent
        } else {
          this.focusIndex = [null, null]; // beginning of list, back to the input we go!
        }
      },
      setActive(index, childIndex) {
        this.activeIndex = [index, childIndex];
      },
      onEnterDown() {
        const input = find(this.$el, '.filterable-list-input input');

        // simulate active states when pressing enter
        if (this.matches.length === 1 && !_.get(this.matches, '[0].children.length')) {
          this.focusOnIndex(0, null);
          this.setActive(0, null);
        } else {
          this.setActive(null, null);
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
      },
      toggleExpand(index, shouldExpand) {
        _.set(this.matches, `[${index}].expanded`, shouldExpand);
      }
    },
    components: {
      'list-item': listItem,
      UiTextbox,
      UiButton
    }
  };
</script>
