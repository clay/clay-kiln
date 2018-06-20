<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .filterable-list-item {
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
    &.clickable.focused {
      background-color: $list-bg-hover;
    }

    &.active:after {
      opacity: 0.4;
      transition: opacity 600ms ease-out;
      width: 100%;
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
  }
</style>

<template>
  <li class="filterable-list-item" :data-item-id="item.id" :ref="item.id" :class="{ focused: focused, active: active, selected: selected, 'clickable': hasRootAction }" @click.stop="handleClick(item.id, item.title)">
    <ui-icon-button v-if="hasReorder" type="button" class="filterable-list-item-drag" tooltip="Drag to Reorder" icon="drag_handle"></ui-icon-button>
    <button
      type="button"
      class="filterable-list-item-btn"
      v-conditional-focus="focused"
      @keydown.down.stop.prevent="$emit('focus-index', index + 1)"
      @keydown.up.stop.prevent="$emit('focus-index', index - 1)"
      @keydown.enter.stop.prevent="onEnterDown"
      @keyup.enter.stop="onEnterUp">
      {{ item.title }}
    </button>
    <ui-ripple-ink v-if="hasRootAction" ref="ripple" :trigger="item.id"></ui-ripple-ink>
    <ui-icon-button v-for="action in displayedActions" :key="action.tooltip" type="button" class="filterable-list-item-secondary-action" :tooltip="action.tooltip" :icon="action.icon" @click.stop="action.action(item.id)"></ui-icon-button>
  </li>
</template>

<script>
  import UiIconButton from 'keen/UiIconButton';
  import UiRippleInk from 'keen/UiRippleInk';

  export default {
    props: ['item', 'index', 'focused', 'active', 'selected', 'hasReorder', 'hasRootAction', 'hasChildAction', 'secondaryActions'],
    data() {
      return {};
    },
    computed: {
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
      }
    },
    methods: {
      onEnterDown() {
        this.$emit('set-active', this.index);
      },
      onEnterUp() {
        this.$emit('set-active', this.index);
        this.handleClick(this.item.id, this.item.title);
      },
      handleClick(id, title) {
        if (this.hasRootAction) {
          return this.$emit('root-action', id, title);
        }
      }
    },
    components: {
      UiIconButton,
      UiRippleInk
    }
  };
</script>
