<docs>
  # drop-image

  Appends dragdrop events to an input which grab the url of any file dropped into the input.

  ## Arguments

  _No arguments_
</docs>

<style lang="sass">
  .drop-image {
    display: none;
  }
</style>

<template>
  <span class="drop-image"></span>
</template>

<script>
  import { getInput } from '../lib/forms/field-helpers';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    mounted() {
      const input = getInput(this.$el),
        store = this.$store,
        path = this.name;

      // add drag and drop event handlers to input
      input.addEventListener('drag', (e) => e.preventDefault());
      input.addEventListener('drop', (e) => {
        const data = e.dataTransfer.getData('text/uri-list');

        e.preventDefault(); // don't let the browser do anything funky with this
        store.commit(UPDATE_FORMDATA, { path, data });
      });
    },
    slot: 'after'
  };
</script>
