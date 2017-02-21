<docs>
  # textarea

  A multi-line text input.

  ## Arguments

  * **required** _(optional)_ set textarea required (will block saving)
  * **placeholder** _(optional)_ placeholder that will display in the textarea
</docs>

<style lang="sass">
  @import '../styleguide/inputs';

  .editor-textarea {
    @include input();

    max-width: 100%; // prevents resize
    min-height: 40px;
  }
</style>

<template>
  <textarea class="editor-textarea" :required="args.required" :placeholder="args.placeholder" :value="data" @input="update"></textarea>
</template>

<script>
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    methods: {
      update(e) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: e.target.value });
      }
    },
    slot: 'main'
  };
</script>
