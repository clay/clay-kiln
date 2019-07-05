<template>
  <div :class="placeholderClass" :style="{ minHeight: placeholderHeight }" :ref="uid">
    <!-- collapsible component list placeholders (always displayed, even if the list is empty) -->
    <div v-if="isComponent && isCollapsible" class="placeholder-label-collapsible">
      <span class="placeholder-text">{{ text }}</span>
      <ui-button v-if="isEmptyList" :disabled="!isActive" class="placeholder-add-component" icon="add" :color="placeholderButtonColor" @click.stop.prevent="openAddComponentPane">{{ addComponentText }}</ui-button>
      <ui-icon-button v-else class="placeholder-collapse-button" :icon="collapseIcon" :tooltip="collapseTooltip" :color="placeholderButtonColor" @click.stop.prevent="toggleCollapse"></ui-icon-button>
    </div>
    <!-- normal component list placeholders (displayed when the list is empty) -->
    <ui-button v-else-if="isComponent" :disabled="!isActive" class="placeholder-add-component" icon="add" :color="placeholderButtonColor" @click.stop.prevent="openAddComponentPane">{{ addComponentText }}</ui-button>
    <!-- field placeholders -->
    <div v-else class="placeholder-label">
      <ui-icon v-if="!isPermanent" class="placeholder-icon" icon="add"></ui-icon>
      <span class="placeholder-text">{{ text }}</span>
      <ui-ripple-ink v-if="!isPermanent && isActive" :trigger="uid"></ui-ripple-ink>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import cuid from 'cuid';
  import store from '../core-data/store';
  import { isLayout, isPage } from 'clayutils';
  import { placeholderProp, componentListProp, componentProp } from '../utils/references';
  import { isComponentInPage } from '../utils/component-elements';
  import { isEmpty } from '../utils/comparators';
  import { getData } from '../core-data/components';
  import { get } from '../core-data/groups';
  import label from '../utils/label';
  import interpolate from '../utils/interpolate';
  import UiIcon from 'keen/UiIcon';
  import UiButton from 'keen/UiButton';
  import UiIconButton from 'keen/UiIconButton';
  import UiRippleInk from 'keen/UiRippleInk';

  function getSchema(options) {
    return get(options.uri, options.path).schema;
  }

  function isPageArea(uri, path) {
    const subschema = getSchema({ uri, path });

    return !!subschema[componentListProp].page;
  }

  export default {
    data() {
      return {
        isCollapsed: true
      };
    },
    computed: {
      uid() {
        return cuid();
      },
      isPermanent() {
        return !!_.get(getSchema(this.$options), `${placeholderProp}.permanent`);
      },
      isError() {
        return _.find(_.get(store, 'state.validation.errors', []), error => _.find(error.items, item => item.uri === this.$options.uri && item.path === this.$options.path));
      },
      isActive() {
        const isPageEditMode = _.get(store, 'state.editMode') === 'page',
          isPageComponent = isLayout(this.$options.uri) || isPage(this.$options.uri) ? isPageArea(this.$options.uri, this.$options.path) : isComponentInPage(this.$options.uri);

        return isPageEditMode && isPageComponent || !isPageEditMode && !isPageComponent;
      },
      placeholderClass() {
        return {
          'kiln-placeholder': !this.isPermanent && this.isActive,
          'kiln-permanent-placeholder': this.isPermanent && this.isActive,
          'kiln-error-placeholder': this.isError,
          'kiln-inactive-placeholder': !this.isActive
        };
      },
      placeholderButtonColor() {
        if (!this.isPermanent && this.isActive) {
          return 'accent';
        } else if (this.isPermanent && this.isActive) {
          return 'primary';
        } else {
          return 'default';
        }
      },
      text() {
        const subSchema = getSchema(this.$options),
          componentData = getData(this.$options.uri);

        if (subSchema[placeholderProp].text) {
          // if `text` is specified, interpolate it with the component data
          // and then capitalize the first letter in each word
          return interpolate(subSchema[placeholderProp].text, componentData).split(' ').map(_.upperFirst).join(' ');
        } else {
          // default to using the label of the path
          return label(this.$options.path, subSchema);
        }
      },
      isComponent() {
        const subSchema = getSchema(this.$options);

        return !!subSchema[componentListProp] || !!subSchema[componentProp];
      },
      isCollapsible() {
        const subSchema = getSchema(this.$options);

        return _.get(subSchema, `${componentListProp}.collapse`);
      },
      collapseIcon() {
        return this.isCollapsed ? 'keyboard_arrow_down' : 'keyboard_arrow_up';
      },
      collapseTooltip() {
        return this.isCollapsed ? 'Expand List' : 'Collapse List';
      },
      isEmptyList() {
        return isEmpty(getData(this.$options.uri, this.$options.path));
      },
      addComponentText() {
        const subSchema = getSchema(this.$options),
          componentsToAdd = _.get(subSchema, `${componentListProp}.include`) || _.get(subSchema, `${componentProp}.include`),
          hasOneComponent = componentsToAdd && componentsToAdd.length === 1;

        return hasOneComponent ? `Add ${label(componentsToAdd[0])} Here` : 'Add Component Here';
      },
      placeholderHeight() {
        const placeholderHeight = parseInt(getSchema(this.$options)[placeholderProp].height, 10) || 100, // default to 100px
          parentHeight = parseInt(this.$options.parentHeight, 10) || 0; // default to 0 for comparison purposes

        // if the parent element (the element with `data-editable` or `data-placeholder`)
        // is larger than the specified placeholder height, use that instead.
        // this is useful for having different-sized placeholders for different-sized instances
        // of the same component, e.g. ads
        return parentHeight > placeholderHeight ? `${parentHeight}px` : `${placeholderHeight}px`;
      }
    },
    methods: {
      toggleCollapse() {
        this.isCollapsed = !this.isCollapsed;
        // reach up to the (non-vue) parent element, which is the component list itself
        this.$el && this.$el.parentNode && this.$el.parentNode.classList.toggle('kiln-collapsed');
      },
      openAddComponentPane(e) {
        const parentURI = this.$options.uri,
          path = this.$options.path;

        return store.dispatch('openAddComponent', {
          parentURI,
          path,
          pos: { x: e.clientX, y: e.clientY }
        });
      }
    },
    mounted() {
      if (this.isCollapsible && this.isCollapsed) {
        this.$nextTick(() => {
          // collapsible component lists will be collapsed when loaded
          // note: waiting for nextTick so we can see the (non-vue) containing element
          this.$el && this.$el.parentNode && this.$el.parentNode.classList.toggle('kiln-collapsed');
        });
      }
    },
    components: {
      UiIcon,
      UiButton,
      UiIconButton,
      UiRippleInk
    }
  };
</script>

<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';
  @import '../../styleguide/animations';

  // all editable elements should have some kind of ux showing they can be edited
  .component-selector-wrapper *[data-editable] {
    cursor: pointer;
  }

  // editable TEXT elements should use a caret rather than a pointer through
  .component-selector-wrapper  p[data-editable],
  .component-selector-wrapper  blockquote[data-editable] {
    cursor: text;
  }

  .component-selector-wrapper *[data-editable].kiln-internals {
    cursor: default;
  }

  .kiln-collapsed > *:not(.kiln-placeholder) {
    display: none;
  }

  .kiln-placeholder {
    transition: background-color $standard-time $standard-curve;

    .placeholder-label,
    .placeholder-icon,
    .placeholder-text {
      transition: color $standard-time $standard-curve;
    }
  }

  .kiln-permanent-placeholder,
  .kiln-placeholder,
  .kiln-inactive-placeholder {
    align-items: center;
    border-radius: 2px;

    // explicitly setting box-sizing because Kiln placeholders rely on this property being set to border-box for proper styling,
    // while the site using Kiln might have box-sizing set to something else, not set at all
    box-sizing: border-box;

    cursor: pointer;
    display: flex;
    height: 100%;
    justify-content: center;
    padding: 16px 24px;
    position: relative;
    width: 100%;

    .placeholder-add-component {
      flex: 0 0 auto;
    }

    .placeholder-label {
      align-items: center;
      display: flex;
      flex: 1 1 auto;
      flex-flow: row wrap;
      justify-content: center;
    }

    .placeholder-label-collapsible {
      align-items: center;
      display: flex;
      flex: 1 1 auto;
      flex-flow: row nowrap;
      justify-content: space-between;
    }

    .placeholder-icon {
      flex: 0 0 auto;
    }

    .placeholder-text {
      @include type-button();

      flex: 0 1 auto;
      line-height: 18px;
      text-align: center;
    }
  }

  // collapsible placeholders
  .collapsible-component-list > .kiln-placeholder {
    // using !important here to override the inline placeholder height (min-height) styles,
    // as collapsible list placeholders should ALWAYS be a set height
    height: 68px !important;
    margin: 0 0 20px;
    min-height: 68px !important;
  }

  .kiln-permanent-placeholder {
    background-color: $permanent-placeholder-bg-color;
    cursor: pointer;

    .placeholder-label {
      color: $permanent-placeholder-color;
    }

    .placeholder-icon {
      color: $permanent-placeholder-color;
    }

    .placeholder-text {
      color: $permanent-placeholder-color;
    }
  }

  .kiln-inactive-placeholder {
    background-color: $inactive-placeholder-bg-color;
    cursor: not-allowed;

    .placeholder-label {
      color: $inactive-placeholder-color;
    }

    .placeholder-icon {
      color: $inactive-placeholder-color;
    }

    .placeholder-text {
      color: $inactive-placeholder-color;
    }
  }

  .kiln-placeholder {
    background-color: $placeholder-bg-color;

    .placeholder-label {
      color: $placeholder-color;
    }

    .placeholder-icon {
      color: $placeholder-color;
    }

    .placeholder-text {
      color: $placeholder-color;
    }
  }

  .kiln-placeholder.kiln-error-placeholder {
    background-color: $placeholder-error-bg-color;

    .placeholder-label {
      color: $placeholder-error-color;
    }

    .placeholder-icon {
      color: $placeholder-error-color;
    }

    .placeholder-text {
      color: $placeholder-error-color;
    }
  }
</style>
