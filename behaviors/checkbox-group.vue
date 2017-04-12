<docs>
  # checkbox-group

  A group of checkboxes, allowing the user to toggle on or off related items.

  ## Arguments

  * **options** _(required)_ an array of checkboxes

  Each option should be an object with `name` and `value` properties. Use the bootstrap to specify which should be toggled by default, e.g.

  ```yaml
  field1:
    option1: true
    option2: false
    option3: false
  ```
</docs>

<style lang="sass">
  @import '../styleguide/inputs';
  @import '../styleguide/typography';

  .checkbox-group .checkbox-group-item {
    margin: 0 0 10px;
    padding: 0;
    width: 100%;
  }

  .checkbox-group .checkbox-group-item:first-of-type {
    margin-top: 15px;
  }

  .checkbox-group input {
    @include checkbox();
  }

  .checkbox-group label {
    @include primary-text();

    cursor: pointer;
    padding-left: 5px;
    vertical-align: baseline;
  }
</style>

<template>
  <div class="checkbox-group">
    <div class="checkbox-group-item" v-for="option in options">
      <input :name="option.name" type="checkbox" :id="option.id" :checked="data[option.value]" :value="option.value" @change="update" />
      <label :for="option.id">{{ option.name }}</label>
    </div>
  </div>
</template>

<script>
  import cid from '@nymag/cid';
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {};
    },
    computed: {
      options() {
        return this.args.options.map((o) => {
          return { name: o.name || o.value, value: o.value, id: cid() };
        });
      }
    },
    methods: {
      update(e) {
        const key = e.target.value,
          newData = { [key]: !this.data[key] }; // toggle the check

        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data: _.assign({}, this.data, newData) });
      }
    },
    slot: 'main'
  };
</script>
