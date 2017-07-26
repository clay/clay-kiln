<docs>
  # reveal

  Conditionally shows/hides a field based on another field

  ## Arguments

  * **field** and/or **sites** to compare against
  * **operator** _(optional)_ to use for the comparison
  * **value** _(optional)_ to compare the field against

  If neither `operator` nor `value` are specified, this will show the current field if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality. You can compare against fields, sites (using the same site logic syntax as `select` and component lists), or both.

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
  import { filterBySite } from '../lib/utils/site-filter';
  import { getData } from '../lib/core-data/components';

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
        const currentSlug = _.get(this.$store, 'state.site.slug'),
          uri = _.get(this.$store, 'state.ui.currentForm.uri'),
          field = this.args.field,
          operator = this.args.operator,
          value = this.args.value,
          sites = this.args.sites,
          fieldPath = field && _.reduce(field.split('.'), (str, fieldPart) => str += `.${fieldPart}`, 'state.ui.currentForm.fields'),
          // compare against the field if it's in the current form,
          // but fall back to comparing against data in the component
          // (this allows comparing to fields that might not be in the same form)
          data = field && (_.get(this.$store, fieldPath) || getData(uri, field));

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
          throw new Error('Please specify sites or field logic for the reveal behavior!');
        }
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
