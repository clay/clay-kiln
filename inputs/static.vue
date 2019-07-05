<docs>
  # `static`

  A static, non-editable bit of text. Useful for displaying data in a list when only overrides are editable

  ```yaml
  title:
    _label: Title from Service
    _has: static
  titleOverride:
    _label: Title Override
    _has: text
  ```

  ### Static Arguments

  * **help** - description / helper text for the field
  * **text** - optional interpolated string to use rather than simply printing the value of the property

  ```yaml
  title:
    _label: Title from Service
    _has:
      input: static
      text: ${title} (generated)
      help: Non-editable title
  ```

  {% hint style="info" %}

  Static inputs don't have validation.

  {% endhint %}
</docs>

  <style lang="sass">
    @import '../styleguide/colors';
    @import '../styleguide/typography';

    .static-input *::selection {
      background-color: $text-selection;
    }

    .static-input-text {
      @include type-body();
      height: $ui-input-height;
    }
  </style>

  <template>
    <div class="static-input ui-textbox has-label has-floating-label">
      <div class="ui-textbox__content">
        <label class="ui-textbox__label">
          <div class="ui-textbox__label-text" :class="labelClasses">{{ label }}</div>
          <div class="static-input-text">{{ staticText }}</div>
        </label>

        <div class="ui-textbox__feedback" v-if="hasFeedback">
          <div class="ui-textbox__feedback-text">{{ args.help }}</div>
        </div>
      </div>
    </div>
  </template>

<script>
  import _ from 'lodash';
  import label from '../lib/utils/label';
  import interpolate from '../lib/utils/interpolate';
  import { getFieldData } from '../lib/forms/field-helpers';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    computed: {
      label() {
        return label(this.name, this.schema);
      },
      labelClasses() {
        return {
          'is-inline': this.isLabelInline,
          'is-floating': !this.isLabelInline
        };
      },
      isLabelInline() {
        return this.staticText.length === 0;
      },
      hasFeedback() {
        return this.args.help;
      },
      staticText() {
        let str = this.args.text || '${' + this.name + '}';

        return interpolate(str, prop => getFieldData(this.$store, prop, this.name, _.get(this.$store, 'state.ui.currentForm.uri')));
      }
    }
  };
</script>
