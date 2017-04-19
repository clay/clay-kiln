<docs>
  # reveal

  Conditionally shows/hides a field based on another field

  ## Arguments

  * **field** to compare against
  * **operator** _(optional)_ to use for the comparison
  * **value** _(optional)_ to compare the field against

  If neither `operator` nor `value` are specified, this will show the current field if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

  Operators:

  * `===`
  * `!==`
  * `<`
  * `>`
  * `<=`
  * `>=`
  * `typeof`
  * `regex`
  * `empty` (only checks field data, no value needed)
  * `not-empty` (only checks field data, no value needed)
  * `truthy` (only checks field data, no value needed)
  * `falsy` (only checks field data, no value needed)
</docs>

<style lang="sass">

</style>

<template>
  <span class="kiln-hide"></span>
</template>

<script>
  import _ from 'lodash';
  import { getField } from '../lib/forms/field-helpers';
  import { compare } from '../lib/utils/comparators';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      isShown() {
        const field = this.args.field,
          operator = this.args.operator,
          value = this.args.value,
          data = _.get(this.$store, `state.ui.currentForm.fields[${field}]`);

        return compare({ data, operator, value });
      }
    },
    watch: {
      isShown(val) {
        const fieldEl = getField(this.$el);

        if (val) {
          fieldEl.classList.remove('kiln-reveal-hide');
        } else {
          fieldEl.classList.add('kiln-reveal-hide');
        }
      }
    },
    mounted() {
      const fieldEl = getField(this.$el);

      if (this.isShown) {
        fieldEl.classList.remove('kiln-reveal-hide');
      } else {
        fieldEl.classList.add('kiln-reveal-hide');
      }
    },
    slot: 'after'
  };
</script>
