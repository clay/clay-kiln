<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/layers';
  @import '../../styleguide/buttons';

  // size of the thick component border
  $border-size: 3px;
  // amount of space between selector and component
  $offset: 5px;
  // smallest length of the thick border
  $min-border-length: 20px;

  // borders
  $thick-border: $border-size solid $mini-selector-color;
  $thin-border: 1px solid $mini-selector-color;
  $thin-padding: 1px solid $mini-selector-border-padding;

  // component element needs to be position: relative for the mini selectors to display
  .component-selector-wrapper {
    position: relative;
  }

  .mini-selector {
    @include mini-selector-layer();

    opacity: 1;
    pointer-events: none;
    position: absolute;

    &.left,
    &.right {
      height: 100%;
      min-height: $min-border-length;
      top: 0;
    }

    &.top,
    &.bottom {
      left: 0;
      min-width: $min-border-length;
      width: 100%;
    }

    &.left {
      border-right: $thick-border;
      right: calc(100% + #{$offset});
    }

    &.right {
      border-left: $thick-border;
      left: calc(100% + #{$offset});
    }

    &.top {
      border-bottom: $thick-border;
      bottom: calc(100% + #{$offset});
    }

    &.bottom {
      border-top: $thick-border;
      top: calc(100% + #{$offset});
    }

    // if we absolutely, positively have no space for the mini-selector,
    // simply hide it (we already have the expanded selector)
    &.hidden {
      display: none;
    }
  }

  .selector-fade-enter-active, .selector-fade-leave-active {
    transition: opacity 150ms linear;
  }

  .selector-fade-enter, .selector-fade-leave-to {
    opacity: 0;
  }

  .quick-bar {
    // behind its parent, so the border padding doesn't show
    @include quick-bar-layer();

    background: $selector-bg;
    border: $thin-border;
    display: flex;
    pointer-events: all;
    position: absolute;

    &:before {
      border: $thin-padding;
      content: '';
      height: calc(100% + 4px);
      left: -2px;
      position: absolute;
      top: -2px;
      width: calc(100% + 4px);
    }

    &:after {
      content: '';
      height: 100%;
      position: absolute;
      width: 100%;
    }

    &.left,
    &.right {
      align-items: flex-start;
      flex-direction: column;
      height: auto;
      justify-content: center;
    }

    &.top,
    &.bottom {
      align-items: center;
      flex-direction: row;
      justify-content: flex-start;
      width: auto;
    }

    // nudge the quick bar so the border lines up with the thick border
    &.left {
      border-right: none;
      right: 0;

      &:before {
        border-right: none;
        width: calc(100% + 2px);
      }

      &:after {
        border-right: $thin-border;
        height: calc(100% + 2px);
        right: -1px;
        top: 0;
      }
    }

    &.right {
      border-left: none;
      left: 0;

      &:before {
        border-left: none;
        width: calc(100% + 2px);
      }

      &:after {
        border-left: $thin-border;
        height: calc(100% + 2px);
        left: -1px;
        top: 0;
      }
    }

    &.top {
      border-bottom: none;
      bottom: 0;

      &:before {
        border-bottom: none;
        height: calc(100% + 2px);
      }

      &:after {
        border-bottom: $thin-border;
        bottom: -1px;
        left: 0;
        width: calc(100% + 2px);
      }
    }

    &.bottom {
      border-top: none;
      top: 0;

      &:before {
        border-top: none;
        height: calc(100% + 2px);
        top: 0;
      }

      &:after {
        border-top: $thin-border;
        left: 0;
        top: -1px;
        width: calc(100% + 2px);
      }
    }

    &-button {
      @include icon-button($mini-selector-color, 18px);

      // note: 46px is width minus border
      flex: 0 0 46px;
      padding: 14px;
      z-index: 1;

      .left &.quick-bar-add,
      .left &.quick-bar-replace,
      .right &.quick-bar-add,
      .right &.quick-bar-replace {
        border-top: $thin-border;
      }

      .top &.quick-bar-add,
      .top &.quick-bar-replace,
      .bottom &.quick-bar-add,
      .bottom &.quick-bar-replace {
        border-left: $thin-border;
      }
    }
  }
</style>

<template>
  <transition name="selector-fade">
    <aside data-ignore v-show="isCurrentSelection" class="mini-selector" :class="selectorPosition" @click.stop>
      <div v-if="hasButtons" class="quick-bar" :class="selectorPosition">
        <button v-if="hasSettings" class="quick-bar-button quick-bar-settings" title="Component Settings" @click.stop="openSettings"><icon name="settings"></icon></button>
        <button v-if="hasRemove" class="quick-bar-button quick-bar-remove" title="Remove Component" @click.stop="removeComponent"><icon name="delete"></icon></button>
        <button v-if="hasAddComponent" class="quick-bar-button quick-bar-add" title="Add Component" @click.stop="openAddComponentPane"><icon name="add-icon"></icon></button>
        <button v-if="hasReplaceComponent" class="quick-bar-button quick-bar-replace" title="Replace Component"><icon name="replace-icon"></icon></button>
      </div>
    </aside>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import getRect from 'element-client-rect';
  import store from '../core-data/store';
  import { getData, getSchema } from '../core-data/components';
  import { getSettingsFields } from '../core-data/groups';
  import icon from '../utils/icon.vue';

  /**
  * calculate the selector position, based on how much space is around the component
  * @param  {Element} componentEl
  * @return {string}
  */
  function calculateSelectorPosition(componentEl) {
    const rect = getRect(componentEl),
      selectorDimension = 50;

    if (rect.left > selectorDimension) {
      return 'left';
    } else if (rect.bottom > selectorDimension) {
      return 'bottom';
    } else if (rect.right > selectorDimension) {
      return 'right';
    } else if (rect.top > selectorDimension) {
      return 'top';
    } else {
      return 'hidden';
    }
  }

  function setupResizeListener() {
    this.onResize = _.debounce(this.setSelectorPosition, 100);
  }

  export default {
    data() {
      return {
        selectorPosition: 'left'
      };
    },
    computed: {
      currentComponent() {
        return _.get(store, 'state.ui.currentSelection') || {};
      },
      uri() {
        return this.currentComponent.uri;
      },
      parentField() {
        return this.isCurrentSelection && this.currentComponent.parentField;
      },
      hasSettings() {
        return this.isCurrentSelection && !_.isEmpty(getSettingsFields(getData(this.uri), getSchema(this.uri)).fields);
      },
      // note: only for components in LISTS! components in properties can be replaced but not removed (for now)
      hasRemove() {
        return this.parentField && this.parentField.type === 'list';
      },
      hasAddComponent() {
        return this.parentField && this.parentField.type === 'list';
      },
      hasReplaceComponent() {
        return this.parentField && this.parentField.type === 'prop';
      },
      hasButtons() {
        return this.hasSettings || this.hasRemove || this.hasAddComponent || this.hasReplaceComponent;
      },
      isCurrentSelection() {
        return this.$options.componentEl === this.currentComponent.el;
      }
    },
    watch: {
      isCurrentSelection(val) {
        if (val) {
          // fires when selecting a component
          this.setSelectorPosition();

          // recalculate selector position on resize (only listen when component is selected)
          window.addEventListener('resize', this.onResize);
        } else {
          // fires when unselecting a component
          window.removeEventListener('resize', this.onResize);
        }
      }
    },
    methods: {
      openSettings() {
        return store.dispatch('focus', { uri: this.uri, path: 'settings' });
      },
      openAddComponentPane() {
        return store.dispatch('openAddComponents', {
          currentURI: this.uri,
          parentURI: this.currentComponent.parentURI,
          path: this.parentField.path
        });
      },
      removeComponent() {
        const el = this.currentComponent.el;

        store.dispatch('unselect');
        return store.dispatch('unfocus').then(() => store.dispatch('removeComponent', el));
      },
      setSelectorPosition() {
        this.selectorPosition = calculateSelectorPosition(this.$options.componentEl);
      },
    },
    mounted() {
      // setup event listener, so it can be removed later
      setupResizeListener.call(this);
    },
    components: {
      icon
    }
  };
</script>
