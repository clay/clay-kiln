<docs>
  # `checkbox`

  A single checkbox, allowing the user to toggle something on or off. [Uses Keen's UICheckbox](https://josephuspaye.github.io/Keen-UI/#/ui-checkbox).

  In practice, it's usually best to use a conversational tone / question as the checkbox label, e.g.

  ```yaml
  field1:
    _label: Should we use a special logo in this component?
    _has: checkbox
  ```

  ### Checkbox Arguments

  * **help** - description / helper text for the field

  {% hint style="info" %}

  Single checkboxes don't have validation.

  {% endhint %}

  ### Checkbox Data Format

  Checkbox data is a **boolean**, `true` or `false`.
</docs>

<template>
  <div class="kiln-single-checkbox">
    <ui-checkbox
      color="accent"
      :name="name"
      :label="label"
      :value="data"
      :disabled="disabled"
      @input="update"
      v-dynamic-events="customEvents">
    </ui-checkbox>
    <div class="ui-textbox__feedback" v-if="args.help">
      <div class="ui-textbox__feedback-text">{{ args.help }}</div>
    </div>
  </div>
</template>

<script>
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import label from '../lib/utils/label';
  import UiCheckbox from 'keen/UiCheckbox';
  import { DynamicEvents } from './mixins';

  export default {
    mixins: [DynamicEvents],
    props: ['name', 'data', 'schema', 'args', 'disabled'],
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
