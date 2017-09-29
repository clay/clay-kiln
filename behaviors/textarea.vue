<docs>
  # textarea

  A multi-line text input.

  ## Arguments

  * **required** _(optional)_ set textarea required (will block saving)
  * **placeholder** _(optional)_ placeholder that will display in the textarea
</docs>

<style lang="sass">
  .editor-textarea {
    max-width: 100%; // prevents resize
    min-height: 40px;
  }
</style>

<template>
  <textarea class="editor-textarea" :required="args.required" :placeholder="args.placeholder" :value="data" @input="update" @keydown="closeFormOnEnter"></textarea>
</template>

<script>
  import keycode from 'keycode';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { setCaret, isFirstField } from '../lib/forms/field-helpers';
  import _ from 'lodash';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    methods: {
      update(e) {
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: e.target.value });
      },
      closeFormOnEnter(e) {
        const key = keycode(e);

        if (key === 'enter') {
          // close form when hitting enter in textarea fields
          this.$store.dispatch('unfocus');
        }
      }
    },
    mounted() {
      if (isFirstField(this.$el)) {
        const offset = _.get(this, '$store.state.ui.currentForm.initialOffset');

        this.$nextTick(() => {
          setCaret(this.$el, offset, this.data);
        });
      }
    },
    slot: 'main'
  };
</script>
