<docs>
  # codemirror

  A syntax-highlighted text area. Useful for writing css, sass, yaml, or other code in the editor.

  ## Arguments

  * **mode** _(required)_ the language used

  The mode of the editor sets syntax highlighting, linting, and other functionality. Currently, we support these modes:

  * `text/css` - css mode
  * `text/x-scss` - sass/scss mode (useful for per-instance styles)
  * `text/x-yaml` - yaml mode (useful for writing elasticsearch queries)

  _Note:_ We will add more supported modes as we find use cases for them. See [this link](http://codemirror.net/mode/) for the full list of modes supported in codemirror.

  ### Shared Arguments

  This input shares certain arguments with other inputs:

  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
  * **validate** - an object that contains pre-publish validation rules:

  * **validate.required** - either `true` or an object that described the conditions that should make this field required

  Validation rules may also have custom error messages, that will appear in the same place as the help text. If you do not specify a message, default error messages will appear.

  * **validate.requiredMessage** - will appear when required validation fails

  ### Conditional Required Arguments

  * **field** to compare against (inside complex-list item, current form, or current component)
  * **operator** _(optional)_ to use for the comparison
  * **value** _(optional)_ to compare the field against

  If neither `operator` nor `value` are specified, this will make the current field required if the compared field has any data (i.e. if it's not empty). If only the value is specified, it'll default to strict equality.

  Operators:

  * `===`
  * `!==`
  * `<`
  * `>`
  * `<=`
  * `>=`
  * `typeof`
  * `regex`
  * `empty` (only checks field data, no value needed)
  * `not-empty` (only checks field data, no value needed)
  * `truthy` (only checks field data, no value needed)
  * `falsy` (only checks field data, no value needed)

  _Note:_ You can compare against deep fields (like checkbox-group) by using dot-separated paths, e.g. `featureTypes.New York Magazine Story` (don't worry about spaces!)

  Note: labels are pulled from the field's `_label` property.
</docs>

<style lang="sass">
  @import '~codemirror/lib/codemirror.css';
  @import '../styleguide/colors';

  .codemirror-wrapper {
    .CodeMirror {
      font-family: monospace;
      padding: 0;
      transition: all 200ms ease;
    }

    .ui-textbox__feedback {
      border-top: 1px solid $divider-color;
      transition: all 200ms ease;
    }

    &:hover:not(.is-disabled) {
      .ui-textbox__feedback {
        border-top: 1px solid rgba(black, 0.3);
      }
    }

    &.is-active:not(.is-disabled) {
      .ui-textbox__feedback {
        border-top: 2px solid $brand-primary-color;
      }
    }

    &.is-invalid:not(.is-disabled) {
      .CodeMirror {
        border-bottom: 1px solid $md-red;
      }
    }

    &.is-disabled {
      .ui-textbox__feedback {
        border-top: 1px dotted $divider-color;
      }
    }
  }
</style>

<template>
  <div class="codemirror-wrapper ui-textbox has-label is-multi-line" :class="classes">
    <div class="ui-textbox__icon-wrapper" v-if="hasButton">
      <component :is="args.attachedButton.name" :name="name" :data="data" :schema="schema" :args="args.attachedButton" @disable="disableInput" @enable="enableInput"></component>
    </div>

    <div class="ui-textbox__content">
      <label class="ui-textbox__label">
        <div class="ui-textbox__label-text is-floating">{{ label }}</div>
        <textarea class="ui-textbox__input codemirror" :value="data"></textarea>
      </label>

      <div class="ui-textbox__feedback" v-if="hasFeedback">
        <div class="ui-textbox__feedback-text" v-if="showError">{{ error }}</div>
        <div class="ui-textbox__feedback-text" v-else-if="showHelp">{{ args.help }}</div>
      </div>
    </div>
  </div>
</template>

<script>
  import _ from 'lodash';
  import Codemirror from 'codemirror';
  import { find } from '@nymag/dom';
  import { shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import label from '../lib/utils/label';
  import logger from '../lib/utils/log';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

  // scss mode
  require('codemirror/mode/css/css');
  // yaml mode
  require('codemirror/mode/yaml/yaml');
  // show selections
  require('codemirror/addon/selection/active-line.js');

  const log = logger(__filename);

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        isActive: false,
        isTouched: false,
        isDisabled: false
      };
    },
    computed: {
      isRequired() {
        return _.get(this.args, 'validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name);
      },
      label() {
        return `${label(this.name, this.schema)}${this.isRequired ? '*' : ''}`;
      },
      hasButton() {
        const button = _.get(this, 'args.attachedButton');

        if (button && !_.get(window, `kiln.inputs['${button.name}']`)) {
          log.warn(`Attached button (${button.name}) for '${this.name}' not found!`, { action: 'hasButton' });
          return false;
        } else if (button) {
          return true;
        } else {
          return false;
        }
      },
      error() {
        return this.isTouched && getValidationError(this.data || '', this.args.validate, this.$store, this.name);
      },
      isInvalid() {
        return !!this.error;
      },
      classes() {
        return [
          { 'ui-textbox--icon-position-right': this.hasButton },
          { 'is-active': this.isActive },
          { 'is-invalid': this.isInvalid },
          { 'is-touched': this.isTouched },
          { 'is-disabled': this.isDisabled }
        ];
      },
      hasFeedback() {
        return this.args.help || this.error;
      },
      showError() {
        return this.isInvalid && this.error;
      },
      showHelp() {
        return !this.showError && this.args.help;
      }
    },
    methods: {
      onFocus() {
        this.isActive = true;
      },
      onBlur() {
        this.isActive = false;

        if (!this.isTouched) {
          this.isTouched = true;
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
      const editor = Codemirror.fromTextArea(find(this.$el, '.codemirror'), {
          value: this.data,
          mode: this.args.mode,
          lint: true,
          styleActiveLine: true,
          lineNumbers: true,
          tabSize: 2,
          extraKeys: {
            // close form when hitting meta+enter on both windows and macos
            'Cmd-Enter': () => this.$store.dispatch('unfocus'),
            'Ctrl-Enter': () => this.$store.dispatch('unfocus')
          }
        }),
        store = this.$store,
        name = this.name;

      // refresh the codemirror instance after it instantiates
      // wait until it gets redrawn in the dom first
      this.$nextTick(() => editor.refresh());

      editor.on('change', (instance) => store.commit(UPDATE_FORMDATA, { path: name, data: instance.getValue() }));

      editor.on('focus', this.onFocus);
      editor.on('blur', this.onBlur);
    }
  };
</script>
