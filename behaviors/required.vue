<docs>
  # required

  Appends "required" to a field's label, to mark that field as required.

  ## Arguments

  _No arguments_
</docs>

<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/typography';

  .label-required {
    @include secondary-text();

    color: $blue-50;
    float: left;
  }

  .editor-inline .label-required {
    margin-top: 10px; // since the inner label has a 10px margin
  }
</style>

<template>
  <span v-if="hasLabel" class="label-required">required</span>
</template>

<script>
  import _ from 'lodash';
  import { fieldProp, behaviorKey } from '../lib/utils/references';
  import { expand, convertNativeTagName } from '../lib/forms/behaviors';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      hasLabel() {
        console.log(this.schema[fieldProp])
        return !!_.find(expand(this.schema[fieldProp]), (b) => b[behaviorKey] === convertNativeTagName('label'));
      }
    },
    slot: 'before'
  };
</script>
