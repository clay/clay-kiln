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

  .kiln-placeholder {
    transition: background-color $standard-time $standard-curve;

    .placeholder-label,
    .placeholder-icon,
    .placeholder-text {
      transition: color $standard-time $standard-curve;
    }
  }

  .kiln-permanent-placeholder,
  .kiln-placeholder {
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

<template>
  <div v-once :class="{ 'kiln-permanent-placeholder': isPermanent, 'kiln-placeholder': !isPermanent, 'kiln-error-placeholder': isError }" :style="{ minHeight: placeholderHeight }" :ref="uid">
    <ui-button v-if="isComponent" class="placeholder-add-component" icon="add" color="primary" @click.stop.prevent="openAddComponentPane">{{ addComponentText }}</ui-button>
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
  import { placeholderProp, componentListProp, componentProp } from '../utils/references';
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
