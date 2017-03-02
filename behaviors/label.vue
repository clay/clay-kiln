<docs>
  # label

  Appends a label to a field. This is pulled from the field's `_label` property, and falls back to using the key of the field.

  ## Arguments

  _No arguments_
</docs>

<style lang="sass">
  @import '../styleguide/typography';

  .label-inner {
    @include input-label();

    float: left;
    margin-right: 8px;
    text-align: left;
    margin-bottom: 5px;
  }
</style>

<template>
  <span class="label-inner">{{ label }}</span>
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
