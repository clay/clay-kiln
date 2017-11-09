<style lang="sass">
  @import '../../styleguide/animations';

  .kiln-field {
    border: none;
    flex: 0 0 100%;
    margin: 0 0 16px;
    opacity: 1;
    padding: 0;
    position: relative;
    transition: opacity $standard-time $standard-curve;
    visibility: visible;
    width: 100%;

    .editor-inline & {
      margin: 0;
    }

    .reveal-enter,
    .reveal-leave-to {
      opacity: 0;
    }

    .reveal-enter-to,
    .reveal-leave {
      opacity: 1;
    }

    .reveal-enter-active,
    .reveal-leave-active {
      transition: opacity $standard-time $standard-curve;
    }
  }
</style>

<template>
  <transition name="reveal" mode="out-in">
    <fieldset class="kiln-field" v-if="inputName && isShown">
      <component :is="inputName" :name="name" :data="data" :schema="schema" :args="expandedInput" @resize="onResize"></component>
    </fieldset>
  </transition>
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

        console.log(this.schema, revealProp, revealConfig)
        console.log(field, operator, value, data)

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
