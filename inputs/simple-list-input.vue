<style lang="sass">
  .simple-list-input {
    align-items: center;
    display: inline-flex;
    flex: 1 0 auto;
    height: 32px;
    margin-bottom: 5px;
    min-width: 100px;
    position: relative;

    .simple-list-add {
      border-bottom: none;
      flex: 1 0 auto;
      width: auto;
    }
  }
</style>

<template>
  <div class="simple-list-input" :class="classes">
    <input
      type="text"
      class="ui-textbox__input simple-list-add"
      ref="input"
      :disabled="disabled"
      v-model.trim="val"
      @input="onChange"
      @keydown.enter.prevent="onEnter"
      @keydown.tab="addItem"
      @keyup.comma="ignoreComma ? null : addItem()"
      @keydown.delete="focusLastItem"
      @keydown.left="focusLastItem"
      @keydown.right="focusFirstItem"
      @keydown.down="autocompleteFocus(false)"
      @keydown.up.prevent="autocompleteFocus(true)"
      @keypress="(event) => $emit('keypress', event)"
      @focus="onFocus"
      @blur="onBlur"
      v-conditional-focus="focusOnInput" />
    <autocomplete
      v-if="showAutocomplete"
      :args="autocomplete"
      :query="val"
      :disabled="disabled"
      :focusIndex="autocompleteIndex"
      :updateFocusIndex="updateFocusIndex"
      :updateMatches="updateAutocompleteMatches"
      :select="onAutocompleteSelect"
      :unselect="unselect"
      @resize="onResize">
    </autocomplete>
  </div>
</template>

<script>
  import _ from 'lodash';
  import autocomplete from './autocomplete.vue';

  export default {
    props: ['items', 'allowRepeatedItems', 'autocomplete', 'currentItem', 'disabled', 'isInitialFocus', 'ignoreComma', 'restrictItemCreation'],
    data() {
      return {
        val: '',
        autocompleteValue: false,
        autocompleteIndex: null,
        autocompleteOptions: [],
        displayAutocomplete: true
      };
    },
    computed: {
      showAutocomplete() {
        return this.autocomplete && this.displayAutocomplete;
      },
      focusOnInput() {
        return _.isNull(this.currentItem);
      },
      classes() {
        return [
          { 'is-disabled': this.disabled }
        ];
      }
    },
    methods: {
      onFocus() {
        this.$emit('select', null);
        this.$emit('focus');
      },
      onBlur() {
        if (!this.showAutocomplete) {
          // don't blur when we're displaying the autocomplete
          this.$emit('blur');
        }
      },
      onChange() {
        if (!this.displayAutocomplete) {
          this.displayAutocomplete = !this.displayAutocomplete;
        }
      },
      // Add an item to the array
      addItem() {
        // Only saves values from the autocomplete list if tag creation restriction is enabled
        if (this.restrictItemCreation) {
          if (!this.autocompleteValue && !_.isNumber(this.autocompleteIndex)) {
            this.$emit('triggerRestrictionError');
            return;
          }
        }
        this.autocompleteValue = false;

        let hasItem;

        if (_.isNumber(this.autocompleteIndex)) {
          this.val = this.autocompleteOptions[this.autocompleteIndex] || '';
          this.displayAutocomplete = false;
        }

        hasItem = !!_.find(this.items, item => item.text === this.val);

        if (this.val && (!hasItem || hasItem && this.allowRepeatedItems)) {
          this.$emit('add', { text: this.ignoreComma ? this.val : this.val.replace(',', '') }); // remove extra comma if using that to add item

          this.unselect();
        }
        this.autocompleteIndex = null;
      },
      onAutocompleteSelect(val) {
        this.val = val;
        this.autocompleteValue = true;
        this.addItem();
      },
      onEnter() {
        if (this.val) {
          // if theres a value in the input, add it (like when you hit tab or comma)
          this.addItem();
        } else {
          // otherwise, close the form (which we never do on tab or comma)
          this.$store.dispatch('unfocus');
        }
      },
      onResize(additionalPixels) {
        this.$root.$emit('resize-form', additionalPixels);
      },
      // Focus on the first item in the list
      focusFirstItem() {
        if (this.items.length && !this.val.length) {
          this.$emit('select', 0);
        }
      },
      // Focus on the last item in the list
      focusLastItem() {
        if (_.isNull(this.currentItem) && !this.val.length) {
          this.$emit('select', this.items.length - 1);
        }
      },
      updateAutocompleteMatches(options) {
        this.autocompleteOptions = options;
      },
      autocompleteFocus(dir) {
        if (_.isNumber(this.autocompleteIndex)) {
          dir ? this.autocompleteIndex-- : this.autocompleteIndex++;
        } else {
          this.autocompleteIndex = dir ? -1 : 0;
        }
      },
      unselect() {
        // Zero out values
        this.val = '';
        this.$emit('select', null);
      },
      updateFocusIndex(val) {
        this.autocompleteIndex = val;
      }
    },
    mounted() {
      if (this.isInitialFocus) {
        this.$refs.input.focus();
      }
    },
    components: {
      autocomplete
    }
  };
</script>
