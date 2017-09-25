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

<template>
  <ui-checkbox :name="name" :label="args.label" :value="data" @input="update"></ui-checkbox>
</template>

<script>
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import UiCheckbox from 'keen/UiCheckbox';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    methods: {
      update(val) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      }
    },
    components: {
      UiCheckbox
    },
    slot: 'main'
  };
</script>
