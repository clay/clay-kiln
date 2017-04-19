<docs>
  # required

  Appends "required (field name)" to a field's label, to mark that field as required (based on another field).

  ## Arguments

  * **field** to compare against
  * **operator** _(optional)_ to use for the comparison
  * **value** _(optional)_ to compare the field against

  If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

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
  @import '../styleguide/colors';
  @import '../styleguide/typography';

  .label-conditional-required {
    @include tertiary-text();

    color: $behavior-required;
  }
</style>

<template>
  <transition name="fade">
    <span v-if="hasLabel && isRequired" class="label-conditional-required">required (based on {{ fieldLabel }})</span>
  </transition>
</template>

<script>
  import _ from 'lodash';
  import { fieldProp, behaviorKey } from '../lib/utils/references';
  import { expand, convertNativeTagName } from '../lib/forms/behaviors';
  import { getSchema, getData } from '../lib/core-data/components';
  import { compare } from '../lib/utils/comparators';
  import label from '../lib/utils/label';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      hasLabel() {
        return !!_.find(expand(this.schema[fieldProp]), (b) => b[behaviorKey] === convertNativeTagName('label'));
      },
      isRequired() {
        const field = this.args.field,
          operator = this.args.operator,
          value = this.args.value,
          // compare against the field if it's in the current form,
          // but fall back to comparing against data in the component
          // (this allows comparing to fields that might not be in the same form)
          uri = _.get(this.$store, 'state.ui.currentForm.uri'),
          data = _.get(this.$store, `state.ui.currentForm.fields[${field}]`) || getData(uri, field);

        return compare({ data, operator, value });
      },
      fieldLabel() {
        const field = this.args.field;

        return label(field, getSchema(_.get(this.$store, 'state.ui.currentForm.uri'), field));
      }
    },
    slot: 'before'
  };
</script>
