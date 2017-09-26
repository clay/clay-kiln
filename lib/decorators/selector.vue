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
      .left &.quick-bar-dupe,
      .right &.quick-bar-add,
      .right &.quick-bar-replace,
      .right &.quick-bar-dupe {
        border-top: $thin-border;
      }

      .top &.quick-bar-add,
      .top &.quick-bar-replace,
      .top &.quick-bar-dupe,
      .bottom &.quick-bar-add,
      .bottom &.quick-bar-replace,
      .bottom &.quick-bar-dupe {
        border-left: $thin-border;
      }
    }
  }
</style>

<template>
  <transition name="selector-fade">
    <aside data-ignore v-show="isCurrentSelection" class="mini-selector" :class="selectorPosition" @click.stop>
      <div class="quick-bar" :class="selectorPosition">
        <button v-if="componentLabel" class="quick-bar-button quick-bar-info" :title="componentLabel" @click.stop="openInfo"><ui-icon icon="info"></ui-icon></button>
        <button v-if="hasSettings" class="quick-bar-button quick-bar-settings" title="Component Settings" @click.stop="openSettings"><ui-icon icon="settings"></ui-icon></button>
        <component v-for="button in customButtons" :is="button"></component>
        <button v-if="hasRemove" class="quick-bar-button quick-bar-remove" title="Remove Component" @click.stop="removeComponent"><ui-icon icon="delete"></ui-icon></button>
        <button v-if="hasAddComponent" class="quick-bar-button quick-bar-add" title="Add Component" @click.stop="openAddComponentPane"><ui-icon icon="add"></ui-icon></button>
        <button v-if="hasDuplicateComponent" class="quick-bar-button quick-bar-dupe" title="Duplicate Component" @click.stop="duplicateComponent"><ui-icon icon="plus_one"></ui-icon></button>
        <button v-if="hasReplaceComponent" class="quick-bar-button quick-bar-replace" title="Replace Component"><ui-icon icon="swap_vert"></ui-icon></button>
      </div>
    </aside>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import getRect from 'element-client-rect';
  import store from '../core-data/store';
  import { getSchema } from '../core-data/components';
  import { getComponentName } from '../utils/references';
  import label from '../utils/label';
  import UiIcon from 'keen/UiIcon';

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
      customButtons() {
        return Object.keys(window.kiln.selectorButtons);
      },
      parentField() {
        return this.isCurrentSelection && this.currentComponent.parentField;
      },
      hasSettings() {
        return this.isCurrentSelection && _.has(getSchema(this.uri), '_groups.settings');
      },
      // note: only for components in LISTS! components in properties can be replaced but not removed (for now)
      hasRemove() {
        return this.parentField && this.parentField.type === 'list' && this.parentField.isEditable;
      },
      hasAddComponent() {
        return this.parentField && this.parentField.type === 'list' && this.parentField.isEditable && !_.get(store, 'state.ui.metaKey');
      },
      hasDuplicateComponent() {
        return this.parentField && this.parentField.type === 'list' && this.parentField.isEditable && _.get(store, 'state.ui.metaKey');
      },
      hasReplaceComponent() {
        return this.parentField && this.parentField.type === 'prop' && this.parentField.isEditable;
      },
      componentName() {
        return this.uri && getComponentName(this.uri);
      },
      componentLabel() {
        return this.componentName && label(this.componentName);
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
      openInfo() {
        const description = _.get(store, `state.schemas['${this.componentName}']._description`);

        if (!description) {
          console.error(`Cannot open component information: "${this.componentLabel}" has no description!`);
        } else {
          return store.dispatch('openPane', {
            title: this.componentLabel,
            position: 'center',
            size: 'medium',
            height: 'short',
            content: {
              component: 'info',
              args: {
                text: description
              }
            }
          });
        }
      },
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
      duplicateComponent() {
        const name = getComponentName(this.uri);

        store.commit('DUPLICATE_COMPONENT', name);
        return store.dispatch('addComponents', {
          currentURI: this.uri,
          parentURI: this.currentComponent.parentURI,
          path: this.parentField.path,
          components: [{ name }]
        }).then((newEl) => store.dispatch('select', newEl));
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
      UiIcon
    }
  };
</script>
