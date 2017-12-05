<docs>
  # `datepicker`

  A material design calendar picker. Allows specifying minimim and maximum dates. [Uses Keen's UIDatepicker](https://josephuspaye.github.io/Keen-UI/#/ui-datepicker).

  ### Datepicker Arguments

  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.min** - minimum date, specified in YYYY-MM-DD
  * **validate.max** - maximum date, specified in YYYY-MM-DD
  * **validate.requiredMessage** - will appear when required validation fails
  * **validate.minMessage** - will appear when minimum validation fails
  * **validate.maxMessage** - will appear when maximum validation fails
</docs>

<template>
  <ui-datepicker
    color="accent"
    :value="parsedData"
    :invalid="isInvalid"
    :required="isRequired"
    :minDate="min"
    :maxDate="max"
    :label="label"
    :floatingLabel="true"
    :help="args.help"
    :error="errorMessage"
    :disabled="isDisabled"
    iconPosition="right"
    @input="update">
    <attached-button slot="icon" :name="name" :data="data" :schema="schema" :args="args" @disable="disableInput" @enable="enableInput"></attached-button>
  </ui-datepicker>
</template>

<script>
  import _ from 'lodash';
  import dateFormat from 'date-fns/format';
  import parseDate from 'date-fns/parse';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import label from '../lib/utils/label';
  import UiDatepicker from 'keen/UiDatepicker';
  import attachedButton from './attached-button.vue';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        isDisabled: false
      };
    },
    computed: {
      isRequired() {
        return _.get(this.args, 'validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name);
      },
      min() {
        return _.get(this.args, 'validate.min') ? parseDate(_.get(this.args, 'validate.min')) : null;
      },
      max() {
        return _.get(this.args, 'validate.max') ? parseDate(_.get(this.args, 'validate.max')) : null;
      },
      label() {
        return `${label(this.name, this.schema)}${this.isRequired ? '*' : ''}`;
      },
      errorMessage() {
        return getValidationError(this.data, this.args.validate, this.$store, this.name);
      },
      isInvalid() {
        return !!this.errorMessage;
      },
      parsedData() {
        return this.data ? parseDate(this.data) : null;
      }
    },
    methods: {
      // every time the value of the input changes, update the store
      update(val) {
        const formatted = dateFormat(val, 'YYYY-MM-DD');

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: formatted });
      },
      disableInput() {
        this.isDisabled = true;
      },
      enableInput() {
        this.isDisabled = false;
      }
    },
    components: {
      UiDatepicker,
      attachedButton
    }
  };
</script>
