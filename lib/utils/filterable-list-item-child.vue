<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';

  .filterable-list-item-child {
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
  }
</style>

<template>
  <li class="filterable-list-item-child" :data-item-id="child.id" :ref="child.id" :class="{ focused: focused, active: active, 'clickable': hasChildAction }" @click.stop="handleChildClick(child.id, child.title)">
    <button
      type="button"
      class="filterable-list-item-child-btn"
      @keydown.down.stop.prevent="$emit('focus-down')"
      @keydown.up.stop.prevent="$emit('focus-up')"
      @keydown.enter.stop.prevent="onEnterDown"
      @keyup.enter.stop.prevent="onEnterUp"
      v-conditional-focus="focused">
      {{ child.title }}
    </button>
    <ui-ripple-ink v-if="hasChildAction" ref="ripple" :trigger="child.id"></ui-ripple-ink>
    <ui-icon-button v-for="action in displayedActions" :key="action.tooltip" type="button" class="filterable-list-item-child-secondary-action" :tooltip="action.tooltip" :icon="action.icon" @click.stop="action.action(child.id, child.title)"></ui-icon-button>
  </li>
</template>

<script>
  import _ from 'lodash';
  import UiIconButton from 'keen/UiIconButton';
  import UiRippleInk from 'keen/UiRippleInk';

  export default {
    props: ['child', 'parentIndex', 'index', 'hasChildAction', 'secondaryActions', 'focusIndex', 'activeIndex'],
    data() {
      return {};
    },
    computed: {
      focused() {
        return this.focusIndex[0] === this.parentIndex && this.focusIndex[1] === this.index;
      },
      active() {
        return this.activeIndex[0] === this.parentIndex && this.activeIndex[1] === this.index;
      },
      displayedActions() {
        const id = this.child.id;

        return _.reduce(this.secondaryActions, (enabledActions, action) => {
          let generated = {};

          // check to see if action is enabled
          if (action.enable && _.isFunction(action.enable) && !action.enable(id)) {
            // if there's an `enable` function and it returns falsy, don't include the action
            return enabledActions;
          }

          // generate a per-child tooltip if it's a function
          if (_.isFunction(action.tooltip)) {
            generated.tooltip = action.tooltip(id);
          }

          // generate a per-child icon if it's a function
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
        this.$emit('set-active', this.parentIndex, this.index);
      },
      onEnterUp() {
        this.handleChildClick(this.child.id, this.child.title);
      },
      handleChildClick(id, title) {
        if (this.hasChildAction) {
          return this.$emit('child-action', id, title);
        }
      }
    },
    components: {
      UiIconButton,
      UiRippleInk
    }
  };
</script>
