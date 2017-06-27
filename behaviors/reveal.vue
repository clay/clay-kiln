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

  _Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story`
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

  /**
   * toggle showing or hiding a field
   * @param  {Element}  fieldEl
   * @param  {Boolean} isShown
   */
  function toggleField(fieldEl, isShown) {
    if (isShown) {
      fieldEl.classList.remove('kiln-reveal-hide');
    } else {
      fieldEl.classList.add('kiln-reveal-hide');
    }
  }

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
          fieldPath = _.reduce(field.split('.'), (str, fieldPart) => str += `.${fieldPart}`, 'state.ui.currentForm.fields'),
          data = _.get(this.$store, fieldPath); // note: we explicitly only allow revealing fields based on other fields IN THE SAME FORM

        return compare({ data, operator, value });
      }
    },
    watch: {
      isShown(val) {
        toggleField(getField(this.$el), val);
      }
    },
    mounted() {
      toggleField(getField(this.$el), this.isShown);
    },
    slot: 'after'
  };
</script>
