<docs>
  # `select`

  An enhanced browser `<select>` element, allowing the user to select one (or more!) of a few related options. [Uses Keen's UISelect](https://josephuspaye.github.io/Keen-UI/#/ui-select).

  ### Select Arguments

  * **multiple** - allow multiple options to be selected. data will be an object with options as keys, similar to checkbox-group
  * **search** - allow users to type stuff in to filter options. Extremely useful for longer options lists
  * **list** - The key `list` is where the value is the name of a list that Amphora knows about accessible via `/<site>/_lists/<listName>`.
  * **options** - an array of strings or objects (with `name`, `value`, and optionally `sites`)
  * **keys** passthrough option for Keen to specify keys for input objects, especially for use when you don't control the input shape, e.g. lists
  * **storeRawData** normally only the `value` of each option is stored, but with this option you can store the entire input object
  * **help** - description / helper text for the field
  * **attachedButton** - an icon button that should be attached to the field, to allow additional functionality
  * **validate.required** - either `true` or an object that described the conditions that should make this field required
  * **validate.requiredMessage** - will appear when required validation fails

  If you specify options as strings, the label for each will simply be the option converted to Start Case. If this behavior is run on a site with no available options, an error message will appear. Please use `_reveal` on the field to conditionally hide/show it based on site.

  ```yaml
  field1:
    _has:
      input: select
      options:
        - foo
        -
          name: Bar
          value: bar
        -
          name: Baz Qux
          value: baz-qux
          sites: site1, site2
  ```

  > #### info::Usage Notes
  >
  > * no/empty option is pre-selected by default (you don't need to specify an empty option in the schema)
  > * you can specify site-specific options, [similar to components in a component-list](https://github.com/clay/clay-kiln/wiki/Component-Lists#site-specific-components)
  >
  > ```yaml
  >     fn: select
  >     options:
  >       - foo (site1)
  >       - bar (not: site1)
  >       - baz (site1, site2)
  > ```
</docs>

<style lang="sass">
  @import '../styleguide/typography';

  .editor-no-options {
    @include type-body();

    color: $text-disabled-color;
  }
</style>

<template>
  <ui-select
    v-if="hasOptions"
    :name="name"
    :value="value"
    :keys="keys"
    :options="options"
    :multiple="args.multiple"
    :hasSearch="args.search"
    :list="args.list"
    :label="label"
    :floatingLabel="true"
    :help="args.help"
    :error="errorMessage"
    :invalid="isInvalid"
    iconPosition="right"
    @input="handleInput"
  >
    <attached-button slot="icon" :name="name" :data="data" :schema="schema" :args="args" @disable="disableInput" @enable="enableInput"></attached-button>
  </ui-select>
  <!-- todo: there's a "no-results" slot in ui-select, should we maybe use that? -->
  <span v-else class="editor-no-options">{{ label }}: No options available on current site.</span>
</template>

<script>
  import _ from 'lodash';
  import { UPDATE_FORMDATA } from '../lib/forms/mutationTypes';
  import { filterBySite } from '../lib/utils/site-filter';
  import label from '../lib/utils/label';
  import { shouldBeRequired, getValidationError } from '../lib/forms/field-helpers';
  import UiSelect from 'keen/UiSelect';
  import attachedButton from './attached-button.vue';

  export default {
    props: ['name', 'data', 'schema', 'args'],
    data() {
      return {
        listOptions: [],
        isDisabled: false
      };
    },
    mounted() {
      if(this.args.list){
        this.fetchListItems().then( listItems => {
          this.listOptions = listItems;
        }); // todo: ".catch"?
      }
    },
    computed: {
      keys () {
        return {
          label: 'name', // backwards compatibility I guess?
          value: 'value',
          ...this.args.keys
        }
      },
      NULL_OPTION () {
        return {
          [this.keys.label]: 'None',
          [this.keys.value]: null,
        }
      },
      // combine arg/prop options, fetched list options, and a null option for non-multiple selects
      options () {
        const propOptions = (this.args.options || [])
        let opts = propOptions.concat(this.listOptions)
        if (opts.length > 0) {
          if (!this.args.multiple) {
            opts = [ this.NULL_OPTION, ...opts ]
          }
          opts = opts.map(this.formatOptionForInput)
        }
        return opts
      },
      // convert store data into a format suitable for Keen UiSelect.value prop
      value () {
        if (!this.data) {
          // defaults to pass Keen's type check
          return this.args.multiple ? [] : {}
        } else if (this.args.storeRawData) {
          return this.data
        } else {
          return (this.args.multiple)
            ? this.options.filter(o => this.data.includes(o.value))
            : this.options.find(o => this.data === o.value)
        }
      },
      hasOptions() {
        return (this.options.length > 0);
      },
      isRequired() {
        return _.get(this.args, 'validate.required') === true || shouldBeRequired(this.args.validate, this.$store, this.name);
      },
      label() {
        return `${label(this.name, this.schema)}${this.isRequired ? '*' : ''}`;
      },
      errorMessage() {
        return getValidationError(this.data, this.args.validate, this.$store, this.name);
      },
      isInvalid() {
        return !!this.errorMessage;
      }
    },
    methods: {
      // input may be stored as simply a value (scalar) or the entire input object
      formatOptionForStore (o) {
        if (_.isObject(o) && !this.args.storeRawData) {
          return o[this.keys.value]
        } else {
          return o
        }
      },
      // basically, all input takes the object form
      formatOptionForInput (o) {
        // start-case labels for scalar options
        if (_.isString(o) || _.isNumber(o)) {
          return {
            [this.keys.value]: o,
            [this.keys.label]: _.startCase(o)
          };
        } else {
          return o
        }
      },
      handleInput (value) {
        const data = (this.args.multiple)
          ? value.map(this.formatOptionForStore)
          : this.formatOptionForStore(value)
        this.$store.commit(UPDATE_FORMDATA, { path: this.name, data });
      },
      fetchListItems() {
        // todo: look into "loading" prop for UiSelect
        const listName = this.args.list,
          lists = this.$store.state.lists,
          list = _.get(lists, listName, {});
        let promise;

        // todo: hmm i feel like we could use a light wrapper for this list retrieval business
        if (list.items && !list.isLoading && !list.error) {
          promise = Promise.resolve(list.items);
        } else {
          promise = this.$store.dispatch('getList', listName).then(() => lists[listName].items);
        }

        return promise;
      },
      disableInput() {
        this.isDisabled = true;
      },
      enableInput() {
        this.isDisabled = false;
      }
    },
    components: {
      UiSelect,
      attachedButton
    }
  };
</script>
