<template>
  <ui-textbox
    type="time"
    placeholder="12:00 AM"
    v-model="timeValue"
    :invalid="isInvalid"
    :required="isRequired"
    :label="label"
    :help="help"
    :error="errorMessage"
    :disabled="isDisabled"
    iconPosition="right"
    @input="update">
    <attached-button slot="icon" :name="name" :data="data" :schema="schema" :args="args" @disable="disableInput" @enable="enableInput"></attached-button>
  </ui-textbox>
</template>

<script>
  import _ from 'lodash';
  import dateFormat from 'date-fns/format';
  import { parseDate as parseNaturalDate } from 'chrono-node';
  import { shouldBeRequired, getValidationError } from '../forms/field-helpers';
  import UiTextbox from 'keen/UiTextbox';
  import attachedButton from '../../inputs/attached-button.vue';

  export default {
    props: ['value', 'label', 'help', 'name', 'schema', 'args'],
    data() {
      return {
        isDisabled: false,
        timeValue: ''
      };
    },
    computed: {
      isRequired() {
        return _.get(this, 'args.validate') ? _.get(this, 'args.validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name) : false;
      },
      errorMessage() {
        if (_.get(this, 'args.validate')) {
          const validationError = getValidationError(this.timeValue, this.args.validate, this.$store, this.name),
            parsed = parseNaturalDate(this.timeValue);

          if (validationError) {
            return validationError;
          } else if (!parsed) {
            return `${this.help} (Please enter a valid time)`;
          }
        }
      },
      isInvalid() {
        return !!this.errorMessage;
      }
    },
    mounted() {
      this.timeValue = !!this.value && _.isString(this.value) ? dateFormat(this.value, 'h:mm A') : '';
    },
    methods: {
      // every time the value of the input changes, update the store
      update(val) {
        const parsed = parseNaturalDate(val);

        if (parsed) {
          this.$emit('update', dateFormat(parsed, 'HH:mm'));
        }
      },
      disableInput() {
        this.isDisabled = true;
      },
      enableInput() {
        this.isDisabled = false;
      }
    },
    components: {
      UiTextbox,
      attachedButton
    }
  };
</script>
