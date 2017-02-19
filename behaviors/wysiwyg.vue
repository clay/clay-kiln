<docs>

</docs>

<style lang="sass">
  @import '../styleguide/colors';
  @import '../styleguide/inputs';
  @import '~quill/dist/quill.core.css';
  @import '~quill/dist/quill.bubble.css';

  .wysiwyg-input {
    @include normal-text();

    cursor: text;
    min-height: 19px;
    outline: none;
    text-align: left;
    white-space: normal;

    &::selection {
      background-color: $blue-25;
    }
  }

  .wysiwyg-input *::selection {
    background-color: $blue-25;
  }

  .wysiwyg-input.styled {
    @include input();

    white-space: normal;
  }

</style>

<template>
  <div class="wysiwyg-input" :class="{ styled: isStyled }" :html="data"></div>
</template>

<script>
  import Quill from 'quill';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      isStyled() {
        return this.args.styled;
      }
    },
    mounted() {
      const editor = new Quill(this.$el, {
        theme: 'bubble',
        formats: [
          'bold',
          'italic',
          'strike',
          'link'
        ],
        modules: {
          toolbar: [['bold', 'italic', 'strike', 'link', 'clean']]
        }
      });

      editor.on('text-change', (delta, oldDelta, source) => {
        console.log('[EDITOR] text change!', editor.root.innerHTML)
      })
    },
    slot: 'main'
  };
</script>
