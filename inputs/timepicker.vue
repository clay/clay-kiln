<docs>
  # `timepicker`

  A basic time picker. Uses native time inputs when available, but falls back to relatively-simple natural language parsing.

  ### Timepicker Arguments

  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.requiredMessage** - will appear when required validation fails

  {% hint style="info" %}

  #### Natural Language Parsing

  On browsers without native time pickers, users may enter in the time without worrying about the format. The simple NLP engine can handle things like "10am", "4:15 PM", "13:00", and even "midnight".

  {% endhint %}

  ### Timepicker Data Format

  Timepicker returns a **string** with the time in `h:mm A` format.
</docs>

<template>
  <timepicker
    :value="data"
    :label="label"
    :help="timeHelp"
    :name="name"
    :schema="schema"
    :args="args"
    v-dynamic-events="customEvents"
    @update="update">
  </timepicker>
</template>

<script>
  import _ from 'lodash';
  import dateFormat from 'date-fns/format';
  import { parseDate as parseNaturalDate } from 'chrono-node';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { shouldBeRequired } from '../lib/forms/field-helpers';
  import label from '../lib/utils/label';
  import timepicker from '../lib/utils/timepicker.vue';
  import { DynamicEvents } from './mixins';

  export default {
    mixins: [DynamicEvents],
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      timeHelp() {
        const parsed = parseNaturalDate(this.timeValue);

        if (parsed) {
          return `${this.args.help} (Parsed as ${dateFormat(parsed, 'h:mm A')})`;
        } else {
          return this.args.help;
        }
      },
      isRequired() {
        return _.get(this.args, 'validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name);
      },
      label() {
        return `${label(this.name, this.schema)}${this.isRequired ? '*' : ''}`;
      }
    },
    methods: {
      // every time the value of the input changes, update the store
      update(val) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      }
    },
    components: { timepicker }
  };
</script>
