<docs>
  # text

  A basic text input. Can be single line or multi-line. Uses the float label pattern.

  ## Arguments

  * **type** - defaults to `text` if not defined. Set to `multi-line` for a multi-line text area
  * **step** - define step increments (for numberical inputs only)
  * **enforceMaxlength** - prevent user from typing more characters than the maximum allowed (`from validate.max`)

  ### Shared Arguments

  This input shares certain arguments with other inputs:

  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
  * **validate** - an object that contains pre-publish validation rules:

  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.min** - minimum number (for `type=numer`) or length (for other types) that the field must meet
  * **validate.max** - maximum number (for `type=number`) or length (for other types) that the field must not exceed
  * **validate.pattern** - regex pattern

  Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

  * **validate.requiredMessage** - will appear when required validation fails
  * **validate.minMessage** - will appear when minimum validation fails
  * **validate.maxMessage** - will appear when maximum validation fails
  * **validate.patternMessage** - will appear when pattern validation fails (very handy to set, as the default message is vague)

  Note: labels are pulled from the field's `_label` property.
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
    :maxLength="maxLength"
    :enforceMaxlength="args.enforceMaxlength"
    :label="label"
    :floatingLabel="true"
    :help="args.help"
    :error="errorMessage"
    :disabled="isDisabled">
    <slot name="icon" v-if="hasButton">
      <component :is="args.attachedButton.name" :name="name" :data="data" :schema="schema" :args="args.attachedButton"></component>
    </slot>
  </ui-textbox>
</template>

<script>
  import _ from 'lodash';
  import keycode from 'keycode';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { setCaret, isFirstField } from '../lib/forms/field-helpers';
  import { labelProp } from '../lib/utils/references';
  import UiTextbox from 'keen/UiTextbox';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        isInvalid: false,
        errorMessage: null,
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
        return _.get(this.args, 'validate.required') === true; // todo: conditional required
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
      minLength() {
        return !_.includes(['number', 'range'], this.args.type) ? _.get(this.args, 'validate.min') : 0;
      },
      maxLength() {
        return !_.includes(['number', 'range'], this.args.type) ? _.get(this.args, 'validate.max') : 0;
      },
      label() {
        return this.schema[labelProp];
      },
      hasButton() {
        const button = _.get(this, 'args.attachedButton');

        if (button && !_.get(window, `kiln.inputs['${button.name}']`)) {
          console.warn(`Attached button (${button.name}) for '${this.name}' not found!`);
          return false;
        } else if (button) {
          return true;
        } else {
          return false;
        }
      }
    },
    methods: {
      // every time the value of the input changes, update the store
      update(e) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: e.target.value });
      },
      closeFormOnEnter(e) {
        const key = keycode(e);

        if (key === 'enter') {
          // close form when hitting enter in text fields
          this.$store.dispatch('unfocus');
        }
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
    components: _.merge(window.kiln.inputs, { UiTextbox })
  };
</script>
