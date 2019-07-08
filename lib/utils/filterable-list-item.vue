<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .filterable-list-item {
    border: 0;

    &.expanded {
      border-bottom: 1px solid $divider-color;
      border-top: 1px solid $divider-color;

      .filterable-list-item-btn {
        // when expanding items, the item title should be differentiated from its children
        color: $brand-accent-color;
        font-weight: bold;
      }
    }

    &-inner {
      align-items: center;
      background-color: $list-bg;
      color: $list-bg-active;
      display: flex;
      padding: 0 16px;
      position: relative;
      transition: 200ms background-color ease-out;

      &:after {
        background-color: currentColor;
        content: '';
        height: 100%;
        left: 0;
        opacity: 0;
        pointer-events: none;
        position: absolute;
        top: 0;
        transition: opacity 600ms ease-out;
        user-select: none;
        width: 0%;
      }

      &.clickable {
        cursor: pointer;
      }

      &.clickable:hover,
      &.focused {
        background-color: $list-bg-hover;
      }

      &.active:after {
        opacity: 0.4;
        transition: opacity 600ms ease-out;
        width: 100%;
      }
    }

    &-drag {
      color: $text-hint-color;
    }

    &-secondary-action {
      color: $text-alt-color;
    }

    &-btn {
      @include type-subheading();

      appearance: none;
      background: transparent;
      border: none;
      cursor: default;
      flex-grow: 1;
      height: 48px;
      padding: 0;
      text-align: left;
      vertical-align: middle;

      .clickable & {
        cursor: pointer;
      }

      &:focus {
        outline: none;
      }
    }

    &.selected &-btn {
      // some lists allow for denoting a "selected" item
      // e.g. spaces, component finder
      font-weight: bold;
    }

    &-children {
      padding: 0;
    }
  }
</style>

<template>
  <li class="filterable-list-item" :data-item-id="item.id" :ref="item.id" :class="{ expanded: shouldExpand && expanded }">
    <div class="filterable-list-item-inner" :class="{ focused: focused, active: active, selected: selected, 'clickable': hasRootAction }" @click.stop="handleClick(item.id, item.title)">
      <ui-icon-button v-if="hasReorder" type="button" class="filterable-list-item-drag" tooltip="Drag to Reorder" icon="drag_handle"></ui-icon-button>
      <button
        type="button"
        class="filterable-list-item-btn"
        @keydown.down.stop.prevent="$emit('focus-down')"
        @keydown.up.stop.prevent="$emit('focus-up')"
        @keydown.enter.stop.prevent="onEnterDown"
        @keydown.right.stop.prevent="toggleExpand"
        @keyup.enter.stop.prevent="onEnterUp"
        v-conditional-focus="focused">
        {{ item.title }}
      </button>
      <ui-ripple-ink v-if="hasRootAction" ref="ripple" :trigger="item.id"></ui-ripple-ink>
      <ui-icon-button v-if="shouldExpand" type="button" class="filterable-list-item-secondary-action" :icon="expandIcon" @click.stop="toggleExpand"></ui-icon-button>
      <ui-icon-button v-else v-for="action in displayedActions" :key="action.tooltip" type="button" class="filterable-list-item-secondary-action" :tooltip="action.tooltip" :icon="action.icon" @click.stop="action.action(item.id, item.title)"></ui-icon-button>
    </div>
    <ul v-if="expanded" class="filterable-list-item-children">
      <list-item-child
        v-for="(child, childIndex) in item.children"
        :child="child"
        :key="`${child.id}-${childIndex}`"
        :secondaryActions="secondaryActions"
        :hasChildAction="hasChildAction"
        :parentIndex="index"
        :index="childIndex"
        :focusIndex="focusIndex"
        :activeIndex="activeIndex"
        @focus-up="onFocusUp"
        @focus-down="onFocusDown"
        @set-active="onSetActive"
        @child-action="onChildAction"></list-item-child>
    </ul>
  </li>
</template>

<script>
  import _ from 'lodash';
  import UiIconButton from 'keen/UiIconButton';
  import UiRippleInk from 'keen/UiRippleInk';
  import listItemChild from './filterable-list-item-child.vue';

  export default {
    props: ['item', 'index', 'selected', 'hasReorder', 'hasRootAction', 'hasChildAction', 'secondaryActions', 'isFiltered', 'focusIndex', 'activeIndex'],
    data() {
      return {};
    },
    computed: {
      focused() {
        return this.focusIndex[0] === this.index && _.isNull(this.focusIndex[1]);
      },
      active() {
        return this.activeIndex[0] === this.index && _.isNull(this.activeIndex[1]);
      },
      shouldExpand() {
        return this.hasChildAction && !!_.get(this.item, 'children.length', 0);
      },
      expanded() {
        return this.item.expanded || this.isFiltered;
      },
      displayedActions() {
        const id = this.item.id;

        return _.reduce(this.secondaryActions, (enabledActions, action) => {
          let generated = {};

          // check to see if action is enabled
          if (action.enable && _.isFunction(action.enable) && !action.enable(id)) {
            // if there's an `enable` function and it returns falsy, don't include the action
            return enabledActions;
          }

          // generate a per-item tooltip if it's a function
          if (_.isFunction(action.tooltip)) {
            generated.tooltip = action.tooltip(id);
          }

          // generate a per-item icon if it's a function
          if (_.isFunction(action.icon)) {
            generated.icon = action.icon(id);
          }

          enabledActions.push(_.assign({}, action, generated));
  
          return enabledActions;
        }, []);
      },
      expandIcon() {
        return this.expanded ? 'keyboard_arrow_up' : 'keyboard_arrow_down';
      }
    },
    methods: {
      onEnterDown() {
        this.$emit('set-active', this.index, null);
      },
      onEnterUp() {
        this.handleClick(this.item.id, this.item.title);
      },
      handleClick(id, title) {
        if (this.hasRootAction) {
          return this.$emit('root-action', id, title);
        } else {
          this.toggleExpand();
        }
      },
      onChildAction(id, title) {
        this.$emit('child-action', id, title);
      },
      toggleExpand() {
        if (this.shouldExpand) {
          this.$emit('toggle-expand', this.index, !this.item.expanded);
        }
      },
      onFocusUp() {
        this.$emit('focus-up');
      },
      onFocusDown() {
        this.$emit('focus-down');
      },
      onSetActive(index, childIndex) {
        this.$emit('set-active', index, childIndex);
      }
    },
    components: {
      UiIconButton,
      UiRippleInk,
      'list-item-child': listItemChild
    }
  };
</script>
