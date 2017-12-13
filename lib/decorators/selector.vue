<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/layers';
  @import '../../styleguide/animations';

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

    &.selector-left,
    &.selector-right {
      height: 100%;
      min-height: $min-border-length;
      top: 0;
    }

    &.selector-top,
    &.selector-bottom {
      left: 0;
      min-width: $min-border-length;
      width: 100%;
    }

    &.selector-left {
      border-right: $thick-border;
      right: calc(100% + #{$offset});
    }

    &.selector-right {
      border-left: $thick-border;
      left: calc(100% + #{$offset});
    }

    &.selector-top {
      border-bottom: $thick-border;
      bottom: calc(100% + #{$offset});
    }

    &.selector-bottom {
      border-top: $thick-border;
      top: calc(100% + #{$offset});
    }

    // if we absolutely, positively have no space for the mini-selector,
    // simply hide it (we already have the expanded selector)
    &.selector-hidden {
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
    box-shadow: $shadow-2dp;
    display: flex;
    pointer-events: all;
    position: absolute;

    &:after {
      content: '';
      height: 100%;
      position: absolute;
      width: 100%;
    }

    &.selector-left,
    &.selector-right {
      align-items: flex-start;
      flex-direction: column;
      height: auto;
      justify-content: center;
    }

    &.selector-top,
    &.selector-bottom {
      align-items: center;
      flex-direction: row;
      justify-content: flex-start;
      width: auto;
    }

    // nudge the quick bar so the border lines up with the thick border
    &.selector-left {
      border-right: none;
      right: 0;

      &:after {
        border-right: $thin-border;
        height: calc(100% + 2px);
        right: -1px;
        top: 0;
      }
    }

    &.selector-right {
      border-left: none;
      left: 0;

      &:after {
        border-left: $thin-border;
        height: calc(100% + 2px);
        left: -1px;
        top: 0;
      }
    }

    &.selector-top {
      border-bottom: none;
      bottom: 0;

      &:after {
        border-bottom: $thin-border;
        bottom: -1px;
        left: 0;
        width: calc(100% + 2px);
      }
    }

    &.selector-bottom {
      border-top: none;
      top: 0;

      &:after {
        border-top: $thin-border;
        left: 0;
        top: -1px;
        width: calc(100% + 2px);
      }
    }

    & &-button {
      border-radius: 0;
      // note: 46px is width minus border
      flex: 0 0 46px;
      height: 46px;
      width: 46px;
      z-index: 1;

      .selector-left &.quick-bar-add,
      .selector-left &.quick-bar-replace,
      .selector-left &.quick-bar-dupe,
      .selector-right &.quick-bar-add,
      .selector-right &.quick-bar-replace,
      .selector-right &.quick-bar-dupe {
        border-top: $thin-border;
      }

      .selector-top &.quick-bar-add,
      .selector-top &.quick-bar-replace,
      .selector-top &.quick-bar-dupe,
      .selector-bottom &.quick-bar-add,
      .selector-bottom &.quick-bar-replace,
      .selector-bottom &.quick-bar-dupe {
        border-left: $thin-border;
      }
    }
  }
</style>

<template>
  <transition name="selector-fade">
    <aside data-ignore v-if="isCurrentSelection" class="mini-selector" :class="selectorPosition">
      <div class="quick-bar" :class="selectorPosition">
        <ui-icon-button v-once type="secondary" color="primary" class="quick-bar-button quick-bar-info" icon="info_outline" :tooltip="`${componentLabel} Info`" @click.stop="openInfo"></ui-icon-button>
        <ui-icon-button v-once v-show="hasSettings" type="secondary" color="primary" class="quick-bar-button quick-bar-settings" icon="settings" :tooltip="`${componentLabel} Settings`" @click.stop="openSettings"></ui-icon-button>
        <component v-once v-for="(button, index) in customButtons" :is="button" :key="index"></component>
        <ui-icon-button v-once v-show="hasRemove" type="secondary" color="primary" class="quick-bar-button quick-bar-remove" icon="delete" :tooltip="`Remove ${componentLabel}`" @click.stop="removeComponent"></ui-icon-button>
        <ui-icon-button v-show="hasDuplicateComponent" type="secondary" color="primary" class="quick-bar-button quick-bar-dupe" icon="add_circle_outline" :tooltip="`Add ${componentLabel}`" @click.stop="duplicateComponent"></ui-icon-button>
        <ui-icon-button v-show="hasDuplicateComponentWithData" type="secondary" color="primary" class="quick-bar-button quick-bar-dupe" icon="add_circle" :tooltip="`Duplicate ${componentLabel}`" @click.stop="duplicateComponentWithData"></ui-icon-button>
        <ui-icon-button v-once v-show="hasAddComponent" type="secondary" color="primary" class="quick-bar-button quick-bar-add" icon="add" :tooltip="addComponentText" @click.stop="openAddComponentPane"></ui-icon-button>
      </div>
    </aside>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import getRect from 'element-client-rect';
  import { getSchema, getData } from '../core-data/components';
  import { getComponentName, componentListProp } from '../utils/references';
  import { getComponentEl } from '../utils/component-elements';
  import label from '../utils/label';
  import logger from '../utils/log';
  import UiIconButton from 'keen/UiIconButton';

  const log = logger(__filename);

  /**
  * calculate the selector position, based on how much space is around the component
  * @param  {Element} el
  * @return {string}
  */
  function calculateSelectorPosition(el) {
    const rect = getRect(el),
      selectorDimension = 50;

    if (rect.left > selectorDimension) {
      return 'selector-left';
    } else if (rect.bottom > selectorDimension) {
      return 'selector-bottom';
    } else if (rect.right > selectorDimension) {
      return 'selector-right';
    } else if (rect.top > selectorDimension) {
      return 'selector-top';
    } else {
      return 'selector-hidden';
    }
  }

  export default {
    data() {
      return {
        selectorPosition: 'left',
        uri: this.$options.uri,
        componentName: getComponentName(this.$options.uri),
        componentLabel: label(getComponentName(this.$options.uri)),
        parentField: this.$options.parentField,
        parentURI: this.$options.parentURI,
        hasRemove: this.$options.parentField && this.$options.parentField.isEditable,
        hasAddComponent: this.$options.parentField && this.$options.parentField.type === 'list' && this.$options.parentField.isEditable
      };
    },
    computed: {
      currentSelectedComponent() {
        const currentURI = _.get(this.$store, 'state.ui.currentSelection.uri');

        return currentURI && getComponentEl(currentURI);
      },
      isCurrentSelection() {
        return this.currentSelectedComponent && this.$options.componentEl === this.currentSelectedComponent;
      },
      customButtons() {
        return Object.keys(_.get(window, 'kiln.selectorButtons', {}));
      },
      hasSettings() {
        return _.has(getSchema(this.uri), '_groups.settings');
      },
      hasDuplicateComponent() {
        return this.hasAddComponent && !_.get(this.$store, 'state.ui.metaKey');
      },
      hasDuplicateComponentWithData() {
        return this.hasAddComponent && _.get(this.$store, 'state.ui.metaKey');
      },
      parentSchema() {
        return this.parentField ? getSchema(this.parentURI, this.parentField.path) : {};
      },
      addComponentText() {
        if (this.hasAddComponent) {
          const componentsToAdd = _.get(this.schema, `${componentListProp}.include`),
            hasOneComponent = componentsToAdd && componentsToAdd.length === 1;

          return hasOneComponent ? `Add ${label(componentsToAdd[0])}` : 'Add Components';
        }
      }
    },
    watch: {
      isCurrentSelection(val) {
        if (val) {
          // fires when selecting a component
          this.setSelectorPosition();
        }
      }
    },
    methods: {
      openInfo() {
        const description = _.get(this.$store, `state.schemas['${this.componentName}']._description`);

        if (!description) {
          log.error(`Cannot open component information: "${this.componentLabel}" has no description!`, { action: 'openInfo' });
        } else {
          return this.$store.dispatch('openModal', {
            title: this.componentLabel,
            type: 'info',
            data: description
          });
        }
      },
      openSettings() {
        return this.$store.dispatch('focus', { uri: this.uri, path: 'settings' });
      },
      openAddComponentPane(e) {
        return this.$store.dispatch('openAddComponent', {
          currentURI: this.uri,
          parentURI: this.parentURI,
          path: this.parentField.path,
          pos: { x: e.clientX, y: e.clientY }
        });
      },
      duplicateComponent() {
        const name = this.componentName;

        this.$store.commit('DUPLICATE_COMPONENT', name);
        return this.$store.dispatch('addComponents', {
          currentURI: this.uri,
          parentURI: this.parentURI,
          path: this.parentField.path,
          components: [{ name }]
        }).then((newEl) => this.$store.dispatch('select', newEl));
      },
      duplicateComponentWithData() {
        const name = this.componentName,
          data = getData(this.uri);

        this.$store.commit('DUPLICATE_COMPONENT_WITH_DATA', name);
        return this.$store.dispatch('addComponents', {
          currentURI: this.uri,
          parentURI: this.parentURI,
          path: this.parentField.path,
          components: [{ name, data }],
          clone: true
        }).then((newEl) => this.$store.dispatch('select', newEl));
      },
      removeComponent() {
        const el = this.$options.componentEl;

        this.$store.dispatch('unselect');
        return this.$store.dispatch('unfocus').then(() => this.$store.dispatch('removeComponent', el));
      },
      setSelectorPosition() {
        this.selectorPosition = calculateSelectorPosition(this.$options.componentEl);
      },
    },
    components: _.assign({}, _.get(window, 'kiln.selectorButtons', {}), { UiIconButton })
  };
</script>
