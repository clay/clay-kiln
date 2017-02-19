<docs>
  # radio

  A group of radio buttons, allowing the user to select one of a few related options.

  ## Arguments

  * **options** _(required)_ an array of strings

  Unlike [checkbox-group](https://github.com/nymag/clay-kiln/blob/master/behaviors/checkbox-group.md), each option should be a string rather than an object. The label for each option will simply be the option converted to Start Case.

  ```yaml
  field1:
    _has:
      fn: radio
      options:
        - foo # looks like Foo
        - bar # looks like Bar
        - baz # looks like Baz
  ```
</docs>

<style lang="sass">
  @import '../styleguide/typography';

  .editor-radios {
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .editor-radio-item {
    @include input-text();

    margin: 10px 0;
    text-align: left;
  }

  .editor-radio-item input[type='radio'],
  .editor-radio-item label {
    @include input-text();

    cursor: pointer;
    vertical-align: baseline;
  }
</style>

<template>
  <ul class="editor-radios">
    <li class="editor-radio-item" v-for="option in options">
      <label>
        <input type="radio" :checked="option.checked" :value="option.value" @change="update" />
        {{ option.label }}
      </label>
    </li>
  </ul>
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
        const data = this.data;

        return _.map(this.args.options, (option) => {
          return {
            label: _.startCase(option) || 'None',
            value: option,
            checked: option === data
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
