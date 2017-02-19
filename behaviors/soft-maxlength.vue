<docs>
  # soft-maxlength

  Appends a character count to an input. Allows the user to type above the limit, but can be paired with publishing validation to prevent publishing things that are too long.

  ## Arguments

  * **value** _(required)_ number of characters that should be allowed

  The character count will update as users type into the input, and will turn red if they type more characters than allowed.
</docs>

<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/typography';

  .soft-maxlength {
    @include secondary-text();

    float: right;
    margin-top: 5px;
  }

  .soft-maxlength.too-long {
    color: $red;
  }

  // styles on the input
  .input-text.input-too-long,
  .editor-textarea.input-too-long,
  .wysiwyg-input.styled.input-too-long {
    border: 1px solid $red;
  }
</style>

<template>
  <span class="soft-maxlength" :class="{ 'too-long': isTooLong }">{{ currentLength }} / {{ args.value }}</span>
</template>

<script>
  import { decode } from 'he';
  import striptags from 'striptags';
  import { getInput } from '../lib/forms/field-helpers';

  /**
 * Remove tags and white spaces.
 * @param {string} value
 * @returns {string}
 */
  function cleanValue(value) {
    value = value || '';
    return decode(striptags(value));
  }

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      currentLength() {
        return cleanValue(this.data).length;
      },
      isTooLong() {
        return this.currentLength > this.args.value;
      }
    },
    watch: {
      // a neat thing about watchers: they're only recalculated when the watched value changes
      isTooLong(val) {
        const input = getInput(this.$el);

        if (val) {
          input.classList.add('input-too-long');
        } else {
          input.classList.remove('input-too-long');
        }
      }
    },
    slot: 'after'
  };
</script>
