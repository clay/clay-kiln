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

    &.clickable:hover {
      background-color: $list-bg-hover;
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
  <li class="filterable-list-item-child" :data-item-id="child.id" :ref="child.id" :class="{ 'clickable': hasChildAction }" @click.stop="handleChildClick(child.id, child.title)">
    <button
      type="button"
      class="filterable-list-item-child-btn">
      {{ child.title }}
    </button>
    <ui-ripple-ink v-if="hasChildAction" ref="ripple" :trigger="child.id"></ui-ripple-ink>
    <ui-icon-button v-for="action in displayedActions" :key="action.tooltip" type="button" class="filterable-list-item-child-secondary-action" :tooltip="action.tooltip" :icon="action.icon" @click.stop="action.action(child.id)"></ui-icon-button>
  </li>
</template>

<script>
  import UiIconButton from 'keen/UiIconButton';
  import UiRippleInk from 'keen/UiRippleInk';

  export default {
    props: ['child', 'hasChildAction', 'secondaryActions'],
    data() {
      return {};
    },
    computed: {
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
