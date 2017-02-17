<docs>
  # description

  Appends a description to a field.

  ## Arguments

  * **value** _(required)_ field description, allows html
</docs>

<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/typography';

  .label-description {
    @include secondary-text();

    clear: left;
    cursor: default;
    margin: 0 0 5px;
    text-align: left;
  }

  .label-description a {
    @include link();
  }
</style>

<template>
  <p class="label-description" v-html="value"></p>
</template>

<script>
  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      value() {
        return this.args.value;
      }
    },
    created() {
      if (!this.args.value) {
        throw new Error('Description behavior must have a `value` argument!');
      }
    },
    slot: 'before'
  };
</script>
