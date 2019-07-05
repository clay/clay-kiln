<docs>
  # `codemirror`

  A syntax-highlighted text area. Useful for writing css, sass, yaml, or other code in the editor.

  ### Codemirror Arguments

  * **mode** _(required)_ the language used
  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.requiredMessage** - will appear when required validation fails

  The mode of the editor sets syntax highlighting, linting, and other functionality. Currently, we support these modes:

  * `text/css` - css mode
  * `text/x-scss` - sass/scss mode (useful for per-instance styles)
  * `text/x-yaml` - yaml mode (useful for writing elasticsearch queries)

  {% hint style="info" %}

  We will add more supported modes as we find use cases for them. See [the full list of modes supported in codemirror.](http://codemirror.net/mode/)

  {% endhint %}

  ### Codemirror Data Format

  Codemirror inputs, no matter what mode you select, will return a **string** of plaintext.
</docs>

<template>
  <div class="codemirror-wrapper ui-textbox has-label is-multi-line" :class="classes">
    <attached-button
      class="ui-textbox__icon-wrapper"
      :name="name"
      :data="data"
      :schema="schema"
      :args="args"
      @disable="disableInput"
      @enable="enableInput"
    ></attached-button>

    <div class="ui-textbox__content">
      <label class="ui-textbox__label">
        <div class="ui-textbox__label-text is-floating">{{ label }}</div>
        <textarea
          class="ui-textbox__input codemirror"
          :value="data"
        ></textarea>
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
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import attachedButton from './attached-button.vue';
  import { DynamicEvents } from './mixins';


  // scss mode
  import 'codemirror/mode/css/css';
  // yaml mode
  import 'codemirror/mode/yaml/yaml';
  import 'codemirror/mode/sass/sass';
  import 'codemirror/mode/javascript/javascript';
  // show selections
  import 'codemirror/addon/selection/active-line.js';

  let editor = null;

  export default {
    mixins: [DynamicEvents],
    props: ['name', 'data', 'schema', 'args', 'initialFocus'],
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
    updated() {
      if (editor.doc && this.args && editor.doc.modeOption !== this.args.mode) {
        editor.setOption('mode', this.args.mode);
      };
    },
    mounted() {
      editor = Codemirror.fromTextArea(find(this.$el, '.codemirror'), {
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
      });

      const store = this.$store,
        name = this.name,
        initialFocus = this.initialFocus;

      // refresh the codemirror instance after it instantiates
      // wait until it gets redrawn in the dom first
      this.$nextTick(() => {
        editor.refresh();
        if (initialFocus === name) {
          editor.focus();
        }
      });

      if (this.schema.events && _.isObject(this.schema.events)) {
        Object.keys(this.schema.events).forEach((key) => {
          editor.on(key, this.schema.events[key]);
        });
      }

      editor.on('change', instance => store.commit(UPDATE_FORMDATA, { path: name, data: instance.getValue() }));

      editor.on('focus', this.onFocus);
      editor.on('blur', this.onBlur);
    },
    components: {
      attachedButton
    }
  };
</script>

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
