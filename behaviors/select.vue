<docs>
  # select

  A standard browser `<select>` element, allowing the user to select one of a few related options.

  _Notes:_

  - the first item in `options` is pre-selected
  - you can force the user to select an option by adding a `required` behavior and by setting the options like this:

  ```yaml
      fn: select
      options:
        -
        - foo
        - bar
  ```

  Since a blank option is selected by default, the validator will fail.

  ## Arguments

  * **options** _(required)_ an array of strings

  Unlike [checkbox-group](https://github.com/nymag/clay-kiln/blob/master/behaviors/checkbox-group.md), each option should be a string rather than an object. The label for each option will simply be the option converted to Start Case.

  ```yaml
  field1:
    _has:
      fn: select
      options:
        - foo # looks like Foo
        - bar # looks like Bar
        - baz # looks like Baz
  ```
</docs>

<style lang="sass">
  @import '../styleguide/inputs';

  .editor-select {
    @include select();
  }
</style>

<template>
  <select class="editor-select" :value="data" @change="update">
    <option v-for="option in options" :value="option.value">{{ option.text }}</option>
  </select>
</template>

<script>
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      options() {
        return _.map(this.args.options, (option) => {
          return {
            value: option,
            text: _.startCase(option) || 'None'
          };
        });
      }
    },
    methods: {
      update(e) {
        const value = e.target.value;

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: value });
      }
    },
    slot: 'main'
  };
</script>
