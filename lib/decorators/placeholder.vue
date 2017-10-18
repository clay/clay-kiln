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

  .kiln-inline-placeholder,
  .kiln-block-placeholder {
    transition: background-color 300ms $standard-curve;

    .placeholder-label,
    .placeholder-icon,
    .placeholder-text {
      transition: color 300ms $standard-curve;
    }
  }

  .kiln-inline-placeholder {
    display: inline-block;

    .placeholder-label {
      display: inline-block;
      position: relative;
    }

    .placeholder-icon {
      color: $placeholder-color;
      pointer-events: none;
      position: absolute;
      right: calc(100% + 5px);
      top: 0;
    }

    .placeholder-text {
      @include normal-text();

      color: $text-alt-color;
      cursor: text;
    }
  }

  .kiln-permanent-placeholder,
  .kiln-block-placeholder {
    align-items: center;
    border-radius: 2px;
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

  .kiln-permanent-placeholder {
    background-color: $permanent-placeholder-bg-color;

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

  .kiln-block-placeholder {
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

  .kiln-error-placeholder {
    &.kiln-block-placeholder {
      // inline placeholders don't have a background-color
      background-color: $placeholder-error-bg-color;
    }

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

<template>
  <div :class="{ 'kiln-inline-placeholder': isInline, 'kiln-permanent-placeholder': isPermanent && !isInline, 'kiln-block-placeholder': !isPermanent && !isInline, 'kiln-error-placeholder': isError }" :style="{ minHeight: placeholderHeight }" :ref="uid">
    <div v-if="isInline" class="placeholder-label">
      <ui-icon class="placeholder-icon" icon="arrow_forward"></ui-icon>
      <span class="placeholder-text">{{ text }}</span>
    </div>
    <ui-button v-else-if="isComponent" class="placeholder-add-component" icon="add" color="primary" :raised="true" @click.stop.prevent="openAddComponentPane">{{ addComponentText }}</ui-button>
    <div v-else class="placeholder-label">
      <ui-icon v-if="!isPermanent" class="placeholder-icon" icon="add"></ui-icon>
      <span class="placeholder-text">{{ text }}</span>
      <ui-ripple-ink v-if="!isPermanent" :trigger="uid"></ui-ripple-ink>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import cuid from 'cuid';
  import store from '../core-data/store';
  import { placeholderProp, componentListProp, componentProp, fieldProp } from '../utils/references';
  import { getData } from '../core-data/components';
  import { get } from '../core-data/groups';
  import label from '../utils/label';
  import interpolate from '../utils/interpolate';
  import UiIcon from 'keen/UiIcon';
  import UiButton from 'keen/UiButton';
  import UiRippleInk from 'keen/UiRippleInk';

  function getSchema(options) {
    return get(options.uri, options.path).schema;
  }

  export default {
    data() {
      return {};
    },
    computed: {
      uid() {
        return cuid();
      },
      isPermanent() {
        return !!_.get(getSchema(this.$options), `${placeholderProp}.permanent`);
      },
      isInline() {
        return _.get(getSchema(this.$options), `${fieldProp}.input`) === 'inline';
      },
      isError() {
        return _.find(_.get(store, 'state.validation.errors', []), (error) => _.find(error.items, (item) => item.uri === this.$options.uri && item.path === this.$options.path));
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
      addComponentText() {
        const subSchema = getSchema(this.$options),
          componentsToAdd = _.get(subSchema, `${componentListProp}.include`) || _.get(subSchema, `${componentProp}.include`),
          hasOneComponent = componentsToAdd && componentsToAdd.length === 1;

        return hasOneComponent ? `Add ${label(componentsToAdd[0])}` : 'Add Components';
      },
      placeholderHeight() {
        const placeholderHeight = parseInt(getSchema(this.$options)[placeholderProp].height, 10) || 100, // default to 100px
          parentHeight = parseInt(this.$options.parentHeight, 10) || 0; // default to 0 for comparison purposes

        if (this.isInline) {
          return 'none'; // no min-height for inline placeholders
        } else {
          // if the parent element (the element with `data-editable` or `data-placeholder`)
          // is larger than the specified placeholder height, use that instead.
          // this is useful for having different-sized placeholders for different-sized instances
          // of the same component, e.g. ads
          return parentHeight > placeholderHeight ? `${parentHeight}px` : `${placeholderHeight}px`;
        }
      }
    },
    methods: {
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
    components: {
      UiIcon,
      UiButton,
      UiRippleInk
    }
  };
</script>
