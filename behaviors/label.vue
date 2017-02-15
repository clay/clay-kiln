<style lang="sass">
  @import '../styleguide/typography';

  .editor .label-inner {
    @include label();

    color: $black;
    float: left;
    margin-right: 8px;
    text-align: left;
  }

  .editor-inline .label-inner {
    margin-top: 10px;
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
