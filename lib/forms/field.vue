<style lang="sass">
  @import '../../styleguide/forms';

  .kiln-field {
    @include field();

    opacity: 1;
    transition: opacity 300ms linear;
    visibility: visible;

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
  <fieldset class="kiln-field" v-if="inputName">
    <component :is="inputName" :name="name" :data="data" :schema="schema" :args="expandedInput"></component>
  </fieldset>
</template>

<script>
  import { fieldProp, inputProp } from '../utils/references';
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
      }
    },
    components: window.kiln.inputs
  };
</script>
