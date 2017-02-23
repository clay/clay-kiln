<template>
  <section class="editor editor-inline" @click.stop>
    <form @submit.prevent>
      <div class="input-container">
        <field v-for="(field, index) in fieldNames" :class="{ 'first-field': index === 0 }" :name="field" :data="fields[field]" :schema="componentSchema[field]"></field>
      </div>
      <button type="submit" class="hidden-submit"></button>
    </form>
  </section>
</template>

<script>
  import { mapState } from 'vuex';
  import store from '../core-data/store';
  import { getComponentName } from '../utils/references';
  import field from './field.vue';

  export default {
    data() {
      return {};
    },
    store,
    computed: mapState({
      fields: (state) => state.ui.currentForm.fields,
      fieldNames: (state) => state.ui.currentForm.schema.fields || [state.ui.currentForm.path], // group or single field
      schema: (state) => state.ui.currentForm.schema,
      componentSchema: (state) => state.schemas[getComponentName(state.ui.currentForm.uri)]
    }),
    components: {
      field
    },
    beforeCreate() {
      // because inline forms don't live inside the regular Vue tree,
      // we need to manually inject $store before they're created.
      // this allows the computed properties and child components to use this.$store as normal
      this.$store = store;
    }
  };
</script>
