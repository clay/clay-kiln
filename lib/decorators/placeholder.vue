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
      <span class="placeholder-add-component" title="Add Components">Add Components</span>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
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
        return !!getSchema(this.$options)[placeholderProp].permanent;
      },
      isRequired() {
        return !!getSchema(this.$options)[placeholderProp].required;
      },
      text() {
        const subSchema = getSchema(this.$options),
          componentData = getData(this.$options.uri);

        if (subSchema[placeholderProp].text) {
          // if `text` is specified, interpolate it with the component data
          // and then capitalize each word
          return _.words(interpolate(subSchema[placeholderProp].text, componentData)).map(_.upperFirst).join(' ');
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
    components: {
      icon
    }
  };
</script>
