<style lang="sass">

  .kiln-field {
    border: none;
    flex: 0 0 100%;
    margin: 0 0 16px;
    opacity: 1;
    padding: 0;
    position: relative;
    transition: opacity 300ms linear;
    visibility: visible;
    width: 100%;

    &.kiln-reveal-hide {
      // fade out, THEN remove the element from the space it takes up
      // (by using margin-top, which can be transitioned and thus delayed)
      margin-top: -1000px;
      opacity: 0;
      transition: visibility 0ms 300ms, margin-top 0ms 300ms, opacity 300ms linear;
      visibility: hidden;
    }
  }
</style>

<template>
  <fieldset class="kiln-field" :class="{ 'kiln-reveal-hide': !isShown }" v-if="inputName">
    <component :is="inputName" :name="name" :data="data" :schema="schema" :args="expandedInput" @resize="onResize"></component>
  </fieldset>
</template>

<script>
  import _ from 'lodash';
  import { fieldProp, inputProp, revealProp } from '../utils/references';
  import { getFieldData } from './field-helpers';
  import { filterBySite } from '../utils/site-filter';
  import { compare } from '../utils/comparators';
  import { expand } from './inputs';

  export default {
    props: ['name', 'data', 'schema'],
    data() {
      return {};
    },
    computed: {
      expandedInput() {
        return expand(this.schema[fieldProp]);
      },
      inputName() {
        return this.expandedInput[inputProp];
      },
      isShown() {
        const revealConfig = _.get(this.schema, revealProp, {}),
          currentSlug = _.get(this.$store, 'state.site.slug'),
          uri = _.get(this.$store, 'state.ui.currentForm.uri'),
          field = revealConfig.field,
          operator = revealConfig.operator,
          value = revealConfig.value,
          sites = revealConfig.sites,
          data = getFieldData(this.$store, field, this.name, uri);

        if (sites && field) {
          // if there is site logic, run it before field logic
          // and return a boolean based on both checks
          return filterBySite([{ sites }], currentSlug).length && compare({ data, operator, value });
        } else if (sites) {
          // only check the site logic
          return filterBySite([{ sites }], currentSlug).length;
        } else if (field) {
          // only check field logic
          return compare({ data, operator, value });
        } else {
          return true; // show the field if no _reveal config
        }
      }
    },
    methods: {
      onResize() {
        this.$emit('resize'); // pass this to the form component
      }
    },
    components: window.kiln.inputs
  };
</script>
