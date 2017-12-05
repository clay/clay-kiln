<docs>
  # `text`

  A basic text input. Can be single line or multi-line. Uses the float label pattern. [Uses Keen's UITextbox](https://josephuspaye.github.io/Keen-UI/#/ui-textbox).

  ### Text Arguments

  * **type** - input type, which can match any native `<input type="">` or can be set to `multi-line` for a multi-line text area
  * **step** - define step increments (for numberical inputs only)
  * **enforceMaxlength** - prevent user from typing more characters than the maximum allowed (`from validate.max`)
  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.min** - minimum number (for `type=numer`) or length (for other types) that the field must meet
  * **validate.max** - maximum number (for `type=number`) or length (for other types) that the field must not exceed
  * **validate.pattern** - regex pattern
  * **validate.requiredMessage** - will appear when required validation fails
  * **validate.minMessage** - will appear when minimum validation fails
  * **validate.maxMessage** - will appear when maximum validation fails
  * **validate.patternMessage** - will appear when pattern validation fails (very handy to set, as the default message is vague)
</docs>

<template>
  <ui-textbox
    :value="data"
    :type="type"
    :multiLine="isMultiline"
    :invalid="isInvalid"
    :required="isRequired"
    :min="min"
    :max="max"
    :step="step"
    :maxlength="maxLength"
    :enforceMaxlength="args.enforceMaxlength"
    :label="label"
    :floatingLabel="true"
    :help="args.help"
    :error="errorMessage"
    :disabled="isDisabled"
    iconPosition="right"
    @input="update"
    @keydown-enter="closeFormOnEnter">
    <attached-button slot="icon" :name="name" :data="data" :schema="schema" :args="args" @disable="disableInput" @enable="enableInput"></attached-button>
  </ui-textbox>
</template>

<script>
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { setCaret, isFirstField, shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import label from '../lib/utils/label';
  import UiTextbox from 'keen/UiTextbox';
  import attachedButton from './attached-button.vue';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        isDisabled: false
      };
    },
    computed: {
      type() {
        if (this.args.type === 'multi-line' || !this.args.type) {
          return 'text';
        } else {
          return this.args.type;
        }
      },
      isMultiline() {
        return this.args.type === 'multi-line';
      },
      isRequired() {
        return _.get(this.args, 'validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name);
      },
      min() {
        return _.includes(['number', 'range'], this.args.type) ? _.get(this.args, 'validate.min') : 0;
      },
      max() {
        return _.includes(['number', 'range'], this.args.type) ? _.get(this.args, 'validate.max') : 0;
      },
      step() {
        return this.args.step ? this.args.step.toString() : 'any';
      },
      maxLength() {
        return !_.includes(['number', 'range'], this.args.type) ? _.get(this.args, 'validate.max') : 0;
      },
      label() {
        return `${label(this.name, this.schema)}${this.isRequired ? '*' : ''}`;
      },
      errorMessage() {
        return getValidationError(this.data, this.args.validate, this.$store, this.name);
      },
      isInvalid() {
        return !!this.errorMessage;
      }
    },
    methods: {
      // every time the value of the input changes, update the store
      update(val) {
        if (_.isString(val)) {
          // remove 'line separator' and 'paragraph separator' characters from text inputs
          // (not visible in text editors, but get added when pasting from pdfs and old systems)
          val = val.replace(/(\u2028|\u2029)/g, '');
        }

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: val });
      },
      closeFormOnEnter(e) {
        if (!this.isMultiline || e.metaKey || e.ctrlKey) {
          // close form when hitting enter in text fields
          this.$store.dispatch('unfocus');
        }
      },
      disableInput() {
        this.isDisabled = true;
      },
      enableInput() {
        this.isDisabled = false;
      }
    },
    mounted() {
      if (isFirstField(this.$el)) {
        const offset = _.get(this, '$store.state.ui.currentForm.initialOffset');

        this.$nextTick(() => {
          if (_.includes(['text', 'search', 'url', 'tel', 'password', 'multi-line'], this.args.type)) {
            // selection range is only permitted on text-like input types
            setCaret(this.$el, offset, this.data);
          }
        });
      }
    },
    components: {
      UiTextbox,
      attachedButton
    }
  };
</script>
