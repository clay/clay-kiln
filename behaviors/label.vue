<docs>
  # label

  Appends a label to a field. This is pulled from the field's `_label` property, and falls back to using the key of the field.

  ## Arguments

  _No arguments_
</docs>

<style lang="sass">
  @import '../styleguide/typography';

  .legend {
    @include input-label();

    float: left;
    margin-bottom: 5px;
    margin-right: 8px;
    padding: 0;
    text-align: left;
  }
</style>

<template>
  <legend class="legend">{{ label }}</legend>
</template>

<script>
  import label from '../lib/utils/label';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      label() {
        return label(this.name, this.schema);
      }
    },
    slot: 'before'
  };
</script>
