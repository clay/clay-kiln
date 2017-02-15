<style lang="sass">
  @import '../styleguide/inputs';

  .input-text {
    @include input();
  }
</style>

<template>
  <input class="input-text" :value="data" @input="update" />
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
