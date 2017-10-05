<docs>
  # checkbox

  A single checkbox, allowing the user to toggle something on or off.

  In practice, it's usually best to use a conversational tone / question as the checkbox label, e.g.

  ```yaml
  field1:
    _label: Should we use a special logo in this component?
    _has: checkbox
  ```

  Note: Single checkboxes don't have validation, but may have help text below them.
</docs>

<template>
  <div class="kiln-single-checkbox">
    <ui-checkbox :name="name" :label="label" :value="data" @input="update"></ui-checkbox>
    <div class="ui-textbox__feedback" v-if="args.help">
      <div class="ui-textbox__feedback-text">{{ args.help }}</div>
    </div>
  </div>
</div>
</template>

<script>
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import label from '../lib/utils/label';
  import UiCheckbox from 'keen/UiCheckbox';

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
    methods: {
      update(val) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      }
    },
    components: {
      UiCheckbox
    }
  };
</script>