<docs>
  # checkbox

  A single checkbox, allowing the user to toggle something on or off.

  ## Arguments

  * **label** _(required)_ the checkbox label

  In practice, it's usually best to use a conversational tone / question as the checkbox label, with the field label being shorter. e.g.

  ```yaml
  field1:
    _label: Special Logo
    _has:
      fn: checkbox
      label: Should we use a special logo in this component?
  ```
</docs>

<style lang="sass">
  @import '../styleguide/typography';
  @import '../styleguide/inputs';

  .checkbox-wrapper {
    align-items: center;
    display: flex;
    width: 100%;
  }

  .input-checkbox {
    @include checkbox();

    cursor: pointer;
  }

  .checkbox-label {
    @include input-text();

    cursor: pointer;
    flex: 1 0 auto;
    margin-left: 10px;
    vertical-align: baseline;
  }
</style>

<template>
  <label class="checkbox-wrapper"><input class="input-checkbox" type="checkbox" :checked="data" @change="update" /><span class="checkbox-label">{{ args.label }}</span></label>
</template>

<script>
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    methods: {
      update() {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: !this.data });
      }
    },
    slot: 'main'
  };
</script>
