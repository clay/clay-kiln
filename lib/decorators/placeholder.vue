<style lang="sass">
  @import '../../styleguide/colors';
  @import '../../styleguide/typography';
  @import '../../styleguide/buttons';

  // styles shared between regular and permanent placeholders
  .kiln-placeholder,
  .kiln-permanent-placeholder {
    align-items: center;
    display: flex;
    flex-direction: column;
    height: 100%;
    justify-content: center;
    padding: 8px;
    position: relative;
    width: 100%;

    .placeholder-top,
    .placeholder-bottom {
      display: flex;
      flex-flow: row wrap;
      min-width: 60%;
      width: auto;
    }

    .placeholder-label {
      @include placeholder-primary();

      border-bottom-style: solid;
      border-bottom-width: 4px;
      flex: 1 1 100%;
    }

    .placeholder-this-page,
    .placeholder-many-pages {
      @include placeholder-secondary();

      align-items: flex-start;
      flex: 0 1 auto;

      svg {
        height: 11px;
        margin: 4px 4px 0 0;
        width: 11px;
      }
    }

    .placeholder-required {
      @include placeholder-secondary();

      display: block;
      flex: 1 0 auto;
      text-align: right;
    }

    .placeholder-add-component {
      display: block;
      flex: 0 0 auto;
    }

    // single line styles (when placeholders are not tall enough to fit multiple lines)
    &.single-line {
      flex-direction: row;

      .placeholder-top {
        flex-flow: row; // no wrap
        justify-content: flex-start;
      }

      .placeholder-bottom {
        flex-flow: row; // no wrap
        justify-content: flex-start;
        min-width: 0;
      }

      .placeholder-this-page,
      .placeholder-many-pages {
        order: 1;

        svg {
          margin-top: 4px;
        }
      }

      .placeholder-location-text {
        display: none; // hide 'this page' / 'multiple pages'
      }

      .placeholder-label {
        border: none;
        flex: 0 1 auto; // allow word wrapping
        margin: 0 4px;
        order: 2;
      }

      .placeholder-required {
        flex: 0 0 auto;
        margin: 2px 0 0 4px;
        order: 3;
        text-align: left;
      }

      .placeholder-add-component {
        margin: 0;
      }
    }
  }

  // multi-page / single-page toggle
  .placeholder-this-page {
    display: none;
  }

  .placeholder-many-pages {
    display: flex;
  }

  .kiln-page-area .placeholder-this-page {
    display: flex;
  }

  .kiln-page-area .placeholder-many-pages {
    display: none;
  }

  // regular placeholder - displays when field is empty
  .kiln-placeholder {
    background-color: $placeholder-background;
    border: 1px dashed $placeholder-border;

    svg,
    svg * {
      fill: $placeholder-label-border;
    }

    .placeholder-label {
      border-bottom-color: $placeholder-label-border;
      color: $placeholder-label;
    }

    .placeholder-this-page,
    .placeholder-many-pages,
    .placeholder-required {
      color: $placeholder-border;
    }

    .placeholder-add-component {
      @include button-outlined($placeholder-border, $placeholder-background);
      @include placeholder-secondary();

      margin: 16px auto 0;
      padding: 8px;
    }
  }

  // permanent placeholder - always displays, even when there is data in fields
  .kiln-permanent-placeholder {
    background-color: $permanent-placeholder-background;
    border: 1px dotted $permanent-placeholder-border;

    svg,
    svg * {
      fill: $permanent-placeholder-label-border;
    }

    .placeholder-label {
      border-bottom-color: $permanent-placeholder-label-border;
      color: $permanent-placeholder-label;
    }

    .placeholder-this-page,
    .placeholder-many-pages,
    .placeholder-required {
      color: $permanent-placeholder-label;
    }

    // permanent placeholders should probably never show this button,
    // but let's add styles just in case
    .placeholder-add-component {
      @include button-outlined($permanent-placeholder-label, $permanent-placeholder-background);
      @include placeholder-secondary();

      margin: 16px auto 0;
      padding: 8px;
    }
  }
</style>

<template>
  <div :class="[isPermanent ? permanentClass : temporaryClass, { 'single-line': isSingleLine }]" :style="{ minHeight: placeholderHeight }">
    <div class="placeholder-top">
      <span class="placeholder-label">{{ text }}</span>
      <span class="placeholder-location">
        <span class="placeholder-this-page" title="This Page"><icon name="this-page"></icon><span class="placeholder-location-text placeholder-this-page"> This Page</span></span>
        <span class="placeholder-many-pages" title="Multiple Pages"><icon name="many-pages"></icon><span class="placeholder-location-text placeholder-many-pages"> Multiple Pages</span></span>
      </span>
      <span v-if="isRequired" class="placeholder-required">Required</span>
    </div>
    <div v-if="canAddComponent" class="placeholder-bottom">
      <span class="placeholder-add-component" title="Add Components" @click.stop="openAddComponentPane">Add Components</span>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import store from '../core-data/store';
  import { placeholderProp, componentListProp, componentProp } from '../utils/references';
  import { getData } from '../core-data/components';
  import { get } from '../core-data/groups';
  import interpolate from '../utils/interpolate';
  import icon from '../utils/icon.vue';

  const SINGLE_LINE_HEIGHT = 50;

  function getSchema(options) {
    return get(options.uri, options.path).schema;
  }

  export default {
    data() {
      return {
        permanentClass: 'kiln-permanent-placeholder',
        temporaryClass: 'kiln-placeholder'
      };
    },
    computed: {
      isPermanent() {
        return !!_.get(getSchema(this.$options), `${placeholderProp}.permanent`);
      },
      isRequired() {
        return !!getSchema(this.$options)[placeholderProp].required;
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
      canAddComponent() {
        const subSchema = getSchema(this.$options);

        return !!subSchema[componentListProp] || !!subSchema[componentProp];
      },
      placeholderHeight() {
        const placeholderHeight = parseInt(getSchema(this.$options)[placeholderProp].height, 10) || 100, // default to 100px
          parentHeight = parseInt(this.$options.parentHeight, 10) || 0; // default to 0 for comparison purposes

        // if the parent element (the element with `data-editable` or `data-placeholder`)
        // is larger than the specified placeholder height, use that instead.
        // this is useful for having different-sized placeholders for different-sized instances
        // of the same component, e.g. ads
        return parentHeight > placeholderHeight ? `${parentHeight}px` : `${placeholderHeight}px`;
      },
      isSingleLine() {
        // note: this.placeholderHeight is a computed property. getters are cool!
        return parseInt(this.placeholderHeight, 10) < SINGLE_LINE_HEIGHT;
      }
    },
    methods: {
      openAddComponentPane() {
        const parentURI = this.$options.uri,
          path = this.$options.path;

        return store.dispatch('openAddComponents', {
          parentURI,
          path
        });
      }
    },
    components: {
      icon
    }
  };
</script>
