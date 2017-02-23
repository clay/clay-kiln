<template>
  <div class="editor-overlay" v-if="hasCurrentModalForm" @click.stop>
    <section class="editor">
      <form @submit.prevent>
        <header>
          <span class="form-header">{{ label }}</span>
          <button type="submit" class="save" @click.stop="save">Save</button>
        </header>
        <div class="input-container">
          <field v-for="field in fieldNames" :name="field" :data="fields[field]" :schema="componentSchema[field]"></field>
        </div>
      </form>
    </section>
  </div>
</template>

<script>
  import _ from 'lodash';
  import { mapState } from 'vuex';
  import { displayProp, getComponentName } from '../utils/references';
  import label from '../utils/label';
  import field from './field.vue';

  export default {
    data() {
      return {};
    },
    computed: mapState({
      hasCurrentModalForm: (state) => !_.isNull(state.ui.currentForm) && state.ui.currentForm.schema[displayProp] !== 'inline',
      label: (state) => label(state.ui.currentForm.path, state.ui.currentForm.schema),
      fields: (state) => state.ui.currentForm.fields,
      fieldNames: (state) => state.ui.currentForm.schema.fields || [state.ui.currentForm.path], // group or single field
      schema: (state) => state.ui.currentForm.schema,
      componentSchema: (state) => state.schemas[getComponentName(state.ui.currentForm.uri)]
    }),
    components: {
      field
    },
    methods: {
      save() {
        this.$store.dispatch('unfocus');
      }
    }
  };
</script>
