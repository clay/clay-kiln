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
</docs>

<style lang="sass">
  @import '../styleguide/inputs';
  @import '~codemirror/lib/codemirror.css';

  .CodeMirror {
    @include input();

    font-family: monospace;
    padding: 0;
  }
</style>

<template>
  <textarea class="codemirror" :value="data"></textarea>
</template>

<script>
  import Codemirror from 'codemirror';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

  // scss mode
  require('codemirror/mode/css/css');
  // yaml mode
  require('codemirror/mode/yaml/yaml');
  // show selections
  require('codemirror/addon/selection/active-line.js');

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    mounted() {
      const editor = Codemirror.fromTextArea(this.$el, {
          value: this.data,
          mode: this.args.mode,
          lint: true,
          styleActiveLine: true,
          lineNumbers: true,
          tabSize: 2
        }),
        store = this.$store,
        name = this.name;

      // refresh the codemirror instance after it instantiates
      // wait until it gets redrawn in the dom first
      setTimeout(function () {
        editor.refresh();
      }, 0);

      editor.on('change', function (instance) {
        store.commit(UPDATE_FORMDATA, { path: name, data: instance.getValue() });
      });
    },
    slot: 'main'
  };
</script>
