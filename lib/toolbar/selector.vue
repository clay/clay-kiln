<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';
  @import '../../styleguide/layers';
  @import '../../styleguide/buttons';

  $icon-size: 18px;
  $menu-size: 48px;
  $easeOutCubic: cubic-bezier(.215, .61, .355, 1);

  // selector outlines
  .expanded-selector {
    @include component-toolbar-layer();

    align-items: center;
    background: $selector-bg;
    border-right: 1px solid $selector-border;
    border-top: 1px solid $selector-border;
    display: flex;
    left: 0;
    justify-content: flex-start;
    max-width: 350px; // pane size
    position: fixed;
    top: calc(100% - 96px); // 48px times 2
    transition: transform 350ms $easeOutCubic;
    width: 100%;

    &-name {
      @include selector-label();

      flex: 1 1 auto;
      line-height: $icon-size; // same vertical space as the icons
      margin: 0;
      overflow: hidden;
      padding: 0 20px;
      text-align: left;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    // settings, remove, add buttons (and 3rd party buttons)
    // note: button styles are in styleguide/api
    &-button {
      flex: 0 0 auto;

      &.expanded-selector-add,
      &.expanded-selector-replace {
        border-left: 1px solid $selector-divider;
      }
    }
  }

  .selector-slide-enter, .selector-slide-leave-active {
    transform: translate3d(0, calc(100% + 50px), 0);
  }
</style>

<template>
  <transition name="selector-slide">
    <div v-if="hasCurrentComponent" class="expanded-selector" @click.stop>
      <span class="expanded-selector-name">{{ componentLabel }}</span>
      <button v-if="hasSettings" class="expanded-selector-button expanded-selector-settings" title="Component Settings" @click="openSettings"><icon name="settings"></icon></button>
      <button v-if="hasRemove" class="expanded-selector-button expanded-selector-remove" title="Remove Component" @click="removeComponent"><icon name="delete"></icon></button>
      <button v-if="hasAddComponent" class="expanded-selector-button expanded-selector-add" title="Add Component" @click.stop="openAddComponentPane"><icon name="add-icon"></icon></button>
      <button v-if="hasReplaceComponent" class="expanded-selector-button expanded-selector-replace" title="Replace Component"><icon name="replace-icon"></icon></button>
    </div>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import { getData, getSchema } from '../core-data/components';
  import label from '../utils/label';
  import { getComponentName } from '../utils/references';
  import { getSettingsFields } from '../core-data/groups';
  import icon from '../utils/icon.vue';

  export default {
    data() {
      return {};
    },
    computed: {
      hasCurrentComponent() {
        return _.get(this.$store, 'state.ui.currentSelection') !== null;
      },
      currentComponent() {
        return _.get(this.$store, 'state.ui.currentSelection') || {};
      },
      uri() {
        return this.currentComponent.uri;
      },
      parentField() {
        return this.currentComponent.parentField;
      },
      componentLabel() {
        return label(getComponentName(this.uri));
      },
      hasSettings() {
        return !_.isEmpty(getSettingsFields(getData(this.uri), getSchema(this.uri)).fields);
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
      }
    },
    methods: {
      openSettings() {
        return this.$store.dispatch('focus', { uri: this.uri, path: 'settings' });
      },
      openAddComponentPane() {
        return this.$store.dispatch('openAddComponents', {
          currentURI: this.uri,
          parentURI: this.currentComponent.parentURI,
          path: this.parentField.path
        });
      },
      removeComponent() {
        const el = this.currentComponent.el;

        this.$store.dispatch('unselect');
        return this.$store.dispatch('unfocus').then(() => this.$store.dispatch('removeComponent', el));
      },
      // todo: do we want to add these buttons back in?
      // prev() {
      //   return store.dispatch('navigateComponents', 'prev');
      // },
      // next() {
      //   return store.dispatch('navigateComponents', 'next');
      // }
    },
    components: {
      icon
    }
  };
</script>
